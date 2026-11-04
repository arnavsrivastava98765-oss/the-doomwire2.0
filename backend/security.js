/**
 * DoomWire Security & SSRF Defense Module
 * Strict URL validation, DNS resolution check, and private IP range enforcement.
 */

const dns = require('dns').promises;
const net = require('net');

/**
 * Checks whether an IPv4 address is in a private, loopback, link-local, or reserved range.
 * @param {string} ip
 * @returns {boolean}
 */
function isPrivateIPv4(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return true;
  const [a, b, c, d] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 10.0.0.0/8 (Private-Use Networks)
  if (a === 10) return true;

  // 100.64.0.0/10 (Shared Address Space / CGNAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 169.254.0.0/16 (Link-Local / Cloud Metadata: AWS, Azure, GCP, OpenStack)
  if (a === 169 && b === 254) return true;

  // 172.16.0.0/12 (Private-Use Networks: 172.16.0.0 – 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (a === 192 && b === 0 && c === 0) return true;

  // 192.0.2.0/24 (TEST-NET-1)
  if (a === 192 && b === 0 && c === 2) return true;

  // 192.168.0.0/16 (Private-Use Networks)
  if (a === 192 && b === 168) return true;

  // 198.18.0.0/15 (Network Interconnect Benchmark Testing)
  if (a === 198 && (b === 18 || b === 19)) return true;

  // 198.51.100.0/24 (TEST-NET-2)
  if (a === 198 && b === 51 && c === 100) return true;

  // 203.0.113.0/24 (TEST-NET-3)
  if (a === 203 && b === 0 && c === 113) return true;

  // 224.0.0.0/4 (Multicast)
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 (Reserved / Future Use)
  if (a >= 240) return true;

  // Broadcast
  if (a === 255 && b === 255 && c === 255 && d === 255) return true;

  return false;
}

/**
 * Checks whether an IPv6 address is loopback, unique local, link-local, or IPv4-mapped private.
 * @param {string} ip
 * @returns {boolean}
 */
function isPrivateIPv6(ip) {
  const normalized = ip.toLowerCase();

  // Loopback (::1) or Unspecified (::)
  if (normalized === '::1' || normalized === '::') return true;

  // IPv4-mapped IPv6 (::ffff:127.0.0.1 or ::ffff:a.b.c.d)
  if (normalized.startsWith('::ffff:')) {
    const ipv4Part = normalized.slice(7);
    if (net.isIPv4(ipv4Part)) {
      return isPrivateIPv4(ipv4Part);
    }
  }

  // Unique Local Address (fc00::/7)
  if (/^f[cd][0-9a-f]{2}:/i.test(normalized)) return true;

  // Link-Local Unicast (fe80::/10)
  if (/^fe[89ab][0-9a-f]:/i.test(normalized)) return true;

  // Multicast (ff00::/8)
  if (normalized.startsWith('ff')) return true;

  return false;
}

/**
 * Checks whether any IP (v4 or v6) is private or reserved.
 * @param {string} ip
 * @returns {boolean}
 */
function isPrivateIp(ip) {
  const version = net.isIP(ip);
  if (version === 4) return isPrivateIPv4(ip);
  if (version === 6) return isPrivateIPv6(ip);
  return true; // Invalid IP string is treated as unsafe
}

/**
 * Checks if a hostname directly matches loopback or private domain patterns.
 * @param {string} hostname
 * @returns {boolean}
 */
function isDisallowedHostname(hostname) {
  const h = (hostname || '').toLowerCase().trim();
  if (!h) return true;
  if (h === 'localhost') return true;
  if (h.endsWith('.localhost')) return true;
  if (h.endsWith('.local')) return true;
  if (h.endsWith('.internal')) return true;
  if (h.endsWith('.arpa')) return true;
  if (h.endsWith('.onion')) return true;
  return false;
}

/**
 * Normalizes input URL string and guarantees http/https protocol.
 * @param {string} input
 * @returns {URL}
 */
