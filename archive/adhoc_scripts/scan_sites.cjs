const io = require('socket.io-client');
const fs = require('fs');

const sites = [
  'cnn.com',
  'nytimes.com',
  'reddit.com',
  'forbes.com',
  'timesofindia.indiatimes.com',
  'flipkart.com',
  'moneycontrol.com',
  'ndtv.com',
  'amazon.in'
];

async function scanSite(siteUrl) {
  return new Promise((resolve) => {
    console.log(`\n========================================`);
    console.log(`Scanning: ${siteUrl}...`);
    const socket = io('http://localhost:5000');
    
    const packets = [];
    const companies = new Set();
    const countries = new Set();
    let redCount = 0;
    let orangeCount = 0;
    let thirdPartyCount = 0;

    const baseHost = siteUrl.replace(/^www\./, '').split('/')[0];

    const timer = setTimeout(() => {
      console.log(`Timeout reached for ${siteUrl}, finalizing collected packets.`);
      socket.disconnect();
      finish();
    }, 25000);

    function finish() {
      clearTimeout(timer);
      const res = {
        site: siteUrl,
        totalRequests: packets.length,
        thirdPartyRequests: thirdPartyCount,
        distinctCompanies: companies.size,
        distinctCountries: countries.size,
        redCount,
        orangeCount,
        redAndOrange: redCount + orangeCount,
        companiesList: Array.from(companies),
        countriesList: Array.from(countries)
      };
      resolve(res);
    }

    socket.on('connect', () => {
      socket.emit('scan_url', { url: `https://${siteUrl}` });
    });

    socket.on('packet_captured', (pkt) => {
      packets.push(pkt);
      const isThirdParty = !pkt.domain.includes(baseHost) && !baseHost.includes(pkt.domain);
      if (isThirdParty) {
        thirdPartyCount++;
      }
      if (pkt.company) companies.add(pkt.company);
      if (pkt.city) {
        const parts = pkt.city.split(',');
        const country = parts[parts.length - 1].trim();
        if (country) countries.add(country);
      }
      if (pkt.threatLevel === 'red') redCount++;
      if (pkt.threatLevel === 'orange') orangeCount++;
    });

    socket.on('scan_complete', () => {
      console.log(`Scan completed cleanly for ${siteUrl}! Packets: ${packets.length}`);
      socket.disconnect();
      finish();
    });

    socket.on('scan_error', (err) => {
      console.error(`Error scanning ${siteUrl}:`, err);
      socket.disconnect();
      finish();
    });
  });
}

async function run() {
  const results = [];
  for (const site of sites) {
    try {
      const res = await scanSite(site);
      results.push(res);
      console.log(`Result for ${site}:`, JSON.stringify(res, null, 2));
    } catch (e) {
      console.error(`Failed ${site}:`, e);
    }
  }

  fs.writeFileSync('scripts/scan_results.json', JSON.stringify(results, null, 2));
  console.log('\nAll scans complete! Saved to scripts/scan_results.json');
}

run();
