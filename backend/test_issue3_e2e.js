// backend/test_issue3_e2e.js
// 10-Cycle verification of Extension Active Protection & DeclarativeNetRequest Wiring

const path = require('path');

// Mock Chrome Extension Environment for Service Worker verification
function createMockChromeEnvironment() {
  const dynamicRules = new Map();
  const listeners = {
    onMessageExternal: [],
    onMessage: [],
    onInstalled: []
  };

  const chromeMock = {
    declarativeNetRequest: {
      getDynamicRules: (callback) => {
        const rules = Array.from(dynamicRules.values());
        if (callback) callback(rules);
        return Promise.resolve(rules);
      },
      updateDynamicRules: ({ addRules = [], removeRuleIds = [] }, callback) => {
        for (const id of removeRuleIds) {
          dynamicRules.delete(id);
        }
        for (const rule of addRules) {
          dynamicRules.set(rule.id, rule);
        }
        if (callback) callback();
        return Promise.resolve();
      }
    },
    runtime: {
      onMessageExternal: {
        addListener: (fn) => listeners.onMessageExternal.push(fn)
      },
      onMessage: {
        addListener: (fn) => listeners.onMessage.push(fn)
      },
      onInstalled: {
        addListener: (fn) => listeners.onInstalled.push(fn)
      }
    },
    alarms: {
      create: () => { },
      onAlarm: { addListener: () => { } }
    }
  };

  return { chromeMock, dynamicRules, listeners };
}

function runOneCycle(cycleNum) {
  const { chromeMock, dynamicRules, listeners } = createMockChromeEnvironment();
  global.chrome = chromeMock;

  // Clear module cache to load fresh background instance
  const backgroundPath = path.resolve(__dirname, '../extension/background.js');
  delete require.cache[require.resolve(backgroundPath)];
  const ext = require(backgroundPath);

  // Test 1: Deterministic Rule ID generation
  const id1 = ext.getRuleIdForDomain('doubleclick.net');
  const id2 = ext.getRuleIdForDomain('doubleclick.net');
  const id3 = ext.getRuleIdForDomain('criteo.com');
  if (id1 !== id2) {
    throw new Error('getRuleIdForDomain is not deterministic!');
  }
  if (id1 === id3) {
    throw new Error('Different domains resulted in rule ID collision!');
  }
  if (id1 < 1000 || id1 > 1000000) {
    throw new Error(`Rule ID out of valid range: ${id1}`);
  }

  // Test 2: blockDomainAcrossBrowser registers native declarativeNetRequest rule
  ext.blockDomainAcrossBrowser('tracker.example.com');
  const rule = dynamicRules.get(ext.getRuleIdForDomain('tracker.example.com'));
  if (!rule) {
    throw new Error('blockDomainAcrossBrowser failed to register dynamic rule!');
  }
  if (rule.action.type !== 'block' || rule.condition.urlFilter !== '||tracker.example.com^') {
    throw new Error(`Malformed declarativeNetRequest rule: ${JSON.stringify(rule)}`);
  }

  // Test 3: Idempotency (calling blockDomainAcrossBrowser again does not duplicate rule)
  ext.blockDomainAcrossBrowser('tracker.example.com');
  if (dynamicRules.size !== 1) {
    throw new Error(`Duplicate rules were created! Expected 1, found ${dynamicRules.size}`);
  }

  // Test 4: unblockDomainAcrossBrowser removes rule
  ext.unblockDomainAcrossBrowser('tracker.example.com');
  if (dynamicRules.size !== 0) {
    throw new Error('unblockDomainAcrossBrowser failed to remove the rule!');
  }

  // Test 5: External message handling (from DoomWire Web UI)
  const messageExternalListener = listeners.onMessageExternal[0];
  if (!messageExternalListener) {
    throw new Error('Extension failed to register onMessageExternal listener!');
  }

  let blockResponse = null;
  messageExternalListener({ action: 'BLOCK_DOMAIN', domain: 'ads.example.org' }, {}, (res) => {
    blockResponse = res;
  });
  if (!blockResponse || !blockResponse.success) {
    throw new Error('External message BLOCK_DOMAIN failed to respond with success!');
  }
  if (!dynamicRules.has(ext.getRuleIdForDomain('ads.example.org'))) {
    throw new Error('External message BLOCK_DOMAIN did not register declarativeNetRequest rule!');
  }

  // Test 6: Query blocked rules via external message
  let queryResponse = null;
  messageExternalListener({ action: 'GET_BLOCKED_RULES' }, {}, (res) => {
    queryResponse = res;
  });
  if (!queryResponse || !queryResponse.success || queryResponse.rules.length !== 1) {
    throw new Error('External message GET_BLOCKED_RULES failed to return active rules!');
  }

  // Test 7: External unblock
  messageExternalListener({ action: 'UNBLOCK_DOMAIN', domain: 'ads.example.org' }, {}, () => { });
  if (dynamicRules.size !== 0) {
    throw new Error('External message UNBLOCK_DOMAIN failed to unblock rule!');
  }
}

function main() {
  console.log('=== VERIFYING ISSUE 3: EXTENSION ACTIVE PROTECTION WIRING (10 CONSECUTIVE CYCLES) ===\n');
  try {
    for (let c = 1; c <= 10; c++) {
      runOneCycle(c);
      console.log(`[Cycle ${c}/10] Passed. Verified declarativeNetRequest dynamic rules, message bridges & idempotency.`);
    }
    console.log('\n>>> SUCCESS: ALL 10 CYCLES PASSED PERFECTLY! EXTENSION IS FULLY FUNCTIONAL & WIRED! <<<\n');
    process.exit(0);
  } catch (err) {
    console.error('\n>>> VERIFICATION FAILED:', err.message, '<<<\n');
    console.error(err.stack);
    process.exit(1);
  }
}

main();