function normalizeTargetUrl(input) {
  if (!input || typeof input !== 'string') {
    throw new Error('URL must be a non-empty string.');
  }
  let trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Target URL cannot be empty.');
  }

  // Check if explicit protocol was supplied
  if (!/^https?:\/\//i.test(trimmed)) {
    // If input begins with a known non-http scheme (e.g. file:, javascript:, ftp:, gopher:)
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/i.test(trimmed)) {
      const scheme = trimmed.split(':')[0].toLowerCase();
      if (scheme !== 'http' && scheme !== 'https') {
        throw new Error(`Forbidden protocol '${scheme}:'. Only http:// and https:// targets are allowed.`);
      }
    } else {
      // Plain hostname or domain like "cnn.com" or "httpfoo.com"
      trimmed = `https://${trimmed}`;
    }
  }

  const parsed = new URL(trimmed);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Forbidden protocol '${parsed.protocol}'. Only http:// and https:// targets are allowed.`);
  }

  return parsed;
}

/**
 * Full SSRF Validation: Parses URL, enforces http(s), resolves DNS,
 * and ensures all resolved IP addresses are public and non-internal.
 *
 * @param {string} inputUrl
 * @returns {Promise<{ valid: boolean, url?: string, hostname?: string, ip?: string, reason?: string }>}
 */
async function validateTargetUrl(inputUrl) {
  let parsedUrl;
  try {
    parsedUrl = normalizeTargetUrl(inputUrl);
  } catch (err) {
    return { valid: false, reason: err.message };
  }

  const hostname = parsedUrl.hostname;

  // 1. Check against disallowed domain names
  if (isDisallowedHostname(hostname)) {
    return {
      valid: false,
      reason: `Access to internal/loopback hostname '${hostname}' is prohibited (SSRF Defense).`
    };
  }

  // 2. If hostname is a direct IP address literal, check it immediately
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      return {
        valid: false,
        reason: `Target IP '${hostname}' belongs to a private, loopback, or metadata range (SSRF Defense).`
      };
    }
    return {
      valid: true,
      url: parsedUrl.toString(),
      hostname: hostname,
      ip: hostname
    };
  }

  // 3. Resolve hostname via DNS and check every resolved address
  try {
    let lookupResults;
    try {
      lookupResults = await dns.lookup(hostname, { all: true });
    } catch (firstErr) {
      if (firstErr.code === 'EAI_AGAIN') {
        // Transient DNS error, retry once after brief backoff
        await new Promise((r) => setTimeout(r, 200));
        lookupResults = await dns.lookup(hostname, { all: true });
      } else {
        throw firstErr;
      }
    }

    if (!lookupResults || lookupResults.length === 0) {
      return {
        valid: false,
        reason: `Hostname '${hostname}' could not be resolved via DNS.`
      };
    }

    for (const record of lookupResults) {
      if (isPrivateIp(record.address)) {
        return {
          valid: false,
          reason: `Resolved IP '${record.address}' for host '${hostname}' is private/internal (SSRF Defense).`
        };
      }
    }

    return {
      valid: true,
      url: parsedUrl.toString(),
      hostname: hostname,
      ip: lookupResults[0].address
    };
  } catch (dnsErr) {
    return {
      valid: false,
      reason: `DNS lookup failed for '${hostname}': ${dnsErr.message}`
    };
  }
}

/**
 * Fast synchronous check for in-flight requests (redirects & subresources) inside Playwright.
 * Quick checks against private IP literals, loopbacks, and non-http schemes.
 *
 * @param {string} urlString
 * @returns {boolean} true if safe, false if forbidden
 */
function isSafeInflightUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const host = parsed.hostname;
    if (isDisallowedHostname(host)) {
      return false;
    }
    if (net.isIP(host) && isPrivateIp(host)) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = {
  isPrivateIPv4,
  isPrivateIPv6,
  isPrivateIp,
  isDisallowedHostname,
  normalizeTargetUrl,
  validateTargetUrl,
  isSafeInflightUrl
};

