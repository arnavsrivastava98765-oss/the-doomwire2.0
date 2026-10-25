<div align="center">

# ⚡ DOOMWIRE
### Tactical 3D Cyber-Radar, In-Flight Packet X-Ray & Autonomous Deception Firewall

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=for-the-badge&logo=react)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-0.174-black.svg?style=for-the-badge&logo=three.js)](https://threejs.org)
[![Playwright](https://img.shields.io/badge/Playwright-Chromium-45ba4b.svg?style=for-the-badge&logo=playwright)](https://playwright.dev)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-white.svg?style=for-the-badge&logo=socket.io)](https://socket.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC.svg?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

<p align="center">
  <b>Turn invisible surveillance into an interactive 3D cyber-defense theater.</b><br/>
  Inspect live tracker arcs shooting across the planet, unmask parent corporations, and physically sever or poison data streams in one click.
</p>

</div>

---

## 📑 Table of Contents
1. [The Problem DoomWire Solves](#1-the-problem-doomwire-solves)
2. [What DoomWire Does (Feature Matrix)](#2-what-doomwire-does-feature-matrix)
3. [Under the Hood: The 5-Stage Technical Engine](#3-under-the-hood-the-5-stage-technical-engine)
4. [Tactical 3D Command Deck & Controls](#4-tactical-3d-command-deck--controls)
5. [System Architecture Diagram](#5-system-architecture-diagram)
6. [WebSocket Protocol Specification](#6-websocket-protocol-specification)
7. [Getting Started (Quickstart)](#7-getting-started-quickstart)
8. [Why This Project Stands Out in Engineering Interviews](#8-why-this-project-stands-out-in-engineering-interviews)
9. [Companion Chrome Extension (Manifest V3)](#9-companion-chrome-extension-manifest-v3)
10. [License](#10-license)

---

## 1. The Problem DoomWire Solves

When you open a single website—a news article, an e-commerce store, or a link from social media—you assume your computer is only communicating with that single server.

**In reality, within 3 seconds of loading, that page secretly executes hidden tracking scripts that connect your browser to 30 to 100 third-party surveillance servers worldwide:**
* **Data Brokers & Ad Networks:** Harvesting your IP, browsing journey, and search intent to construct permanent cross-site behavioral profiles.
* **Session-Replay Spyware:** Tools like Hotjar, Clarity, and Yandex Metrica that record your screen, mouse vectors, and keystrokes inside form fields *before you even click submit*.
* **Hardware Fingerprinters:** Extracting your GPU model, screen color depth, canvas noise, battery telemetry, and installed system fonts to track you even across Incognito / Private browsing modes.
* **Telemetry & Phishing Beacons:** Harvesting credential tokens and exfiltrating data to foreign jurisdictions.

**Traditional ad blockers fail human intuition:** They just show a passive counter like `"14 blocked"`.  
**DoomWire turns the invisible visible and controllable:** It projects every outgoing connection onto an interactive 3D WebGL Earth, maps physical GPS coordinates, parses sensitive payloads, and gives you live buttons to **Cut** (block) or **Poison** (feed synthetic decoys) to each tracking company.

---

## 2. What DoomWire Does (Feature Matrix)

| Feature | What the User Experiences | What Happens Under the Hood |
|---|---|---|
| **1. 3D Live Laser Radar** | A spinning, dark-mode 3D Earth. When you scan a URL, neon laser beams shoot out live from your terminal to the exact server cities worldwide receiving your data. | Every outgoing HTTP/HTTPS/WebSocket request is intercepted in-flight, resolved to an IP, and mapped to physical latitude/longitude coordinates. |
| **2. Color-Coded Threat Spectrum** | • **Green:** Legitimate website content & CDNs<br/>• **Yellow:** Ad & behavioral profiling beacons<br/>• **Orange:** Session-replay & keystroke spyware<br/>• **Red:** Phishing, malware & high-risk telemetry<br/>• **Purple:** Active deception (Poisoned decoys) | Outgoing requests are cross-referenced against tracker intelligence datasets and inspected for fingerprinting or exfiltration signatures. |
| **3. Packet X-Ray Inspector** | Clicking any laser beam or stream packet slides open an X-Ray card revealing the Real Parent Corporation (Google, Meta, ByteDance, Microsoft), the Tool Category, and Harvested Personal Details. | Unmasks cryptic CDN domains using DuckDuckGo Tracker Radar intelligence and parses URL parameters, cookies, and JSON request bodies. |
| **4. "Cut the Wire" (Hard Block)** | Clicking **CUT THE WIRE** snaps the laser beam in half, removes it from the 3D globe, and stops all future data exfiltration. | Executes Playwright's `route.abort('blockedbyclient')` at the network gatekeeper level, ensuring zero bytes ever leave your device to that tracker. |
| **5. "Poison the Wire" (Deception Mode)** | Clicking **POISON DATA** turns the laser beam **Neon Purple**. | Instead of blocking the request (which can break website layouts), Playwright intercepts the packet in-flight and replaces your real telemetry with synthetic decoys (`fake GPU`, `fake screen resolution`, `noise canvas hash`, `decoy user-agent`). |
| **6. Master Kill & Deception Switches** | **[ ✂ CUT ALL TRACKERS ]** & **[ ☣ POISON ALL TRACKERS ]** buttons in the bottom command deck. | Instantly applies mass firewall rules across all detected surveillance domains simultaneously. |
| **7. Clean-Room Safe View** | An isolated preview window displaying the sanitized website with all trackers purged. | Renders an isolated, defanged snapshot from the Playwright sandbox with all cut trackers stripped out before network transit. |

---

## 3. Under the Hood: The 5-Stage Technical Engine

```
[ Stage 1: Playwright Interceptor ] ───▶ [ Stage 2: DNS & Offline GeoIP ]
                                                        │
[ Stage 4: WebSocket Stream ]       ◀─── [ Stage 3: Corporate Unmasking & X-Ray ]
         │
         ▼
[ Stage 5: Active Defense: Abort (Cut) vs. Decoy Modification (Poison) ]
```

### Stage 1: In-Flight Network Interception (Playwright Sandbox)
Standard web browsers prevent one tab from sniffing another website's network packets due to CORS and browser sandboxing. Rather than forcing users to install root SSL certificates on an OS-level MITM proxy, DoomWire runs an isolated headless Chromium instance via Playwright.  
Before loading the URL, we attach an asynchronous network gatekeeper:
```javascript
await page.route('**/*', async (route) => {
  const req = route.request();
  const domain = new URL(req.url()).hostname;

  // 1. Cut the Wire check (Hard block)
  if (blockedDomains.has(domain)) {
    return route.abort('blockedbyclient');
  }

  // 2. Poison the Wire check (Active Deception)
  if (poisonedDomains.has(domain)) {
    const spoofedHeaders = {
      ...req.headers(),
      'user-agent': 'DoomWire-DecoyBot/4.2 (X11; Linux x86_64)',
      'x-forwarded-for': '198.51.100.42'
    };
    const spoofedPayload = JSON.stringify({
      spoofed: true,
      synthetic_fingerprint: 'DOOMWIRE_NOISE_HEX_' + Math.random().toString(16).substring(2, 8),
      fake_gpu: 'Intel Iris Plus Graphics 640'
    });
    return route.continue({ headers: spoofedHeaders, postData: spoofedPayload });
  }

  // 3. Normal packet inspection and stream to 3D Globe
  inspectAndEmit(req, domain);
  return route.continue();
});
```

### Stage 2: Sub-2ms DNS & Offline Geo-IP Resolution
For every intercepted domain (e.g. `sc-static.net`, `doubleclick.net`):
1. Node's `dns.promises.lookup(domain)` asynchronously resolves the server's real IPv4 address.
2. The offline `geoip-lite` database maps that IP to physical **Latitude, Longitude, City, and Country** in less than 2 milliseconds with zero rate limits or third-party API dependencies.

### Stage 3: Corporate Entity Unmasking & Payload X-Ray
* **Corporate Ownership Map:** Cryptic tracking domains are matched against DuckDuckGo Tracker Radar entity definitions (`sc-static.net` ➔ **Snap Inc.**, `2mdn.net` ➔ **Google LLC**, `clarity.ms` ➔ **Microsoft Corp**).
* **Payload Deep Inspector:** Inspects query parameters, headers, and POST payloads to extract leaked telemetry:
  * Display metrics (Screen Resolution, Color Depth, Viewport)
  * Hardware Fingerprints (ANGLE GPU Renderer, WebGL Canvas hashes)
  * Identity Tokens (`_ga`, `_fbp`, session cookies)
  * Biometric vectors (Mouse tracking coordinates, keystroke listeners)

### Stage 4: Real-time WebSocket Streaming (`socket.io`)
Every packet and threat classification is emitted over a high-throughput WebSocket channel to the React frontend. Arcs and impact rings trigger dynamically on the 3D globe as the page loads.

### Stage 5: Active Defense Closed Loop
When a user clicks **Cut the Wire** or **Poison Data**:
* The frontend emits a socket event back to the server.
* The backend registers the domain in `blockedDomains` or `poisonedDomains`.
* Future requests to that domain are aborted or injected with synthetic noise payloads.
* The 3D globe immediately snaps the laser beam or transforms it into a glowing **Neon Purple Deception Beam**.

---

## 4. Tactical 3D Command Deck & Controls

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

## 5. System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          DOOMWIRE CLIENT (FRONTEND)                     │
│                                                                        │
│   ┌─────────────────────┐   ┌─────────────────┐   ┌────────────────┐   │
│   │  React 18 + Vite    │   │  react-globe.gl │   │  Tactical HUD  │   │
│   │  Tailwind CSS v4    │   │  Three.js WebGL │   │  Web Audio FX  │   │
│   └──────────┬──────────┘   └────────┬────────┘   └───────┬────────┘   │
└──────────────┼───────────────────────┼────────────────────┼────────────┘
               │                       │                    │
               ▼                       ▼                    ▼
     ┌──────────────────────────────────────────────────────────┐
     │             Bi-Directional WebSocket Channel             │
     │      (packet_captured, wire_cut, wire_poisoned)          │
     └─────────────────────────┬────────────────────────────────┘
                               │
┌──────────────────────────────▼─────────────────────────────────────────┐
│                          DOOMWIRE BACKEND ENGINE                        │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │   Node.js + Express + Socket.io Server (Port 5000)             │   │
│   └──────────────────────────────┬─────────────────────────────────┘   │
│                                  │                                     │
│   ┌──────────────────────────────▼─────────────────────────────────┐   │
│   │   Playwright Headless Chromium Sandbox Engine                  │   │
│   │   • page.route('**/*') In-Flight Gatekeeper                     │   │
│   │   • Active Firewall: route.abort('blockedbyclient')            │   │
│   │   • Deception Engine: route.continue({ headers, postData })     │   │
│   └──────────────┬─────────────────────────────────┬───────────────┘   │
│                  │                                 │                   │
│   ┌──────────────▼──────────────┐   ┌──────────────▼───────────────┐   │
│   │   DNS & Offline GeoIP       │   │  DuckDuckGo Tracker Radar    │   │
│   │   (dns.lookup + geoip-lite) │   │  Corporate Entity Unmasking  │   │
│   └─────────────────────────────┘   └──────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. WebSocket Protocol Specification

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `scan_url` | Client ➔ Server | `{ url, userLocation }` | Initiates Playwright reconnaissance on the target URL. |
| `packet_captured` | Server ➔ Client | `{ id, domain, company, city, geo: { lat, lng }, threatLevel, trackerType, leakedData }` | Emitted when an outgoing packet is intercepted and mapped. |
| `cut_wire` | Client ➔ Server | `domain` | Aborts all future outgoing connections to this domain. |
| `poison_wire` | Client ➔ Server | `domain` | Swaps real device data with synthetic decoys for this domain. |
| `cut_all` | Client ➔ Server | `{ domains: [...] }` | Master kill switch for all active tracking domains. |
| `poison_all` | Client ➔ Server | `{ domains: [...] }` | Master deception switch for all active tracking domains. |
| `wire_cut` | Server ➔ Client | `{ domain }` | Broadcast to all clients to snap and remove the laser arc. |
| `wire_poisoned` | Server ➔ Client | `{ domain }` | Broadcast to all clients to turn laser beam Neon Purple. |
| `scan_complete` | Server ➔ Client | `{ message, totalPackets, safeViewImage }` | Signals scan completion and delivers clean-room preview. |

---

## 7. Getting Started (Quickstart)

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### 1. Clone the Repository
```bash
git clone https://github.com/arnavsrivastava98765-oss/The-DoomWire.git
cd The-DoomWire
```

### 2. Launch the Backend Server
```bash
cd backend
npm install
npx playwright install chromium
node server.js
```
*Backend initializes on `http://localhost:5000` with the Playwright sandbox ready.*

### 3. Launch the Frontend Radar UI
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
*Frontend opens at `http://localhost:5173`.*

---

## 8. Why This Project Stands Out in Engineering Interviews

When showcasing DoomWire in a technical interview, you demonstrate mastery across three distinct engineering domains:

1. **Visual Engineering & WebGL Graphics:**
   * High-performance 3D rendering with Three.js and `react-globe.gl`.
   * Real-time animated arcs, expanding radar rings, and coordinate projection.
   * Responsive HUD layout with glassmorphism, CRT scanlines, and audio synthesis.

2. **Systems, Networking & Telemetry:**
   * Asynchronous DNS resolution coupled with offline `geoip-lite` (<2ms response).
   * HTTP header, query string, and payload parsing to extract fingerprinting keys.
   * High-throughput, bi-directional WebSocket event streaming with Socket.io.

3. **Browser Internals & Active Cyber Defense:**
   * Headless Chromium orchestration with Playwright.
   * In-process network routing using `page.route()` that intercepts HTTPS traffic without SSL MITM proxy certificates.
   * Active countermeasures: `route.abort('blockedbyclient')` and active decoy payload injection (`route.continue()`).

---

## 9. Companion Chrome Extension (Manifest V3)

To extend "Cut the Wire" protection outside the sandbox across your daily Chrome/Brave/Edge browser, DoomWire integrates with Chrome's native `declarativeNetRequest` engine:

```javascript
// extension/background.js
const socket = io('http://localhost:5000');

socket.on('wire_cut', ({ domain }) => {
  chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [{
      id: Math.floor(Math.random() * 100000),
      priority: 1,
      action: { type: 'block' },
      condition: { urlFilter: `||${domain}^` }
    }]
  });
  console.log(`[DoomWire Shield] Blocked across your browser: ${domain}`);
});
```

---

## 10. License

Distributed under the **MIT License**. See `LICENSE` for more information.

Built with ⚡ by [Arnav](https://github.com/arnavsrivastava98765-oss) for privacy advocates, security researchers, and systems engineers.
