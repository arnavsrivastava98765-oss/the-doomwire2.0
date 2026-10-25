# ⚡ DOOMWIRE // Tactical 3D Cyber-Radar, Packet X-Ray & Active Privacy Firewall

> Turn passive surveillance into an active cyber defense theater. Inspect real-time 3D tracker arcs across the globe, unmask parent entities, and physically sever or poison data streams in one click.

---

## 🌐 Overview

When you load a single webpage, hidden scripts execute within seconds, broadcasting telemetry to 30–100 third-party servers worldwide. Traditional ad blockers reduce this to a flat counter like `"14 blocked"`.

**DoomWire** visualizes and neutralizes this invisible surveillance grid in real time:
* **Live 3D WebGL Orbital Radar**: Shoots neon laser beams from your city to the exact servers storing your personal data.
* **Exact Destination Telemetry**: Tracks the real parent corporation (Meta, Google, ByteDance, Criteo), destination city, and physical GPS coordinates.
* **Packet X-Ray Inspector**: Reveals device fingerprints, ANGLE GPU renderers, screen depths, session tokens, and biometric DOM listeners.
* **"Cut the Wire" (Hard Block)**: Snaps the laser beam and physically aborts outgoing requests (`route.abort('blockedbyclient')`).
* **"Poison the Wire" (Active Deception)**: Intercepts packets in-flight and substitutes real device data with synthetic decoy fingerprints (`route.continue({ headers, postData })`), transforming the beam into Neon Purple.
* **Clean-Room Safe View**: Renders an isolated, defanged snapshot of the target webpage with all cut surveillance trackers stripped before network arrival.

---

## 🛠️ Architecture

```
[ Frontend: React + Vite + Three.js / Globe.gl + Tailwind CSS ]
                       │
             (Live WebSocket Stream)
                       │
[ Backend: Node.js + Express + Socket.io + Playwright Sandbox ]
         ├── In-flight Packet Interceptor (page.route)
         ├── DNS & Offline GeoIP Engine (geoip-lite)
         ├── Tracker Radar Intelligence Dictionary
         └── Active Firewall (route.abort & payload spoofing)
```

---

## 🚀 Quickstart

### Prerequisites
* **Node.js**: v18+ installed

### 1. Backend Setup
```bash
cd backend
npm install
npx playwright install chromium
node server.js
```
*Backend runs on `http://localhost:5000`.*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🎮 Tactical Controls

| Control | Description |
|---|---|
| **SCAN TARGET** | Initiates headless Chromium reconnaissance for any URL (e.g. CNN, Forbes, custom). |
| **CUT WIRE** | Hard-aborts outgoing packets to that domain. |
| **POISON DATA** | Injects synthetic decoy hardware fingerprints and turns laser Neon Purple. |
| **CUT ALL TRACKERS** | Master kill switch that terminates all detected ad & spyware connections. |
| **POISON ALL TRACKERS** | Master deception switch that spoofs decoy telemetry across all trackers. |
| **3D CAMERA DOCK** | Zoom in/out, pan up/down/left/right, auto-orbit toggle, and reset view. |

---

## 🛡️ License
MIT License. Built for security researchers, privacy advocates, and OSINT analysts.
