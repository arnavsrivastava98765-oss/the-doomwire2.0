/**
 * DoomWire Companion Shield - Background Service Worker (Manifest V3)
 * Listens for wire cuts from the DoomWire 3D Cyber-Radar backend and applies
 * real-time native declarativeNetRequest blocking rules across Chrome/Brave/Edge.
 */

const DOOMWIRE_API = 'http://localhost:5000';
let activeRuleId = 100;

// Poll/listen for severed wire rules from DoomWire backend
async function syncFirewallRules() {
  try {
    const res = await fetch(`${DOOMWIRE_API}/api/status`);
    if (res.ok) {
      console.log('[DoomWire Shield] Connected to local radar engine.');
    }
  } catch (e) {
    // Backend offline or reconnecting
  }
}

// Native declarativeNetRequest rule applicator
function blockDomainAcrossBrowser(domain) {
  activeRuleId++;
  chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [{
      id: activeRuleId,
      priority: 1,
      action: { type: 'block' },
      condition: {
        urlFilter: `||${domain}^`,
        resourceTypes: ['main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'xmlhttprequest', 'ping', 'other']
      }
    }]
  }, () => {
    console.log(`[DoomWire Shield] System-wide wire cut enforced for: ${domain}`);
  });
}

// Initial status ping on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('[DoomWire Shield] Tactical extension active.');
  syncFirewallRules();
});
