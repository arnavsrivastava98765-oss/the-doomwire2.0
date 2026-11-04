<div align="center">

# ⚡ DOOMWIRE
### Tactical 3D Cyber-Radar, In-Flight Packet X-Ray & Autonomous Deception Firewall

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=for-the-badge&logo=react)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-0.186-black.svg?style=for-the-badge&logo=three.js)](https://threejs.org)
[![Playwright](https://img.shields.io/badge/Playwright-Chromium-45ba4b.svg?style=for-the-badge&logo=playwright)](https://playwright.dev)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-white.svg?style=for-the-badge&logo=socket.io)](https://socket.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC.svg?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

<p align="center">
  <b>Turn invisible web surveillance into an interactive 3D cyber-defense theater.</b><br/>
  Inspect live tracker arcs shooting across the planet, unmask parent corporations via DuckDuckGo Tracker Radar, and physically sever or inject decoy headers into in-flight data streams in one click.
</p>

</div>

---

## 📑 Table of Contents
1. [The Problem DoomWire Solves](#1-the-problem-doomwire-solves)
2. [Technical & Legal Disclaimer](#2-technical--legal-disclaimer)
3. [What DoomWire Does (Feature Matrix)](#3-what-doomwire-does-feature-matrix)
4. [Under the Hood: The 5-Stage Technical Engine](#4-under-the-hood-the-5-stage-technical-engine)
5. [Tactical 3D Command Deck & Controls](#5-tactical-3d-command-deck--controls)
6. [Modular System Architecture](#6-modular-system-architecture)
7. [WebSocket Protocol Specification](#7-websocket-protocol-specification)
8. [Automated Verification Suite (18 Tests)](#8-automated-verification-suite-18-tests)
9. [Getting Started (Quickstart)](#9-getting-started-quickstart)
10. [Production Cloud Deployment (Render & Vercel)](#10-production-cloud-deployment-render--vercel)
11. [Companion Chrome Extension (Manifest V3)](#11-companion-chrome-extension-manifest-v3)
12. [License](#12-license)

---

## 1. The Problem DoomWire Solves

When you open a single website—a news article, an e-commerce store, or a link from social media—you assume your computer is only communicating with that single server.

**In reality, within seconds of loading, that page executes subresource scripts that connect to dozens of third-party network endpoints worldwide:**
* **Ad Exchanges & Real-Time Bidding:** Measuring traffic, ad delivery, and search intent to facilitate programmatic advertising.
* **Session Recording & Interaction Telemetry:** Diagnostic tools like Hotjar and Microsoft Clarity that record user interaction heatmaps, scroll depth, and client responsiveness.
* **Client Diagnostics & Environment Indicators:** Capturing viewport dimensions, client hints, and browser characteristics for responsive layout delivery and fraud prevention.
* **Analytics Beacons & Conversion Pixels:** Beacons transmitting browsing sessions, referrer paths, and marketing campaign attribution identifiers.

**Traditional ad blockers fail human intuition:** They just show a passive counter like `"14 blocked"`.  
**DoomWire turns the invisible visible and controllable:** It projects outgoing connections onto an interactive 3D WebGL Earth, maps physical GPS coordinates based on server IPs, parses observed request parameters and cookies, and gives you live buttons to **Cut** (abort) or **Poison** (inject synthetic decoy headers) for target domains inside an isolated per-socket sandbox session.

---

## 2. Technical & Legal Disclaimer

> **Notice:** DoomWire is an educational and observability platform designed for cybersecurity research, network telemetry analysis, and privacy visualization. Domain classifications, entity attributions, and geographic coordinates are derived from observable network headers, DNS A/CNAME records, and open-source datasets (including DuckDuckGo Tracker Radar). Categories describe functional network roles (such as advertising, telemetry, analytics, or session replay) and do **not** imply unlawful activity, phishing, or malware. Geographic locations indicate IP Anycast or datacenter points of presence, which may differ from a corporate legal entity's headquarters.

---

## 3. What DoomWire Does (Feature Matrix)

| Feature | What the User Experiences | What Happens Under the Hood |
|---|---|---|
| **1. 3D Live Laser Radar** | A spinning, dark-mode 3D Earth. When you scan a URL, neon laser beams shoot out live from your terminal to the server cities worldwide receiving connections. | Outgoing HTTP/HTTPS requests inside the isolated Playwright sandbox are intercepted in-flight, resolved to an IP, and mapped to geographic coordinates. |
| **2. Color-Coded Threat Spectrum** | • **Green:** Primary website origin content & CDNs<br/>• **Yellow:** Behavioral analytics & conversion tracking<br/>• **Orange:** Session recording, heatmaps & interaction telemetry<br/>• **Red:** Programmatic ad bidding exchanges & third-party data brokers<br/>• **Purple:** Active deception (Decoy header injection) | Outgoing requests are cross-referenced against Tracker Radar intelligence datasets and inspected for genuine query parameters and cookies using exact domain matching. |
| **3. Packet X-Ray Inspector** | Clicking any laser beam or stream packet slides open an X-Ray card revealing the Parent Corporation, the Tool Category, and Observed Request Attributes. | Unmasks cryptic tracker domains using Tracker Radar intelligence and parses genuine URL parameters, cookies, and headers without fabricated heuristics. |
| **4. "Cut the Wire" (Hard Block)** | Clicking **CUT THE WIRE** snaps the laser beam in half, removes it from the 3D globe, and stops future outbound transmissions to this endpoint. | Executes Playwright's `route.abort('blockedbyclient')` at the network gatekeeper level within the user's isolated session, preventing subsequent network transit. |
| **5. "Poison the Wire" (Deception Mode)** | Clicking **POISON DATA** turns the laser beam **Neon Purple**. | Playwright intercepts the packet in-flight and injects synthetic decoy headers (`X-Forwarded-For: 198.51.100.42`, `DNT: 1`, `Sec-GPC: 1`, Decoy User-Agent) without corrupting GET request semantics. |
| **6. SSRF & Sandbox Hardening** | Protects the hosting server from server-side request forgery attacks. | Blocks localhost, loopback (`127.0.0.1`), private RFC1918 ranges, and AWS/GCP cloud metadata endpoints (`169.254.169.254`) both before launch and during navigation redirects. |
| **7. Multi-User Session Isolation** | Multiple users can scan websites simultaneously without stepping on each other's rules or aborting active browses. | Allocates a dedicated Playwright browser context, page, and rule set per WebSocket connection (`socket.id`), preventing global state leaks. |
| **8. Rate Limiting & Concurrency Cap** | Prevents denial-of-service abuse on free-tier infrastructure. | Enforces sliding-window IP rate limiting (10 scans / 5 min) and a strict concurrency governor (max 2 concurrent Chromium sessions). |
| **9. Clean-Room Safe View** | An isolated preview window displaying the sanitized website with all blocked domains severed. | Renders an isolated snapshot from the Playwright sandbox with all cut trackers stripped out before network transit. |

---

## 4. Under the Hood: The 5-Stage Technical Engine

```
[ Stage 1: Playwright Interceptor ] ───▶ [ Stage 2: DNS & Offline GeoIP ]
                                                        │
[ Stage 4: WebSocket Stream ]       ◀─── [ Stage 3: Corporate Unmasking & X-Ray ]
         │
         ▼
[ Stage 5: Active Defense: Abort (Cut) vs. Decoy Modification (Poison) ]
```

### Stage 1: In-Flight Network Interception (Playwright Sandbox)
Standard web browsers prevent one tab from sniffing another website's network packets due to CORS and browser sandboxing. DoomWire runs an isolated headless Chromium instance via Playwright inside a hardened sandbox.  
Before loading the URL, an asynchronous network gatekeeper is attached per session:
```javascript
await page.route('**/*', async (route) => {
  const req = route.request();
  const domain = new URL(req.url()).hostname;

  // 1. Cut the Wire check (Hard block)
  if (sessionRules.blockedDomains.has(domain)) {
    return route.abort('blockedbyclient');
  }

  // 2. Poison the Wire check (Synthetic Decoy & Privacy Headers)
  if (sessionRules.poisonedDomains.has(domain)) {
    const spoofedHeaders = {
      ...req.headers(),
      'user-agent': 'DoomWire-DecoyBot/4.2 (X11; Linux x86_64; rv:109.0)',
      'x-forwarded-for': '198.51.100.42',
      'dnt': '1',
      'sec-gpc': '1',
      'referer': 'https://deception.internal.local'
    };
    if (['POST', 'PUT', 'PATCH'].includes(req.method())) {
      const decoyBody = JSON.stringify({ _doomwire_decoy: true, _synthetic_entropy: 'decoy_payload' });
      return route.continue({ headers: spoofedHeaders, postData: decoyBody });
    }
    // GET / HEAD requests continue cleanly with decoy headers without attaching illegal request bodies
    return route.continue({ headers: spoofedHeaders });
  }

  // 3. Normal packet inspection and stream to 3D Globe
  inspectAndEmit(req, domain);
  return route.continue();
});
```

> **Consent Interaction Policy:** To observe real-world tracking behavior, the sandbox simulates interaction with standard consent notices (OneTrust, Cookiebot, and standard CMPs). This allows DoomWire to measure genuine post-consent network beacons and bidstream telemetry that initialize only after user consent is registered.

### Stage 2: Sub-2ms DNS & Offline Geo-IP Resolution
For every intercepted domain (e.g. `sc-static.net`, `doubleclick.net`):
1. Node's `dns.promises.lookup(domain)` asynchronously resolves the server's real IPv4 address.
2. The offline `geoip-lite` database maps that IP to physical **Latitude, Longitude, City, and Country** in less than 2 milliseconds with zero rate limits or third-party API dependencies.

### Stage 3: Corporate Entity Unmasking & Empirical Payload X-Ray
* **Corporate Ownership Map:** Cryptic tracking domains are matched against DuckDuckGo Tracker Radar entity definitions (`sc-static.net` ➔ **Snap Inc.**, `2mdn.net` ➔ **Google LLC**, `clarity.ms` ➔ **Microsoft Corp**).
* **Payload Deep Inspector:** Inspects genuine query parameters, headers, and cookies to extract empirical telemetry:
  * Viewport & Display metrics (`w`, `h`, `res`, `v`)
  * Analytics Tokens (`_ga`, `_fbp`, session cookies)
  * Tracking IDs (`tid`, `uid`, `cid`, `pixel`)

### Stage 4: Real-time WebSocket Streaming (`socket.io`)
Every packet and threat classification is emitted over a high-throughput WebSocket channel to the React frontend. Arcs and impact rings trigger dynamically on the 3D globe as the page loads.

### Stage 5: Active Defense Closed Loop
When a user clicks **Cut the Wire** or **Poison Data**:
* The frontend emits a socket event back to the server scoped to the active session.
* The backend registers the domain in `session.blockedDomains` or `session.poisonedDomains`.
* Future requests to that domain are aborted or injected with synthetic noise payloads.
* The 3D globe immediately snaps the laser beam or transforms it into a glowing **Neon Purple Deception Beam**.

---

## 5. Tactical 3D Command Deck & Controls

### 3D Globe Navigation (Zero Screen Clipping)
* **Mouse & Gesture Pan:** Built with `enablePan: true`—right-click or two-finger drag smoothly shifts the globe **Up, Down, Left, and Right**.
* **On-Screen Navigation Pod:**
  * **Zoom In `(+)`** & **Zoom Out `(-)`**
  * **Shift Up `(↑)`**, **Shift Down `(↓)`**, **Shift Left `(←)`**, **Shift Right `(→)`**
  * **Reset Camera (`RESET`)**
  * **Auto-Orbit Toggle `(⟳)`**
* **Target Snap:** Clicking any packet automatically glides the camera directly to that destination server.

### Bottom Command Deck
Docked full-width at the bottom of the viewport:
* **Destination Telemetry:** Displays the exact server facility and physical GPS coordinates (e.g., `Meta Platforms EU Storage • Dublin, IE (53.3498°N, -6.2603°E)`).
* **Target Wire Controls:** Immediate **[ ✂ CUT WIRE ]** and **[ ☣ POISON DATA ]** action triggers.
* **Master Kill Switches:** **[ ✂ CUT ALL TRACKERS ]** and **[ ☣ POISON ALL TRACKERS ]**.
* **Synthesizer Audio:** Web Audio API synth blips on packet captures, high-voltage severing arcs, and poison warbles (with toggleable mute).

---

## 6. Modular System Architecture

The codebase has been refactored into decoupled single-responsibility modules:

```
├── backend/
│   ├── server.js              # Express HTTP, Socket.io lifecycle, health checks (/api/status)
│   ├── scanner.js             # Playwright orchestration, per-socket isolation, consent handling
│   ├── intel.js               # DNS lookup, geoip-lite, parameter X-Ray, DuckDuckGo entity mapping
│   ├── classifier.js          # Registrable domain & FQDN threat classification
│   ├── security.js            # SSRF protection, URL validation, private IP blocking
│   ├── rateLimiter.js         # IP rate limiting & global concurrency throttling
│   ├── trackerEntities.js     # Curated DuckDuckGo Tracker Radar entity database
│   └── test_all.js            # Automated test runner executing all 18 verification suites
├── src/
│   ├── App.jsx                # React state orchestrator & HUD overlays
│   ├── domainRecon.js         # Client-side domain mapping (100% backend-delegated)
│   ├── components/
│   │   ├── NavigationPod.jsx  # 3D globe camera Pan / Tilt / Zoom controls
│   │   ├── SpectrumLegend.jsx # Functional threat taxonomy legend
│   │   ├── InspectorModal.jsx # Empirical packet payload X-Ray modal
│   │   ├── SafeViewModal.jsx  # Clean-room isolated preview dialog
│   │   └── ServerModal.jsx    # Backend URL configuration & cold-start monitor
│   └── utils/
│       ├── audio.js           # Web Audio API procedural sound synthesizer
│       ├── globeConfig.js     # Three.js globe materials, shaders & multi-tier cyber arcs
│       └── themes.js          # Dark minimalist tactical themes
├── extension/
│   ├── background.js          # Chrome Manifest V3 active firewall (declarativeNetRequest)
│   └── manifest.json          # Chrome extension permissions & metadata
├── Dockerfile                 # Multi-stage production container with non-root execution
├── render.yaml                # Infrastructure-as-Code blueprint for Render Web Service
└── vercel.json                # Single-page application routing rules for Vercel CDN
```

---

## 7. WebSocket Protocol Specification

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `scan_url` | Client ➔ Server | `{ url, userLocation }` | Initiates Playwright reconnaissance on the target URL with SSRF checks. |
| `packet_captured` | Server ➔ Client | `{ id, domain, company, city, geo: { lat, lng }, threatLevel, trackerType, leakedData, isFirstParty }` | Emitted when an outgoing packet is intercepted and mapped. |
| `cut_wire` | Client ➔ Server | `domain` | Aborts all future outgoing connections to this domain in the user's session. |
| `poison_wire` | Client ➔ Server | `domain` | Injects synthetic decoy headers into traffic for this domain in the user's session. |
| `cut_all` | Client ➔ Server | `{ domains: [...] }` | Master kill switch for all active tracking domains. |
| `poison_all` | Client ➔ Server | `{ domains: [...] }` | Master deception switch for all active tracking domains. |
| `wire_cut` | Server ➔ Client | `{ domain }` | Confirms domain severing to the client and updates active Chrome extension rules. |
| `wire_poisoned` | Server ➔ Client | `{ domain }` | Confirms decoy injection to turn laser beam Neon Purple. |
| `scan_complete` | Server ➔ Client | `{ message, totalPackets, safeViewImage }` | Signals scan completion and delivers clean-room preview. |

---

## 8. Automated Verification Suite (18 Tests)

DoomWire includes a 100% automated test harness covering all security, precision, and architectural guarantees:

```bash
# Run all 18 automated test suites across child processes
npm test
```

| Suite | Focus Area | What Is Verified |
|---|---|---|
| `test_issue1_e2e.js` | Zero Fabricated Data | Empirical URL parameter & cookie decoding; removal of invented TLS/BGP hashes. |
| `test_issue2_e2e.js` | Deception Integrity | Decoy headers (`X-Forwarded-For`, `Sec-GPC`) injected; GET request bodies preserved. |
| `test_issue3_e2e.js` | Extension Integration | Chrome `declarativeNetRequest` rule generation from `wire_cut` socket events. |
| `test_issue4_e2e.js` | SSRF Defense | Immediate rejection of loopback (`127.0.0.1`), metadata (`169.254.169.254`), and private subnets. |
| `test_issue5_e2e.js` | Per-Socket Isolation | Multiple browser sessions run concurrently without cross-user interference or shared rules. |
| `test_issue6_e2e.js` | Rate Limiting & DoS | IP sliding window blocks excessive scans; concurrency governor caps simultaneous instances. |
| `test_issue7_e2e.js` | Full Network Capture | Extended network observation window; captures all dynamically loaded scripts. |
| `test_issue8_e2e.js` | Empirical Distinction | DNS-discovered infrastructure separated from observed network traffic. |
| `test_issue9_12_e2e.js` | DDG Tracker Radar | Legitimate corporate unmasking and explicit separation of 1st-party vs 3rd-party hosts. |
| `test_issue10_e2e.js` | Substring Precision | Exact registrable domain matching; stops false positives on domains like `adobe` or `stage`. |
| `test_issue11_e2e.js` | Zero Leaky Proxies | Third-party CORS proxies removed; all recon executed securely backend-side. |
| `test_issue13_e2e.js` | Docker Security | Non-root `pwuser`, clean multi-stage layer caching, single Playwright install. |
| `test_issue14_e2e.js` | Cold-Start Resilience | `/api/status` health check endpoint and client-side warming indicators. |
| `test_issue15_e2e.js` | Modular Architecture | Verification that monolithic files are cleanly separated into dedicated components. |
| `test_issue16_e2e.js` | Test Suite Coverage | Automated test harness verification. |
| `test_issue17_e2e.js` | Edge-Case URL Defense | Malformed URLs like `httpfoo.com` safely rejected; modern Chromium user-agent verified. |
| `test_issue18_e2e.js` | Dependency Audit | Clean `npm audit` check with zero high/critical vulnerabilities. |
| `test_legal_framing.js` | Legal & Ethical Safety | Neutral functional categories used; defamatory terms eliminated; disclaimers verified. |

---

## 9. Getting Started (Quickstart)

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### 1. Clone the Repository
```bash
git clone https://github.com/arnavsrivastava98765-oss/the-doomwire2.0.git
cd the-doomwire2.0
```

### 2. Install Dependencies
```bash
# Install frontend orchestrator dependencies
npm install

# Install backend dependencies and Playwright Chromium
cd backend
npm install
npx playwright install chromium
cd ..
```

### 3. Launch Development Environment
From the project root:
```bash
npm run dev
```
* Concurrently launches the backend engine on `http://localhost:5000` and the Vite React UI on `http://localhost:5173`.
* Navigate to `http://localhost:5173` in your browser.

---

## 10. Production Cloud Deployment (Render & Vercel)

DoomWire is engineered for high-availability split-cloud deployment:

### Backend Engine on Render (Docker Web Service)
The backend runs in an isolated, non-root Linux container with Playwright Chromium.

1. **Blueprint Deployment (`render.yaml`):**
   * Connect your GitHub repository to Render.
   * Render automatically reads `render.yaml` and deploys the `doomwire-engine` service using the root `Dockerfile`.
   * **Health Check Path:** `/api/status`
   * **Port:** `5000`
2. **Render Cold-Start Protection:**
   * Free-tier Render instances sleep after 15 minutes of inactivity.
   * DoomWire's UI automatically surfaces a **WAKING ENGINE (~20s)...** notification and pings `/api/status` until the container initializes.

### Frontend Radar on Vercel (Global Edge CDN)
The static React UI deploys globally across Vercel's edge network.

1. **Vercel Setup:**
   * Import the GitHub repository in the Vercel Dashboard.
   * **Framework Preset:** Vite
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
2. **Environment Variables:**
   * Set `VITE_BACKEND_URL` to your live Render backend URL:
     ```
     VITE_BACKEND_URL=https://your-doomwire-engine.onrender.com
     ```
   * Single-page routing is automatically handled by [`vercel.json`](file:///c:/Users/arnav/OneDrive/Desktop/Dazyyy%20vr-3.4/vercel.json).

---

## 11. Companion Chrome Extension (Manifest V3)

To extend "Cut the Wire" protection outside the sandbox across your daily browsing in Chrome, Brave, or Edge:

1. Open your browser and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select the [`extension`](file:///c:/Users/arnav/OneDrive/Desktop/Dazyyy%20vr-3.4/extension) directory.
4. When you click **Cut the Wire** inside the DoomWire 3D UI, the backend broadcasts a `wire_cut` event that dynamically registers a `declarativeNetRequest` block rule inside your Chrome browser.

```javascript
// extension/background.js
socket.on('wire_cut', ({ domain }) => {
  blockDomainAcrossBrowser(domain);
  console.log(`[DoomWire Shield] Blocked across browser via declarativeNetRequest: ${domain}`);
});
```

---

## 12. License

Distributed under the **MIT License**. See `LICENSE` for more information.

Built with ⚡ by [Arnav](https://github.com/arnavsrivastava98765-oss) for privacy advocates, security researchers, and systems engineers.
