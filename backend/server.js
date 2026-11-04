const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { validateTargetUrl } = require('./security');
const { classifyThreat, getRegistrableDomain } = require('./classifier');
const { resolveTrackerEntity } = require('./trackerEntities');
const {
  checkScanRateLimit,
  acquireScanSlot,
  releaseScanSlot,
  getCapacityMetrics,
  expressHttpRateLimiter,
  getCorsOriginValidator,
  getClientIp
} = require('./rateLimiter');
const {
  getSharedBrowser,
  isBrowserActive,
  inspectSensitiveData,
  discoverTargetInfrastructure,
  executeScan
} = require('./scanner');
const {
  resolveIntelligence,
  deriveCompanyFromDomain,
  TRACKER_RADAR,
  CCTLD_GEO_REGISTRY,
  GLOBAL_BRAND_REGISTRY,
  intelCache
} = require('./intel');

const app = express();
const corsOriginValidator = getCorsOriginValidator();

app.use(cors({ origin: corsOriginValidator, methods: ['GET', 'POST'] }));
app.use(expressHttpRateLimiter);
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOriginValidator,
    methods: ['GET', 'POST']
  }
});

// Per-User / Per-Socket Isolated Sessions
const userSessions = new Map(); // socket.id -> session object

function getOrCreateSession(socketId) {
  if (!userSessions.has(socketId)) {
    userSessions.set(socketId, {
      socketId,
      hasSlot: false,
      context: null,
      page: null,
      blockedDomains: new Set(),
      poisonedDomains: new Set(),
      safetyWatchdog: null,
      scanCompleted: false,
      interceptedCount: 0
    });
  }
  return userSessions.get(socketId);
}

function acquireSessionSlot(session) {
  if (!session) return false;
  if (session.hasSlot) {
    return true; // Session already holds a valid slot
  }
  if (acquireScanSlot()) {
    session.hasSlot = true;
    return true;
  }
  return false;
}

function releaseSessionSlot(session) {
  if (session && session.hasSlot) {
    session.hasSlot = false;
    releaseScanSlot();
  }
}

async function cleanupSessionBrowser(session) {
  if (!session) return;
  releaseSessionSlot(session);
  if (session.safetyWatchdog) {
    clearTimeout(session.safetyWatchdog);
    session.safetyWatchdog = null;
  }
  if (session.page) {
    try { await session.page.close(); } catch (e) {}
    session.page = null;
  }
  if (session.context) {
    try { await session.context.close(); } catch (e) {}
    session.context = null;
  }
}

