const assert = require('assert');
const {
  isPrivateIPv4,
  isPrivateIPv6,
  isPrivateIp,
  isDisallowedHostname,
  normalizeTargetUrl,
  validateTargetUrl,
  isSafeInflightUrl
} = require('./security.js');

async function runTests() {
  console.log('>>> RUNNING COMPREHENSIVE SECURITY & SSRF TEST HARNESS <<<\n');
  let passCount = 0;
  let totalCount = 0;

  function test(name, fn) {
    totalCount++;
    try {
      fn();
      passCount++;
      console.log(`  [PASS] ${name}`);
    } catch (e) {
      console.error(`  [FAIL] ${name}: ${e.message}`);
      throw e;
    }
  }

  async function testAsync(name, fn) {
    totalCount++;
    try {
      await fn();
      passCount++;
      console.log(`  [PASS] ${name}`);
    } catch (e) {
      console.error(`  [FAIL] ${name}: ${e.message}`);
      throw e;
    }
  }

  // --- Suite 1: IPv4 Private / Loopback / Metadata Ranges ---
  console.log('--- Suite 1: IPv4 Range Validation ---');
  test('Blocks 127.0.0.1 (Loopback)', () => assert.strictEqual(isPrivateIPv4('127.0.0.1'), true));
  test('Blocks 127.255.255.255 (Loopback boundary)', () => assert.strictEqual(isPrivateIPv4('127.255.255.255'), true));
  test('Blocks 10.0.0.1 (Private Class A)', () => assert.strictEqual(isPrivateIPv4('10.0.0.1'), true));
  test('Blocks 10.254.1.99 (Private Class A)', () => assert.strictEqual(isPrivateIPv4('10.254.1.99'), true));
  test('Blocks 172.16.0.1 (Private Class B)', () => assert.strictEqual(isPrivateIPv4('172.16.0.1'), true));
  test('Blocks 172.31.255.255 (Private Class B boundary)', () => assert.strictEqual(isPrivateIPv4('172.31.255.255'), true));
  test('Allows 172.32.0.1 (Public Class B)', () => assert.strictEqual(isPrivateIPv4('172.32.0.1'), false));
  test('Blocks 192.168.1.1 (Private Class C)', () => assert.strictEqual(isPrivateIPv4('192.168.1.1'), true));
  test('Blocks 169.254.169.254 (Cloud Metadata Service)', () => assert.strictEqual(isPrivateIPv4('169.254.169.254'), true));
  test('Blocks 169.254.0.1 (Link-local)', () => assert.strictEqual(isPrivateIPv4('169.254.0.1'), true));
  test('Blocks 0.0.0.0 (Current network)', () => assert.strictEqual(isPrivateIPv4('0.0.0.0'), true));
  test('Blocks 100.64.0.1 (CGNAT)', () => assert.strictEqual(isPrivateIPv4('100.64.0.1'), true));
  test('Blocks 100.127.255.255 (CGNAT boundary)', () => assert.strictEqual(isPrivateIPv4('100.127.255.255'), true));
  test('Allows 100.128.0.1 (Public IP after CGNAT)', () => assert.strictEqual(isPrivateIPv4('100.128.0.1'), false));
  test('Blocks 198.51.100.5 (TEST-NET-2)', () => assert.strictEqual(isPrivateIPv4('198.51.100.5'), true));
  test('Blocks 203.0.113.1 (TEST-NET-3)', () => assert.strictEqual(isPrivateIPv4('203.0.113.1'), true));
  test('Blocks 224.0.0.1 (Multicast)', () => assert.strictEqual(isPrivateIPv4('224.0.0.1'), true));
  test('Blocks 255.255.255.255 (Broadcast)', () => assert.strictEqual(isPrivateIPv4('255.255.255.255'), true));
  test('Allows 8.8.8.8 (Google Public DNS)', () => assert.strictEqual(isPrivateIPv4('8.8.8.8'), false));
  test('Allows 1.1.1.1 (Cloudflare DNS)', () => assert.strictEqual(isPrivateIPv4('1.1.1.1'), false));
  test('Allows 151.101.1.69 (Fastly CDN)', () => assert.strictEqual(isPrivateIPv4('151.101.1.69'), false));

  // --- Suite 2: IPv6 Range Validation ---
  console.log('\n--- Suite 2: IPv6 Range Validation ---');
  test('Blocks ::1 (IPv6 Loopback)', () => assert.strictEqual(isPrivateIPv6('::1'), true));
  test('Blocks :: (IPv6 Unspecified)', () => assert.strictEqual(isPrivateIPv6('::'), true));
  test('Blocks ::ffff:127.0.0.1 (IPv4-mapped Loopback)', () => assert.strictEqual(isPrivateIPv6('::ffff:127.0.0.1'), true));
  test('Blocks ::ffff:169.254.169.254 (IPv4-mapped Cloud Metadata)', () => assert.strictEqual(isPrivateIPv6('::ffff:169.254.169.254'), true));
  test('Blocks ::ffff:192.168.0.1 (IPv4-mapped Private)', () => assert.strictEqual(isPrivateIPv6('::ffff:192.168.0.1'), true));
  test('Blocks fc00::1 (IPv6 Unique Local)', () => assert.strictEqual(isPrivateIPv6('fc00::1'), true));
  test('Blocks fd12:3456:789a::1 (IPv6 Unique Local)', () => assert.strictEqual(isPrivateIPv6('fd12:3456:789a::1'), true));
  test('Blocks fe80::1 (IPv6 Link-Local)', () => assert.strictEqual(isPrivateIPv6('fe80::1'), true));
  test('Blocks ff02::1 (IPv6 Multicast)', () => assert.strictEqual(isPrivateIPv6('ff02::1'), true));
  test('Allows 2606:4700:4700::1111 (Cloudflare IPv6)', () => assert.strictEqual(isPrivateIPv6('2606:4700:4700::1111'), false));

  // --- Suite 3: Disallowed Hostnames ---
  console.log('\n--- Suite 3: Hostname Pattern Validation ---');
  test('Blocks localhost', () => assert.strictEqual(isDisallowedHostname('localhost'), true));
  test('Blocks app.localhost', () => assert.strictEqual(isDisallowedHostname('app.localhost'), true));
  test('Blocks router.local', () => assert.strictEqual(isDisallowedHostname('router.local'), true));
  test('Blocks cluster.internal', () => assert.strictEqual(isDisallowedHostname('cluster.internal'), true));
  test('Blocks secret.onion', () => assert.strictEqual(isDisallowedHostname('secret.onion'), true));
  test('Allows cnn.com', () => assert.strictEqual(isDisallowedHostname('cnn.com'), false));
  test('Allows github.com', () => assert.strictEqual(isDisallowedHostname('github.com'), false));

  // --- Suite 4: URL Normalization & Scheme Validation ---
  console.log('\n--- Suite 4: URL Normalization & Scheme Validation ---');
  test('Normalizes naked domain "cnn.com" to "https://cnn.com/"', () => {
    const res = normalizeTargetUrl('cnn.com');
    assert.strictEqual(res.toString(), 'https://cnn.com/');
  });
  test('Normalizes "httpfoo.com" without corrupting protocol (fixes Issue 17)', () => {
    const res = normalizeTargetUrl('httpfoo.com');
    assert.strictEqual(res.toString(), 'https://httpfoo.com/');
    assert.strictEqual(res.protocol, 'https:');
  });
  test('Preserves explicit "http://example.com"', () => {
    const res = normalizeTargetUrl('http://example.com');
    assert.strictEqual(res.toString(), 'http://example.com/');
  });
  test('Rejects "javascript:alert(1)"', () => {
    assert.throws(() => normalizeTargetUrl('javascript:alert(1)'), /Forbidden protocol/);
  });
  test('Rejects "file:///etc/passwd"', () => {
    assert.throws(() => normalizeTargetUrl('file:///etc/passwd'), /Forbidden protocol/);
  });
  test('Rejects "ftp://evil.com/payload"', () => {
    assert.throws(() => normalizeTargetUrl('ftp://evil.com/payload'), /Forbidden protocol/);
  });
  test('Rejects "data:text/html,evil"', () => {
    assert.throws(() => normalizeTargetUrl('data:text/html,evil'), /Forbidden protocol/);
  });
  test('Rejects empty or whitespace-only inputs', () => {
    assert.throws(() => normalizeTargetUrl('   '), /Target URL cannot be empty/);
    assert.throws(() => normalizeTargetUrl(''), /URL must be a non-empty string/);
  });

  // --- Suite 5: Full End-to-End SSRF Target Validation ---
  console.log('\n--- Suite 5: End-to-End SSRF Target Validation ---');
  await testAsync('Blocks http://169.254.169.254/latest/meta-data/', async () => {
    const res = await validateTargetUrl('http://169.254.169.254/latest/meta-data/');
    assert.strictEqual(res.valid, false);
    assert.ok(res.reason.includes('SSRF Defense'));
  });

  await testAsync('Blocks http://127.0.0.1:8080/admin', async () => {
    const res = await validateTargetUrl('http://127.0.0.1:8080/admin');
    assert.strictEqual(res.valid, false);
    assert.ok(res.reason.includes('SSRF Defense'));
  });

  await testAsync('Blocks http://localhost:5000/api/status', async () => {
    const res = await validateTargetUrl('http://localhost:5000/api/status');
    assert.strictEqual(res.valid, false);
    assert.ok(res.reason.includes('internal/loopback hostname'));
  });

  await testAsync('Blocks http://10.0.0.1/', async () => {
    const res = await validateTargetUrl('http://10.0.0.1/');
    assert.strictEqual(res.valid, false);
  });

  await testAsync('Blocks http://192.168.1.1/', async () => {
    const res = await validateTargetUrl('http://192.168.1.1/');
    assert.strictEqual(res.valid, false);
  });

  await testAsync('Blocks http://172.20.0.5/', async () => {
    const res = await validateTargetUrl('http://172.20.0.5/');
    assert.strictEqual(res.valid, false);
  });

  await testAsync('Blocks malicious non-existent domain safely without crashing', async () => {
    const res = await validateTargetUrl('https://this-domain-definitely-does-not-exist-98712398712.xyz');
    assert.strictEqual(res.valid, false);
    assert.ok(res.reason.includes('DNS lookup failed') || res.reason.includes('could not be resolved'));
  });

  await testAsync('Allows legitimate public website https://example.com', async () => {
    const res = await validateTargetUrl('https://example.com');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.hostname, 'example.com');
    assert.ok(res.ip);
  });

  await testAsync('Allows legitimate public website with naked domain "google.com"', async () => {
    const res = await validateTargetUrl('google.com');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.hostname, 'google.com');
    assert.ok(res.url.startsWith('https://google.com'));
  });

  // --- Suite 6: In-Flight Redirect & Subresource Checks ---
  console.log('\n--- Suite 6: In-Flight Request Interception Checks ---');
  test('isSafeInflightUrl allows https://cdn.example.com/bundle.js', () => {
    assert.strictEqual(isSafeInflightUrl('https://cdn.example.com/bundle.js'), true);
  });
  test('isSafeInflightUrl blocks http://127.0.0.1:3000/internal', () => {
    assert.strictEqual(isSafeInflightUrl('http://127.0.0.1:3000/internal'), false);
  });
  test('isSafeInflightUrl blocks http://169.254.169.254/latest/meta-data', () => {
    assert.strictEqual(isSafeInflightUrl('http://169.254.169.254/latest/meta-data'), false);
  });
  test('isSafeInflightUrl blocks file:///etc/shadow', () => {
    assert.strictEqual(isSafeInflightUrl('file:///etc/shadow'), false);
  });
  test('isSafeInflightUrl blocks javascript:void(0)', () => {
    assert.strictEqual(isSafeInflightUrl('javascript:void(0)'), false);
  });

  console.log(`\n========================================`);
  console.log(`RESULTS: ${passCount} / ${totalCount} TESTS PASSED (100% SUCCESS)`);
  console.log(`========================================\n`);
  process.exit(0);
}

runTests().catch((e) => {
  console.error('FATAL TEST ERROR:', e);
  process.exit(1);
});

