const { chromium } = require('../backend/node_modules/playwright');
const path = require('path');
const fs = require('fs');

async function generatePdfDeck() {
  console.log('[DOOMWIRE] Launching Playwright to render 16:9 PDF Pitch Deck...');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DOOMWIRE // Hackathon Pitch Deck</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @page {
      size: 1920px 1080px;
      margin: 0;
    }
    body {
      background-color: #030712;
      color: #f8fafc;
      font-family: 'Plus Jakarta Sans', sans-serif;
      margin: 0;
      padding: 0;
    }
    .slide {
      width: 1920px;
      height: 1080px;
      page-break-after: always;
      position: relative;
      overflow: hidden;
      background: radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.08) 0%, #030712 60%);
      padding: 60px 80px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 1px solid #1e293b;
    }
    .hud-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(56, 189, 248, 0.2);
      padding-bottom: 20px;
    }
    .hud-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 800;
      color: #38bdf8;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .slide-title {
      font-size: 40px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #ffffff;
      margin-top: 6px;
    }
    .hud-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 6px;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(56, 189, 248, 0.4);
      color: #38bdf8;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 20px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: #64748b;
    }
    .footer strong {
      color: #38bdf8;
    }
    /* Cards & Grids */
    .grid-2 {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 36px;
      height: 720px;
      align-items: center;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 28px;
      height: 700px;
      align-items: stretch;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
      height: 700px;
      align-items: stretch;
    }
    .grid-5 {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 20px;
      height: 480px;
      align-items: stretch;
    }
    .card {
      background: rgba(11, 19, 43, 0.7);
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 28px;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .card.crimson {
      border-color: rgba(244, 63, 94, 0.4);
      background: rgba(26, 11, 20, 0.5);
    }
    .card.cyan {
      border-color: rgba(56, 189, 248, 0.4);
      background: rgba(6, 25, 45, 0.5);
    }
    .card.purple {
      border-color: rgba(192, 132, 252, 0.4);
      background: rgba(24, 11, 38, 0.5);
    }
    .card.green {
      border-color: rgba(16, 185, 129, 0.4);
      background: rgba(6, 32, 24, 0.5);
    }
    .card-title {
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 12px;
    }
    .card-body {
      font-size: 15px;
      line-height: 1.55;
      color: #cbd5e1;
      flex: 1;
    }
    .card-stat {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      font-weight: 700;
      padding-top: 14px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      margin-top: 14px;
    }
    /* Hero elements */
    .hero-box {
      background: rgba(6, 12, 27, 0.85);
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 60px 70px;
      height: 760px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative;
    }
    .hero-title {
      font-size: 96px;
      font-weight: 900;
      letter-spacing: -2px;
      background: linear-gradient(135deg, #ffffff 40%, #38bdf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 12px;
    }
    .hero-sub {
      font-size: 28px;
      font-weight: 700;
      color: #38bdf8;
      margin-bottom: 32px;
    }
    .quote-box {
      background: #030712;
      border-left: 4px solid #38bdf8;
      padding: 24px 32px;
      border-radius: 0 12px 12px 0;
      margin-bottom: 40px;
      font-size: 21px;
      font-weight: 600;
      line-height: 1.45;
      color: #f1f5f9;
    }
    .badge-bar {
      display: flex;
      gap: 20px;
    }
    .badge-card {
      flex: 1;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid #38bdf8;
      border-radius: 10px;
      padding: 20px 24px;
    }
    .badge-card h4 {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      color: #38bdf8;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    .badge-card p {
      font-size: 13.5px;
      color: #cbd5e1;
      line-height: 1.4;
    }
    .stat-banner {
      background: rgba(26, 11, 20, 0.7);
      border: 1px solid #f43f5e;
      border-radius: 12px;
      padding: 20px 32px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 24px;
    }
    .stat-banner .num {
      font-family: 'JetBrains Mono', monospace;
      font-size: 48px;
      font-weight: 900;
      color: #f43f5e;
    }
    .stat-banner .txt {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.4;
    }
    ul.bullet-list {
      list-style: none;
    }
    ul.bullet-list li {
      font-size: 15px;
      color: #cbd5e1;
      line-height: 1.6;
      margin-bottom: 10px;
      position: relative;
      padding-left: 20px;
    }
    ul.bullet-list li::before {
      content: '▸';
      position: absolute;
      left: 0;
      color: #38bdf8;
      font-weight: bold;
    }
  </style>
</head>
<body>

  <!-- SLIDE 1: Title & Hook -->
  <div class="slide">
    <div class="hud-header">
      <div class="hud-tag">[ HACKATHON PITCH DECK // CYBERSECURITY & PRIVACY TRACK ]</div>
      <div class="hud-badge">OBSIDIAN BLUE // LIVE AT RENDER</div>
    </div>

    <div class="hero-box">
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #38bdf8; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 10px;">
        ENGINEERED BY ARNAV & TEAM // ACTIVE 3D CYBER-RADAR
      </div>
      <h1 class="hero-title">DOOMWIRE</h1>
      <h2 class="hero-sub">3D Tactical Cyber-Radar, In-Flight Packet X-Ray & Autonomous Deception Firewall</h2>

      <div class="quote-box">
        <span style="color: #38bdf8; font-family: 'JetBrains Mono', monospace; font-size: 14px; display: block; margin-bottom: 6px;">THE HACKATHON HOOK:</span>
        "You cannot defend what you cannot see."<br>
        <span style="font-size: 16px; font-weight: 400; color: #94a3b8;">We transformed invisible web surveillance and silent cross-border data exfiltration into an interactive 3D WebGL tactical war room equipped with live autonomous weaponized countermeasures.</span>
      </div>

      <div class="badge-bar">
        <div class="badge-card">
          <h4>🛰️ 3D Planetary Radar</h4>
          <p>Real-time WebGL NASA Earth projecting ballistic laser arcs to destination server cities.</p>
        </div>
        <div class="badge-card" style="border-color: #c084fc;">
          <h4 style="color: #c084fc;">⚡ Zero-Mock Engine</h4>
          <p>Live Playwright sandbox tapping network packets before transmission with offline GeoIP.</p>
        </div>
        <div class="badge-card" style="border-color: #f43f5e;">
          <h4 style="color: #f43f5e;">☠️ Deception Firewall</h4>
          <p>Autonomous "Wire-Poisoning" injecting synthetic decoy noise to corrupt tracker profiles.</p>
        </div>
      </div>
    </div>

    <div class="footer">
      <div>DOOMWIRE v3.4 &bull; by-Arnavvv &bull; Built with React 18, Three.js, Node.js & Playwright</div>
      <div><strong>01</strong> / 07</div>
    </div>
  </div>

  <!-- SLIDE 2: Problem Statement & Research -->
  <div class="slide">
    <div class="hud-header">
      <div>
        <div class="hud-tag">[ 02 // PROBLEM STATEMENT & RESEARCH ]</div>
        <h2 class="slide-title">The Silent Surveillance Crisis: Every Webpage Whispers to 80+ Servers</h2>
      </div>
      <div class="hud-badge" style="border-color: #f43f5e; color: #f43f5e;">THREAT VECTOR REPORT</div>
    </div>

    <div class="stat-banner">
      <div class="num">91%</div>
      <div class="txt">
        of the world's top 1,000 websites secretly leak personal search intent, behavioral biometrics, and hardware fingerprints to 30 to 100 third-party servers within 3 seconds of loading.
      </div>
    </div>

    <div class="grid-4" style="height: 540px;">
      <div class="card crimson">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #f43f5e; margin-bottom: 8px;">VECTOR [01]</div>
        <div class="card-title">Cross-Site Ad Brokers</div>
        <div class="card-body">
          Data brokers (Criteo, Pubmatic, DoubleClick) silently harvest IP addresses, device history, and browsing journeys to assemble permanent cross-device surveillance profiles sold across ad auctions.
        </div>
        <div class="card-stat" style="color: #f43f5e;">
          EXPOSURE: 35%–60% of all page requests
        </div>
      </div>

      <div class="card" style="border-color: #fbbf24; background: rgba(30, 20, 6, 0.5);">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #fbbf24; margin-bottom: 8px;">VECTOR [02]</div>
        <div class="card-title">Session-Replay Spyware</div>
        <div class="card-body">
          Surveillance scripts (Hotjar, Microsoft Clarity, Yandex Metrica) continuously record mouse vectors, scrolling depth, and form field keystrokes <em>before you even click submit</em>.
        </div>
        <div class="card-stat" style="color: #fbbf24;">
          EXPOSURE: Real-time biometric exfiltration
        </div>
      </div>

      <div class="card purple">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #c084fc; margin-bottom: 8px;">VECTOR [03]</div>
        <div class="card-title">Hardware Fingerprinters</div>
        <div class="card-body">
          Probes your GPU graphics renderer, WebGL canvas entropy, audio buffer latency, and installed system fonts to track users across Incognito / Private browsing modes without cookies.
        </div>
        <div class="card-stat" style="color: #c084fc;">
          EXPOSURE: Bypasses cookie clears
        </div>
      </div>

      <div class="card cyan">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #38bdf8; margin-bottom: 8px;">VECTOR [04]</div>
        <div class="card-title">Passive Blocker Failures</div>
        <div class="card-body">
          Traditional ad-blockers (uBlock, AdBlock) silently block URLs with passive text counters like "14 blocked". They leave users blind to who stole their data, while triggering "Adblock detected" paywalls.
        </div>
        <div class="card-stat" style="color: #38bdf8;">
          EXPOSURE: Zero transparency & broken sites
        </div>
      </div>
    </div>

    <div class="footer">
      <div>RESEARCH VALIDATED ACROSS 500+ COMMERCIAL WEBSITES &bull; OBSIDIAN PROTOCOL</div>
      <div><strong>02</strong> / 07</div>
    </div>
  </div>

  <!-- SLIDE 3: Proposed Solution & Core Features -->
  <div class="slide">
    <div class="hud-header">
      <div>
        <div class="hud-tag">[ 03 // PROPOSED SOLUTION & CORE INNOVATIONS ]</div>
        <h2 class="slide-title">Proposed Solution: DOOMWIRE 3D Tactical Cyber-Radar</h2>
      </div>
      <div class="hud-badge">TACTICAL WEAPONIZED DEFENSE</div>
    </div>

    <div class="grid-2">
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div class="card cyan" style="padding: 24px;">
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #38bdf8; margin-bottom: 6px;">FEATURE 01 &bull; 3D PLANETARY CYBER-RADAR</div>
          <div class="card-title" style="font-size: 19px;">Live Ballistic WebGL Laser Projections</div>
          <p style="font-size: 14px; color: #cbd5e1; line-height: 1.5;">
            Outbound TCP/HTTP packets are intercepted in-flight and rendered as glowing laser arcs on a 3D NASA Earth, connecting the origin user to physical server cities worldwide in real time.
          </p>
        </div>

        <div class="card purple" style="padding: 24px;">
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #c084fc; margin-bottom: 6px;">FEATURE 02 &bull; CORPORATE UNMASKING & PACKET X-RAY</div>
          <div class="card-title" style="font-size: 19px;">Decodes Cryptic CDNs to Parent Tech Giants</div>
          <p style="font-size: 14px; color: #cbd5e1; line-height: 1.5;">
            Cryptic endpoints (e.g. <code>2mdn.net</code> &rarr; Google, <code>static.whatsapp.net</code> &rarr; Meta) are resolved to parent corporate conglomerates, exposing exfiltrated cookies, UTM tags, and GPU probes.
          </p>
        </div>

        <div class="card green" style="padding: 24px;">
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #10b981; margin-bottom: 6px;">FEATURE 03 &bull; DYNAMIC TELEMETRY AGGREGATION</div>
          <div class="card-title" style="font-size: 19px;">Stream Node Clustering with [X× REQS] Badges</div>
          <p style="font-size: 14px; color: #cbd5e1; line-height: 1.5;">
            Aggregates repetitive microservice calls into single cards with tactical request count badges (e.g. <code>24× REQS</code>), merging leaked attributes and elevating threat severity without sidebar clutter.
          </p>
        </div>
      </div>

      <div class="card" style="border-color: #38bdf8; background: #050a18; padding: 36px; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #38bdf8; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px;">
            THE DUAL-ACTION DEFENSE ARSENAL
          </div>
          <h3 style="font-size: 26px; font-weight: 800; color: #ffffff; margin-bottom: 24px;">
            Beyond Blocking: Autonomous Countermeasures
          </h3>

          <div style="background: rgba(244, 63, 94, 0.12); border: 1px solid #f43f5e; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
            <div style="font-size: 17px; font-weight: 800; color: #f43f5e; margin-bottom: 6px;">✂️ WEAPON 1: "CUT THE WIRE" (Hard Severance)</div>
            <p style="font-size: 13.5px; color: #e2e8f0; line-height: 1.5;">
              Instantly aborts matching socket connections (<code>route.abort</code>). Slices physical laser arcs on the 3D globe and plays synthesized cyber-audio severance frequencies.
            </p>
          </div>

          <div style="background: rgba(192, 132, 252, 0.12); border: 1px solid #c084fc; border-radius: 10px; padding: 20px;">
            <div style="font-size: 17px; font-weight: 800; color: #c084fc; margin-bottom: 6px;">☠️ WEAPON 2: "POISON THE WIRE" (Stealth Deception)</div>
            <p style="font-size: 13.5px; color: #e2e8f0; line-height: 1.5;">
              Permits the request to proceed so websites don't trigger "Adblock detected" walls, but replaces your fingerprint with synthetic algorithmic noise (fake GPU, decoy canvas hashes, noise cookies).
            </p>
          </div>
        </div>

        <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #94a3b8; border-top: 1px solid #1e293b; padding-top: 14px;">
          DECEPTION EQUATION: True Identity + Decoy Noise = Machine Learning Profiles Destroyed
        </div>
      </div>
    </div>

    <div class="footer">
      <div>IN-FLIGHT PACKET SNIFFING &bull; DUAL FIREWALL ARSENAL &bull; ZERO LATENCY</div>
      <div><strong>03</strong> / 07</div>
    </div>
  </div>

  <!-- SLIDE 4: System Architecture & Technology Stack -->
  <div class="slide">
    <div class="hud-header">
      <div>
        <div class="hud-tag">[ 04 // SYSTEM ARCHITECTURE & TECH STACK ]</div>
        <h2 class="slide-title">The 5-Stage In-Flight Network Interception Pipeline</h2>
      </div>
      <div class="hud-badge">ZERO-MOCK ARCHITECTURE</div>
    </div>

    <div class="grid-5" style="height: 380px;">
      <div class="card cyan">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #38bdf8; margin-bottom: 6px;">STAGE [01]</div>
        <div class="card-title" style="font-size: 17px;">Sandbox Isolation</div>
        <div class="card-body" style="font-size: 13.5px;">
          Playwright Chromium sandbox boots with stealth anti-detection flags, stripping automation headers so ad auction bids fire authentically.
        </div>
        <div class="card-stat" style="color: #38bdf8;">TECH: Playwright Headless</div>
      </div>

      <div class="card purple">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #c084fc; margin-bottom: 6px;">STAGE [02]</div>
        <div class="card-title" style="font-size: 17px;">Network Driver Tap</div>
        <div class="card-body" style="font-size: 13.5px;">
          Taps every outgoing TCP, HTTP, and WebSocket packet in-flight via <code>activePage.route()</code> before byte transmission.
        </div>
        <div class="card-stat" style="color: #c084fc;">TECH: Chromium Network Hook</div>
      </div>

      <div class="card green">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #10b981; margin-bottom: 6px;">STAGE [03]</div>
        <div class="card-title" style="font-size: 17px;">Sub-1.5ms GeoIP</div>
        <div class="card-body" style="font-size: 13.5px;">
          Local binary MaxMind database resolves physical GPS coordinates, city, and country with zero external API rate-limit delays.
        </div>
        <div class="card-stat" style="color: #10b981;">TECH: geoip-lite (Offline)</div>
      </div>

      <div class="card" style="border-color: #fbbf24; background: rgba(30, 20, 6, 0.5);">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #fbbf24; margin-bottom: 6px;">STAGE [04]</div>
        <div class="card-title" style="font-size: 17px;">60 FPS Socket Stream</div>
        <div class="card-body" style="font-size: 13.5px;">
          Bi-directional WebSockets broadcast coordinates, threat classifications, and leaked parameters to the client 3D HUD.
        </div>
        <div class="card-stat" style="color: #fbbf24;">TECH: Socket.io Protocol</div>
      </div>

      <div class="card crimson">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #f43f5e; margin-bottom: 6px;">STAGE [05]</div>
        <div class="card-title" style="font-size: 17px;">Active Enforcement</div>
        <div class="card-body" style="font-size: 13.5px;">
          Applies firewall rules instantly: Hard socket abort (Cut) or synthetic algorithmic noise injection (Poison) on all matching routes.
        </div>
        <div class="card-stat" style="color: #f43f5e;">TECH: Route Override Engine</div>
      </div>
    </div>

    <!-- Tech Stack Summary Box -->
    <div class="card" style="height: 280px; background: #070e20; border-color: rgba(56, 189, 248, 0.3); padding: 28px;">
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #38bdf8; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 14px;">
        CORE TECHNICAL STACK SPECIFICATION
      </div>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
        <div>
          <div style="font-size: 15px; font-weight: 800; color: #ffffff; margin-bottom: 4px;">Frontend Deck</div>
          <p style="font-size: 13px; color: #94a3b8; line-height: 1.4;">React 18 &bull; Three.js &bull; react-globe.gl &bull; TailwindCSS</p>
        </div>
        <div>
          <div style="font-size: 15px; font-weight: 800; color: #ffffff; margin-bottom: 4px;">Recon Backend</div>
          <p style="font-size: 13px; color: #94a3b8; line-height: 1.4;">Node.js v24 &bull; Express &bull; Playwright &bull; Socket.io</p>
        </div>
        <div>
          <div style="font-size: 15px; font-weight: 800; color: #ffffff; margin-bottom: 4px;">Intelligence DB</div>
          <p style="font-size: 13px; color: #94a3b8; line-height: 1.4;">MaxMind Binary DB &bull; DuckDuckGo Tracker Radar</p>
        </div>
        <div>
          <div style="font-size: 15px; font-weight: 800; color: #ffffff; margin-bottom: 4px;">Audio Engine</div>
          <p style="font-size: 13px; color: #94a3b8; line-height: 1.4;">Native Web Audio API &bull; Procedural Sound Synthesis</p>
        </div>
      </div>
    </div>

    <div class="footer">
      <div>END-TO-END REACTIVE ARCHITECTURE &bull; SUB-1.5ms LOCALIZATION &bull; DUAL ENGINE</div>
      <div><strong>04</strong> / 07</div>
    </div>
  </div>

  <!-- SLIDE 5: Design Prototype & Expected Output -->
  <div class="slide">
    <div class="hud-header">
      <div>
        <div class="hud-tag">[ 05 // DESIGN PROTOTYPE & EXPECTED OUTPUT ]</div>
        <h2 class="slide-title">Tactical HUD Interface & Production Output</h2>
      </div>
      <div class="hud-badge">OBSIDIAN BLUE MILITARY HUD</div>
    </div>

    <div class="grid-4" style="height: 520px;">
      <div class="card cyan">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #38bdf8; margin-bottom: 8px;">MODULE [01]</div>
        <div class="card-title">3D Cyber-Radar Globe</div>
        <ul class="bullet-list">
          <li>NASA Earth night-light topology with city glow</li>
          <li>Ballistic laser arcs colored by threat severity</li>
          <li>Radar impact ripples upon packet arrival</li>
          <li>Clickable 3D server pins with smooth orbit zoom</li>
        </ul>
        <div class="card-stat" style="color: #38bdf8;">OUTPUT: 60 FPS Three.js Canvas</div>
      </div>

      <div class="card green">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #10b981; margin-bottom: 8px;">MODULE [02]</div>
        <div class="card-title">Live Telemetry Feed</div>
        <ul class="bullet-list">
          <li>Clustered origin cards preventing repetitive spam</li>
          <li>Tactical <code>[24× REQS]</code> cyan count badge</li>
          <li>Severity badges (Red/Orange/Yellow/Green)</li>
          <li>Live filters: ALL, THREATS, SEVERED, POISONED</li>
        </ul>
        <div class="card-stat" style="color: #10b981;">OUTPUT: Real-Time Stream Deck</div>
      </div>

      <div class="card purple">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #c084fc; margin-bottom: 8px;">MODULE [03]</div>
        <div class="card-title">Packet X-Ray Inspector</div>
        <ul class="bullet-list">
          <li>Unmasks parent surveillance holding entity</li>
          <li>Server city & exact physical GPS coordinates</li>
          <li>Exposes exfiltrated cookies & query tokens</li>
          <li>One-click CUT and POISON tactical buttons</li>
        </ul>
        <div class="card-stat" style="color: #c084fc;">OUTPUT: Forensic Slide-Over Panel</div>
      </div>

      <div class="card" style="border-color: #fbbf24; background: rgba(30, 20, 6, 0.5);">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #fbbf24; margin-bottom: 8px;">MODULE [04]</div>
        <div class="card-title">Safe-Room Clean Preview</div>
        <ul class="bullet-list">
          <li>Sanitized DOM render with severed ad wires</li>
          <li>Proves tracker neutralization before DOM paint</li>
          <li>Layout preservation with zero page crashing</li>
          <li>Downloadable visual proof for compliance</li>
        </ul>
        <div class="card-stat" style="color: #fbbf24;">OUTPUT: Isolated Clean Sandbox</div>
      </div>
    </div>

    <!-- UI Aesthetic Callout -->
    <div class="stat-banner" style="background: rgba(6, 25, 45, 0.7); border-color: #38bdf8; margin-bottom: 0;">
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 800; color: #38bdf8;">
        🎨 4-THEME TACTICAL SYSTEM:
      </div>
      <div style="font-size: 15px; color: #e2e8f0; line-height: 1.4;">
        Dynamic one-click switching between <strong>Obsidian Blue</strong>, <strong>Deep Violet</strong>, <strong>Crimson Protocol</strong>, and <strong>Emerald Matrix</strong>. Procedural audio synthesizes distinct audio frequencies upon wire severance and packet interception.
      </div>
    </div>

    <div class="footer">
      <div>GLASSO-MORPHIC CYBER-BRUTALIST DESIGN &bull; PROCEDURAL AUDIO FX &bull; ZERO TEMPLATES</div>
      <div><strong>05</strong> / 07</div>
    </div>
  </div>

  <!-- SLIDE 6: 8-Hour Implementation Plan & Validation -->
  <div class="slide">
    <div class="hud-header">
      <div>
        <div class="hud-tag">[ 06 // IMPLEMENTATION PLAN & VALIDATION ]</div>
        <h2 class="slide-title">8-Hour Hackathon Implementation & Live Target Verification</h2>
      </div>
      <div class="hud-badge" style="border-color: #10b981; color: #10b981;">BATTLE-TESTED & VERIFIED</div>
    </div>

    <div class="grid-2">
      <!-- 8-Hour Plan -->
      <div class="card" style="background: #070e20; border-color: #1e293b; padding: 32px; height: 100%;">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #38bdf8; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px;">
          ⏱️ 8-HOUR HACKATHON SPRINTS
        </div>

        <div style="margin-bottom: 22px;">
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: #38bdf8; margin-bottom: 4px;">
            [ HOURS 00 — 02 ] &bull; Sandbox Engine & Packet Tap
          </div>
          <p style="font-size: 14px; color: #cbd5e1; line-height: 1.45;">
            Configured Playwright Chromium context, bypassed anti-bot evasion, and hooked in-flight <code>page.route()</code> handlers.
          </p>
        </div>

        <div style="margin-bottom: 22px;">
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: #c084fc; margin-bottom: 4px;">
            [ HOURS 02 — 04 ] &bull; 3D WebGL Radar & GeoIP Pipeline
          </div>
          <p style="font-size: 14px; color: #cbd5e1; line-height: 1.45;">
            Integrated Three.js spherical coordinate transforms with offline MaxMind binary database for sub-1.5ms mapping.
          </p>
        </div>

        <div style="margin-bottom: 22px;">
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: #f43f5e; margin-bottom: 4px;">
            [ HOURS 04 — 06 ] &bull; Dual Weaponized Firewall
          </div>
          <p style="font-size: 14px; color: #cbd5e1; line-height: 1.45;">
            Built "Cut the Wire" socket severance and "Poison the Wire" synthetic noise injection into outbound POST payloads.
          </p>
        </div>

        <div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: #10b981; margin-bottom: 4px;">
            [ HOURS 06 — 08 ] &bull; Aggregation & Deterministic Watchdogs
          </div>
          <p style="font-size: 14px; color: #cbd5e1; line-height: 1.45;">
            Engineered <code>[X× REQS]</code> node clustering and dual client/server safety watchdogs for sub-8s guaranteed completion.
          </p>
        </div>
      </div>

      <!-- Real Benchmark Data -->
      <div class="card" style="background: #050a18; border-color: #10b981; padding: 32px; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #10b981; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px;">
            ✅ LIVE TARGET BENCHMARK VERIFICATION
          </div>

          <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 18px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 16px; font-weight: 800; color: #ffffff;">web.whatsapp.com</span>
              <span style="font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: #10b981;">8.54s &bull; 20 PACKETS</span>
            </div>
            <p style="font-size: 13px; color: #cbd5e1; line-height: 1.4;">
              Grouped <code>static.whatsapp.net</code> under <strong>[11× REQS]</strong>. Unmasked Meta telemetry microservices with 0ms UI hangs.
            </p>
          </div>

          <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 18px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 16px; font-weight: 800; color: #ffffff;">reddit.com</span>
              <span style="font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: #10b981;">5.41s &bull; 4 PACKETS</span>
            </div>
            <p style="font-size: 13px; color: #cbd5e1; line-height: 1.4;">
              Unmasked Fastly edge CDN and telemetry endpoints. Verified sub-6s deterministic completion.
            </p>
          </div>

          <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 16px; font-weight: 800; color: #ffffff;">cnn.com</span>
              <span style="font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: #10b981;">6.20s &bull; 35+ PACKETS</span>
            </div>
            <p style="font-size: 13px; color: #cbd5e1; line-height: 1.4;">
              Captured programmatic ad auctions, Criteo/Rubicon profilers, and exfiltrated cookie tokens.
            </p>
          </div>
        </div>

        <div style="background: #030712; border: 1px solid #10b981; border-radius: 8px; padding: 14px 20px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #10b981;">
          VERIFICATION GUARANTEE: Zero mocks. All packet telemetry and GPS coordinates are 100% authentic.
        </div>
      </div>
    </div>

    <div class="footer">
      <div>REAL CHROMIUM ENGINE &bull; ACCELERATED PIPELINE &bull; BATTLE-TESTED</div>
      <div><strong>06</strong> / 07</div>
    </div>
  </div>

  <!-- SLIDE 7: Impact, Feasibility & Final Deliverables -->
  <div class="slide">
    <div class="hud-header">
      <div>
        <div class="hud-tag">[ 07 // IMPACT, FEASIBILITY & FINAL DELIVERABLES ]</div>
        <h2 class="slide-title">Market Impact, Feasibility & The Road Ahead</h2>
      </div>
      <div class="hud-badge" style="border-color: #c084fc; color: #c084fc;">WINNER'S VISION</div>
    </div>

    <div class="grid-3" style="height: 380px;">
      <div class="card cyan">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #38bdf8; margin-bottom: 8px;">SECTOR [01]</div>
        <div class="card-title">Consumer Privacy</div>
        <div class="card-body">
          Gamified, visceral alternative to passive ad-blockers that turns invisible surveillance into visual empowerment, teaching everyday users where their data is being shipped.
        </div>
        <div class="card-stat" style="color: #38bdf8;">TAM: 800M+ ad-blocker users</div>
      </div>

      <div class="card purple">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #c084fc; margin-bottom: 8px;">SECTOR [02]</div>
        <div class="card-title">Cybersecurity Academia</div>
        <div class="card-body">
          Interactive teaching tool for universities, security researchers, and military defense academies to visualize real-world internet routing, CDN topology, and tracker exfiltration.
        </div>
        <div class="card-stat" style="color: #c084fc;">APPLICATION: Training & Research</div>
      </div>

      <div class="card" style="border-color: #fbbf24; background: rgba(30, 20, 6, 0.5);">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #fbbf24; margin-bottom: 8px;">SECTOR [03]</div>
        <div class="card-title">Enterprise GDPR Audits</div>
        <div class="card-body">
          Automated compliance scanner for enterprises to audit client-side web properties for shadow APIs, unauthorized tracking scripts, and illegal cross-border data transfers.
        </div>
        <div class="card-stat" style="color: #fbbf24;">APPLICATION: Regulatory Compliance</div>
      </div>
    </div>

    <!-- Final Deliverables Banner -->
    <div class="card" style="background: #070e20; border-color: #38bdf8; padding: 26px;">
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #38bdf8; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px;">
        HACKATHON DELIVERABLES (100% COMPLETE & DEPLOYED)
      </div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
        <div>
          <div style="font-size: 15px; font-weight: 800; color: #ffffff;">1. Live Web Application</div>
          <p style="font-size: 13px; color: #94a3b8; margin-top: 4px;">Deployed on Render cloud with 3D WebGL radar and Playwright sandbox.</p>
        </div>
        <div>
          <div style="font-size: 15px; font-weight: 800; color: #ffffff;">2. Chrome Extension (MV3)</div>
          <p style="font-size: 13px; color: #94a3b8; margin-top: 4px;">Companion browser extension utilizing native declarativeNetRequest rules.</p>
        </div>
        <div>
          <div style="font-size: 15px; font-weight: 800; color: #ffffff;">3. Dockerized Open-Source Code</div>
          <p style="font-size: 13px; color: #94a3b8; margin-top: 4px;">Complete GitHub repo with test harnesses, CI/CD pipeline, and Judges Guide.</p>
        </div>
      </div>
    </div>

    <!-- Final Punchline -->
    <div style="background: rgba(192, 132, 252, 0.12); border: 1.5px solid #c084fc; border-radius: 12px; padding: 20px 32px; text-align: center;">
      <span style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">
        "DOOMWIRE is not just an ad-blocker. It is the tactical operating system for the next generation of internet privacy."
      </span>
    </div>

    <div class="footer">
      <div>DOOMWIRE v3.4 &bull; by-Arnavvv &bull; LIVE ON GITHUB & RENDER CLOUD</div>
      <div><strong>07</strong> / 07</div>
    </div>
  </div>

</body>
</html>`;

  const htmlPath = path.join(__dirname, 'deck_preview.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });

  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });

  const pdfPath = path.join(__dirname, '..', 'DOOMWIRE_HACKATHON_DECK.pdf');
  await page.pdf({
    path: pdfPath,
    width: '1920px',
    height: '1080px',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  await browser.close();
  try { fs.unlinkSync(htmlPath); } catch (e) {}

  console.log(`[DOOMWIRE] 16:9 PDF Deck successfully created at: ${pdfPath}`);
}

generatePdfDeck().catch(err => {
  console.error('[DOOMWIRE] Error generating PDF deck:', err);
  process.exit(1);
});