io.on('connection', (socket) => {
  console.log(`[DoomWire] Tactical radar client connected: ${socket.id}`);
  const session = getOrCreateSession(socket.id);

  // Send this user's current isolated blocked/poisoned status
  socket.emit('state_sync', {
    blockedDomains: Array.from(session.blockedDomains),
    poisonedDomains: Array.from(session.poisonedDomains)
  });

  socket.on('scan_url', async ({ url, userLocation }) => {
    if (socket.disconnected) return;
    const clientIp = getClientIp(socket);

    // 0a. Synchronous Per-IP Rate Limiting (prevents script spam and DoS)
    const rateCheck = checkScanRateLimit(clientIp);
    if (!rateCheck.allowed) {
      console.warn(`[DoomWire // RATE LIMIT] IP ${clientIp} exceeded scan rate limit. Retry in ${rateCheck.retryAfterSec}s.`);
      socket.emit('scan_status', {
        status: `BLOCKED // RATE LIMIT EXCEEDED (RETRY IN ${rateCheck.retryAfterSec}S)`,
        stage: 0
      });
      socket.emit('scan_error', {
        error: `Rate limit exceeded: You have initiated too many scans. Please wait ${rateCheck.retryAfterSec} seconds.`
      });
      return;
    }

    // 0b. Acquire session slot (session holds at most 1 slot across the server)
    const slotAcquired = acquireSessionSlot(session);
    if (!slotAcquired) {
      const metrics = getCapacityMetrics();
      console.warn(`[DoomWire // CAPACITY CAP] Active scans at max capacity (${metrics.activeScans}/${metrics.maxConcurrentScans}). Rejecting request from ${clientIp}.`);
      socket.emit('scan_status', {
        status: 'BUSY // SERVER CAPACITY REACHED (PLEASE RETRY IN A MOMENT)',
        stage: 0
      });
      socket.emit('scan_error', {
        error: `Server capacity reached: ${metrics.activeScans} active reconnaissance scans are running. Please retry in a few seconds.`
      });
      return;
    }

    session.currentScanId = (session.currentScanId || 0) + 1;
    const scanId = session.currentScanId;

    // Clean up any prior browser context for THIS user
    if (session.safetyWatchdog) {
      clearTimeout(session.safetyWatchdog);
      session.safetyWatchdog = null;
    }
    if (session.page) {
      try { await session.page.close(); } catch (e) {}
      session.page = null;
    }
    if (session.context) {
      try { await session.context.close(); } catch (e) {}
      session.context = null;
    }
    session.scanCompleted = false;
    session.interceptedCount = 0;

    // 0c. Strict SSRF Defense & URL Normalization
    const validation = await validateTargetUrl(url);

    // If client disconnected or a newer scan was initiated, abort this superseded scan immediately
    if (session.currentScanId !== scanId || socket.disconnected) {
      return;
    }

    if (!validation.valid) {
      releaseSessionSlot(session);
      console.warn(`[DoomWire // SSRF REJECTED] Target '${url}' blocked: ${validation.reason}`);
      socket.emit('scan_status', { status: `BLOCKED // SSRF DEFENSE: ${validation.reason.toUpperCase()}`, stage: 0 });
      socket.emit('scan_error', { error: validation.reason });
      return;
    }
    const validatedUrl = validation.url;

    // 0d. Execute scan inside isolated Playwright session
    await executeScan({
      session,
      socket,
      validatedUrl,
      scanId,
      cleanupSessionBrowser
    });
  });

  // Action: Cut the wire (block) - Per-user
  socket.on('cut_wire', (domain) => {
    session.blockedDomains.add(domain);
    session.poisonedDomains.delete(domain);
    console.log(`[DoomWire] Wire Cut for domain: ${domain} (Client: ${socket.id})`);
    socket.emit('wire_cut', { domain });
  });

  // Action: Poison the wire (inject synthetic decoys) - Per-user
  socket.on('poison_wire', (domain) => {
    session.poisonedDomains.add(domain);
    session.blockedDomains.delete(domain);
    console.log(`[DoomWire] Wire Poisoned for domain: ${domain} (Client: ${socket.id})`);
    socket.emit('wire_poisoned', { domain });
  });

  // Action: Restore wire connection - Per-user
  socket.on('restore_wire', (domain) => {
    session.blockedDomains.delete(domain);
    session.poisonedDomains.delete(domain);
    console.log(`[DoomWire] Wire Restored for domain: ${domain} (Client: ${socket.id})`);
    socket.emit('wire_restored', { domain });
  });

  // Action: Master Cut (Block all active tracker domains) - Per-user
  socket.on('cut_all', ({ domains }) => {
    if (Array.isArray(domains)) {
      domains.forEach((d) => {
        session.blockedDomains.add(d);
        session.poisonedDomains.delete(d);
      });
      console.log(`[DoomWire] MASTER CUT executed on ${domains.length} domains for Client ${socket.id}`);
      socket.emit('all_wires_cut', { domains });
    }
  });

  // Action: Master Poison (Deceive all active tracker domains) - Per-user
  socket.on('poison_all', ({ domains }) => {
    if (Array.isArray(domains)) {
      domains.forEach((d) => {
        session.poisonedDomains.add(d);
        session.blockedDomains.delete(d);
      });
      console.log(`[DoomWire] MASTER POISON executed on ${domains.length} domains for Client ${socket.id}`);
      socket.emit('all_wires_poisoned', { domains });
    }
  });

  // Action: Clear all rules - Per-user
  socket.on('clear_rules', () => {
    session.blockedDomains.clear();
    session.poisonedDomains.clear();
    console.log(`[DoomWire] Rules cleared for Client ${socket.id}`);
    socket.emit('rules_cleared');
  });

  socket.on('disconnect', async () => {
    console.log(`[DoomWire] Tactical radar client disconnected: ${socket.id}`);
    const active = userSessions.get(socket.id);
    if (active) {
      await cleanupSessionBrowser(active);
      userSessions.delete(socket.id);
    }
  });
});

// Serve static frontend bundle from dist
const distPath = fs.existsSync(path.join(__dirname, '../dist'))
  ? path.join(__dirname, '../dist')
  : path.join(__dirname, './dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// REST Health Check & Status Endpoint
app.get('/api/status', (req, res) => {
  res.status(200).json({
    system: 'DoomWire Tactical Command Backend',
    status: 'ONLINE',
    activeSessions: userSessions.size,
    browserActive: isBrowserActive(),
    capacity: getCapacityMetrics()
  });
});

// REST Firewall Rules Endpoint for Companion Extension Sync
app.get('/api/firewall/rules', (req, res) => {
  const allBlocked = new Set();
  for (const session of userSessions.values()) {
    for (const d of session.blockedDomains) {
      allBlocked.add(d);
    }
  }
  res.status(200).json({
    status: 'ONLINE',
    blockedDomains: Array.from(allBlocked),
    ruleCount: allBlocked.size,
    timestamp: new Date().toISOString()
  });
});

// Serve the 3D Web Application for any non-API web route
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    return res.status(200).json({
      status: 'ONLINE',
      system: 'DoomWire Tactical Command Backend',
      service: 'Active Playwright Chromium Sandbox',
      activeSessions: userSessions.size,
      browserActive: isBrowserActive(),
      timestamp: new Date().toISOString()
    });
  }
  next();
});

const PORT = process.env.PORT || 5000;
if (!server.listening) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`=================================================`);
    console.log(`⚡ DOOMWIRE CYBER-RADAR BACKEND ONLINE ON PORT ${PORT}`);
    console.log(`⚡ Playwright Sandbox & Active Firewall Active`);
    console.log(`=================================================`);
  }).on('error', (err) => {
    if (err.code !== 'EADDRINUSE') throw err;
  });
}

module.exports = {
  app,
  server,
  io,
  inspectSensitiveData,
  discoverTargetInfrastructure,
  classifyThreat,
  deriveCompanyFromDomain,
  resolveIntelligence,
  getSharedBrowser,
  isBrowserActive
};
