// Lightweight synchronous fallback for instant safe-room preview wireframe
export const generateQuickDomainNodes = (inputUrl) => {
  let domain = 'target-perimeter.com';
  try {
    const formatted = inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`;
    domain = new URL(formatted).hostname.toLowerCase().replace(/^www\./, '');
  } catch (e) {
    domain = inputUrl.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '').toLowerCase() || 'target-perimeter.com';
  }
  const parts = domain.split('.');
  const brand = parts.length >= 2 ? parts[parts.length - 2].toUpperCase() : 'HOST';
  return [
    { domain: domain, company: `${brand} Origin Host`, trackerType: 'Primary Web Origin', threatLevel: 'green' },
    { domain: `api.${domain}`, company: `${brand} Platform Services`, trackerType: 'REST & GraphQL API Gateway', threatLevel: 'yellow' },
    { domain: `cdn.${domain}`, company: `${brand} Global Edge`, trackerType: 'Content Delivery Network Edge', threatLevel: 'green' },
    { domain: `auth.${domain}`, company: `${brand} Identity Mesh`, trackerType: 'SSO & OAuth Identity Provider', threatLevel: 'yellow' }
  ];
};

// Generates an interactive, tactical Safe-Room preview in-memory via HTML5 Canvas
export const generateSimulatedSafeView = (url, severedSet = new Set(), poisonedSet = new Set(), customBeacons = []) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 700;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const displayUrl = (url || 'https://domain-target.com').trim();
  let cleanDomain = 'domain-target.com';
  try {
    cleanDomain = new URL(displayUrl.startsWith('http') ? displayUrl : `https://${displayUrl}`).hostname;
  } catch (e) {
    cleanDomain = displayUrl.replace(/^https?:\/\//, '').split('/')[0] || 'domain-target.com';
  }

  // Tactical Dark Background
  ctx.fillStyle = '#070b14';
  ctx.fillRect(0, 0, 1200, 700);

  // Chrome Header
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 1200, 52);
  ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(26, 26, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(46, 26, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(66, 26, 6, 0, Math.PI * 2); ctx.fill();

  // URL Bar with actual user-requested URL
  ctx.fillStyle = '#1e293b';
  if (ctx.roundRect) ctx.roundRect(100, 12, 850, 28, 6); else ctx.fillRect(100, 12, 850, 28);
  ctx.fill();
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('🛡️ [DOOMWIRE ISOLATED SANDBOX] -> ' + (displayUrl.startsWith('http') ? displayUrl : `https://${displayUrl}`), 120, 31);

  // Status Badge
  ctx.fillStyle = '#00f0ff';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('ACTIVE FIREWALL DEFENSE', 980, 31);

  // Main Page Content Area (Sanitized Wireframe tailored to target domain)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(50, 80, 730, 220);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(50, 80, 730, 220);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText(`DOM PURIFIED: ${cleanDomain.toUpperCase()}`, 80, 130);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`Target perimeter at ${cleanDomain} analyzed inside isolated execution sandbox.`, 80, 165);
  ctx.fillText('Real-time network telemetry, ad exchanges, third-party trackers, and data syncs isolated.', 80, 190);
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(`FIREWALL STATUS: ${severedSet.size} WIRES CUT // ${poisonedSet.size} WIRES POISONED`, 80, 240);

  // Dynamic Surveillance Slots derived from actual target beacons
  const pool = customBeacons.length > 0 ? customBeacons : generateQuickDomainNodes(displayUrl);
  const dangerNodes = pool.filter((b) => b.threatLevel === 'red' || b.threatLevel === 'orange' || b.threatLevel === 'yellow');
  const selectedNodes = (dangerNodes.length >= 4 ? dangerNodes : pool).slice(0, 4);

  const slotCoords = [
    { x: 810, y: 80, w: 340, h: 220 },
    { x: 810, y: 320, w: 340, h: 320 },
    { x: 50, y: 320, w: 730, h: 140 },
    { x: 50, y: 480, w: 730, h: 160 }
  ];

  selectedNodes.forEach((node, idx) => {
    const coords = slotCoords[idx];
    if (!coords) return;

    const isSev = severedSet.has(node.domain);
    const isPois = poisonedSet.has(node.domain);

    ctx.fillStyle = isSev ? 'rgba(239, 68, 68, 0.12)' : isPois ? 'rgba(192, 132, 252, 0.15)' : 'rgba(30, 41, 59, 0.7)';
    ctx.fillRect(coords.x, coords.y, coords.w, coords.h);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = isSev ? '#ef4444' : isPois ? '#c084fc' : '#475569';
    ctx.strokeRect(coords.x, coords.y, coords.w, coords.h);

    ctx.fillStyle = isSev ? '#ef4444' : isPois ? '#c084fc' : '#f87171';
    ctx.font = 'bold 12px monospace';
    const label = isSev ? '✂ SEVERED WIRE // NETWORK PACKET DROPPED' : isPois ? '☠ POISONED // DIFFERENTIAL NOISE INJECTED' : '⚠ SURVEILLANCE BEACON IDENTIFIED';
    ctx.fillText(label, coords.x + 16, coords.y + 32);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px monospace';
    ctx.fillText(`Target: ${node.domain} [${node.company || node.trackerType}]`, coords.x + 16, coords.y + 55);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    const sub = isSev ? 'Connection sinkholed by DoomWire DNS firewall.' : isPois ? 'Synthetic decoy noise headers injected.' : (node.trackerType || 'Network endpoint monitored on 3D globe.');
    ctx.fillText(sub, coords.x + 16, coords.y + 78);
  });

  return canvas.toDataURL('image/png');
};

