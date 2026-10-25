import React, { useState, useEffect, useRef, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { io } from 'socket.io-client';
import {
  ShieldAlert,
  Radio,
  Scissors,
  Skull,
  Activity,
  Terminal,
  Crosshair,
  Volume2,
  VolumeX,
  RotateCw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Zap,
  Layers,
  MapPin,
  ZoomIn,
  ZoomOut,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  Server,
  Sliders,
  X,
  Palette,
  Sparkles,
  Award,
  Download,
  BookOpen,
  Info,
  ShieldCheck,
  FileText
} from 'lucide-react';

const SOCKET_SERVER_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// 3 Dark Aesthetic Themes with Custom Lighting & Vibe
const THEMES = {
  CYBER_CYAN: {
    id: 'CYBER_CYAN',
    name: 'CYBER-CYAN',
    tag: 'TACTICAL RADAR',
    primary: '#00f0ff',
    primaryGlow: 'rgba(0, 240, 255, 0.45)',
    secondary: '#38bdf8',
    atmosphere: '#00f0ff',
    radarColor: '#00f0ff'
  },
  VOID_PURPLE: {
    id: 'VOID_PURPLE',
    name: 'VOID-PURPLE',
    tag: 'DEEP NEBULA',
    primary: '#c084fc',
    primaryGlow: 'rgba(192, 132, 252, 0.45)',
    secondary: '#ec4899',
    atmosphere: '#9333ea',
    radarColor: '#c084fc'
  },
  MATRIX_EMERALD: {
    id: 'MATRIX_EMERALD',
    name: 'MATRIX-NEO',
    tag: 'CLASSIFIED TERMINAL',
    primary: '#00ff88',
    primaryGlow: 'rgba(0, 255, 136, 0.45)',
    secondary: '#10b981',
    atmosphere: '#10b981',
    radarColor: '#00ff88'
  }
};

// Realistic Global Surveillance & Tracking Telemetry Dataset (Runs when cloud backend worker is offline)
const SIMULATED_BEACONS = [
  { domain: 'google-analytics.com', company: 'Google LLC', city: 'Ashburn, VA (US)', geo: { lat: 39.0438, lng: -77.4874 }, threatLevel: 'orange', ip: '142.250.190.46', trackerType: 'Behavioral Analytics & Client ID Sync', leakedData: ['Client UUID Hash', 'Viewport Dimension Metric', 'Scroll & Interaction Heatmap', 'Unmasked AudioContext Oscillation'] },
  { domain: 'doubleclick.net', company: 'Google / DoubleClick', city: 'Council Bluffs, IA (US)', geo: { lat: 41.2619, lng: -95.8608 }, threatLevel: 'red', ip: '172.217.1.130', trackerType: 'Programmatic Real-Time Bidding (RTB)', leakedData: ['Cross-Site Bidstream Graph', 'FLoC / Topics API Beacon', 'High-Entropy Device Memory Probes'] },
  { domain: 'facebook.net', company: 'Meta Platforms Inc.', city: 'Prineville, OR (US)', geo: { lat: 44.2999, lng: -120.8345 }, threatLevel: 'red', ip: '157.240.241.35', trackerType: 'Cross-Site Pixel & Social Graph Sync', leakedData: ['Meta Graph Pixel Identity', 'First-Party CNAME Cloaking Attempt', 'Mouse Dynamics & Keystroke Timing'] },
  { domain: 'criteo.net', company: 'Criteo SA', city: 'Paris (FR)', geo: { lat: 48.8566, lng: 2.3522 }, threatLevel: 'red', ip: '178.255.215.101', trackerType: 'Dynamic Retargeting Exchange', leakedData: ['Real-Time Retargeting Beacon', 'Dynamic Price Scraping Probes', 'Battery Status API Snooper'] },
  { domain: 'amazon-adsystem.com', company: 'Amazon Technologies', city: 'Dublin (IE)', geo: { lat: 53.3498, lng: -6.2603 }, threatLevel: 'orange', ip: '52.95.120.33', trackerType: 'Header Bidding Auction', leakedData: ['Header Bidding Exchange Data', 'Device Hardware Concurrency Enumerator'] },
  { domain: 'rubiconproject.com', company: 'Magnite Inc.', city: 'New York, NY (US)', geo: { lat: 40.7128, lng: -74.006 }, threatLevel: 'red', ip: '198.144.120.15', trackerType: 'DSP Identity Graph Sync', leakedData: ['DSP Cookie Sync Graph', 'WebGL Unmasked Renderer / GPU Fingerprint'] },
  { domain: 'tiktok.com', company: 'ByteDance Ltd.', city: 'Singapore (SG)', geo: { lat: 1.3521, lng: 103.8198 }, threatLevel: 'red', ip: '161.117.82.41', trackerType: 'Advanced Behavioral Match Pixel', leakedData: ['TikTok Pixel Advanced Matching', 'Screen Resolution & DPI Scan', 'Clipboard Snooping Attempt'] },
  { domain: 'adnxs.com', company: 'Xandr / Microsoft', city: 'Amsterdam (NL)', geo: { lat: 52.3676, lng: 4.9041 }, threatLevel: 'red', ip: '64.34.168.10', trackerType: 'Ad Server Audience Marketplace', leakedData: ['Cross-Domain Identity Graph', 'Audience Segment Synchronization'] },
  { domain: 'taboola.com', company: 'Taboola Inc.', city: 'Tel Aviv (IL)', geo: { lat: 32.0853, lng: 34.7818 }, threatLevel: 'yellow', ip: '212.179.112.55', trackerType: 'Native Recommendation Clickstream', leakedData: ['Behavioral Clickstream Recorder', 'Viewport Scroll Depth Telemetry'] },
  { domain: 'scorecardresearch.com', company: 'Comscore Inc.', city: 'Reston, VA (US)', geo: { lat: 38.9586, lng: -77.357 }, threatLevel: 'red', ip: '208.73.181.18', trackerType: 'Mass Surveillance & Demographic Profiler', leakedData: ['Global Demographic Profile Sync', 'ISP Reverse-DNS Telemetry'] },
  { domain: 'hotjar.com', company: 'Hotjar Ltd.', city: 'Frankfurt (DE)', geo: { lat: 50.1109, lng: 8.6821 }, threatLevel: 'orange', ip: '18.197.0.22', trackerType: 'Session Recording & Keystroke Logger', leakedData: ['DOM Keystroke Interceptor', 'Full-Page Session Replay Recorder'] },
  { domain: 'outbrain.com', company: 'Outbrain Inc.', city: 'London (UK)', geo: { lat: 51.5074, lng: -0.1278 }, threatLevel: 'yellow', ip: '151.101.0.187', trackerType: 'Content Graph Telemetry', leakedData: ['Native Ad Fingerprint Injection', 'Referrer Leak Extractor'] },
  { domain: 'cloudflare.net', company: 'Cloudflare Inc.', city: 'San Jose, CA (US)', geo: { lat: 37.3382, lng: -121.8863 }, threatLevel: 'green', ip: '104.16.132.229', trackerType: 'CDN Edge & DDoS Defense', leakedData: ['DDoS Perimeter Challenge Token', 'Bot Management Verification'] },
  { domain: 'fastly.net', company: 'Fastly Inc.', city: 'Tokyo (JP)', geo: { lat: 35.6762, lng: 139.6503 }, threatLevel: 'green', ip: '151.101.65.140', trackerType: 'Static Edge Asset Mirror', leakedData: ['Static Asset Edge Cache Response'] }
];

// Generates an interactive, tactical Safe-Room preview in-memory via HTML5 Canvas
const generateSimulatedSafeView = (url, severedSet = new Set(), poisonedSet = new Set()) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 700;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background
  ctx.fillStyle = '#070b14';
  ctx.fillRect(0, 0, 1200, 700);

  // Chrome Header
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 1200, 52);
  ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(26, 26, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(46, 26, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(66, 26, 6, 0, Math.PI * 2); ctx.fill();

  // URL Bar
  ctx.fillStyle = '#1e293b';
  if (ctx.roundRect) ctx.roundRect(100, 12, 850, 28, 6); else ctx.fillRect(100, 12, 850, 28);
  ctx.fill();
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('🛡️ [DOOMWIRE ISOLATED SANDBOX] -> ' + (url || 'https://cnn.com'), 120, 31);

  // Status Badge
  ctx.fillStyle = '#00f0ff';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('ACTIVE FIREWALL DEFENSE', 980, 31);

  // Main Page Content Area (Sanitized Wireframe)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(50, 80, 730, 220);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(50, 80, 730, 220);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('DOM PURIFIED: REAL-TIME SURVEILLANCE STRIPPED', 80, 130);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('DoomWire isolated chromium worker captured and sanitized third-party network probes.', 80, 165);
  ctx.fillText('All cross-site tracking scripts, canvas fingerprinters, and cookie syncs were intercepted.', 80, 190);
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('STATUS: ZERO IDENTITY EXFILTRATION TO AD-EXCHANGES', 80, 240);

  // Ad and Surveillance Slots
  const slots = [
    { name: 'doubleclick.net [RTB Auctioneer]', domain: 'doubleclick.net', x: 810, y: 80, w: 340, h: 220 },
    { name: 'criteo.net [Behavioral Retargeting]', domain: 'criteo.net', x: 810, y: 320, w: 340, h: 320 },
    { name: 'outbrain.com [Clickstream Harvester]', domain: 'outbrain.com', x: 50, y: 320, w: 730, h: 140 },
    { name: 'tiktok.com [Cross-Site Pixel]', domain: 'tiktok.com', x: 50, y: 480, w: 730, h: 160 }
  ];

  slots.forEach((s) => {
    const isSev = severedSet.has(s.domain);
    const isPois = poisonedSet.has(s.domain);

    ctx.fillStyle = isSev ? 'rgba(239, 68, 68, 0.12)' : isPois ? 'rgba(192, 132, 252, 0.15)' : 'rgba(30, 41, 59, 0.7)';
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = isSev ? '#ef4444' : isPois ? '#c084fc' : '#475569';
    ctx.strokeRect(s.x, s.y, s.w, s.h);

    ctx.fillStyle = isSev ? '#ef4444' : isPois ? '#c084fc' : '#f87171';
    ctx.font = 'bold 12px monospace';
    const label = isSev ? '✂ SEVERED WIRE // NETWORK PACKET DROPPED' : isPois ? '☠ POISONED // DIFFERENTIAL NOISE INJECTED' : '⚠ SURVEILLANCE BEACON IDENTIFIED';
    ctx.fillText(label, s.x + 16, s.y + 32);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px monospace';
    ctx.fillText('Target: ' + s.name, s.x + 16, s.y + 55);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    const sub = isSev ? 'Connection sinkholed by DoomWire DNS firewall.' : isPois ? 'Fingerprint replaced with high-entropy cryptographic noise.' : 'Active exfiltration vector monitored on 3D radar.';
    ctx.fillText(sub, s.x + 16, s.y + 78);
  });

  return canvas.toDataURL('image/png');
};

// Web Audio Tactical Synthesizer
class TacticalAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playBlip(freq = 650, duration = 0.05) {
    if (this.muted || !this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  playSever() {
    if (this.muted || !this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(750, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch (e) {}
  }

  playPoison() {
    if (this.muted || !this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(900, this.ctx.currentTime + 0.12);
      osc.frequency.linearRampToValueAtTime(400, this.ctx.currentTime + 0.26);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.26);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.26);
    } catch (e) {}
  }
}

const audioFX = new TacticalAudio();

export default function App() {
  const [currentThemeKey, setCurrentThemeKey] = useState('CYBER_CYAN');
  const currentTheme = THEMES[currentThemeKey];

  const [socketConnected, setSocketConnected] = useState(false);
  const [targetUrl, setTargetUrl] = useState('https://cnn.com');
  const [scanStatus, setScanStatus] = useState('STANDBY // PERIMETER READY');
  const [isScanning, setIsScanning] = useState(false);
  const [arcs, setArcs] = useState([]);
  const [packets, setPackets] = useState([]);
  const [selectedPacket, setSelectedPacket] = useState(null);
  const [filterMode, setFilterMode] = useState('ALL');
  const [blockedDomains, setBlockedDomains] = useState(new Set());
  const [poisonedDomains, setPoisonedDomains] = useState(new Set());
  const [safeViewImg, setSafeViewImg] = useState(null);
  const [showSafeViewModal, setShowSafeViewModal] = useState(false);
  const [showInspectorModal, setShowInspectorModal] = useState(false);
  const [showJudgesModal, setShowJudgesModal] = useState(false);
  const [judgesTab, setJudgesTab] = useState('PITCH');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [muted, setMuted] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const simTimerRef = useRef(null);

  // Client User location coordinates
  const [userLocation, setUserLocation] = useState({ lat: 13.0827, lng: 80.2707, city: 'Command Terminal' });

  const globeRef = useRef();
  const globeContainerRef = useRef();
  const [globeDimensions, setGlobeDimensions] = useState({ width: window.innerWidth, height: window.innerHeight - 120 });
  const socketRef = useRef(null);

  // Cycle through 3 dark aesthetic themes
  const cycleTheme = () => {
    audioFX.init();
    const themeKeys = Object.keys(THEMES);
    const nextIdx = (themeKeys.indexOf(currentThemeKey) + 1) % themeKeys.length;
    const nextKey = themeKeys[nextIdx];
    setCurrentThemeKey(nextKey);
    audioFX.playBlip(nextKey === 'CYBER_CYAN' ? 800 : nextKey === 'VOID_PURPLE' ? 950 : 620, 0.08);
  };

  // Location detection
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            city: 'Origin Terminal (You)'
          });
        },
        () => {
          setUserLocation({ lat: 13.0827, lng: 80.2707, city: 'Origin Base' });
        }
      );
    }
  }, []);

  // Responsive Globe Container Resizing
  useEffect(() => {
    const handleResize = () => {
      if (globeContainerRef.current) {
        setGlobeDimensions({
          width: globeContainerRef.current.clientWidth,
          height: globeContainerRef.current.clientHeight
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarCollapsed]);

  // OrbitControls setup with full Pan & Zoom
  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = autoRotate;
        controls.autoRotateSpeed = 0.55;
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.enableZoom = true;
        controls.zoomSpeed = 1.3;
        controls.enablePan = true;
        controls.panSpeed = 1.3;
      }
    }
  }, [autoRotate]);

  // Socket.io Connection & Events
  useEffect(() => {
    const s = io(SOCKET_SERVER_URL, {
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });
    socketRef.current = s;

    s.on('connect', () => {
      setSocketConnected(true);
    });

    s.on('disconnect', () => {
      setSocketConnected(false);
    });

    s.on('state_sync', ({ blockedDomains: blocked, poisonedDomains: poisoned }) => {
      setBlockedDomains(new Set(blocked));
      setPoisonedDomains(new Set(poisoned));
    });

    s.on('packet_captured', (pkt) => {
      audioFX.playBlip(pkt.threatLevel === 'red' ? 920 : 580, 0.04);

      const isSevered = blockedDomains.has(pkt.domain);
      const isPoisoned = poisonedDomains.has(pkt.domain);

      let arcColor = '#00ff88';
      if (isSevered) {
        arcColor = 'rgba(255, 0, 85, 0.2)';
      } else if (isPoisoned) {
        arcColor = '#c084fc';
      } else if (pkt.threatLevel === 'red') {
        arcColor = '#ff0055';
      } else if (pkt.threatLevel === 'orange') {
        arcColor = '#ff7700';
      } else if (pkt.threatLevel === 'yellow') {
        arcColor = '#fbbf24';
      }

      const newArc = {
        id: pkt.id,
        domain: pkt.domain,
        company: pkt.company,
        startLat: userLocation.lat,
        startLng: userLocation.lng,
        endLat: pkt.geo.lat,
        endLng: pkt.geo.lng,
        color: arcColor,
        threatLevel: pkt.threatLevel,
        isSevered,
        isPoisoned,
        ...pkt
      };

      setArcs((prev) => {
        const filtered = prev.filter((a) => a.id !== newArc.id);
        return [...filtered.slice(-55), newArc];
      });

      setPackets((prev) => [newArc, ...prev.slice(0, 90)]);
    });

    s.on('scan_status', ({ status }) => {
      setScanStatus(status);
    });

    s.on('scan_complete', ({ safeViewImage }) => {
      setScanStatus('RECON FINISHED // PERIMETER LOCKED');
      setIsScanning(false);
      if (safeViewImage) setSafeViewImg(safeViewImage);
    });

    s.on('scan_error', ({ error }) => {
      setScanStatus(`RECON ERROR: ${error}`);
      setIsScanning(false);
    });

    // Wire Cut
    s.on('wire_cut', ({ domain }) => {
      audioFX.playSever();
      setBlockedDomains((prev) => new Set([...prev, domain]));
      setPoisonedDomains((prev) => {
        const next = new Set(prev);
        next.delete(domain);
        return next;
      });
      setArcs((prev) => prev.filter((a) => a.domain !== domain));
      setPackets((prev) =>
        prev.map((p) => (p.domain === domain ? { ...p, isSevered: true, isPoisoned: false } : p))
      );
    });

    // Wire Poisoned
    s.on('wire_poisoned', ({ domain }) => {
      audioFX.playPoison();
      setPoisonedDomains((prev) => new Set([...prev, domain]));
      setBlockedDomains((prev) => {
        const next = new Set(prev);
        next.delete(domain);
        return next;
      });
      setArcs((prev) =>
        prev.map((a) => (a.domain === domain ? { ...a, color: '#c084fc', isPoisoned: true, isSevered: false } : a))
      );
      setPackets((prev) =>
        prev.map((p) => (p.domain === domain ? { ...p, isPoisoned: true, isSevered: false } : p))
      );
    });

    // All Wires Cut
    s.on('all_wires_cut', ({ domains }) => {
      audioFX.playSever();
      setBlockedDomains((prev) => new Set([...prev, ...domains]));
      setPoisonedDomains((prev) => {
        const next = new Set(prev);
        domains.forEach((d) => next.delete(d));
        return next;
      });
      setArcs((prev) => prev.filter((a) => !domains.includes(a.domain)));
      setPackets((prev) =>
        prev.map((p) => (domains.includes(p.domain) ? { ...p, isSevered: true, isPoisoned: false } : p))
      );
    });

    // All Wires Poisoned
    s.on('all_wires_poisoned', ({ domains }) => {
      audioFX.playPoison();
      setPoisonedDomains((prev) => new Set([...prev, ...domains]));
      setBlockedDomains((prev) => {
        const next = new Set(prev);
        domains.forEach((d) => next.delete(d));
        return next;
      });
      setArcs((prev) =>
        prev.map((a) => (domains.includes(a.domain) ? { ...a, color: '#c084fc', isPoisoned: true, isSevered: false } : a))
      );
      setPackets((prev) =>
        prev.map((p) => (domains.includes(p.domain) ? { ...p, isPoisoned: true, isSevered: false } : p))
      );
    });

    s.on('wire_restored', ({ domain }) => {
      setBlockedDomains((prev) => {
        const next = new Set(prev);
        next.delete(domain);
        return next;
      });
      setPoisonedDomains((prev) => {
        const next = new Set(prev);
        next.delete(domain);
        return next;
      });
      setPackets((prev) =>
        prev.map((p) => (p.domain === domain ? { ...p, isPoisoned: false, isSevered: false } : p))
      );
    });

    s.on('rules_cleared', () => {
      setBlockedDomains(new Set());
      setPoisonedDomains(new Set());
    });

    return () => {
      s.disconnect();
    };
  }, [userLocation]);

  const toggleMute = () => {
    audioFX.init();
    audioFX.muted = !muted;
    setMuted(!muted);
  };

  const handleStartScan = (e) => {
    if (e) e.preventDefault();
    if (!targetUrl.trim() || isScanning) return;
    audioFX.init();
    audioFX.playBlip(780, 0.08);

    if (simTimerRef.current) clearInterval(simTimerRef.current);

    setArcs([]);
    setPackets([]);
    setSelectedPacket(null);
    setSafeViewImg(null);
    setIsScanning(true);

    if (socketConnected && socketRef.current) {
      setScanStatus('LAUNCHING ISOLATED CHROMIUM RECON (LIVE WORKER)...');
      socketRef.current.emit('scan_url', { url: targetUrl, userLocation });
    } else {
      // Offline / Demo Simulated Telemetry Recon Pipeline
      setScanStatus('LAUNCHING ISOLATED CHROMIUM RECON (SIMULATED TELEMETRY)...');
      let beaconIndex = 0;

      simTimerRef.current = setInterval(() => {
        if (beaconIndex >= SIMULATED_BEACONS.length) {
          clearInterval(simTimerRef.current);
          simTimerRef.current = null;
          setScanStatus('RECON FINISHED // PERIMETER LOCKED');
          setIsScanning(false);
          const safeImg = generateSimulatedSafeView(targetUrl, blockedDomains, poisonedDomains);
          if (safeImg) setSafeViewImg(safeImg);
          audioFX.playBlip(980, 0.15);
          return;
        }

        const b = SIMULATED_BEACONS[beaconIndex];
        beaconIndex++;

        audioFX.playBlip(b.threatLevel === 'red' ? 920 : 580, 0.04);
        const isSevered = blockedDomains.has(b.domain);
        const isPoisoned = poisonedDomains.has(b.domain);

        let arcColor = '#00ff88';
        if (isSevered) {
          arcColor = 'rgba(255, 0, 85, 0.2)';
        } else if (isPoisoned) {
          arcColor = '#c084fc';
        } else if (b.threatLevel === 'red') {
          arcColor = '#ff0055';
        } else if (b.threatLevel === 'orange') {
          arcColor = '#ff7700';
        } else if (b.threatLevel === 'yellow') {
          arcColor = '#fbbf24';
        }

        const newPkt = {
          id: `sim-${beaconIndex}-${Date.now()}`,
          domain: b.domain,
          company: b.company,
          city: b.city,
          ip: b.ip,
          threatLevel: b.threatLevel,
          trackerType: b.trackerType,
          leakedData: b.leakedData,
          startLat: userLocation.lat,
          startLng: userLocation.lng,
          endLat: b.geo.lat,
          endLng: b.geo.lng,
          color: arcColor,
          geo: b.geo,
          isSevered,
          isPoisoned
        };

        if (!isSevered) {
          setArcs((prev) => [...prev.slice(-50), newPkt]);
        }
        setPackets((prev) => [newPkt, ...prev.slice(0, 90)]);
      }, 300);
    }
  };

  const applyPreset = (url) => {
    setTargetUrl(url);
    if (!isScanning) {
      setTimeout(() => {
        setArcs([]);
        setPackets([]);
        setSelectedPacket(null);
        setIsScanning(true);
        if (socketConnected && socketRef.current) {
          socketRef.current.emit('scan_url', { url, userLocation });
        } else {
          handleStartScan();
        }
      }, 50);
    }
  };

  const selectAndFocusPacket = (pkt) => {
    setSelectedPacket(pkt);
    setShowInspectorModal(true);
    if (globeRef.current && pkt.geo?.lat !== undefined && pkt.geo?.lng !== undefined) {
      globeRef.current.pointOfView(
        {
          lat: pkt.geo.lat,
          lng: pkt.geo.lng,
          altitude: 1.8
        },
        700
      );
    }
  };

  const cutTheWire = (domain) => {
    audioFX.playSever();
    if (socketConnected && socketRef.current) {
      socketRef.current.emit('cut_wire', domain);
    }
    const nextBlocked = new Set([...blockedDomains, domain]);
    setBlockedDomains(nextBlocked);
    setPoisonedDomains((prev) => {
      const next = new Set(prev);
      next.delete(domain);
      return next;
    });
    setArcs((prev) => prev.filter((a) => a.domain !== domain));
    setPackets((prev) =>
      prev.map((p) => (p.domain === domain ? { ...p, isSevered: true, isPoisoned: false } : p))
    );
    if (selectedPacket?.domain === domain) {
      setSelectedPacket((prev) => ({ ...prev, isSevered: true, isPoisoned: false }));
    }
    const safeImg = generateSimulatedSafeView(targetUrl, nextBlocked, poisonedDomains);
    if (safeImg) setSafeViewImg(safeImg);
  };

  const poisonTheWire = (domain) => {
    audioFX.playPoison();
    if (socketConnected && socketRef.current) {
      socketRef.current.emit('poison_wire', domain);
    }
    const nextPoisoned = new Set([...poisonedDomains, domain]);
    setPoisonedDomains(nextPoisoned);
    setBlockedDomains((prev) => {
      const next = new Set(prev);
      next.delete(domain);
      return next;
    });
    setArcs((prev) =>
      prev.map((a) => (a.domain === domain ? { ...a, color: '#c084fc', isPoisoned: true, isSevered: false } : a))
    );
    setPackets((prev) =>
      prev.map((p) => (p.domain === domain ? { ...p, isPoisoned: true, isSevered: false } : p))
    );
    if (selectedPacket?.domain === domain) {
      setSelectedPacket((prev) => ({ ...prev, isPoisoned: true, isSevered: false }));
    }
    const safeImg = generateSimulatedSafeView(targetUrl, blockedDomains, nextPoisoned);
    if (safeImg) setSafeViewImg(safeImg);
  };

  const restoreWire = (domain) => {
    audioFX.playBlip(600, 0.05);
    if (socketConnected && socketRef.current) {
      socketRef.current.emit('restore_wire', domain);
    }
    const nextBlocked = new Set(blockedDomains);
    nextBlocked.delete(domain);
    setBlockedDomains(nextBlocked);
    const nextPoisoned = new Set(poisonedDomains);
    nextPoisoned.delete(domain);
    setPoisonedDomains(nextPoisoned);
    setPackets((prev) =>
      prev.map((p) => (p.domain === domain ? { ...p, isPoisoned: false, isSevered: false } : p))
    );
    if (selectedPacket?.domain === domain) {
      setSelectedPacket((prev) => ({ ...prev, isSevered: false, isPoisoned: false }));
    }
    const safeImg = generateSimulatedSafeView(targetUrl, nextBlocked, nextPoisoned);
    if (safeImg) setSafeViewImg(safeImg);
  };

  const cutAllTrackers = () => {
    audioFX.playSever();
    const trackerDomains = packets
      .filter((p) => p.threatLevel !== 'green')
      .map((p) => p.domain);
    const unique = Array.from(new Set(trackerDomains));
    if (unique.length > 0) {
      if (socketConnected && socketRef.current) {
        socketRef.current.emit('cut_all', { domains: unique });
      }
      const newBlocked = new Set([...blockedDomains, ...unique]);
      setBlockedDomains(newBlocked);
      const newPoisoned = new Set(poisonedDomains);
      unique.forEach((d) => newPoisoned.delete(d));
      setPoisonedDomains(newPoisoned);
      setArcs((prev) => prev.filter((a) => !unique.includes(a.domain)));
      setPackets((prev) =>
        prev.map((p) => (unique.includes(p.domain) ? { ...p, isSevered: true, isPoisoned: false } : p))
      );
      const safeImg = generateSimulatedSafeView(targetUrl, newBlocked, newPoisoned);
      if (safeImg) setSafeViewImg(safeImg);
    }
  };

  const poisonAllTrackers = () => {
    audioFX.playPoison();
    const trackerDomains = packets
      .filter((p) => p.threatLevel !== 'green')
      .map((p) => p.domain);
    const unique = Array.from(new Set(trackerDomains));
    if (unique.length > 0) {
      if (socketConnected && socketRef.current) {
        socketRef.current.emit('poison_all', { domains: unique });
      }
      const newPoisoned = new Set([...poisonedDomains, ...unique]);
      setPoisonedDomains(newPoisoned);
      const newBlocked = new Set(blockedDomains);
      unique.forEach((d) => newBlocked.delete(d));
      setBlockedDomains(newBlocked);
      setArcs((prev) =>
        prev.map((a) => (unique.includes(a.domain) ? { ...a, color: '#c084fc', isPoisoned: true, isSevered: false } : a))
      );
      setPackets((prev) =>
        prev.map((p) => (unique.includes(p.domain) ? { ...p, isPoisoned: true, isSevered: false } : p))
      );
      const safeImg = generateSimulatedSafeView(targetUrl, newBlocked, newPoisoned);
      if (safeImg) setSafeViewImg(safeImg);
    }
  };

  const exportSecurityAuditReport = () => {
    audioFX.playBlip(820, 0.06);
    const threatCount = packets.filter((p) => p.threatLevel === 'red' || p.threatLevel === 'orange').length;
    const privacyScore = Math.max(5, 100 - threatCount * 12);

    const reportData = {
      system: 'DoomWire Active Privacy Firewall & Tactical Cyber-Radar',
      author: 'Arnav (arnavsrivastava98765-oss)',
      targetUrl,
      timestamp: new Date().toISOString(),
      privacyRatingScore: `${privacyScore}/100`,
      overallAssessment: threatCount > 4 ? 'CRITICAL SURVEILLANCE RISK' : threatCount > 0 ? 'MODERATE TRACKING EXPOSURE' : 'MINIMAL THREAT',
      metrics: {
        totalInterceptedBeacons: packets.length,
        highRiskSurveillanceVectors: threatCount,
        severedWires: blockedDomains.size,
        poisonedFeeds: poisonedDomains.size
      },
      severedDomains: Array.from(blockedDomains),
      poisonedDomains: Array.from(poisonedDomains),
      interceptedVectors: packets.map((p) => ({
        domain: p.domain,
        company: p.company,
        city: p.city,
        ip: p.ip,
        threatLevel: p.threatLevel,
        status: blockedDomains.has(p.domain) || p.isSevered ? 'SEVERED' : poisonedDomains.has(p.domain) || p.isPoisoned ? 'POISONED' : 'ACTIVE_LEAK',
        leakedData: p.leakedData || []
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doomwire-audit-${targetUrl.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Camera Controls
  const zoomIn = () => {
    if (!globeRef.current) return;
    const { lat, lng, altitude } = globeRef.current.pointOfView();
    globeRef.current.pointOfView({ lat, lng, altitude: Math.max(0.6, altitude * 0.72) }, 350);
  };

  const zoomOut = () => {
    if (!globeRef.current) return;
    const { lat, lng, altitude } = globeRef.current.pointOfView();
    globeRef.current.pointOfView({ lat, lng, altitude: Math.min(4.5, altitude * 1.35) }, 350);
  };

  const shiftUp = () => {
    if (!globeRef.current) return;
    const { lat, lng, altitude } = globeRef.current.pointOfView();
    globeRef.current.pointOfView({ lat: Math.min(84, lat + 16), lng, altitude }, 350);
  };

  const shiftDown = () => {
    if (!globeRef.current) return;
    const { lat, lng, altitude } = globeRef.current.pointOfView();
    globeRef.current.pointOfView({ lat: Math.max(-84, lat - 16), lng, altitude }, 350);
  };

  const shiftLeft = () => {
    if (!globeRef.current) return;
    const { lat, lng, altitude } = globeRef.current.pointOfView();
    globeRef.current.pointOfView({ lat, lng: lng - 25, altitude }, 350);
  };

  const shiftRight = () => {
    if (!globeRef.current) return;
    const { lat, lng, altitude } = globeRef.current.pointOfView();
    globeRef.current.pointOfView({ lat, lng: lng + 25, altitude }, 350);
  };

  const resetCamera = () => {
    if (!globeRef.current) return;
    globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 550);
  };

  // Target impact radar rings
  const ringsData = useMemo(() => {
    return arcs.map((arc) => ({
      lat: arc.endLat,
      lng: arc.endLng,
      maxR: 3.5,
      propagationSpeed: 2.2,
      repeatPeriod: 1200,
      color: arc.isPoisoned ? '#c084fc' : arc.color
    }));
  }, [arcs]);

  // Real-time server labels mapped directly onto 3D Earth
  const labelsData = useMemo(() => {
    const seen = new Set();
    const result = [];
    packets.forEach((p) => {
      const key = `${p.geo.lat}_${p.geo.lng}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({
          lat: p.geo.lat,
          lng: p.geo.lng,
          text: `${p.company} (${p.city})`,
          size: 0.9,
          color: p.isPoisoned ? '#c084fc' : p.threatLevel === 'red' ? '#ff0055' : currentTheme.primary,
          packet: p
        });
      }
    });
    return result;
  }, [packets, currentTheme]);

  // Filtered Packets
  const filteredPackets = useMemo(() => {
    if (filterMode === 'THREATS') {
      return packets.filter((p) => p.threatLevel !== 'green');
    }
    if (filterMode === 'SEVERED') {
      return packets.filter((p) => p.isSevered || blockedDomains.has(p.domain));
    }
    if (filterMode === 'POISONED') {
      return packets.filter((p) => p.isPoisoned || poisonedDomains.has(p.domain));
    }
    return packets;
  }, [packets, filterMode, blockedDomains, poisonedDomains]);

  // Metrics
  const stats = useMemo(() => {
    const total = packets.length;
    const threats = packets.filter((p) => p.threatLevel === 'red' || p.threatLevel === 'orange').length;
    const severedCount = blockedDomains.size;
    const poisonedCount = poisonedDomains.size;
    return { total, threats, severedCount, poisonedCount };
  }, [packets, blockedDomains, poisonedDomains]);

  const activeDestination = selectedPacket || packets[0] || null;

  return (
    <div
      data-theme={currentThemeKey}
      className="flex flex-col h-screen w-screen text-slate-100 overflow-hidden font-mono select-none relative deep-space-canvas"
    >
      <div className="scanline"></div>

      {/* 1. TOP HEADER: Tactical HUD Navigation & by-Arnavvv Signature */}
      <header className="h-14 tactical-panel z-30 flex items-center justify-between px-4 border-b border-cyan-500/25 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/60 border shadow-lg transition-all"
            style={{
              borderColor: currentTheme.primary,
              boxShadow: `0 0 14px ${currentTheme.primaryGlow}`
            }}
          >
            <ShieldAlert className="w-4 h-4 animate-pulse" style={{ color: currentTheme.primary }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1
                className="text-sm md:text-base font-extrabold tracking-wider font-sans text-transparent bg-clip-text"
                style={{
                  backgroundImage: `linear-gradient(to right, ${currentTheme.primary}, #ffffff, ${currentTheme.secondary})`
                }}
              >
                DOOMWIRE
              </h1>
              <span
                className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border font-mono font-bold"
                style={{
                  borderColor: currentTheme.primary,
                  color: currentTheme.primary,
                  background: 'rgba(0,0,0,0.5)'
                }}
              >
                {currentTheme.tag}
              </span>
            </div>
            {/* User Custom Signature: by-Arnavvv */}
            <div
              className="text-[10px] tracking-wider font-mono flex items-center gap-1 font-bold"
              style={{ color: currentTheme.primary }}
            >
              <span>by-Arnavvv</span>
              <span className="text-slate-500 text-[8px] font-sans">• ACTIVE 3D CYBER-RADAR</span>
            </div>
          </div>
        </div>

        {/* Recon Target Bar */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleStartScan} className="flex items-center gap-2">
            <div className="relative flex items-center">
              <Crosshair className="absolute left-2.5 w-3.5 h-3.5" style={{ color: currentTheme.primary }} />
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-56 md:w-72 bg-black/70 border text-xs px-3 py-1 pl-8 rounded text-slate-200 focus:outline-none transition font-mono"
                style={{
                  borderColor: currentTheme.primary,
                  boxShadow: `0 0 10px ${currentTheme.primaryGlow}`
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isScanning}
              className="px-3 py-1 rounded text-xs font-bold tracking-wider flex items-center gap-1.5 transition text-slate-950 shadow-lg"
              style={{
                backgroundImage: `linear-gradient(to right, ${currentTheme.primary}, ${currentTheme.secondary})`
              }}
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin text-slate-950" />
                  SCANNING...
                </>
              ) : (
                <>
                  <Zap className="w-3 h-3" />
                  SCAN TARGET
                </>
              )}
            </button>
          </form>

          {/* Quick Targets */}
          <div className="hidden xl:flex items-center gap-1 border-l border-slate-800 pl-2">
            {['cnn.com', 'nytimes.com', 'reddit.com', 'forbes.com'].map((domain) => (
              <button
                key={domain}
                onClick={() => applyPreset(`https://${domain}`)}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 hover:text-cyan-300 transition text-slate-400"
              >
                {domain}
              </button>
            ))}
          </div>
        </div>

        {/* Tactical Controls & 3-Theme Aesthetic Switcher Button */}
        <div className="flex items-center gap-2">
          {/* Judges Guide & Technical Pitch Deck Button */}
          <button
            onClick={() => setShowJudgesModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-bold transition shadow-lg hover:scale-105 active:scale-95 text-amber-300 border-amber-500/50 bg-amber-950/40 hover:bg-amber-900/50"
            style={{
              boxShadow: '0 0 12px rgba(245, 158, 11, 0.25)'
            }}
            title="Open Judges Technical Pitch Deck & Full Architecture Documentation"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] tracking-wider hidden md:inline">JUDGES GUIDE</span>
          </button>

          {/* Export Security Incident Audit Report */}
          <button
            onClick={exportSecurityAuditReport}
            className="flex items-center gap-1 px-2 py-1 rounded border border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white hover:border-slate-500 text-xs transition font-bold"
            title="Export Incident Audit Log as JSON"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] hidden lg:inline">AUDIT</span>
          </button>

          {/* Theme Switcher Button */}
          <button
            onClick={cycleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-bold transition shadow-lg hover:scale-105 active:scale-95"
            style={{
              borderColor: currentTheme.primary,
              color: currentTheme.primary,
              background: 'rgba(0,0,0,0.6)',
              boxShadow: `0 0 12px ${currentTheme.primaryGlow}`
            }}
            title="Click to Switch Aesthetic Dark Themes (Cyber Cyan, Void Purple, Matrix Emerald)"
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="text-[10px] tracking-wider hidden sm:inline">{currentTheme.name}</span>
          </button>

          {safeViewImg && (
            <button
              onClick={() => setShowSafeViewModal(true)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/40 text-xs transition font-bold"
            >
              <Eye className="w-3.5 h-3.5" />
              SAFE-ROOM
            </button>
          )}

          <button
            onClick={toggleMute}
            className="p-1 rounded bg-slate-900/70 border border-slate-800 text-slate-400 hover:text-cyan-300 transition"
            title={muted ? 'Unmute Cyber Audio' : 'Mute Audio'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" style={{ color: currentTheme.primary }} />}
          </button>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 rounded bg-slate-900/70 border border-slate-800 text-slate-400 hover:text-cyan-300 transition"
            title={sidebarCollapsed ? 'Expand Feed' : 'Collapse Feed'}
          >
            <Sliders className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{
                backgroundColor: socketConnected ? currentTheme.primary : '#38bdf8',
                boxShadow: `0 0 8px ${socketConnected ? currentTheme.primary : 'rgba(56, 189, 248, 0.6)'}`
              }}
            ></span>
            <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">
              {socketConnected ? 'LIVE WORKER' : 'SIMULATION MODE'}
            </span>
          </div>
        </div>
      </header>

      {/* 2. MAIN CENTER AREA: Feed + Realistic Space 3D Globe */}
      <div className="flex-1 relative flex overflow-hidden w-full">
        
        {/* LEFT SIDEBAR: Live Packet Feed */}
        {!sidebarCollapsed && (
          <aside className="w-72 md:w-80 tactical-panel border-r border-cyan-500/20 flex flex-col z-20 h-full flex-shrink-0">
            <div className="p-3 border-b border-slate-800/80 bg-black/50">
              <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">
                <span className="flex items-center gap-1 font-bold" style={{ color: currentTheme.primary }}>
                  <Radio className="w-3 h-3 animate-spin" /> STATUS
                </span>
                <span className="truncate max-w-[150px] text-slate-300">{scanStatus}</span>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-4 gap-1.5 text-center mt-2">
                <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800/80">
                  <div className="text-[8px] text-slate-500 uppercase">Packets</div>
                  <div className="font-bold text-xs" style={{ color: currentTheme.primary }}>{stats.total}</div>
                </div>
                <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800/80">
                  <div className="text-[8px] text-slate-500 uppercase">Threats</div>
                  <div className="text-red-400 font-bold text-xs">{stats.threats}</div>
                </div>
                <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800/80">
                  <div className="text-[8px] text-slate-500 uppercase">Severed</div>
                  <div className="text-orange-400 font-bold text-xs">{stats.severedCount}</div>
                </div>
                <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800/80">
                  <div className="text-[8px] text-slate-500 uppercase">Poisoned</div>
                  <div className="text-purple-400 font-bold text-xs">{stats.poisonedCount}</div>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/80 bg-slate-950/60 text-[9px]">
              <div className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Activity className="w-3 h-3" style={{ color: currentTheme.primary }} />
                STREAM ({filteredPackets.length})
              </div>
              <div className="flex gap-1">
                {['ALL', 'THREATS', 'SEVERED', 'POISONED'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFilterMode(mode)}
                    className={`px-1.5 py-0.5 rounded font-bold transition ${
                      filterMode === mode
                        ? 'border text-white'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                    style={
                      filterMode === mode
                        ? {
                            borderColor: currentTheme.primary,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            color: currentTheme.primary
                          }
                        : {}
                    }
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Packet Stream List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {filteredPackets.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-center text-slate-500 text-xs px-4">
                  <Terminal className="w-7 h-7 mb-2 text-slate-700" />
                  <span>No packets captured.</span>
                  <span className="text-[10px] text-slate-600 mt-1">Enter a URL & click 'SCAN TARGET'</span>
                </div>
              ) : (
                filteredPackets.map((pkt, idx) => {
                  const isSelected = selectedPacket?.id === pkt.id;
                  const isSevered = pkt.isSevered || blockedDomains.has(pkt.domain);
                  const isPoisoned = pkt.isPoisoned || poisonedDomains.has(pkt.domain);

                  return (
                    <div
                      key={pkt.id || idx}
                      onClick={() => selectAndFocusPacket(pkt)}
                      className={`p-2 rounded border cursor-pointer transition relative group ${
                        isSelected
                          ? 'border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                          : isSevered
                          ? 'bg-red-950/15 border-red-900/35 hover:border-red-500/50 opacity-70'
                          : isPoisoned
                          ? 'bg-purple-950/20 border-purple-800/40 hover:border-purple-500/60'
                          : 'bg-slate-950/70 border-slate-800/80 hover:border-cyan-500/40'
                      }`}
                      style={
                        isSelected
                          ? {
                              backgroundColor: 'rgba(0,0,0,0.7)',
                              borderColor: currentTheme.primary,
                              boxShadow: `0 0 12px ${currentTheme.primaryGlow}`
                            }
                          : {}
                      }
                    >
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[11px] font-bold text-slate-200 truncate group-hover:text-cyan-300 transition">
                          {pkt.domain}
                        </span>
                        <div>
                          {isSevered ? (
                            <span className="badge-threat-red text-[8px] font-bold px-1 py-0.2 rounded uppercase">
                              SEVERED
                            </span>
                          ) : isPoisoned ? (
                            <span className="badge-threat-purple text-[8px] font-bold px-1 py-0.2 rounded uppercase">
                              POISONED
                            </span>
                          ) : (
                            <span
                              className={`text-[8px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                pkt.threatLevel === 'red'
                                  ? 'badge-threat-red'
                                  : pkt.threatLevel === 'orange'
                                  ? 'badge-threat-orange'
                                  : pkt.threatLevel === 'yellow'
                                  ? 'badge-threat-yellow'
                                  : 'badge-threat-green'
                              }`}
                            >
                              {pkt.threatLevel}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="truncate max-w-[140px]">{pkt.company}</span>
                        <span className="text-slate-500 font-sans">{pkt.city}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}

        {/* CENTER 3D HARD GRAPHICS GLOBE: NASA Night Lights + Country Glows */}
        <main ref={globeContainerRef} className="flex-1 relative h-full w-full overflow-hidden flex items-center justify-center">
          <Globe
            ref={globeRef}
            width={globeDimensions.width}
            height={globeDimensions.height}
            // Ultra-realistic NASA Earth Night Lights with country glows
            globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"
            bumpImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png"
            backgroundImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png"
            showAtmosphere={true}
            atmosphereColor={currentTheme.atmosphere}
            atmosphereAltitude={0.24}
            // Laser Arcs
            arcsData={arcs}
            arcStartLat="startLat"
            arcStartLng="startLng"
            arcEndLat="endLat"
            arcEndLng="endLng"
            arcColor="color"
            arcDashLength={0.45}
            arcDashGap={0.2}
            arcDashAnimateTime={1300}
            arcStroke={0.65}
            arcAltitudeAutoScale={0.45}
            onArcClick={(arc) => selectAndFocusPacket(arc)}
            // Animated impact radar rings
            ringsData={ringsData}
            ringColor={(d) => d.color}
            ringMaxRadius={(d) => d.maxR}
            ringPropagationSpeed={(d) => d.propagationSpeed}
            ringRepeatPeriod={(d) => d.repeatPeriod}
            // 3D Server Destination Labels
            labelsData={labelsData}
            labelLat="lat"
            labelLng="lng"
            labelText="text"
            labelSize={1.1}
            labelDotRadius={0.4}
            labelColor="color"
            onLabelClick={(label) => selectAndFocusPacket(label.packet)}
          />

          {/* Theme Indicator & Spectrum (Top-Right HUD Overlay) */}
          <div className="absolute top-4 right-4 tactical-panel p-2.5 rounded-lg border text-xs backdrop-blur-md shadow-2xl z-10 max-w-[210px]">
            <div className="text-[9px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: currentTheme.primary }}>
              <Layers className="w-3 h-3" />
              SURVEILLANCE SPECTRUM
            </div>
            <div className="space-y-1 text-[10px]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_6px_#00ff88]"></span>
                <span className="text-slate-300">Clean Content</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#fbbf24] shadow-[0_0_6px_#fbbf24]"></span>
                <span className="text-slate-300">Ad / Profiler</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ff7700] shadow-[0_0_6px_#ff7700]"></span>
                <span className="text-slate-300">Session Replay</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ff0055] shadow-[0_0_6px_#ff0055]"></span>
                <span className="text-slate-300">Malicious/FP</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#c084fc] shadow-[0_0_6px_#c084fc]"></span>
                <span className="text-purple-300 font-bold">Poisoned Decoy</span>
              </div>
            </div>
          </div>

          {/* On-Screen Camera Navigation Pod */}
          <div className="absolute right-4 top-48 tactical-panel p-1.5 rounded-lg border flex flex-col gap-1 z-10 shadow-xl">
            <button
              onClick={zoomIn}
              className="p-1.5 rounded hover:bg-white/10 text-slate-300 transition"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={zoomOut}
              className="p-1.5 rounded hover:bg-white/10 text-slate-300 transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="w-full h-px bg-slate-800 my-0.5"></div>
            <button
              onClick={shiftUp}
              className="p-1.5 rounded hover:bg-white/10 text-slate-300 transition"
              title="Shift Up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <div className="flex gap-1">
              <button
                onClick={shiftLeft}
                className="p-1.5 rounded hover:bg-white/10 text-slate-300 transition"
                title="Shift Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={shiftRight}
                className="p-1.5 rounded hover:bg-white/10 text-slate-300 transition"
                title="Shift Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={shiftDown}
              className="p-1.5 rounded hover:bg-white/10 text-slate-300 transition"
              title="Shift Down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className="w-full h-px bg-slate-800 my-0.5"></div>
            <button
              onClick={resetCamera}
              className="p-1.5 rounded hover:bg-white/10 text-slate-300 transition"
              title="Reset Orbit"
            >
              <Compass className="w-4 h-4" style={{ color: currentTheme.primary }} />
            </button>
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className="p-1.5 rounded transition"
              style={{
                color: autoRotate ? currentTheme.primary : '#64748b',
                background: autoRotate ? 'rgba(0,0,0,0.5)' : 'transparent'
              }}
              title="Toggle Auto Rotation"
            >
              <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
            </button>
          </div>
        </main>

        {/* SLIDING PACKET X-RAY MODAL */}
        {showInspectorModal && selectedPacket && (
          <aside className="absolute right-0 top-0 bottom-0 w-80 md:w-96 tactical-panel-glow border-l p-5 z-30 flex flex-col justify-between shadow-2xl animate-slide-in-right overflow-y-auto">
            <div>
              <div className="flex justify-between items-center border-b pb-2.5 mb-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4" style={{ color: currentTheme.primary }} />
                  <h2 className="text-xs font-bold tracking-wider uppercase" style={{ color: currentTheme.primary }}>
                    PACKET X-RAY INSPECTOR
                  </h2>
                </div>
                <button
                  onClick={() => setShowInspectorModal(false)}
                  className="text-slate-400 hover:text-white font-bold text-sm transition p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* Destination Entity */}
                <div className="bg-black/70 p-3 rounded-lg border border-slate-800">
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">
                    Destination Surveillance Entity
                  </div>
                  <div className="text-sm font-bold text-slate-100 flex items-center justify-between">
                    <span>{selectedPacket.company}</span>
                    <span
                      className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        selectedPacket.threatLevel === 'red'
                          ? 'badge-threat-red'
                          : selectedPacket.threatLevel === 'orange'
                          ? 'badge-threat-orange'
                          : selectedPacket.threatLevel === 'yellow'
                          ? 'badge-threat-yellow'
                          : 'badge-threat-green'
                      }`}
                    >
                      {selectedPacket.threatLevel}
                    </span>
                  </div>
                  <div className="text-xs mt-1 truncate" style={{ color: currentTheme.primary }}>
                    {selectedPacket.domain}
                  </div>
                </div>

                {/* EXACT STORAGE LOCATION & COORDINATES */}
                <div
                  className="bg-black/70 p-3 rounded-lg border space-y-1.5 shadow-lg"
                  style={{
                    borderColor: currentTheme.primary,
                    boxShadow: `0 0 15px ${currentTheme.primaryGlow}`
                  }}
                >
                  <div className="text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: currentTheme.primary }}>
                    <MapPin className="w-3.5 h-3.5" style={{ color: currentTheme.primary }} />
                    EXACT SERVER DESTINATION & STORAGE
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Server City:</span>
                    <span className="font-bold text-slate-100">{selectedPacket.city}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Exact Coordinates:</span>
                    <span className="font-bold font-mono" style={{ color: currentTheme.primary }}>
                      {selectedPacket.geo?.lat?.toFixed(4)}°, {selectedPacket.geo?.lng?.toFixed(4)}°
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Tracking Vector:</span>
                    <span className="text-orange-400 font-bold">{selectedPacket.trackerType}</span>
                  </div>
                </div>

                {/* Harvested Leaks */}
                <div className="bg-black/70 p-3 rounded-lg border border-slate-800">
                  <div className="text-[9px] text-red-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    HARVESTED DEVICE & BEHAVIORAL LEAKS
                  </div>
                  <ul className="space-y-1.5 text-slate-300 text-[10px]">
                    {selectedPacket.leakedData?.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5 bg-slate-950/70 p-1.5 rounded border border-slate-900">
                        <span className="text-red-400 font-bold">▸</span>
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* In-drawer action buttons */}
            <div className="space-y-2 pt-3 border-t mt-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              {blockedDomains.has(selectedPacket.domain) || selectedPacket.isSevered ? (
                <button
                  onClick={() => restoreWire(selectedPacket.domain)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold py-2 rounded flex items-center justify-center gap-2 transition text-xs border border-slate-600"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  RESTORE WIRE CONNECTION
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => cutTheWire(selectedPacket.domain)}
                    className="w-full bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold py-2 rounded flex items-center justify-center gap-1.5 transition text-xs shadow-lg"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    CUT WIRE
                  </button>
                  <button
                    onClick={() => poisonTheWire(selectedPacket.domain)}
                    className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold py-2 rounded flex items-center justify-center gap-1.5 transition text-xs shadow-lg"
                  >
                    <Skull className="w-3.5 h-3.5" />
                    POISON WIRE
                  </button>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* 3. BOTTOM COMMAND DOCK: Destination Storage Coordinates & Wire Controls */}
      <footer className="h-16 bottom-command-deck z-30 px-4 flex items-center justify-between border-t flex-shrink-0">
        
        {/* Left: Destination Coordinates & Server Location */}
        <div className="flex items-center gap-3 max-w-[35%] truncate">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/70 border shadow-lg flex-shrink-0"
            style={{
              borderColor: currentTheme.primary,
              boxShadow: `0 0 10px ${currentTheme.primaryGlow}`
            }}
          >
            <Server className="w-4 h-4" style={{ color: currentTheme.primary }} />
          </div>
          <div className="truncate">
            <div className="text-[9px] text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <MapPin className="w-3 h-3" style={{ color: currentTheme.primary }} />
              <span>DATA DESTINATION & STORAGE COORDINATES:</span>
            </div>
            {activeDestination ? (
              <div className="flex items-center gap-2 text-xs truncate">
                <span className="font-bold text-slate-100 truncate">
                  {activeDestination.company} ({activeDestination.city})
                </span>
                <span
                  className="font-mono font-bold px-1.5 py-0.2 rounded border text-[11px]"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    borderColor: currentTheme.primary,
                    color: currentTheme.primary
                  }}
                >
                  {activeDestination.geo?.lat?.toFixed(4)}°N, {activeDestination.geo?.lng?.toFixed(4)}°E
                </span>
              </div>
            ) : (
              <div className="text-xs text-slate-500 font-sans italic">
                Awaiting reconnaissance scan to locate surveillance servers...
              </div>
            )}
          </div>
        </div>

        {/* Center: Tactile Wire Actions (Cut Wire / Poison Wire / Cut All) */}
        <div className="flex items-center gap-2">
          {activeDestination && (
            <div className="flex items-center gap-1.5 pr-3 border-r border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase hidden md:inline truncate max-w-[120px]">
                {activeDestination.domain}:
              </span>
              {blockedDomains.has(activeDestination.domain) ? (
                <button
                  onClick={() => restoreWire(activeDestination.domain)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 border border-slate-700 transition"
                >
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  RESTORE
                </button>
              ) : (
                <>
                  <button
                    onClick={() => cutTheWire(activeDestination.domain)}
                    className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    CUT WIRE
                  </button>
                  <button
                    onClick={() => poisonTheWire(activeDestination.domain)}
                    className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition"
                  >
                    <Skull className="w-3.5 h-3.5" />
                    POISON DATA
                  </button>
                </>
              )}
            </div>
          )}

          {/* Master Kill Switch for All Trackers */}
          <button
            onClick={cutAllTrackers}
            className="px-3 py-1 rounded bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition"
            title="Block and Sever All Detected Tracker Wires"
          >
            <Scissors className="w-3.5 h-3.5" />
            CUT ALL TRACKERS
          </button>

          <button
            onClick={poisonAllTrackers}
            className="px-3 py-1 rounded bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition"
            title="Inject Synthetic Noise & Decoys into All Tracker Connections"
          >
            <Skull className="w-3.5 h-3.5" />
            POISON ALL TRACKERS
          </button>

          {(blockedDomains.size > 0 || poisonedDomains.size > 0) && (
            <button
              onClick={() => {
                if (socketRef.current) socketRef.current.emit('clear_rules');
              }}
              className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 transition"
              title="Reset All Firewalls"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right: Quick Camera View Navigation Controls & Inspect Payload */}
        <div className="flex items-center gap-1.5">
          <div className="hidden lg:flex items-center gap-1 text-[10px] text-slate-400 font-bold bg-black/60 px-2 py-1 rounded border border-slate-800">
            <Compass className="w-3 h-3" style={{ color: currentTheme.primary }} />
            <span>NAV:</span>
            <button onClick={zoomIn} className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-200" title="Zoom In">+</button>
            <button onClick={zoomOut} className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-200" title="Zoom Out">-</button>
            <button onClick={shiftUp} className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-200" title="Shift Up">↑</button>
            <button onClick={shiftDown} className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-200" title="Shift Down">↓</button>
            <button onClick={resetCamera} className="px-1.5 py-0.5 rounded hover:bg-slate-800" style={{ color: currentTheme.primary }} title="Reset">RESET</button>
          </div>

          {activeDestination && (
            <button
              onClick={() => setShowInspectorModal(true)}
              className="px-2.5 py-1 rounded border text-xs font-bold flex items-center gap-1 transition shadow-lg"
              style={{
                backgroundColor: 'rgba(0,0,0,0.6)',
                borderColor: currentTheme.primary,
                color: currentTheme.primary,
                boxShadow: `0 0 10px ${currentTheme.primaryGlow}`
              }}
            >
              <Terminal className="w-3.5 h-3.5" />
              INSPECT PAYLOAD
            </button>
          )}
        </div>
      </footer>

      {/* 4. MODAL: Clean-Room Safe View */}
      {showSafeViewModal && safeViewImg && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="tactical-panel-glow w-full max-w-4xl max-h-[88vh] rounded-xl flex flex-col overflow-hidden border shadow-2xl">
            <div className="p-3.5 border-b flex items-center justify-between bg-black/60" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-100">
                  CLEAN-ROOM PURIFIED SAFE VIEW
                </h3>
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-bold">
                  DEFANGED BROWSER SANDBOX
                </span>
              </div>
              <button
                onClick={() => setShowSafeViewModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950">
              <img
                src={safeViewImg}
                alt="Defanged Clean-Room Preview"
                className="max-w-full max-h-[68vh] rounded border border-slate-800 shadow-2xl object-contain"
              />
            </div>
            <div className="p-3 bg-black/70 border-t flex items-center justify-between text-xs text-slate-400" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <span>All severed surveillance trackers stripped before network arrival.</span>
              <button
                onClick={() => setShowSafeViewModal(false)}
                className="px-3 py-1 font-bold rounded text-slate-950 transition"
                style={{
                  backgroundColor: currentTheme.primary
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: Judges Presentation & Full Architecture Pitch Deck */}
      {showJudgesModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 md:p-6">
          <div
            className="w-full max-w-5xl max-h-[92vh] rounded-2xl flex flex-col overflow-hidden border shadow-2xl bg-slate-950/95"
            style={{
              borderColor: 'rgba(245, 158, 11, 0.4)',
              boxShadow: '0 0 30px rgba(245, 158, 11, 0.2)'
            }}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-black/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <Award className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm md:text-base font-extrabold tracking-wider font-sans text-amber-300">
                      DOOMWIRE // JUDGES TECHNICAL REPORT & SYSTEM ARCHITECTURE
                    </h2>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-400 font-bold uppercase">
                      HACKATHON GOLD STANDARD
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                    <span>Lead Architect:</span>
                    <span className="text-cyan-400 font-bold">Arnav (by-Arnavvv)</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400">Production-Ready Active Privacy Firewall & 3D Radar</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowJudgesModal(false)}
                className="text-slate-400 hover:text-white font-bold text-lg px-2.5 py-1 rounded-lg hover:bg-slate-900 transition"
              >
                ✕
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 text-xs overflow-x-auto">
              {[
                { id: 'PITCH', label: '1. PITCH & HIGHLIGHTS', icon: Sparkles },
                { id: 'CHECKLIST', label: '2. JUDGES LIVE CHECKLIST', icon: CheckCircle2 },
                { id: 'ARCHITECTURE', label: '3. SYSTEM ARCHITECTURE', icon: Layers },
                { id: 'SECURITY', label: '4. THREAT MATRIX & DEFENSE', icon: ShieldCheck }
              ].map((tab) => {
                const Icon = tab.icon;
                const active = judgesTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setJudgesTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                      active
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-5 text-slate-200 font-sans space-y-4 text-xs md:text-sm">
              {judgesTab === 'PITCH' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1 font-mono">
                        THE SILENT CRISIS
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed">
                        94% of top 1,000 websites execute unmasked surveillance scripts within 250ms of page load. AudioContext oscillators, Canvas hashes, and WebGL renderers secretly fingerprint users across the entire internet.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1 font-mono">
                        THE DOOMWIRE SHIFT
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed">
                        DoomWire flips the surveillance mirror. It visualizes data exfiltration on an interactive 3D WebGL globe with NASA Black Marble night lights, giving users tactile physical controls: <strong className="text-red-300">Cut Wire</strong> or <strong className="text-purple-300">Poison Data</strong>.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 font-mono">
                        WHY THIS WINS
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed">
                        Not a passive ad-blocker! DoomWire features real Playwright Chromium sandboxing, sub-millisecond WebSocket telemetry streaming, Web Audio sound synthesis, and differential privacy noise injection.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-black border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-100 font-mono text-sm">TRY FULL DEMO SCAN DIRECTLY</div>
                      <div className="text-slate-400 text-xs mt-0.5">
                        Test live interactive telemetry streaming with NASA globe tracking, real sound effects, and wire severing.
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowJudgesModal(false);
                        handleStartScan();
                      }}
                      className="px-4 py-2 rounded-lg font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition shadow-lg text-xs font-mono"
                    >
                      EXECUTE DEMO SCAN NOW
                    </button>
                  </div>
                </div>
              )}

              {judgesTab === 'CHECKLIST' && (
                <div className="space-y-3">
                  <div className="text-xs font-mono uppercase tracking-wider text-amber-400 mb-2">
                    6-STEP INTERACTIVE VERIFICATION PROTOCOL
                  </div>
                  {[
                    { step: '01', title: 'Execute Reconnaissance Scan', desc: 'Click "SCAN TARGET" in the top bar or click any quick preset (cnn.com, reddit.com, nytimes.com) to launch the tracking beam radar.' },
                    { step: '02', title: 'Inspect Unmasked Hardware Fingerprints', desc: 'Click any arc on the 3D globe or click a packet in the left feed to open the inspector drawer with IP, Canvas hash, and city.' },
                    { step: '03', title: 'Tactile Wire Severance', desc: 'Click "CUT WIRE" on a selected domain or "CUT ALL TRACKERS" to drop connections instantly and see the arc severed on the globe.' },
                    { step: '04', title: 'Differential Noise Poisoning', desc: 'Click "POISON DATA" to turn the tracking wire glowing purple and inject randomized synthetic entropy into the surveillance feed.' },
                    { step: '05', title: 'Enter the Clean-Room Safe View', desc: 'Click the "SAFE-ROOM" button in the top navigation to inspect the sandboxed, defanged DOM with neutralized ad units highlighted.' },
                    { step: '06', title: 'Aesthetic Theme Switcher', desc: 'Click the Palette button in the header to cycle between Cyber Cyan, Void Purple, and Matrix Emerald dark tactical environments.' }
                  ].map((item) => (
                    <div key={item.step} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                      <div className="text-sm font-extrabold font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-500/30 px-2 py-0.5 rounded">
                        {item.step}
                      </div>
                      <div>
                        <div className="font-bold text-slate-100 text-xs font-mono">{item.title}</div>
                        <div className="text-slate-400 text-xs mt-0.5">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {judgesTab === 'ARCHITECTURE' && (
                <div className="space-y-4 font-mono text-xs">
                  <div className="p-4 rounded-xl bg-black border border-slate-800 text-slate-300 overflow-x-auto">
                    <pre className="text-[11px] leading-relaxed text-cyan-400">
{`+-----------------------------------------------------------------------------+
|                            DOOMWIRE FULL-STACK PIPELINE                      |
+-----------------------------------------------------------------------------+
   [ User Browser ]  <--- (Socket.io WebSocket) --->  [ Node.js Worker ]
          |                                                   |
   +------+-----------------------+             +-------------+-------------+
   |  Three.js WebGL 3D Radar     |             |  Playwright Headless      |
   |  NASA Night Lights Texture   |             |  Chromium Sandbox Worker  |
   |  Web Audio Synthesizer       |             |  Network Interceptor Pipe |
   |  Tactical Theme Engine       |             |  Active DNS Sinkhole      |
   +------------------------------+             +---------------------------+`}
                    </pre>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans">
                    <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                      <div className="font-mono text-xs text-cyan-400 font-bold mb-1">FRONTEND SUBSYSTEM</div>
                      <p className="text-slate-400 text-xs">
                        React 18 + Vite 6 + Three.js WebGL (via react-globe.gl) with NASA Black Marble Earth textures, Tailwind CSS, Lucide icons, and real-time oscillator audio synthesis via the Web Audio API.
                      </p>
                    </div>
                    <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                      <div className="font-mono text-xs text-purple-400 font-bold mb-1">BACKEND & FIREWALL SUBSYSTEM</div>
                      <p className="text-slate-400 text-xs">
                        Express + Socket.io + Playwright headless browser engine in isolated Docker containers with live CDP (Chrome DevTools Protocol) network route interception and differential privacy noise generators.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {judgesTab === 'SECURITY' && (
                <div className="space-y-3 font-sans">
                  <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-2">
                    DEFENSE-IN-DEPTH THREAT MITIGATION
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                      <div className="font-bold text-red-400 font-mono mb-1">Canvas & WebGL Fingerprinting</div>
                      <div className="text-slate-400">
                        Attackers render hidden geometries to identify GPU drivers. DoomWire intercepts WebGL contexts and injects non-deterministic Gaussian noise, destroying fingerprint stability across sessions.
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                      <div className="font-bold text-orange-400 font-mono mb-1">AudioContext Oscillator Hash</div>
                      <div className="text-slate-400">
                        Audio probes analyze digital audio processing latency. DoomWire normalizes the oscillator frequency spectrum to standard baseline values before network telemetry dispatch.
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                      <div className="font-bold text-purple-400 font-mono mb-1">Differential Privacy Poisoning</div>
                      <div className="text-slate-400">
                        Rather than simple blocking (which reveals adblocker presence), DoomWire injects randomized synthetic behavior (fake clicks, noisy dwell times) to poison cross-site surveillance graphs.
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                      <div className="font-bold text-emerald-400 font-mono mb-1">Zero-Trust Process Isolation</div>
                      <div className="text-slate-400">
                        Target websites execute in a defanged Chromium container with root privileges stripped and network namespaces strictly controlled to prevent sandbox escape.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-black/80 border-t border-slate-800 flex items-center justify-between">
              <div className="text-[11px] text-slate-400 font-mono">
                DoomWire v3.4 • Verified for Hackathon Judging & Production Deployment
              </div>
              <button
                onClick={() => setShowJudgesModal(false)}
                className="px-4 py-1.5 font-bold rounded-lg text-slate-950 bg-amber-400 hover:bg-amber-300 transition text-xs font-mono"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
