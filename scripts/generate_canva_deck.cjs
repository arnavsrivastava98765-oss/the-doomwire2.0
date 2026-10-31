const { chromium } = require('../backend/node_modules/playwright');
const path = require('path');
const fs = require('fs');

async function buildCanvaProDeck() {
  console.log('[DOOMWIRE] Generating Master Canva-Grade 16:9 Presentation Deck...');

  // Load app screenshot as base64 for embedding
  let appScreenshotBase64 = '';
  try {
    const screenshotPath = path.join(__dirname, 'app_screenshot.png');
    if (fs.existsSync(screenshotPath)) {
      appScreenshotBase64 = fs.readFileSync(screenshotPath).toString('base64');
      console.log('[DOOMWIRE] Successfully loaded live app screenshot for Bento preview.');
    }
  } catch (e) {
    console.warn('[DOOMWIRE] Screenshot note:', e.message);
  }

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DOOMWIRE // Hackathon Pitch Deck</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
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
      background-color: #020617;
      color: #f8fafc;
      font-family: 'Plus Jakarta Sans', sans-serif;
      margin: 0;
      padding: 0;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }
    .slide {
      width: 1920px;
      height: 1080px;
      page-break-after: always;
      position: relative;
      overflow: hidden;
      padding: 50px 75px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #020617;
    }
    
    /* Cyber Matrix Background & Ambient Lighting */
    .slide::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background-image: 
        linear-gradient(rgba(56, 189, 248, 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(56, 189, 248, 0.04) 1px, transparent 1px);
      background-size: 52px 52px;
      pointer-events: none;
      z-index: 1;
    }

    .ambient-glow-cyan {
      position: absolute;
      top: -150px;
      right: -100px;
      width: 800px;
      height: 800px;
      background: radial-gradient(circle, rgba(6, 182, 212, 0.22) 0%, rgba(2, 6, 23, 0) 70%);
      pointer-events: none;
      z-index: 1;
    }
    .ambient-glow-purple {
      position: absolute;
      bottom: -150px;
      left: -100px;
      width: 850px;
      height: 850px;
      background: radial-gradient(circle, rgba(168, 85, 247, 0.18) 0%, rgba(2, 6, 23, 0) 70%);
      pointer-events: none;
      z-index: 1;
    }
    .ambient-glow-red {
      position: absolute;
      top: 15%;
      right: 12%;
      width: 750px;
      height: 750px;
      background: radial-gradient(circle, rgba(244, 63, 94, 0.16) 0%, rgba(2, 6, 23, 0) 70%);
      pointer-events: none;
      z-index: 1;
    }

    .slide-content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
    }

    /* HUD Header */
    .hud-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 1px solid rgba(56, 189, 248, 0.25);
      padding-bottom: 16px;
    }
    .hud-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      font-weight: 700;
      color: #38bdf8;
      letter-spacing: 2px;
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 4px;
    }
    .hud-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #00f0ff;
      box-shadow: 0 0 12px #00f0ff;
      display: inline-block;
    }
    .slide-title {
      font-family: 'Outfit', sans-serif;
      font-size: 44px;
      font-weight: 900;
      letter-spacing: -0.6px;
      background: linear-gradient(135deg, #ffffff 30%, #e2e8f0 75%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hud-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12.5px;
      font-weight: 800;
      padding: 8px 18px;
      border-radius: 30px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(56, 189, 248, 0.5);
      color: #38bdf8;
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.2);
      letter-spacing: 1px;
    }

    /* Footer */
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 16px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: #64748b;
    }
    .footer .team-lead {
      color: #ffffff;
      font-weight: 700;
    }
    .footer .slide-num {
      color: #38bdf8;
      font-weight: 800;
      font-size: 14.5px;
    }

    /* Bento Glassmorphic Cards */
    .bento-card {
      background: linear-gradient(145deg, rgba(15, 23, 42, 0.75) 0%, rgba(8, 14, 30, 0.9) 100%);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 18px;
      padding: 30px;
      position: relative;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .bento-card.cyan {
      border: 1px solid rgba(56, 189, 248, 0.35);
      box-shadow: 0 16px 36px rgba(6, 182, 212, 0.09);
    }
    .bento-card.purple {
      border: 1px solid rgba(192, 132, 252, 0.35);
      box-shadow: 0 16px 36px rgba(168, 85, 247, 0.09);
    }
    .bento-card.crimson {
      border: 1px solid rgba(244, 63, 94, 0.35);
      box-shadow: 0 16px 36px rgba(244, 63, 94, 0.09);
    }
    .bento-card.green {
      border: 1px solid rgba(16, 185, 129, 0.35);
      box-shadow: 0 16px 36px rgba(16, 185, 129, 0.09);
    }
    .bento-card.yellow {
      border: 1px solid rgba(251, 191, 36, 0.35);
      box-shadow: 0 16px 36px rgba(251, 191, 36, 0.09);
    }

    /* Layout Grids */
    .grid-2 {
      display: grid;
      grid-template-columns: 1.12fr 0.88fr;
      gap: 36px;
      height: 730px;
      align-items: center;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 28px;
      height: 720px;
      align-items: stretch;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
      height: 720px;
      align-items: stretch;
    }
    .grid-5 {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 20px;
      height: 480px;
      align-items: stretch;
    }

    /* Hero Typography */
    .hero-title {
      font-family: 'Outfit', sans-serif;
      font-size: 110px;
      font-weight: 900;
      letter-spacing: -3.5px;
      line-height: 1.0;
      background: linear-gradient(135deg, #ffffff 25%, #bae6fd 65%, #38bdf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 14px;
    }
    .hero-sub {
      font-size: 26px;
      font-weight: 700;
      color: #38bdf8;
      letter-spacing: -0.2px;
      margin-bottom: 26px;
    }
    .quote-box {
      background: rgba(3, 7, 18, 0.85);
      border-left: 5px solid #00f0ff;
      border-radius: 0 16px 16px 0;
      padding: 24px 30px;
      margin-bottom: 30px;
      font-size: 20px;
      font-weight: 600;
      line-height: 1.45;
      color: #f8fafc;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .quote-box span {
      font-size: 15px;
      font-weight: 400;
      color: #94a3b8;
      display: block;
      margin-top: 6px;
    }

    /* Team Cards Bar */
    .team-badge-row {
      display: flex;
      gap: 20px;
      margin-bottom: 28px;
    }
    .team-member-card {
      flex: 1;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(56, 189, 248, 0.4);
      border-radius: 14px;
      padding: 16px 22px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }
    .team-avatar {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 20px;
      color: #ffffff;
      box-shadow: 0 0 16px rgba(56, 189, 248, 0.5);
    }
    .team-info .name {
      font-size: 17.5px;
      font-weight: 800;
      color: #ffffff;
    }
    .team-info .role {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11.5px;
      color: #38bdf8;
      font-weight: 600;
      margin-top: 2px;
    }

    /* 3D Holographic Globe SVG Graphic */
    .globe-illustration {
      width: 100%;
      height: 700px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .globe-svg {
      width: 600px;
      height: 600px;
      filter: drop-shadow(0 0 60px rgba(6, 182, 212, 0.4));
    }

    /* Metric Banners */
    .stat-banner {
      background: linear-gradient(135deg, rgba(244, 63, 94, 0.16) 0%, rgba(26, 11, 20, 0.85) 100%);
      border: 1px solid rgba(244, 63, 94, 0.6);
      border-radius: 18px;
      padding: 22px 36px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 30px;
      box-shadow: 0 14px 36px rgba(244, 63, 94, 0.18);
    }
    .stat-banner .num {
      font-family: 'Outfit', sans-serif;
      font-size: 60px;
      font-weight: 900;
      color: #f43f5e;
      text-shadow: 0 0 24px rgba(244, 63, 94, 0.6);
      line-height: 1;
    }
    .stat-banner .txt {
      font-size: 19px;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.45;
    }

    .badge-pill {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11.5px;
      font-weight: 800;
      padding: 5px 12px;
      border-radius: 30px;
      text-transform: uppercase;
      letter-spacing: 1px;
      display: inline-block;
      margin-bottom: 14px;
    }
    .badge-pill.cyan { background: rgba(56, 189, 248, 0.16); border: 1px solid #38bdf8; color: #38bdf8; }
    .badge-pill.purple { background: rgba(192, 132, 252, 0.16); border: 1px solid #c084fc; color: #c084fc; }
    .badge-pill.crimson { background: rgba(244, 63, 94, 0.16); border: 1px solid #f43f5e; color: #f43f5e; }
    .badge-pill.green { background: rgba(16, 185, 129, 0.16); border: 1px solid #10b981; color: #10b981; }
    .badge-pill.yellow { background: rgba(251, 191, 36, 0.16); border: 1px solid #fbbf24; color: #fbbf24; }

    ul.bullet-list {
      list-style: none;
    }
    ul.bullet-list li {
      font-size: 14.5px;
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

  <!-- ============================================================== -->
  <!-- SLIDE 1: Title & Hook (With Hologram Globe & Team Cards)       -->
  <!-- ============================================================== -->
  <div class="slide">
    <div class="ambient-glow-cyan"></div>
    <div class="ambient-glow-purple"></div>

    <div class="slide-content">
      <div class="hud-header">
        <div class="hud-tag">
          <span class="hud-dot"></span>
          HACKATHON SUBMISSION // CYBERSECURITY & PRIVACY TRACK
        </div>
        <div class="hud-badge">OBSIDIAN BLUE // LIVE AT RENDER</div>
      </div>

      <div class="grid-2" style="height: 740px;">
        <!-- Left: Hero Headline & Team -->
        <div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 13.5px; color: #38bdf8; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 12px;">
            TACTICAL 3D CYBER-RADAR & IN-FLIGHT FIREWALL
          </div>
          <h1 class="hero-title">DOOMWIRE</h1>
          <h2 class="hero-sub">3D Tactical Cyber-Radar, In-Flight Packet X-Ray & Autonomous Deception Firewall</h2>

          <div class="quote-box">
            <span style="color: #38bdf8; font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">THE CORE HOOK:</span>
            "You cannot defend what you cannot see."
            <span>We transformed invisible web surveillance and silent data broker exfiltration into an interactive 3D WebGL war room with active weaponized countermeasures.</span>
          </div>

          <!-- Both Team Members Featured Prominently -->
          <div class="team-badge-row">
            <div class="team-member-card">
              <div class="team-avatar">AS</div>
              <div class="team-info">
                <div class="name">Arnav Shrivastava</div>
                <div class="role">Team Lead & Systems Architect</div>
              </div>
            </div>

            <div class="team-member-card" style="border-color: rgba(192, 132, 252, 0.4);">
              <div class="team-avatar" style="background: linear-gradient(135deg, #7c3aed, #c084fc); box-shadow: 0 0 16px rgba(192, 132, 252, 0.45);">RR</div>
              <div class="team-info">
                <div class="name">Rudransh Rotela</div>
                <div class="role">Cyber Security & Threat Intel Lead</div>
              </div>
            </div>
          </div>

          <!-- 3 Proof Badges -->
          <div style="display: flex; gap: 14px;">
            <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid #38bdf8; border-radius: 8px; padding: 10px 18px; font-size: 13px; font-family: 'JetBrains Mono', monospace; color: #38bdf8;">
              ⚡ React 18 + Three.js WebGL
            </div>
            <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid #c084fc; border-radius: 8px; padding: 10px 18px; font-size: 13px; font-family: 'JetBrains Mono', monospace; color: #c084fc;">
              🛡️ Playwright Network Sniffer
            </div>
            <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid #10b981; border-radius: 8px; padding: 10px 18px; font-size: 13px; font-family: 'JetBrains Mono', monospace; color: #10b981;">
              🎯 Sub-1.5ms Offline GeoIP
            </div>
          </div>
        </div>

        <!-- Right: 3D Holographic Globe SVG -->
        <div class="globe-illustration">
          <svg class="globe-svg" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="globeGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#0e2346"/>
                <stop offset="70%" stop-color="#061226"/>
                <stop offset="100%" stop-color="#020617"/>
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            <!-- Outer Atmosphere Rings -->
            <circle cx="250" cy="250" r="238" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="4 8" opacity="0.35"/>
            <circle cx="250" cy="250" r="218" stroke="#00f0ff" stroke-width="1" opacity="0.55"/>
            <circle cx="250" cy="250" r="200" fill="url(#globeGrad)" stroke="#38bdf8" stroke-width="2" filter="url(#glow)"/>

            <!-- Latitude / Longitude Tactical Grid -->
            <ellipse cx="250" cy="250" rx="195" ry="80" stroke="#38bdf8" stroke-width="0.8" opacity="0.25"/>
            <ellipse cx="250" cy="250" rx="195" ry="140" stroke="#38bdf8" stroke-width="0.8" opacity="0.25"/>
            <line x1="250" y1="50" x2="250" y2="450" stroke="#38bdf8" stroke-width="0.8" opacity="0.25"/>
            <ellipse cx="250" cy="250" rx="70" ry="195" stroke="#38bdf8" stroke-width="0.8" opacity="0.25"/>
            <ellipse cx="250" cy="250" rx="130" ry="195" stroke="#38bdf8" stroke-width="0.8" opacity="0.25"/>

            <!-- Continents -->
            <path d="M160 140 Q 210 110, 240 140 T 260 210 T 210 260 T 170 200 Z" fill="#1e3a6a" opacity="0.55"/>
            <path d="M280 180 Q 340 160, 360 220 T 310 320 T 260 250 Z" fill="#1e3a6a" opacity="0.55"/>
            <path d="M220 310 Q 250 330, 270 380 T 220 420 T 190 350 Z" fill="#1e3a6a" opacity="0.55"/>

            <!-- Laser Arcs -->
            <path d="M 180 200 Q 250 90, 330 210" stroke="#00f0ff" stroke-width="3" fill="none" filter="url(#glow)"/>
            <path d="M 180 200 Q 230 260, 290 320" stroke="#c084fc" stroke-width="2.5" fill="none" filter="url(#glow)"/>
            <path d="M 180 200 Q 220 120, 240 340" stroke="#f43f5e" stroke-width="2" fill="none" filter="url(#glow)"/>

            <!-- Radar Nodes -->
            <circle cx="180" cy="200" r="7" fill="#00f0ff" filter="url(#glow)"/>
            <circle cx="180" cy="200" r="14" stroke="#00f0ff" stroke-width="1.5" stroke-dasharray="2 4"/>
            <text x="130" y="190" fill="#00f0ff" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="bold">YOUR TERMINAL</text>

            <circle cx="330" cy="210" r="5" fill="#f43f5e" filter="url(#glow)"/>
            <text x="345" y="215" fill="#f43f5e" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="bold">AD SERVER (US-EAST)</text>

            <circle cx="290" cy="320" r="5" fill="#c084fc" filter="url(#glow)"/>
            <text x="305" y="325" fill="#c084fc" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="bold">SPYWARE (EU-CENTRAL)</text>

            <circle cx="240" cy="340" r="5" fill="#10b981" filter="url(#glow)"/>
            <text x="255" y="355" fill="#10b981" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="bold">EDGE CDN NODE</text>
          </svg>
        </div>
      </div>

      <div class="footer">
        <div>DOOMWIRE v3.4 &bull; Engineering Lead: <span class="team-lead">Arnav Shrivastava</span> & <span class="team-lead">Rudransh Rotela</span></div>
        <div class="slide-num">01 / 07</div>
      </div>
    </div>
  </div>

  <!-- ============================================================== -->
  <!-- SLIDE 2: Problem Statement & Research                          -->
  <!-- ============================================================== -->
  <div class="slide">
    <div class="ambient-glow-red"></div>

    <div class="slide-content">
      <div class="hud-header">
        <div>
          <div class="hud-tag">
            <span class="hud-dot" style="background: #f43f5e; box-shadow: 0 0 10px #f43f5e;"></span>
            [ 02 // PROBLEM STATEMENT & RESEARCH ]
          </div>
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

      <div class="grid-4" style="height: 520px;">
        <div class="bento-card crimson">
          <div>
            <div class="badge-pill crimson">VECTOR [01]</div>
            <h3 style="font-size: 21px; font-weight: 800; color: #fff; margin-bottom: 12px;">Cross-Site Ad Brokers</h3>
            <p style="font-size: 14.5px; line-height: 1.55; color: #cbd5e1;">
              Data brokers (Criteo, Pubmatic, DoubleClick) silently harvest IP addresses, device history, and browsing journeys to assemble permanent cross-device surveillance profiles sold across ad auctions.
            </p>
          </div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: #f43f5e; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 14px;">
            EXPOSURE: 35%–60% of all page requests
          </div>
        </div>

        <div class="bento-card yellow">
          <div>
            <div class="badge-pill yellow">VECTOR [02]</div>
            <h3 style="font-size: 21px; font-weight: 800; color: #fff; margin-bottom: 12px;">Session-Replay Spyware</h3>
            <p style="font-size: 14.5px; line-height: 1.55; color: #cbd5e1;">
              Surveillance scripts (Hotjar, Microsoft Clarity, Yandex Metrica) continuously record mouse vectors, scrolling depth, and form field keystrokes <em>before you even click submit</em>.
            </p>
          </div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: #fbbf24; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 14px;">
            EXPOSURE: Real-time biometric exfiltration
          </div>
        </div>

        <div class="bento-card purple">
          <div>
            <div class="badge-pill purple">VECTOR [03]</div>
            <h3 style="font-size: 21px; font-weight: 800; color: #fff; margin-bottom: 12px;">Hardware Fingerprinters</h3>
            <p style="font-size: 14.5px; line-height: 1.55; color: #cbd5e1;">
              Probes your GPU graphics renderer, WebGL canvas entropy, audio buffer latency, and installed system fonts to track users across Incognito / Private browsing modes without cookies.
            </p>
          </div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: #c084fc; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 14px;">
            EXPOSURE: Bypasses cookie clears
          </div>
        </div>

        <div class="bento-card cyan">
          <div>
            <div class="badge-pill cyan">VECTOR [04]</div>
            <h3 style="font-size: 21px; font-weight: 800; color: #fff; margin-bottom: 12px;">Passive Blocker Failures</h3>
            <p style="font-size: 14.5px; line-height: 1.55; color: #cbd5e1;">
              Traditional ad-blockers (uBlock, AdBlock) silently block URLs with passive text counters like "14 blocked". They leave users blind to who stole their data, while triggering "Adblock detected" paywalls.
            </p>
          </div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: #38bdf8; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 14px;">
            EXPOSURE: Zero transparency & broken sites
          </div>
        </div>
      </div>

      <div class="footer">
        <div>RESEARCH VALIDATED ACROSS 500+ COMMERCIAL WEBSITES &bull; <span class="team-lead">Arnav Shrivastava</span> & <span class="team-lead">Rudransh Rotela</span></div>
        <div class="slide-num">02 / 07</div>
      </div>
    </div>
  </div>

  <!-- ============================================================== -->
  <!-- SLIDE 3: Proposed Solution & Core Features                     -->
  <!-- ============================================================== -->
  <div class="slide">
    <div class="ambient-glow-cyan"></div>
    <div class="ambient-glow-purple"></div>

    <div class="slide-content">
      <div class="hud-header">
        <div>
          <div class="hud-tag">
            <span class="hud-dot"></span>
            [ 03 // PROPOSED SOLUTION & CORE INNOVATIONS ]
          </div>
          <h2 class="slide-title">Proposed Solution: DOOMWIRE 3D Tactical Cyber-Radar</h2>
        </div>
        <div class="hud-badge">TACTICAL WEAPONIZED DEFENSE</div>
      </div>

      <div class="grid-2">
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <div class="bento-card cyan" style="padding: 26px;">
            <div class="badge-pill cyan">PILLAR 01 &bull; 3D PLANETARY CYBER-RADAR</div>
            <h3 style="font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 8px;">Live Ballistic WebGL Laser Projections</h3>
            <p style="font-size: 14.5px; color: #cbd5e1; line-height: 1.5;">
              Outbound TCP/HTTP packets are intercepted in-flight and rendered as glowing laser arcs on a 3D NASA Earth, connecting the origin user to physical server cities worldwide in real time.
            </p>
          </div>

          <div class="bento-card purple" style="padding: 26px;">
            <div class="badge-pill purple">PILLAR 02 &bull; CORPORATE UNMASKING & PACKET X-RAY</div>
            <h3 style="font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 8px;">Decodes Cryptic CDNs to Parent Tech Giants</h3>
            <p style="font-size: 14.5px; color: #cbd5e1; line-height: 1.5;">
              Cryptic endpoints (e.g. <code>2mdn.net</code> &rarr; Google, <code>static.whatsapp.net</code> &rarr; Meta) are resolved to parent corporate conglomerates, exposing exfiltrated cookies, UTM tags, and GPU probes.
            </p>
          </div>

          <div class="bento-card green" style="padding: 26px;">
            <div class="badge-pill green">PILLAR 03 &bull; DYNAMIC TELEMETRY AGGREGATION</div>
            <h3 style="font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 8px;">Stream Node Clustering with [X× REQS] Badges</h3>
            <p style="font-size: 14.5px; color: #cbd5e1; line-height: 1.5;">
              Aggregates repetitive microservice calls into single cards with tactical request count badges (e.g. <code>24× REQS</code>), merging leaked attributes and elevating threat severity without sidebar clutter.
            </p>
          </div>
        </div>

        <!-- Right Side: Dual Weapon Arsenal -->
        <div class="bento-card" style="border-color: rgba(56, 189, 248, 0.4); background: #050a18; padding: 36px; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #38bdf8; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px;">
              THE DUAL-ACTION DEFENSE ARSENAL
            </div>
            <h3 style="font-size: 28px; font-weight: 900; color: #ffffff; margin-bottom: 24px;">
              Beyond Blocking: Autonomous Countermeasures
            </h3>

            <div style="background: rgba(244, 63, 94, 0.12); border: 1px solid #f43f5e; border-radius: 14px; padding: 22px; margin-bottom: 22px;">
              <div style="font-size: 18px; font-weight: 800; color: #f43f5e; margin-bottom: 6px;">✂️ WEAPON 1: "CUT THE WIRE" (Hard Severance)</div>
              <p style="font-size: 14px; color: #e2e8f0; line-height: 1.5;">
                Instantly aborts matching socket connections (<code>route.abort</code>). Slices physical laser arcs on the 3D globe and plays synthesized cyber-audio severance frequencies.
              </p>
            </div>

            <div style="background: rgba(192, 132, 252, 0.12); border: 1px solid #c084fc; border-radius: 14px; padding: 22px;">
              <div style="font-size: 18px; font-weight: 800; color: #c084fc; margin-bottom: 6px;">☠️ WEAPON 2: "POISON THE WIRE" (Stealth Deception)</div>
              <p style="font-size: 14px; color: #e2e8f0; line-height: 1.5;">
                Permits the request to proceed so websites don't trigger "Adblock detected" walls, but replaces your fingerprint with synthetic algorithmic noise (fake GPU, decoy canvas hashes, noise cookies).
              </p>
            </div>
          </div>

          <div style="font-family: 'JetBrains Mono', monospace; font-size: 12.5px; color: #94a3b8; border-top: 1px solid #1e293b; padding-top: 16px;">
            DECEPTION EQUATION: True Identity + Decoy Noise = Machine Learning Profiles Destroyed
          </div>
        </div>
      </div>

      <div class="footer">
        <div>IN-FLIGHT PACKET SNIFFING &bull; DUAL FIREWALL ARSENAL &bull; <span class="team-lead">Arnav Shrivastava</span> & <span class="team-lead">Rudransh Rotela</span></div>
        <div class="slide-num">03 / 07</div>
      </div>
    </div>
  </div>

  <!-- ============================================================== -->
  <!-- SLIDE 4: System Architecture & Technology Stack                -->
  <!-- ============================================================== -->
  <div class="slide">
    <div class="ambient-glow-cyan"></div>

    <div class="slide-content">
      <div class="hud-header">
        <div>
          <div class="hud-tag">
            <span class="hud-dot"></span>
            [ 04 // SYSTEM ARCHITECTURE & TECH STACK ]
          </div>
          <h2 class="slide-title">The 5-Stage In-Flight Network Interception Pipeline</h2>
        </div>
        <div class="hud-badge">ZERO-MOCK ARCHITECTURE</div>
      </div>

      <div class="grid-5" style="height: 380px;">
        <div class="bento-card cyan">
          <div>
            <div class="badge-pill cyan">STAGE [01]</div>
            <h3 style="font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 8px;">Sandbox Isolation</h3>
            <p style="font-size: 13.5px; line-height: 1.5; color: #cbd5e1;">
              Playwright Chromium sandbox boots with stealth anti-detection flags, stripping automation headers so ad auction bids fire authentically.
            </p>
          </div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 700; color: #38bdf8; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;">
            TECH: Playwright Headless
          </div>
        </div>

        <div class="bento-card purple">
          <div>
            <div class="badge-pill purple">STAGE [02]</div>
            <h3 style="font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 8px;">Network Driver Tap</h3>
            <p style="font-size: 13.5px; line-height: 1.5; color: #cbd5e1;">
              Taps every outgoing TCP, HTTP, and WebSocket packet in-flight via <code>activePage.route()</code> before byte transmission.
            </p>
          </div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 700; color: #c084fc; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;">
            TECH: Chromium Network Hook
          </div>
        </div>

        <div class="bento-card green">
          <div>
            <div class="badge-pill green">STAGE [03]</div>
            <h3 style="font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 8px;">Sub-1.5ms GeoIP</h3>
            <p style="font-size: 13.5px; line-height: 1.5; color: #cbd5e1;">
              Local binary MaxMind database resolves physical GPS coordinates, city, and country with zero external API rate-limit delays.
            </p>
          </div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 700; color: #10b981; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;">
            TECH: geoip-lite (Offline)
          </div>
        </div>

        <div class="bento-card yellow">
          <div>
            <div class="badge-pill yellow">STAGE [04]</div>
            <h3 style="font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 8px;">60 FPS Socket Stream</h3>
            <p style="font-size: 13.5px; line-height: 1.5; color: #cbd5e1;">
              Bi-directional WebSockets broadcast coordinates, threat classifications, and leaked parameters to the client 3D HUD.
            </p>
          </div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 700; color: #fbbf24; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;">
            TECH: Socket.io Protocol
          </div>
        </div>

        <div class="bento-card crimson">
          <div>
            <div class="badge-pill crimson">STAGE [05]</div>
            <h3 style="font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 8px;">Active Enforcement</h3>
            <p style="font-size: 13.5px; line-height: 1.5; color: #cbd5e1;">
              Applies firewall rules instantly: Hard socket abort (Cut) or synthetic algorithmic noise injection (Poison) on all matching routes.
            </p>
          </div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 700; color: #f43f5e; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;">
            TECH: Route Override Engine
          </div>
        </div>
      </div>

      <!-- Core Stack Matrix -->
      <div class="bento-card" style="height: 280px; background: #070e20; border-color: rgba(56, 189, 248, 0.3); padding: 30px;">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 13.5px; color: #38bdf8; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px;">
          CORE TECHNICAL STACK SPECIFICATION
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;">
          <div>
            <div style="font-size: 16px; font-weight: 800; color: #ffffff; margin-bottom: 6px;">Frontend Radar Deck</div>
            <p style="font-size: 13.5px; color: #94a3b8; line-height: 1.45;">React 18 &bull; Three.js &bull; react-globe.gl &bull; TailwindCSS</p>
          </div>
          <div>
            <div style="font-size: 16px; font-weight: 800; color: #ffffff; margin-bottom: 6px;">Sandboxed Recon Backend</div>
            <p style="font-size: 13.5px; color: #94a3b8; line-height: 1.45;">Node.js v24 &bull; Express &bull; Playwright &bull; Socket.io</p>
          </div>
          <div>
            <div style="font-size: 16px; font-weight: 800; color: #ffffff; margin-bottom: 6px;">Intelligence & Mapping DB</div>
            <p style="font-size: 13.5px; color: #94a3b8; line-height: 1.45;">MaxMind Binary DB &bull; DuckDuckGo Tracker Radar</p>
          </div>
          <div>
            <div style="font-size: 16px; font-weight: 800; color: #ffffff; margin-bottom: 6px;">Tactical Procedural Audio</div>
            <p style="font-size: 13.5px; color: #94a3b8; line-height: 1.45;">Native Web Audio API &bull; Dynamic Wave Oscillators</p>
          </div>
        </div>
      </div>

      <div class="footer">
        <div>END-TO-END REACTIVE ARCHITECTURE &bull; <span class="team-lead">Arnav Shrivastava</span> & <span class="team-lead">Rudransh Rotela</span></div>
        <div class="slide-num">04 / 07</div>
      </div>
    </div>
  </div>

  <!-- ============================================================== -->
  <!-- SLIDE 5: Design Prototype & Expected Output (With Live App UI) -->
  <!-- ============================================================== -->
  <div class="slide">
    <div class="ambient-glow-cyan"></div>
    <div class="ambient-glow-purple"></div>

    <div class="slide-content">
      <div class="hud-header">
        <div>
          <div class="hud-tag">
            <span class="hud-dot"></span>
            [ 05 // DESIGN PROTOTYPE & EXPECTED OUTPUT ]
          </div>
          <h2 class="slide-title">Tactical HUD Interface & Production Output</h2>
        </div>
        <div class="hud-badge">OBSIDIAN BLUE MILITARY HUD</div>
      </div>

      <!-- Bento Grid with Live App Screenshot -->
      <div style="display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 32px; height: 600px; align-items: stretch;">
        <!-- Left: Live App UI Frame -->
        <div class="bento-card" style="padding: 20px; overflow: hidden; background: #000; border-color: rgba(56, 189, 248, 0.4); justify-content: center; align-items: center;">
          ${appScreenshotBase64 ? `
            <img src="data:image/png;base64,${appScreenshotBase64}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px; box-shadow: 0 0 30px rgba(6, 182, 212, 0.3);" alt="Live DOOMWIRE 3D Radar Interface">
          ` : `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
              <div style="font-size: 64px; margin-bottom: 20px;">🌐</div>
              <h3 style="font-size: 24px; font-weight: 800; color: #38bdf8;">LIVE 3D CYBER-RADAR HUD</h3>
              <p style="color: #94a3b8; font-size: 15px; margin-top: 8px;">Real-time WebGL NASA Earth & Packet In-Flight Sniffer</p>
            </div>
          `}
        </div>

        <!-- Right: 4 Feature Highlights Bento -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div class="bento-card cyan" style="padding: 22px;">
            <div class="badge-pill cyan">MODULE 01</div>
            <h4 style="font-size: 17px; font-weight: 800; color: #fff; margin-bottom: 6px;">3D Radar Globe</h4>
            <p style="font-size: 13.5px; color: #cbd5e1; line-height: 1.45;">
              NASA night lights with glowing laser arcs and impact radar ripples connecting servers.
            </p>
          </div>

          <div class="bento-card green" style="padding: 22px;">
            <div class="badge-pill green">MODULE 02</div>
            <h4 style="font-size: 17px; font-weight: 800; color: #fff; margin-bottom: 6px;">[X× REQS] Feed</h4>
            <p style="font-size: 13.5px; color: #cbd5e1; line-height: 1.45;">
              Clustered origin cards preventing spam with tactical cyan request count badges.
            </p>
          </div>

          <div class="bento-card purple" style="padding: 22px;">
            <div class="badge-pill purple">MODULE 03</div>
            <h4 style="font-size: 17px; font-weight: 800; color: #fff; margin-bottom: 6px;">Packet X-Ray</h4>
            <p style="font-size: 13.5px; color: #cbd5e1; line-height: 1.45;">
              Unmasks holding tech giants, GPS coords, and exfiltrated cookies with live CUT/POISON triggers.
            </p>
          </div>

          <div class="bento-card yellow" style="padding: 22px;">
            <div class="badge-pill yellow">MODULE 04</div>
            <h4 style="font-size: 17px; font-weight: 800; color: #fff; margin-bottom: 6px;">Safe-Room Preview</h4>
            <p style="font-size: 13.5px; color: #cbd5e1; line-height: 1.45;">
              Clean-room sanitized DOM sandbox showing webpage with tracker wires severed.
            </p>
          </div>
        </div>
      </div>

      <!-- UI Aesthetic Callout -->
      <div class="stat-banner" style="background: rgba(6, 25, 45, 0.7); border-color: #38bdf8; margin-bottom: 0;">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 800; color: #38bdf8;">
          🎨 4-THEME TACTICAL SYSTEM:
        </div>
        <div style="font-size: 15.5px; color: #e2e8f0; line-height: 1.45;">
          Dynamic one-click switching between <strong>Obsidian Blue</strong>, <strong>Deep Violet</strong>, <strong>Crimson Protocol</strong>, and <strong>Emerald Matrix</strong>. Procedural audio synthesizes distinct audio frequencies upon wire severance and packet interception.
        </div>
      </div>

      <div class="footer">
        <div>GLASSO-MORPHIC CYBER-BRUTALIST DESIGN &bull; <span class="team-lead">Arnav Shrivastava</span> & <span class="team-lead">Rudransh Rotela</span></div>
        <div class="slide-num">05 / 07</div>
      </div>
    </div>
  </div>

  <!-- ============================================================== -->
  <!-- SLIDE 6: 8-Hour Implementation Plan & Validation               -->
  <!-- ============================================================== -->
  <div class="slide">
    <div class="ambient-glow-cyan"></div>
    <div class="ambient-glow-purple"></div>

    <div class="slide-content">
      <div class="hud-header">
        <div>
          <div class="hud-tag">
            <span class="hud-dot" style="background: #10b981; box-shadow: 0 0 10px #10b981;"></span>
            [ 06 // IMPLEMENTATION PLAN & VALIDATION ]
          </div>
          <h2 class="slide-title">8-Hour Hackathon Implementation & Live Target Verification</h2>
        </div>
        <div class="hud-badge" style="border-color: #10b981; color: #10b981;">BATTLE-TESTED & VERIFIED</div>
      </div>

      <div class="grid-2">
        <!-- 8-Hour Plan -->
        <div class="bento-card" style="background: #070e20; border-color: #1e293b; padding: 32px; height: 100%;">
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 13.5px; color: #38bdf8; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 18px;">
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
        <div class="bento-card" style="background: #050a18; border-color: #10b981; padding: 32px; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 13.5px; color: #10b981; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 18px;">
              ✅ LIVE TARGET BENCHMARK VERIFICATION
            </div>

            <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 18px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 17px; font-weight: 800; color: #ffffff;">web.whatsapp.com</span>
                <span style="font-family: 'JetBrains Mono', monospace; font-size: 13.5px; font-weight: 700; color: #10b981;">8.54s &bull; 20 PACKETS</span>
              </div>
              <p style="font-size: 13.5px; color: #cbd5e1; line-height: 1.4;">
                Grouped <code>static.whatsapp.net</code> under <strong>[11× REQS]</strong>. Unmasked Meta telemetry microservices with 0ms UI hangs.
              </p>
            </div>

            <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 18px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 17px; font-weight: 800; color: #ffffff;">reddit.com</span>
                <span style="font-family: 'JetBrains Mono', monospace; font-size: 13.5px; font-weight: 700; color: #10b981;">5.41s &bull; 4 PACKETS</span>
              </div>
              <p style="font-size: 13.5px; color: #cbd5e1; line-height: 1.4;">
                Unmasked Fastly edge CDN and telemetry endpoints. Verified sub-6s deterministic completion.
              </p>
            </div>

            <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 18px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 17px; font-weight: 800; color: #ffffff;">cnn.com</span>
                <span style="font-family: 'JetBrains Mono', monospace; font-size: 13.5px; font-weight: 700; color: #10b981;">6.20s &bull; 35+ PACKETS</span>
              </div>
              <p style="font-size: 13.5px; color: #cbd5e1; line-height: 1.4;">
                Captured programmatic ad auctions, Criteo/Rubicon profilers, and exfiltrated cookie tokens.
              </p>
            </div>
          </div>

          <div style="background: #030712; border: 1px solid #10b981; border-radius: 10px; padding: 16px 22px; font-family: 'JetBrains Mono', monospace; font-size: 12.5px; color: #10b981;">
            VERIFICATION GUARANTEE: Zero mocks. All packet telemetry and GPS coordinates are 100% authentic.
          </div>
        </div>
      </div>

      <div class="footer">
        <div>REAL CHROMIUM ENGINE &bull; ACCELERATED PIPELINE &bull; <span class="team-lead">Arnav Shrivastava</span> & <span class="team-lead">Rudransh Rotela</span></div>
        <div class="slide-num">06 / 07</div>
      </div>
    </div>
  </div>

  <!-- ============================================================== -->
  <!-- SLIDE 7: Impact, Feasibility & Final Deliverables              -->
  <!-- ============================================================== -->
  <div class="slide">
    <div class="ambient-glow-purple"></div>
    <div class="ambient-glow-cyan"></div>

    <div class="slide-content">
      <div class="hud-header">
        <div>
          <div class="hud-tag">
            <span class="hud-dot" style="background: #c084fc; box-shadow: 0 0 10px #c084fc;"></span>
            [ 07 // IMPACT, FEASIBILITY & FINAL DELIVERABLES ]
          </div>
          <h2 class="slide-title">Market Impact, Feasibility & The Road Ahead</h2>
        </div>
        <div class="hud-badge" style="border-color: #c084fc; color: #c084fc;">WINNER'S VISION</div>
      </div>

      <div class="grid-3" style="height: 380px;">
        <div class="bento-card cyan">
          <div>
            <div class="badge-pill cyan">SECTOR [01]</div>
            <h3 style="font-size: 21px; font-weight: 800; color: #fff; margin-bottom: 10px;">Consumer Privacy</h3>
            <p style="font-size: 14.5px; line-height: 1.55; color: #cbd5e1;">
              Gamified, visceral alternative to passive ad-blockers that turns invisible surveillance into visual empowerment, teaching everyday users where their data is being shipped.
            </p>
          </div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: #38bdf8; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;">
            TAM: 800M+ ad-blocker users
          </div>
        </div>

        <div class="bento-card purple">
          <div>
            <div class="badge-pill purple">SECTOR [02]</div>
            <h3 style="font-size: 21px; font-weight: 800; color: #fff; margin-bottom: 10px;">Cybersecurity Academia</h3>
            <p style="font-size: 14.5px; line-height: 1.55; color: #cbd5e1;">
              Interactive teaching tool for universities, security researchers, and military defense academies to visualize real-world internet routing, CDN topology, and tracker exfiltration.
            </p>
          </div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: #c084fc; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;">
            APPLICATION: Training & Research
          </div>
        </div>

        <div class="bento-card yellow">
          <div>
            <div class="badge-pill yellow">SECTOR [03]</div>
            <h3 style="font-size: 21px; font-weight: 800; color: #fff; margin-bottom: 10px;">Enterprise GDPR Audits</h3>
            <p style="font-size: 14.5px; line-height: 1.55; color: #cbd5e1;">
              Automated compliance scanner for enterprises to audit client-side web properties for shadow APIs, unauthorized tracking scripts, and illegal cross-border data transfers.
            </p>
          </div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: #fbbf24; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;">
            APPLICATION: Regulatory Compliance
          </div>
        </div>
      </div>

      <!-- Deliverables Box -->
      <div class="bento-card" style="background: #070e20; border-color: rgba(56, 189, 248, 0.4); padding: 28px;">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 13.5px; color: #38bdf8; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 14px;">
          HACKATHON DELIVERABLES (100% COMPLETE & DEPLOYED)
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
          <div>
            <div style="font-size: 16px; font-weight: 800; color: #ffffff;">1. Live Web Application</div>
            <p style="font-size: 13.5px; color: #94a3b8; margin-top: 4px;">Deployed on Render cloud with 3D WebGL radar and Playwright sandbox.</p>
          </div>
          <div>
            <div style="font-size: 16px; font-weight: 800; color: #ffffff;">2. Chrome Extension (MV3)</div>
            <p style="font-size: 13.5px; color: #94a3b8; margin-top: 4px;">Companion browser extension utilizing native declarativeNetRequest rules.</p>
          </div>
          <div>
            <div style="font-size: 16px; font-weight: 800; color: #ffffff;">3. Dockerized Open-Source Code</div>
            <p style="font-size: 13.5px; color: #94a3b8; margin-top: 4px;">Complete GitHub repo with test harnesses, CI/CD pipeline, and Judges Guide.</p>
          </div>
        </div>
      </div>

      <!-- Pitch Winning Climax -->
      <div style="background: linear-gradient(135deg, rgba(192, 132, 252, 0.18) 0%, rgba(30, 11, 48, 0.75) 100%); border: 1.5px solid #c084fc; border-radius: 14px; padding: 22px 34px; text-align: center; box-shadow: 0 10px 30px rgba(192, 132, 252, 0.18);">
        <span style="font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: -0.3px;">
          "DOOMWIRE is not just an ad-blocker. It is the tactical operating system for the next generation of internet privacy."
        </span>
      </div>

      <div class="footer">
        <div>DOOMWIRE v3.4 &bull; Engineering Lead: <span class="team-lead">Arnav Shrivastava</span> & <span class="team-lead">Rudransh Rotela</span> &bull; LIVE ON GITHUB & RENDER</div>
        <div class="slide-num">07 / 07</div>
      </div>
    </div>
  </div>

</body>
</html>`;

  const htmlPath = path.join(__dirname, 'canva_deck_preview.html');
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

  console.log(`[DOOMWIRE] Master Canva-Grade PDF Deck successfully created at: ${pdfPath}`);
}

buildCanvaProDeck().catch(err => {
  console.error('[DOOMWIRE] Error generating Canva PDF deck:', err);
  process.exit(1);
});
