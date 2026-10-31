const PptxGenJS = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

async function createPresentation() {
  console.log('[DOOMWIRE] Generating Master Hackathon PPTX Deck...');
  const pptx = new PptxGenJS();

  pptx.layout = 'LAYOUT_16x9';
  pptx.title = 'DOOMWIRE // Tactical 3D Cyber-Radar & Deception Firewall';
  pptx.author = 'by-Arnavvv';
  pptx.company = 'DOOMWIRE Cyber-Defense';
  pptx.subject = 'Hackathon Master Pitch Deck';

  // Aesthetic Color Tokens
  const THEME = {
    bg: '030712',          // Deep Obsidian Space
    panelBg: '0B132B',     // Tactical Card Panel
    panelBorder: '1E293B', // Border stroke
    cyan: '00F0FF',        // Laser Cyan
    cyanSoft: '38BDF8',    // Soft Cyan
    crimson: 'F43F5E',     // Threat Red
    purple: 'C084FC',      // Deception Purple
    green: '10B981',       // Clean Green
    yellow: 'FBBF24',      // Warning Amber
    white: 'FFFFFF',       // Primary Heading
    slateLight: 'E2E8F0',  // High-contrast body
    slateMuted: '94A3B8'   // Secondary info
  };

  const addHeader = (slide, slideNum, title, category) => {
    // Top tactical tag
    slide.addText(
      [
        { text: `[ 0${slideNum} // ${category.toUpperCase()} ]`, options: { fontFace: 'Courier New', fontSize: 10, bold: true, color: THEME.cyan } }
      ],
      { x: 0.6, y: 0.35, w: 9.0, h: 0.3, align: 'left', margin: 0 }
    );

    // Slide Main Title
    slide.addText(
      [
        { text: title, options: { fontFace: 'Trebuchet MS', fontSize: 22, bold: true, color: THEME.white } }
      ],
      { x: 0.6, y: 0.65, w: 10.0, h: 0.5, align: 'left', margin: 0 }
    );

    // Subtle header accent line
    slide.addShape(pptx.ShapeType.line, {
      x: 0.6,
      y: 1.15,
      w: 12.133,
      h: 0,
      line: { color: THEME.panelBorder, width: 1 }
    });

    // Top Right Logo / Signature
    slide.addText(
      [
        { text: 'DOOMWIRE ', options: { fontFace: 'Trebuchet MS', fontSize: 11, bold: true, color: THEME.cyan } },
        { text: 'v3.4', options: { fontFace: 'Courier New', fontSize: 9, color: THEME.slateMuted } }
      ],
      { x: 10.5, y: 0.35, w: 2.2, h: 0.3, align: 'right', margin: 0 }
    );
  };

  const addFooter = (slide, currentSlide) => {
    slide.addShape(pptx.ShapeType.line, {
      x: 0.6,
      y: 7.0,
      w: 12.133,
      h: 0,
      line: { color: THEME.panelBorder, width: 1 }
    });

    slide.addText(
      [
        { text: 'by-Arnavvv  •  TACTICAL 3D CYBER-RADAR & IN-FLIGHT DECEPTION FIREWALL  •  LIVE AT RENDER', options: { fontFace: 'Courier New', fontSize: 8.5, color: THEME.slateMuted } }
      ],
      { x: 0.6, y: 7.05, w: 10.0, h: 0.3, align: 'left', margin: 0 }
    );

    slide.addText(
      [
        { text: `${currentSlide} / 07`, options: { fontFace: 'Courier New', fontSize: 9, bold: true, color: THEME.cyan } }
      ],
      { x: 11.0, y: 7.05, w: 1.7, h: 0.3, align: 'right', margin: 0 }
    );
  };

  // ==========================================
  // SLIDE 1: Title & Hook
  // ==========================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: THEME.bg };

    // Decorative HUD Grid Line
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.6,
      y: 0.6,
      w: 12.133,
      h: 6.2,
      fill: { color: '060C1B' },
      line: { color: THEME.panelBorder, width: 1 }
    });

    // Tactical Pill Badge
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 1.0,
      y: 1.0,
      w: 4.8,
      h: 0.38,
      rectRadius: 0.1,
      fill: { color: '0F172A' },
      line: { color: THEME.cyan, width: 1 }
    });
    slide.addText(
      'HACKATHON SUBMISSION // CYBERSECURITY & PRIVACY',
      { x: 1.0, y: 1.0, w: 4.8, h: 0.38, fontFace: 'Courier New', fontSize: 8.5, bold: true, color: THEME.cyan, align: 'center' }
    );

    // Hero Title
    slide.addText('DOOMWIRE', {
      x: 1.0,
      y: 1.5,
      w: 11.0,
      h: 1.1,
      fontFace: 'Trebuchet MS',
      fontSize: 54,
      bold: true,
      color: THEME.white,
      margin: 0
    });

    // Subtitle
    slide.addText('Tactical 3D Cyber-Radar, In-Flight Packet X-Ray & Autonomous Deception Firewall', {
      x: 1.0,
      y: 2.65,
      w: 11.0,
      h: 0.45,
      fontFace: 'Trebuchet MS',
      fontSize: 16,
      bold: true,
      color: THEME.cyanSoft,
      margin: 0
    });

    // The Judge-Stopping Hook Callout Box
    slide.addShape(pptx.ShapeType.rect, {
      x: 1.0,
      y: 3.3,
      w: 11.3,
      h: 1.25,
      fill: { color: '030712' },
      line: { color: THEME.cyan, width: 1.5 }
    });

    slide.addText(
      [
        { text: 'THE CORE HOOK:  ', options: { fontFace: 'Courier New', fontSize: 11, bold: true, color: THEME.cyan } },
        { text: '"You cannot defend what you cannot see."\n', options: { fontFace: 'Trebuchet MS', fontSize: 14, bold: true, color: THEME.white } },
        { text: 'We transformed invisible surveillance and third-party data broker exfiltration into an interactive 3D WebGL command war room with active weaponized countermeasures.', options: { fontFace: 'Trebuchet MS', fontSize: 11, color: THEME.slateLight } }
      ],
      { x: 1.2, y: 3.45, w: 10.9, h: 0.95, margin: 0 }
    );

    // 3 Feature Badges Across Bottom
    const badgeW = 3.6;
    const badges = [
      { title: '3D PLANETARY RADAR', desc: 'Live NASA Earth projection mapping packet coordinates in-flight', color: THEME.cyan },
      { title: 'ZERO-MOCK ENGINE', desc: 'Real headless Playwright sandbox with active packet sniffing', color: THEME.purple },
      { title: 'DECEPTION FIREWALL', desc: 'Weaponized Wire-Poisoning injecting synthetic noise decoys', color: THEME.crimson }
    ];

    badges.forEach((b, idx) => {
      const bx = 1.0 + idx * (badgeW + 0.25);
      slide.addShape(pptx.ShapeType.rect, {
        x: bx,
        y: 4.8,
        w: badgeW,
        h: 1.35,
        fill: { color: THEME.panelBg },
        line: { color: b.color, width: 1 }
      });

      slide.addText(
        [
          { text: `● ${b.title}\n`, options: { fontFace: 'Courier New', fontSize: 10, bold: true, color: b.color } },
          { text: b.desc, options: { fontFace: 'Trebuchet MS', fontSize: 9.5, color: THEME.slateLight } }
        ],
        { x: bx + 0.2, y: 4.95, w: badgeW - 0.4, h: 1.05, margin: 0 }
      );
    });

    // Team Attribution
    slide.addText(
      'ENGINEERED BY: Arnav & Team  |  Obsidian Blue Protocol  |  Render Cloud Deployed',
      { x: 1.0, y: 6.35, w: 11.3, h: 0.35, fontFace: 'Courier New', fontSize: 9, color: THEME.slateMuted, align: 'center' }
    );
  }

  // ==========================================
  // SLIDE 2: Problem Statement & Research
  // ==========================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: THEME.bg };
    addHeader(slide, 2, 'Problem Statement & The Silent Surveillance Crisis', 'Problem & Research');

    // Big Stat Callout Banner
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.6,
      y: 1.35,
      w: 12.133,
      h: 0.95,
      fill: { color: '1A0B14' },
      line: { color: THEME.crimson, width: 1.5 }
    });

    slide.addText(
      [
        { text: 'THE SHOCKING REALITY:  ', options: { fontFace: 'Courier New', fontSize: 10.5, bold: true, color: THEME.crimson } },
        { text: '91% of top 1,000 websites secretly leak your biometrics, search intent, and hardware fingerprint to 30–100 third-party servers within 3 seconds of page load.', options: { fontFace: 'Trebuchet MS', fontSize: 12, bold: true, color: THEME.white } }
      ],
      { x: 0.8, y: 1.45, w: 11.7, h: 0.75, margin: 0 }
    );

    // 4 Threat Vector Cards
    const vectors = [
      {
        num: '01',
        title: 'Cross-Site Ad Brokers',
        impact: 'Harvests IP, browsing journey, and search intent to construct permanent cross-device identity profiles sold in ad auctions.',
        stat: '35%–60% of all page traffic',
        color: THEME.crimson
      },
      {
        num: '02',
        title: 'Session-Replay Spyware',
        impact: 'Scripts (Hotjar, Clarity, Yandex) record mouse movements, cursor heatmaps, and keystrokes inside forms BEFORE clicking submit.',
        stat: '100% Behavioral capture',
        color: THEME.yellow
      },
      {
        num: '03',
        title: 'Hardware Fingerprinters',
        impact: 'Enumerates GPU renderer, WebGL canvas hash, audio buffer, and screen depth to identify users even in Incognito/Private mode.',
        stat: 'Bypasses cookie clears',
        color: THEME.purple
      },
      {
        num: '04',
        title: 'Passive Blocker Failures',
        impact: 'Traditional ad-blockers (uBlock, AdBlock) silently block URLs with passive "14 blocked" counters, keeping users blind to data destinations.',
        stat: 'Trigger "Adblock detected" walls',
        color: THEME.cyan
      }
    ];

    vectors.forEach((v, idx) => {
      const vx = 0.6 + idx * 3.1;
      slide.addShape(pptx.ShapeType.rect, {
        x: vx,
        y: 2.5,
        w: 2.85,
        h: 4.25,
        fill: { color: THEME.panelBg },
        line: { color: v.color, width: 1 }
      });

      slide.addText(
        [
          { text: `VECTOR [${v.num}]\n`, options: { fontFace: 'Courier New', fontSize: 11, bold: true, color: v.color } },
          { text: `${v.title}\n\n`, options: { fontFace: 'Trebuchet MS', fontSize: 13, bold: true, color: THEME.white } },
          { text: `${v.impact}\n\n`, options: { fontFace: 'Trebuchet MS', fontSize: 9.5, color: THEME.slateLight } },
          { text: `EXPOSURE IMPACT:\n`, options: { fontFace: 'Courier New', fontSize: 8.5, bold: true, color: THEME.slateMuted } },
          { text: v.stat, options: { fontFace: 'Courier New', fontSize: 9.5, bold: true, color: v.color } }
        ],
        { x: vx + 0.15, y: 2.65, w: 2.55, h: 3.9, margin: 0 }
      );
    });

    addFooter(slide, 2);
  }

  // ==========================================
  // SLIDE 3: Proposed Solution & Core Features
  // ==========================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: THEME.bg };
    addHeader(slide, 3, 'Proposed Solution: DOOMWIRE 3D Tactical Cyber-Radar', 'Solution & Core Features');

    // Left Column: 3 Core Pillars
    const pillars = [
      {
        title: '3D Planetary Cyber-Radar',
        badge: 'REAL-TIME WEBGL',
        color: THEME.cyan,
        desc: 'Intercepts outbound TCP/HTTP packets in-flight and renders them as ballistic great-circle laser beams on a spinning 3D NASA night-Earth, landing on physical server coordinates worldwide.'
      },
      {
        title: 'Corporate Unmasking & In-Flight X-Ray',
        badge: 'INTELLIGENCE GRAPH',
        color: THEME.purple,
        desc: 'Decodes cryptic, obscure tracking endpoints (e.g. 2mdn.net ➔ Google, sc-static.net ➔ Snap, static.whatsapp.net ➔ Meta) and performs deep-packet X-Ray to expose cookies, UTM tags, and GPU probes.'
      },
      {
        title: 'Dynamic Telemetry Aggregation [X× REQS]',
        badge: 'CLEAN STREAM ARCHITECTURE',
        color: THEME.green,
        desc: 'Groups repeated microservice requests to the same origin into unified node cards with tactical request count badges (e.g. 24× REQS), merging leaks and elevating threat levels without UI clutter.'
      }
    ];

    pillars.forEach((p, idx) => {
      const py = 1.35 + idx * 1.8;
      slide.addShape(pptx.ShapeType.rect, {
        x: 0.6,
        y: py,
        w: 6.8,
        h: 1.65,
        fill: { color: THEME.panelBg },
        line: { color: p.color, width: 1 }
      });

      slide.addText(
        [
          { text: `${p.badge}  •  `, options: { fontFace: 'Courier New', fontSize: 9, bold: true, color: p.color } },
          { text: `${p.title}\n`, options: { fontFace: 'Trebuchet MS', fontSize: 13, bold: true, color: THEME.white } },
          { text: p.desc, options: { fontFace: 'Trebuchet MS', fontSize: 9.5, color: THEME.slateLight } }
        ],
        { x: 0.8, y: py + 0.15, w: 6.4, h: 1.35, margin: 0 }
      );
    });

    // Right Column: The Dual Weaponized Firewall
    slide.addShape(pptx.ShapeType.rect, {
      x: 7.7,
      y: 1.35,
      w: 5.033,
      h: 5.25,
      fill: { color: '050A18' },
      line: { color: THEME.cyan, width: 1.5 }
    });

    slide.addText('AUTONOMOUS DUAL FIREWALL', {
      x: 8.0,
      y: 1.6,
      w: 4.4,
      h: 0.35,
      fontFace: 'Courier New',
      fontSize: 12,
      bold: true,
      color: THEME.cyan
    });

    // Weapon 1: Cut The Wire
    slide.addShape(pptx.ShapeType.rect, {
      x: 8.0,
      y: 2.1,
      w: 4.433,
      h: 2.0,
      fill: { color: '1A0A0E' },
      line: { color: THEME.crimson, width: 1 }
    });
    slide.addText(
      [
        { text: '✂️ WEAPON 1: "CUT THE WIRE"\n', options: { fontFace: 'Trebuchet MS', fontSize: 12, bold: true, color: THEME.crimson } },
        { text: 'Hard Network Severance\n', options: { fontFace: 'Courier New', fontSize: 9, color: THEME.slateMuted } },
        { text: '• Instantly triggers socket abort (route.abort)\n• Slices the physical laser arc on the 3D globe\n• Synthesizes tactile cyber-audio severance cue\n• Completely cuts data exfiltration to targeted server', options: { fontFace: 'Trebuchet MS', fontSize: 9.5, color: THEME.slateLight } }
      ],
      { x: 8.15, y: 2.2, w: 4.1, h: 1.8, margin: 0 }
    );

    // Weapon 2: Poison The Wire
    slide.addShape(pptx.ShapeType.rect, {
      x: 8.0,
      y: 4.3,
      w: 4.433,
      h: 2.1,
      fill: { color: '140A1E' },
      line: { color: THEME.purple, width: 1 }
    });
    slide.addText(
      [
        { text: '☠️ WEAPON 2: "POISON THE WIRE"\n', options: { fontFace: 'Trebuchet MS', fontSize: 12, bold: true, color: THEME.purple } },
        { text: 'Autonomous Deception Mode (Anti-Adblock Proof)\n', options: { fontFace: 'Courier New', fontSize: 9, color: THEME.slateMuted } },
        { text: '• Lets connection complete to prevent website breakages\n• Injects synthetic algorithmic noise & fake GPU hashes\n• Feeds surveillance servers corrupted behavioral decoys\n• Renders tracking profiles statistically useless', options: { fontFace: 'Trebuchet MS', fontSize: 9.5, color: THEME.slateLight } }
      ],
      { x: 8.15, y: 4.4, w: 4.1, h: 1.9, margin: 0 }
    );

    addFooter(slide, 3);
  }

  // ==========================================
  // SLIDE 4: System Architecture & Tech Stack
  // ==========================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: THEME.bg };
    addHeader(slide, 4, 'System Architecture & Full Technology Stack', 'System Architecture & Tech');

    // 5-Stage Interception Pipeline Blocks
    const pipeline = [
      { step: '01', title: 'SANDBOX LAUNCH', tech: 'Playwright Chromium', desc: 'Isolates target URL in containerized stealth environment with automation flags neutralized.' },
      { step: '02', title: 'NETWORK DRIVER TAP', tech: 'activePage.route()', desc: 'Hooks all outgoing HTTP, WebSocket, and telemetry beacons in-flight before transmission.' },
      { step: '03', title: 'SUB-1.5ms GEOIP', tech: 'MaxMind Binary DB', desc: 'Performs offline binary IP lookup resolving precise server GPS coordinates with 0ms cloud lag.' },
      { step: '04', title: 'TELEMETRY STREAM', tech: 'Socket.io @ 60 FPS', desc: 'Streams latitude/longitude, risk vectors, and leaked payload headers to the client HUD.' },
      { step: '05', title: 'ACTIVE DEFENSE', tech: 'TCP Abort / Decoy', desc: 'Executes user commands: Hard socket abort or synthetic decoy injection on matching routes.' }
    ];

    pipeline.forEach((p, idx) => {
      const px = 0.6 + idx * 2.48;
      slide.addShape(pptx.ShapeType.rect, {
        x: px,
        y: 1.35,
        w: 2.25,
        h: 2.8,
        fill: { color: THEME.panelBg },
        line: { color: THEME.cyan, width: 1 }
      });

      slide.addText(
        [
          { text: `STAGE [${p.step}]\n`, options: { fontFace: 'Courier New', fontSize: 10, bold: true, color: THEME.cyan } },
          { text: `${p.title}\n`, options: { fontFace: 'Trebuchet MS', fontSize: 11, bold: true, color: THEME.white } },
          { text: `(${p.tech})\n\n`, options: { fontFace: 'Courier New', fontSize: 8.5, color: THEME.cyanSoft } },
          { text: p.desc, options: { fontFace: 'Trebuchet MS', fontSize: 9, color: THEME.slateLight } }
        ],
        { x: px + 0.12, y: 1.45, w: 2.0, h: 2.55, margin: 0 }
      );
    });

    // Tech Stack Matrix Table / Grid
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.6,
      y: 4.4,
      w: 12.133,
      h: 2.4,
      fill: { color: '070E20' },
      line: { color: THEME.panelBorder, width: 1 }
    });

    slide.addText('CORE TECHNOLOGY STACK & ZERO-MOCK ENGINEERING', {
      x: 0.9,
      y: 4.55,
      w: 11.0,
      h: 0.3,
      fontFace: 'Courier New',
      fontSize: 10.5,
      bold: true,
      color: THEME.cyan
    });

    const stackItems = [
      { layer: 'FRONTEND RADAR', tech: 'React 18 + Three.js + react-globe.gl', desc: '60 FPS 3D WebGL Earth with NASA Black Marble city lights, dynamic laser arcs, and radar rings.' },
      { layer: 'SANDBOX RECON', tech: 'Playwright + Headless Chromium', desc: 'Live in-browser network driver sniffer extracting real POST payloads, cookies, and tracking scripts.' },
      { layer: 'GEO LOCALIZATION', tech: 'MaxMind GeoIP Binary (geoip-lite)', desc: '100% offline database resolving server IP to country, city, and GPS coordinates in sub-1.5ms.' },
      { layer: 'AUDIO SYNTHESIS', tech: 'Native HTML5 Web Audio API', desc: 'Zero external MP3 audio files. Pure procedural sine/sawtooth sound wave synthesis.' }
    ];

    stackItems.forEach((s, idx) => {
      const sy = 4.95 + idx * 0.42;
      slide.addText(
        [
          { text: `▸  ${s.layer}: `, options: { fontFace: 'Courier New', fontSize: 9, bold: true, color: THEME.cyanSoft } },
          { text: `${s.tech} — `, options: { fontFace: 'Trebuchet MS', fontSize: 9, bold: true, color: THEME.white } },
          { text: s.desc, options: { fontFace: 'Trebuchet MS', fontSize: 9, color: THEME.slateMuted } }
        ],
        { x: 0.9, y: sy, w: 11.5, h: 0.38, margin: 0 }
      );
    });

    addFooter(slide, 4);
  }

  // ==========================================
  // SLIDE 5: Design Prototype & Expected Output
  // ==========================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: THEME.bg };
    addHeader(slide, 5, 'Design Prototype & Tactical User Experience', 'Design Prototype & Output');

    // 4 Key Interface Highlight Cards
    const protoCards = [
      {
        title: '3D Cyber-Radar Globe',
        badge: 'NASA HARD GRAPHICS',
        color: THEME.cyan,
        features: [
          'High-Definition NASA Night-Earth topology',
          'Live ballistic laser arcs colored by threat severity',
          'Impact radar rings radiating upon packet arrival',
          'Clickable 3D server markers with auto-focus camera'
        ]
      },
      {
        title: 'Live Telemetry Stream Feed',
        badge: '[X× REQS] AGGREGATION',
        color: THEME.green,
        features: [
          'Aggregated nodes preventing repetitive clutter',
          'Tactical [24× REQS] cyan badge display',
          'Severity color classification (Red/Orange/Green)',
          'Filter tabs: ALL, THREATS, SEVERED, POISONED'
        ]
      },
      {
        title: 'Packet X-Ray Inspector',
        badge: 'DEEP FORENSIC DRAWER',
        color: THEME.purple,
        features: [
          'Unmasks parent holding entity (e.g., Snap, Meta)',
          'Exact server city and coordinates breakdown',
          'Exfiltrated cookies, UTM tags, and GPU probes',
          'Tactile "CUT" or "POISON" trigger buttons'
        ]
      },
      {
        title: 'Safe-Room Clean Preview',
        badge: 'SANITIZED DOM SANDBOX',
        color: THEME.yellow,
        features: [
          'Real-time screenshot showing tracker-free DOM',
          'Proves ad auctions are neutralized before paint',
          'Zero-crash layout preservation',
          'Visual evidence of severed data wires'
        ]
      }
    ];

    protoCards.forEach((c, idx) => {
      const cx = 0.6 + idx * 3.1;
      slide.addShape(pptx.ShapeType.rect, {
        x: cx,
        y: 1.35,
        w: 2.85,
        h: 4.3,
        fill: { color: THEME.panelBg },
        line: { color: c.color, width: 1 }
      });

      slide.addText(
        [
          { text: `${c.badge}\n`, options: { fontFace: 'Courier New', fontSize: 8.5, bold: true, color: c.color } },
          { text: `${c.title}\n\n`, options: { fontFace: 'Trebuchet MS', fontSize: 13, bold: true, color: THEME.white } },
          ...c.features.map(f => ({ text: `• ${f}\n`, options: { fontFace: 'Trebuchet MS', fontSize: 9.5, color: THEME.slateLight } }))
        ],
        { x: cx + 0.15, y: 1.5, w: 2.55, h: 3.9, margin: 0 }
      );
    });

    // Aesthetic Signature Callout
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.6,
      y: 5.85,
      w: 12.133,
      h: 0.95,
      fill: { color: '070E20' },
      line: { color: THEME.cyan, width: 1 }
    });

    slide.addText(
      [
        { text: 'AESTHETIC SIGNATURE:  ', options: { fontFace: 'Courier New', fontSize: 10, bold: true, color: THEME.cyan } },
        { text: 'Curated 4-Theme Tactical Engine (Obsidian Blue, Deep Violet, Crimson Protocol, Emerald Matrix). Designed to deliver a military-grade intelligence HUD that engages users and judges immediately.', options: { fontFace: 'Trebuchet MS', fontSize: 10.5, color: THEME.slateLight } }
      ],
      { x: 0.8, y: 5.95, w: 11.7, h: 0.75, margin: 0 }
    );

    addFooter(slide, 5);
  }

  // ==========================================
  // SLIDE 6: 8-Hour Implementation & Validation
  // ==========================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: THEME.bg };
    addHeader(slide, 6, '8-Hour Implementation Plan & Live Validation', '8-Hour Plan & Validation');

    // Left Side: 8-Hour Hackathon Implementation Timeline
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.6,
      y: 1.35,
      w: 5.8,
      h: 5.4,
      fill: { color: THEME.panelBg },
      line: { color: THEME.panelBorder, width: 1 }
    });

    slide.addText('HACKATHON 8-HOUR SPRINT TIMELINE', {
      x: 0.9,
      y: 1.55,
      w: 5.2,
      h: 0.3,
      fontFace: 'Courier New',
      fontSize: 11,
      bold: true,
      color: THEME.cyan
    });

    const timeline = [
      { hours: 'HOURS 00 — 02', task: 'Sandbox Engine & Packet Tap', detail: 'Spun up Playwright Chromium context, bypassed anti-bot evasion, and hooked in-flight page.route() listeners.' },
      { hours: 'HOURS 02 — 04', task: '3D WebGL Radar & GeoIP Pipeline', detail: 'Integrated Three.js spherical coordinate transforms with offline MaxMind binary database for sub-1.5ms mapping.' },
      { hours: 'HOURS 04 — 06', task: 'Dual Weaponized Firewall', detail: 'Built "Cut the Wire" socket severance and "Poison the Wire" synthetic noise injection into outbound POST payloads.' },
      { hours: 'HOURS 06 — 08', task: 'Aggregation & Deterministic Watchdog', detail: 'Engineered [X× REQS] node grouping and dual client/server safety watchdogs for sub-8s guaranteed completion.' }
    ];

    timeline.forEach((t, idx) => {
      const ty = 2.05 + idx * 1.15;
      slide.addText(
        [
          { text: `[ ${t.hours} ]  `, options: { fontFace: 'Courier New', fontSize: 9.5, bold: true, color: THEME.cyanSoft } },
          { text: `${t.task}\n`, options: { fontFace: 'Trebuchet MS', fontSize: 11, bold: true, color: THEME.white } },
          { text: t.detail, options: { fontFace: 'Trebuchet MS', fontSize: 9, color: THEME.slateMuted } }
        ],
        { x: 0.9, y: ty, w: 5.2, h: 1.0, margin: 0 }
      );
    });

    // Right Side: Live Benchmark & Validation Table
    slide.addShape(pptx.ShapeType.rect, {
      x: 6.7,
      y: 1.35,
      w: 6.033,
      h: 5.4,
      fill: { color: '050A18' },
      line: { color: THEME.green, width: 1.5 }
    });

    slide.addText('LIVE BENCHMARK & REAL TARGET VALIDATION', {
      x: 7.0,
      y: 1.55,
      w: 5.4,
      h: 0.3,
      fontFace: 'Courier New',
      fontSize: 11,
      bold: true,
      color: THEME.green
    });

    const tests = [
      { target: 'web.whatsapp.com', result: '20 Packets // 10 Nodes // 8.54s', notes: 'Grouped static.whatsapp.net with [11× REQS]. Identified Meta telemetry endpoints with 0ms UI hang.' },
      { target: 'reddit.com', result: '4 Packets // 4 Nodes // 5.41s', notes: 'Unmasked Fastly edge CDN & telemetry endpoints. Verified sub-6s deterministic completion.' },
      { target: 'cnn.com', result: '35+ Packets // 18 Nodes // 6.20s', notes: 'Captured real programmatic ad auction bids, Criteo/Rubicon profilers, and exfiltrated cookie tokens.' }
    ];

    tests.forEach((t, idx) => {
      const ty = 2.05 + idx * 1.15;
      slide.addShape(pptx.ShapeType.rect, {
        x: 7.0,
        y: ty,
        w: 5.433,
        h: 1.0,
        fill: { color: THEME.panelBg },
        line: { color: THEME.panelBorder, width: 1 }
      });

      slide.addText(
        [
          { text: `TARGET: ${t.target}  •  `, options: { fontFace: 'Courier New', fontSize: 9.5, bold: true, color: THEME.white } },
          { text: `${t.result}\n`, options: { fontFace: 'Courier New', fontSize: 9, bold: true, color: THEME.green } },
          { text: t.notes, options: { fontFace: 'Trebuchet MS', fontSize: 8.5, color: THEME.slateLight } }
        ],
        { x: 7.15, y: ty + 0.1, w: 5.1, h: 0.8, margin: 0 }
      );
    });

    // Zero-Mock Verification Badge
    slide.addShape(pptx.ShapeType.rect, {
      x: 7.0,
      y: 5.6,
      w: 5.433,
      h: 0.95,
      fill: { color: '071E14' },
      line: { color: THEME.green, width: 1 }
    });

    slide.addText(
      [
        { text: 'VERIFICATION CERTIFICATION:  ', options: { fontFace: 'Courier New', fontSize: 9, bold: true, color: THEME.green } },
        { text: '100% Zero-Mock Guarantee. Every telemetry arc maps to a real physical server with verified latitude/longitude coordinates tested live.', options: { fontFace: 'Trebuchet MS', fontSize: 9.5, color: THEME.slateLight } }
      ],
      { x: 7.15, y: 5.7, w: 5.1, h: 0.75, margin: 0 }
    );

    addFooter(slide, 6);
  }

  // ==========================================
  // SLIDE 7: Impact, Feasibility & Deliverables
  // ==========================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: THEME.bg };
    addHeader(slide, 7, 'Market Impact, Feasibility & Final Deliverables', 'Impact, Feasibility & Vision');

    // 3 Target Sectors
    const sectors = [
      {
        num: '01',
        title: 'Consumer Privacy',
        desc: 'Gamified, visceral alternative to passive ad-blockers that empowers everyday internet users to see and control their personal data exfiltration.',
        color: THEME.cyan
      },
      {
        num: '02',
        title: 'Cybersecurity Education',
        desc: 'Classroom & university training tool visualizing global internet routing, CDN topology, and corporate data broker tracking mechanics.',
        color: THEME.purple
      },
      {
        num: '03',
        title: 'Enterprise GDPR/CCPA Audit',
        desc: 'Automated compliance scanner auditing websites for shadow APIs and illegal cross-border data transfers to foreign jurisdictions.',
        color: THEME.yellow
      }
    ];

    sectors.forEach((s, idx) => {
      const sx = 0.6 + idx * 4.15;
      slide.addShape(pptx.ShapeType.rect, {
        x: sx,
        y: 1.35,
        w: 3.85,
        h: 2.3,
        fill: { color: THEME.panelBg },
        line: { color: s.color, width: 1 }
      });

      slide.addText(
        [
          { text: `MARKET SECTOR [${s.num}]\n`, options: { fontFace: 'Courier New', fontSize: 9.5, bold: true, color: s.color } },
          { text: `${s.title}\n\n`, options: { fontFace: 'Trebuchet MS', fontSize: 13, bold: true, color: THEME.white } },
          { text: s.desc, options: { fontFace: 'Trebuchet MS', fontSize: 9.5, color: THEME.slateLight } }
        ],
        { x: sx + 0.15, y: 1.5, w: 3.55, h: 2.0, margin: 0 }
      );
    });

    // Final Deliverables Card
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.6,
      y: 3.9,
      w: 12.133,
      h: 1.8,
      fill: { color: '070E20' },
      line: { color: THEME.cyan, width: 1.5 }
    });

    slide.addText('HACKATHON FINAL DELIVERABLES (100% COMPLETE & DEPLOYED)', {
      x: 0.9,
      y: 4.05,
      w: 11.5,
      h: 0.3,
      fontFace: 'Courier New',
      fontSize: 11,
      bold: true,
      color: THEME.cyan
    });

    const deliverables = [
      '1. Live Production Web App: Deployed on Render cloud with full WebGL 3D radar and Playwright sandbox.',
      '2. Companion Browser Extension: Manifest V3 extension providing hardware-level declarativeNetRequest rules.',
      '3. Open-Source Codebase: Clean GitHub repository with Docker container, comprehensive tests, and Judges Guide.'
    ];

    deliverables.forEach((d, idx) => {
      slide.addText(d, {
        x: 0.9,
        y: 4.45 + idx * 0.38,
        w: 11.5,
        h: 0.32,
        fontFace: 'Trebuchet MS',
        fontSize: 10,
        color: THEME.slateLight
      });
    });

    // Pitch Winning Climax
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.6,
      y: 5.95,
      w: 12.133,
      h: 0.85,
      fill: { color: '180B22' },
      line: { color: THEME.purple, width: 1.5 }
    });

    slide.addText(
      '"DOOMWIRE is not just an ad-blocker. It is the tactical operating system for the next generation of internet privacy."',
      { x: 0.8, y: 6.05, w: 11.7, h: 0.65, fontFace: 'Trebuchet MS', fontSize: 13, bold: true, color: THEME.white, align: 'center' }
    );

    addFooter(slide, 7);
  }

  const outputPath = path.join(__dirname, '..', 'DOOMWIRE_HACKATHON_DECK.pptx');
  await pptx.writeFile({ fileName: outputPath });
  console.log(`[DOOMWIRE] PPTX successfully saved to: ${outputPath}`);
}

createPresentation().catch(err => {
  console.error('[DOOMWIRE] Error generating PPTX:', err);
  process.exit(1);
});
