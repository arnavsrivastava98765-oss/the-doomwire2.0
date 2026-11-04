/**
 * DoomWire Companion Shield - Background Service Worker (Manifest V3)
 * Listens for wire cuts from the DoomWire 3D Cyber-Radar backend and applies
 * real-time native declarativeNetRequest blocking rules across Chrome/Brave/Edge.
 */

const DOOMWIRE_API = 'http://localhost:5000';
let activeRuleId = 100;

// Deterministic ID generator from domain string
function getRuleIdForDomain(domain) {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = (hash * 31 + domain.charCodeAt(i)) >>> 0;
  }
  return 1000 + (hash % 900000);
}

// Native declarativeNetRequest rule applicator
function blockDomainAcrossBrowser(domain) {
  if (!domain || typeof domain !== 'string') return;
  const cleanDomain = domain.toLowerCase().trim().replace(/^www\./, '');
  const ruleId = getRuleIdForDomain(cleanDomain);

  chrome.declarativeNetRequest.getDynamicRules((rules) => {
    const existing = rules.find((r) => r.id === ruleId || (r.condition && r.condition.urlFilter === `||${cleanDomain}^`));
    if (existing) {
      console.log(`[DoomWire Shield] Rule already active for: ${cleanDomain} (ID: ${existing.id})`);
      return;
    }

    chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [{
        id: ruleId,
        priority: 1,
        action: { type: 'block' },
        condition: {
          urlFilter: `||${cleanDomain}^`,
          resourceTypes: ['main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'xmlhttprequest', 'ping', 'other']
        }
      }]
    }, () => {
      console.log(`[DoomWire Shield] System-wide wire cut enforced for: ${cleanDomain} (Rule ID: ${ruleId})`);
    });
  });
}

// Native declarativeNetRequest rule remover
function unblockDomainAcrossBrowser(domain) {
  if (!domain || typeof domain !== 'string') return;
  const cleanDomain = domain.toLowerCase().trim().replace(/^www\./, '');

  chrome.declarativeNetRequest.getDynamicRules((rules) => {
    const matching = rules.filter((r) => r.condition && r.condition.urlFilter === `||${cleanDomain}^`);
    if (matching.length > 0) {
      const idsToRemove = matching.map((r) => r.id);
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: idsToRemove
      }, () => {
        console.log(`[DoomWire Shield] Wire cut removed for: ${cleanDomain} (IDs: ${idsToRemove.join(', ')})`);
      });
    }
  });
}

// Poll/listen for severed wire rules from DoomWire backend
async function syncFirewallRules() {
  try {
    const res = await fetch(`${DOOMWIRE_API}/api/firewall/rules`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.blockedDomains)) {
        for (const domain of data.blockedDomains) {
          blockDomainAcrossBrowser(domain);
        }
        console.log(`[DoomWire Shield] Synchronized ${data.blockedDomains.length} firewall rules with local radar engine.`);
      }
    }
  } catch (e) {
    // Backend offline or reconnecting
  }
}

// 1. External message listener (from DoomWire Web UI)
if (chrome.runtime.onMessageExternal) {
  chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    if (message.action === 'BLOCK_DOMAIN' && message.domain) {
      blockDomainAcrossBrowser(message.domain);
      sendResponse({ success: true, domain: message.domain });
    } else if (message.action === 'UNBLOCK_DOMAIN' && message.domain) {
      unblockDomainAcrossBrowser(message.domain);
      sendResponse({ success: true, domain: message.domain });
    } else if (message.action === 'GET_BLOCKED_RULES') {
      chrome.declarativeNetRequest.getDynamicRules((rules) => {
        sendResponse({ success: true, rules });
      });
      return true; // asynchronous response
    }
  });
}

// 2. Internal extension messaging
chrome.runtime?.onMessage?.addListener?.((message, sender, sendResponse) => {
  if (message.action === 'BLOCK_DOMAIN' && message.domain) {
    blockDomainAcrossBrowser(message.domain);
    sendResponse({ success: true, domain: message.domain });
  } else if (message.action === 'UNBLOCK_DOMAIN' && message.domain) {
    unblockDomainAcrossBrowser(message.domain);
    sendResponse({ success: true, domain: message.domain });
  } else if (message.action === 'GET_BLOCKED_RULES') {
    chrome.declarativeNetRequest.getDynamicRules((rules) => {
      sendResponse({ success: true, rules });
    });
    return true;
  }
});

// Periodic sync alarm (every 1 minute)
chrome.alarms?.create?.('doomwire_firewall_sync', { periodInMinutes: 1 });
chrome.alarms?.onAlarm?.addListener?.((alarm) => {
  if (alarm.name === 'doomwire_firewall_sync') {
    syncFirewallRules();
  }
});

// Initial status ping and rule sync on install
chrome.runtime?.onInstalled?.addListener?.(() => {
  console.log('[DoomWire Shield] Tactical extension active.');
  syncFirewallRules();
});

// Export functions for testability in Node / Vitest
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getRuleIdForDomain,
    blockDomainAcrossBrowser,
    unblockDomainAcrossBrowser,
    syncFirewallRules
  };
}
