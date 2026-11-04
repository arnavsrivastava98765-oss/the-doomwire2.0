/**
 * DoomWire Rate Limiting, Concurrency Management & Origin Control
 * Protects server memory and network from abuse, script bombardment, and OOM crashes.
 */

// Maximum concurrent Playwright browser sessions allowed across the server
const MAX_CONCURRENT_SCANS = parseInt(process.env.MAX_CONCURRENT_SCANS || '3', 10);

// Per-IP scan rate limit settings: 10 scans per 60 seconds (configurable for test harnesses)
const SCAN_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_SCANS_PER_WINDOW = parseInt(process.env.MAX_SCANS_PER_WINDOW || '10', 10);

// Per-IP HTTP request limit settings: 60 requests per 60 seconds
const HTTP_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_HTTP_PER_WINDOW = 60;

// In-memory sliding windows: ip -> [timestamps]
const scanWindows = new Map();
const httpWindows = new Map();

let activeScanCount = 0;

/**
 * Periodically purge stale IP entries every 2 minutes to prevent memory leaks
 */
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of scanWindows.entries()) {
    const valid = timestamps.filter((t) => now - t < SCAN_LIMIT_WINDOW_MS);
    if (valid.length === 0) scanWindows.delete(ip);
    else scanWindows.set(ip, valid);
  }
  for (const [ip, timestamps] of httpWindows.entries()) {
    const valid = timestamps.filter((t) => now - t < HTTP_LIMIT_WINDOW_MS);
    if (valid.length === 0) httpWindows.delete(ip);
    else httpWindows.set(ip, valid);
  }
}, 2 * 60 * 1000).unref();

/**
 * Extracts normalized client IP from socket or request
 */
function getClientIp(reqOrSocket) {
  if (!reqOrSocket) return '127.0.0.1';
  // Socket.IO socket object
  if (reqOrSocket.handshake) {
    const forwarded = reqOrSocket.handshake.headers['x-forwarded-for'];
    if (forwarded) return forwarded.split(',')[0].trim();
    return reqOrSocket.handshake.address || reqOrSocket.conn?.remoteAddress || '127.0.0.1';
  }
  // Express request object
  const forwarded = reqOrSocket.headers?.['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return reqOrSocket.ip || reqOrSocket.socket?.remoteAddress || '127.0.0.1';
}

/**
 * Checks and records a scan attempt for a given IP.
 * @param {string} ip
 * @returns {{ allowed: boolean, remaining: number, retryAfterSec?: number }}
 */
function checkScanRateLimit(ip) {
  const now = Date.now();
  const history = scanWindows.get(ip) || [];
  const recent = history.filter((t) => now - t < SCAN_LIMIT_WINDOW_MS);

  if (recent.length >= MAX_SCANS_PER_WINDOW) {
    const oldest = recent[0];
    const retryAfterSec = Math.ceil((oldest + SCAN_LIMIT_WINDOW_MS - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  recent.push(now);
  scanWindows.set(ip, recent);
  return { allowed: true, remaining: MAX_SCANS_PER_WINDOW - recent.length };
}

/**
 * Attempts to acquire an active scan execution slot (concurrency semaphore).
 * @returns {boolean} true if slot acquired, false if at capacity
 */
function acquireScanSlot() {
  if (activeScanCount >= MAX_CONCURRENT_SCANS) {
    return false;
  }
  activeScanCount++;
  return true;
}

/**
 * Releases an acquired scan slot.
 */
function releaseScanSlot() {
  if (activeScanCount > 0) {
    activeScanCount--;
  }
}

/**
 * Returns current server capacity metrics.
 */
function getCapacityMetrics() {
  return {
    activeScans: activeScanCount,
    maxConcurrentScans: MAX_CONCURRENT_SCANS,
    capacityRemaining: Math.max(0, MAX_CONCURRENT_SCANS - activeScanCount)
  };
}

/**
 * Express middleware for general HTTP rate limiting
 */
function expressHttpRateLimiter(req, res, next) {
  const ip = getClientIp(req);
  const now = Date.now();
  const history = httpWindows.get(ip) || [];
  const recent = history.filter((t) => now - t < HTTP_LIMIT_WINDOW_MS);

  if (recent.length >= MAX_HTTP_PER_WINDOW) {
    const oldest = recent[0];
    const retryAfterSec = Math.ceil((oldest + HTTP_LIMIT_WINDOW_MS - now) / 1000);
    res.set('Retry-After', String(retryAfterSec));
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Please retry after ${retryAfterSec} seconds.`
    });
  }

  recent.push(now);
  httpWindows.set(ip, recent);
  next();
}

/**
 * Returns CORS origin validator matching permitted production & development hosts
 */
function getCorsOriginValidator() {
  const allowedConfig = process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGIN;
  if (!allowedConfig || allowedConfig.trim() === '*') {
    return (origin, callback) => callback(null, true);
  }
  const configuredOrigins = allowedConfig
    ? allowedConfig.split(',').map((o) => o.trim().toLowerCase())
    : [];

  return (origin, callback) => {
    // Allow non-browser requests (e.g. curl, server-to-server health checks)
    if (!origin) return callback(null, true);

    const norm = origin.toLowerCase();

    // Always allow local development ports
    if (
      norm === 'http://localhost:5173' ||
      norm === 'http://localhost:5000' ||
      norm === 'http://127.0.0.1:5173' ||
      norm === 'http://127.0.0.1:5000' ||
      /^http:\/\/localhost:\d+$/.test(norm) ||
      /^http:\/\/127\.0\.0\.1:\d+$/.test(norm)
    ) {
      return callback(null, true);
    }

    // Check configured environment origins (e.g. your Render / production domains)
    if (configuredOrigins.some((allowed) => norm === allowed || norm.endsWith('.' + allowed))) {
      return callback(null, true);
    }

    // If no specific production origins were configured via env, permit access but log warning
    if (configuredOrigins.length === 0) {
      return callback(null, true);
    }

    callback(new Error(`CORS policy violation: Origin '${origin}' is not authorized.`));
  };
}

// Reset helper for testing
function _resetLimitsForTesting() {
  scanWindows.clear();
  httpWindows.clear();
  activeScanCount = 0;
}

module.exports = {
  MAX_CONCURRENT_SCANS,
  MAX_SCANS_PER_WINDOW,
  getClientIp,
  checkScanRateLimit,
  acquireScanSlot,
  releaseScanSlot,
  getCapacityMetrics,
  expressHttpRateLimiter,
  getCorsOriginValidator,
  _resetLimitsForTesting
};
