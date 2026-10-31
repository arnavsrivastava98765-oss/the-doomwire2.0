import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
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
  Palette
} from 'lucide-react';
import { resolveRealDomainEcosystem, getThreatColor } from './domainRecon.js';

const getInitialBackendUrl = () => {
  if (typeof window !== 'undefined') {
    // 1. If running on localhost or loopback, always connect directly to local real backend on port 5000
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    // 2. If running directly on Render or self-hosted container, connect to current origin
    if (window.location.origin.includes('onrender.com') || window.location.origin.includes(':5000')) {
      return window.location.origin;
    }
    const saved = localStorage.getItem('doomwire_backend_url');
    if (saved) return saved;
  }
  return import.meta.env.VITE_BACKEND_URL || 'https://doomwire-engine.onrender.com';
};

// 4 Minimalist Dark Aesthetic Themes with Colored Hairline Borders
const THEMES = {
  OBSIDIAN_BLUE: {
    id: 'OBSIDIAN_BLUE',
    name: 'OBSIDIAN // BLUE',
    tag: 'TACTICAL BLUE',
    primary: '#38bdf8',
    primaryGlow: 'rgba(56, 189, 248, 0.25)',
    secondary: '#60a5fa',
    atmosphere: '#0284c7',
    radarColor: '#38bdf8',
    border: 'rgba(56, 189, 248, 0.28)',
    surfaceBg: 'rgba(8, 12, 22, 0.88)'
  },
  DEEP_VIOLET: {
    id: 'DEEP_VIOLET',
    name: 'VOID // PURPLE',
    tag: 'PURPLISH BLACK',
    primary: '#c084fc',
    primaryGlow: 'rgba(192, 132, 252, 0.25)',
    secondary: '#ec4899',
    atmosphere: '#7e22ce',
    radarColor: '#c084fc',
    border: 'rgba(192, 132, 252, 0.3)',
    surfaceBg: 'rgba(14, 8, 24, 0.88)'
  },
  CRIMSON_PROTOCOL: {
    id: 'CRIMSON_PROTOCOL',
    name: 'CRIMSON // RED',
    tag: 'STEALTH RED',
    primary: '#f43f5e',
    primaryGlow: 'rgba(244, 63, 94, 0.25)',
    secondary: '#fb7185',
    atmosphere: '#be123c',
    radarColor: '#f43f5e',
    border: 'rgba(244, 63, 94, 0.3)',
    surfaceBg: 'rgba(16, 7, 10, 0.88)'
  },
  NEO_EMERALD: {
    id: 'NEO_EMERALD',
    name: 'EMERALD // BLACK',
    tag: 'TACTICAL SAGE',
    primary: '#10b981',
    primaryGlow: 'rgba(16, 185, 129, 0.25)',
    secondary: '#34d399',
    atmosphere: '#047857',
    radarColor: '#10b981',
    border: 'rgba(16, 185, 129, 0.28)',
    surfaceBg: 'rgba(6, 14, 9, 0.88)'
  }
};

// Lightweight synchronous fallback for instant safe-room preview wireframe
const generateQuickDomainNodes = (inputUrl) => {
  let domain = 'target-perimeter.com';
  try {
    const formatted = inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`;
    domain = new URL(formatted).hostname.toLowerCase().replace(/^www\./, '');
  } catch (e) {
    domain = inputUrl.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '').toLowerCase() || 'target-perimeter.com';
  }
  const parts = domain.split('.');
  const brand = parts.length >= 2 ? parts[parts.length - 2].toUpperCase() : 'HOST';
  return [
    { domain: domain, company: `${brand} Origin Host`, trackerType: 'Primary Web Origin', threatLevel: 'green' },
    { domain: `api.${domain}`, company: `${brand} Platform Services`, trackerType: 'REST & GraphQL API Gateway', threatLevel: 'yellow' },
    { domain: `cdn.${domain}`, company: `${brand} Global Edge`, trackerType: 'Content Delivery Network Edge', threatLevel: 'green' },
    { domain: `auth.${domain}`, company: `${brand} Identity Mesh`, trackerType: 'SSO & OAuth Identity Provider', threatLevel: 'yellow' }
  ];
};

// Generates an interactive, tactical Safe-Room preview in-memory via HTML5 Canvas
const generateSimulatedSafeView = (url, severedSet = new Set(), poisonedSet = new Set(), customBeacons = []) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 700;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const displayUrl = (url || 'https://domain-target.com').trim();
  let cleanDomain = 'domain-target.com';
  try {
    cleanDomain = new URL(displayUrl.startsWith('http') ? displayUrl : `https://${displayUrl}`).hostname;
  } catch (e) {
    cleanDomain = displayUrl.replace(/^https?:\/\//, '').split('/')[0] || 'domain-target.com';
  }

  // Tactical Dark Background
  ctx.fillStyle = '#070b14';
  ctx.fillRect(0, 0, 1200, 700);

  // Chrome Header
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 1200, 52);
  ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(26, 26, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(46, 26, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(66, 26, 6, 0, Math.PI * 2); ctx.fill();

  // URL Bar with actual user-requested URL
  ctx.fillStyle = '#1e293b';
  if (ctx.roundRect) ctx.roundRect(100, 12, 850, 28, 6); else ctx.fillRect(100, 12, 850, 28);
  ctx.fill();
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('🛡️ [DOOMWIRE ISOLATED SANDBOX] -> ' + (displayUrl.startsWith('http') ? displayUrl : `https://${displayUrl}`), 120, 31);

  // Status Badge
  ctx.fillStyle = '#00f0ff';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('ACTIVE FIREWALL DEFENSE', 980, 31);

  // Main Page Content Area (Sanitized Wireframe tailored to target domain)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(50, 80, 730, 220);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(50, 80, 730, 220);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText(`DOM PURIFIED: ${cleanDomain.toUpperCase()}`, 80, 130);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`Target perimeter at ${cleanDomain} analyzed inside isolated execution sandbox.`, 80, 165);
  ctx.fillText('Real-time network surveillance, ad auctions, cross-site fingerprinters, and cookie syncs isolated.', 80, 190);
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(`FIREWALL STATUS: ${severedSet.size} WIRES CUT // ${poisonedSet.size} WIRES POISONED`, 80, 240);

  // Dynamic Surveillance Slots derived from actual target beacons
  const pool = customBeacons.length > 0 ? customBeacons : generateQuickDomainNodes(displayUrl);
  const dangerNodes = pool.filter((b) => b.threatLevel === 'red' || b.threatLevel === 'orange' || b.threatLevel === 'yellow');
  const selectedNodes = (dangerNodes.length >= 4 ? dangerNodes : pool).slice(0, 4);

  const slotCoords = [
    { x: 810, y: 80, w: 340, h: 220 },
    { x: 810, y: 320, w: 340, h: 320 },
    { x: 50, y: 320, w: 730, h: 140 },
    { x: 50, y: 480, w: 730, h: 160 }
  ];

  selectedNodes.forEach((node, idx) => {
    const coords = slotCoords[idx];
    if (!coords) return;

    const isSev = severedSet.has(node.domain);
    const isPois = poisonedSet.has(node.domain);

    ctx.fillStyle = isSev ? 'rgba(239, 68, 68, 0.12)' : isPois ? 'rgba(192, 132, 252, 0.15)' : 'rgba(30, 41, 59, 0.7)';
    ctx.fillRect(coords.x, coords.y, coords.w, coords.h);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = isSev ? '#ef4444' : isPois ? '#c084fc' : '#475569';
    ctx.strokeRect(coords.x, coords.y, coords.w, coords.h);

    ctx.fillStyle = isSev ? '#ef4444' : isPois ? '#c084fc' : '#f87171';
    ctx.font = 'bold 12px monospace';
    const label = isSev ? '✂ SEVERED WIRE // NETWORK PACKET DROPPED' : isPois ? '☠ POISONED // DIFFERENTIAL NOISE INJECTED' : '⚠ SURVEILLANCE BEACON IDENTIFIED';
    ctx.fillText(label, coords.x + 16, coords.y + 32);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px monospace';
    ctx.fillText(`Target: ${node.domain} [${node.company || node.trackerType}]`, coords.x + 16, coords.y + 55);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    const sub = isSev ? 'Connection sinkholed by DoomWire DNS firewall.' : isPois ? 'Fingerprint replaced with high-entropy cryptographic noise.' : (node.trackerType || 'Active exfiltration vector monitored on 3D radar.');
    ctx.fillText(sub, coords.x + 16, coords.y + 78);
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
  const [currentThemeKey, setCurrentThemeKey] = useState('OBSIDIAN_BLUE');
  const currentTheme = THEMES[currentThemeKey];

  const [socketConnected, setSocketConnected] = useState(false);
  const [backendUrl, setBackendUrl] = useState(getInitialBackendUrl);
  const [showServerModal, setShowServerModal] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState(backendUrl);
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

  // Cycle through 4 dark minimalist aesthetic themes
  const cycleTheme = () => {
    audioFX.init();
    const themeKeys = Object.keys(THEMES);
    const nextIdx = (themeKeys.indexOf(currentThemeKey) + 1) % themeKeys.length;
    const nextKey = themeKeys[nextIdx];
    setCurrentThemeKey(nextKey);
    audioFX.playBlip(nextKey === 'OBSIDIAN_BLUE' ? 750 : nextKey === 'DEEP_VIOLET' ? 880 : nextKey === 'CRIMSON_PROTOCOL' ? 620 : 690, 0.06);
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

  // Pre-seed tactical surveillance perimeter on load so the 3D globe is active immediately
  useEffect(() => {
    let active = true;
    resolveRealDomainEcosystem(targetUrl || 'cnn.com', userLocation).then((nodes) => {
      if (!active) return;
      const initialBeacons = nodes.map((b, idx) => ({
        id: `init-${idx}`,
        ...b
      }));
      setArcs(initialBeacons);
      setPackets(initialBeacons);
      setSelectedPacket(initialBeacons[0]);
    }).catch(() => {});
    return () => { active = false; };
  }, [userLocation]);

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

  // Configure Bright, High-Definition Space Lighting (Less Dark with Vibrant Night Glow)
  const configureGlobeLighting = useCallback(() => {
    if (!globeRef.current) return;
    try {
      if (typeof globeRef.current.globeMaterial === 'function') {
        const globeMat = globeRef.current.globeMaterial();
        if (globeMat) {
          globeMat.color = new THREE.Color(0xffffff);
          // Boost emissive city lights for radiant night glow from space
          if (globeMat.map) {
            globeMat.emissiveMap = globeMat.map;
            globeMat.emissive = new THREE.Color(0xfff5dd);
            globeMat.emissiveIntensity = 2.1;
          } else {
            globeMat.emissive = new THREE.Color(0xfff5dd);
            globeMat.emissiveIntensity = 1.7;
          }
          globeMat.bumpScale = 14;
          globeMat.needsUpdate = true;
        }
      }

      if (typeof globeRef.current.scene === 'function') {
        const scene = globeRef.current.scene();
        if (scene) {
          // Remove previous lights to avoid compounding
          const oldLights = scene.children.filter((c) => c.userData?.isDoomwireLight);
          oldLights.forEach((l) => scene.remove(l));

          // 1. Ambient Light - Brightened so continental geography and oceans are clearly visible (less dark)
          const ambient = new THREE.AmbientLight(0xdbeafe, 0.92);
          ambient.userData = { isDoomwireLight: true };
          scene.add(ambient);

          // 2. Hemisphere Light - Natural planetary sky & ground lighting that brings out continents and coastlines
          const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.82);
          hemiLight.userData = { isDoomwireLight: true };
          scene.add(hemiLight);

          // 3. Directional Sun Light - Crisp specular highlight across topography
          const sunLight = new THREE.DirectionalLight(0xfffaed, 1.2);
          sunLight.position.set(2.5, 2, 2.5);
          sunLight.userData = { isDoomwireLight: true };
          scene.add(sunLight);

          // 4. Cool Rim Light - Highlights the curvature and silhouette of the Earth
          const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.75);
          rimLight.position.set(-2.5, -2, -2.5);
          rimLight.userData = { isDoomwireLight: true };
          scene.add(rimLight);
        }
      }
    } catch (err) {
      console.warn('Globe lighting setup:', err);
    }
  }, []);

  // Ensure asynchronous texture load locks in the emissive night city map
  useEffect(() => {
    let attempts = 0;
    const interval = setInterval(() => {
      try {
        if (globeRef.current && typeof globeRef.current.globeMaterial === 'function') {
          const mat = globeRef.current.globeMaterial();
          if (mat && mat.map) {
            mat.emissiveMap = mat.map;
            mat.emissive = new THREE.Color(0xfff5dd);
            mat.emissiveIntensity = 2.1;
            mat.bumpScale = 14;
            mat.needsUpdate = true;
            clearInterval(interval);
          }
        }
      } catch (err) {}
      attempts++;
      if (attempts > 30) clearInterval(interval);
    }, 200);
    return () => clearInterval(interval);
  }, [globeDimensions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      configureGlobeLighting();
    }, 300);
    return () => clearTimeout(timer);
  }, [configureGlobeLighting, globeDimensions]);

  // Socket.io Connection & Events
  useEffect(() => {
    if (!backendUrl) return;
    const s = io(backendUrl, {
      reconnectionAttempts: 8,
      reconnectionDelay: 2500,
      timeout: 8000
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

      const arcColor = isPoisoned ? '#c084fc' : getThreatColor(pkt.threatLevel);

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
  }, [backendUrl, userLocation]);

  const toggleMute = () => {
    audioFX.init();
    audioFX.muted = !muted;
    setMuted(!muted);
  };

  const handleStartScan = (e, targetOverride = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const activeUrl = (typeof targetOverride === 'string' ? targetOverride : targetUrl).trim();
    if (!activeUrl || isScanning) return;
    if (targetOverride) setTargetUrl(targetOverride);

    audioFX.init();
    audioFX.playBlip(780, 0.08);

    if (simTimerRef.current) clearInterval(simTimerRef.current);

    setArcs([]);
    setPackets([]);
    setSelectedPacket(null);
    setSafeViewImg(null);
    setIsScanning(true);

    if (socketConnected && socketRef.current) {
      setScanStatus('LAUNCHING ISOLATED CHROMIUM RECON (LIVE PLAYWRIGHT SANDBOX)...');
      socketRef.current.emit('scan_url', { url: activeUrl, userLocation });
    } else {
      // Live Real-Time DNS-over-HTTPS & Network Reconnaissance Engine
      setScanStatus(`RESOLVING DNS INFRASTRUCTURE FOR [${activeUrl.toUpperCase()}]...`);

      resolveRealDomainEcosystem(activeUrl, userLocation).then((dynamicBeacons) => {
        setScanStatus(`HARVESTING IN-FLIGHT TELEMETRY BEAMS (${dynamicBeacons.length} NODES DISCOVERED)...`);
        let beaconIndex = 0;

        simTimerRef.current = setInterval(() => {
          if (beaconIndex >= dynamicBeacons.length) {
            clearInterval(simTimerRef.current);
            simTimerRef.current = null;
            setScanStatus(`RECON FINISHED // ${dynamicBeacons.length} DESTINATION NODES SECURED`);
            setIsScanning(false);
            const safeImg = generateSimulatedSafeView(activeUrl, blockedDomains, poisonedDomains, dynamicBeacons);
            if (safeImg) setSafeViewImg(safeImg);
            audioFX.playBlip(980, 0.15);
            return;
          }

          const b = dynamicBeacons[beaconIndex];
          beaconIndex++;

          audioFX.playBlip(b.threatLevel === 'red' ? 920 : 580, 0.04);
          const isSevered = blockedDomains.has(b.domain);
          const isPoisoned = poisonedDomains.has(b.domain);

          const arcColor = isPoisoned ? '#c084fc' : (b.color || getThreatColor(b.threatLevel));

          const newPkt = {
            id: `recon-${beaconIndex}-${Date.now()}`,
            ...b,
            color: arcColor,
            isSevered,
            isPoisoned
          };

          if (!isSevered) {
            setArcs((prev) => [...prev.slice(-60), newPkt]);
          }
          setPackets((prev) => [newPkt, ...prev.slice(0, 100)]);
        }, 130);
      }).catch((err) => {
        console.error('Recon error:', err);
        setIsScanning(false);
        setScanStatus(`RECON NOTICE: ${err.message}`);
      });
    }
  };

  const applyPreset = (url) => {
    setTargetUrl(url);
    if (!isScanning) {
      setTimeout(() => {
        handleStartScan(null, url);
      }, 60);
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
    if (!safeViewImg || !safeViewImg.startsWith('data:image/jpeg')) {
      const safeImg = generateSimulatedSafeView(targetUrl, nextBlocked, poisonedDomains, packets);
      if (safeImg) setSafeViewImg(safeImg);
    }
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
    if (!safeViewImg || !safeViewImg.startsWith('data:image/jpeg')) {
      const safeImg = generateSimulatedSafeView(targetUrl, blockedDomains, nextPoisoned, packets);
      if (safeImg) setSafeViewImg(safeImg);
    }
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

    setArcs((prev) => {
      const exists = prev.some((a) => a.domain === domain);
      if (exists) {
        return prev.map((a) =>
          a.domain === domain
            ? { ...a, color: getThreatColor(a.threatLevel), isPoisoned: false, isSevered: false }
            : a
        );
      }
      const pkt = packets.find((p) => p.domain === domain) || (selectedPacket?.domain === domain ? selectedPacket : null);
      if (pkt) {
        return [...prev, { ...pkt, color: getThreatColor(pkt.threatLevel), isPoisoned: false, isSevered: false }];
      }
      return prev;
    });

    if (!safeViewImg || !safeViewImg.startsWith('data:image/jpeg')) {
      const safeImg = generateSimulatedSafeView(targetUrl, nextBlocked, nextPoisoned, packets);
      if (safeImg) setSafeViewImg(safeImg);
    }
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
      if (!safeViewImg || !safeViewImg.startsWith('data:image/jpeg')) {
        const safeImg = generateSimulatedSafeView(targetUrl, newBlocked, newPoisoned, packets);
        if (safeImg) setSafeViewImg(safeImg);
      }
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
      if (!safeViewImg || !safeViewImg.startsWith('data:image/jpeg')) {
        const safeImg = generateSimulatedSafeView(targetUrl, newBlocked, newPoisoned, packets);
        if (safeImg) setSafeViewImg(safeImg);
      }
    }
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
      color: arc.isPoisoned ? '#c084fc' : (Array.isArray(arc.color) ? arc.color[1] : arc.color)
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
          color: p.isPoisoned ? '#c084fc' : p.threatLevel === 'red' ? '#ff0055' : p.threatLevel === 'orange' ? '#ff7700' : p.threatLevel === 'yellow' ? '#fbbf24' : '#00ff88',
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
      className="flex flex-col h-screen w-screen text-slate-100 overflow-hidden select-none relative deep-space-canvas"
    >
      {/* 1. TOP HEADER: Tactical HUD Navigation & by-Arnavvv Signature */}
      <header
        className="h-14 tactical-panel z-30 flex items-center justify-between px-4 border-b flex-shrink-0"
        style={{ borderColor: currentTheme.border }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/60 border shadow-sm transition-all"
            style={{
              borderColor: currentTheme.border
            }}
          >
            <ShieldAlert className="w-4 h-4" style={{ color: currentTheme.primary }} />
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
                  borderColor: currentTheme.border,
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
              <Crosshair className="absolute left-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-56 md:w-72 bg-black/80 border text-xs px-3 py-1.5 pl-8 rounded text-slate-200 focus:outline-none transition font-mono"
                style={{
                  borderColor: currentTheme.border
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isScanning}
              className="px-3.5 py-1.5 rounded text-xs font-bold tracking-wider flex items-center gap-1.5 transition text-slate-950 font-sans"
              style={{
                backgroundColor: currentTheme.primary
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
          <div className="hidden xl:flex items-center gap-1 border-l border-slate-800/80 pl-2">
            {['cnn.com', 'nytimes.com', 'reddit.com', 'forbes.com'].map((domain) => (
              <button
                key={domain}
                onClick={() => applyPreset(`https://${domain}`)}
                className="text-[10px] px-2 py-0.5 rounded bg-black/40 border border-slate-800 hover:border-slate-600 transition text-slate-400 hover:text-slate-200"
              >
                {domain}
              </button>
            ))}
          </div>
        </div>

        {/* Tactical Controls & Theme Switcher */}
        <div className="flex items-center gap-2">
          {/* Theme Switcher Button */}
          <button
            onClick={cycleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-bold transition hover:bg-white/5 active:scale-95"
            style={{
              borderColor: currentTheme.border,
              color: currentTheme.primary,
              background: 'rgba(0,0,0,0.6)'
            }}
            title="Switch Aesthetic Theme"
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="text-[10px] tracking-wider hidden sm:inline">{currentTheme.name}</span>
          </button>

          {safeViewImg && (
            <button
              onClick={() => setShowSafeViewModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/40 text-xs transition font-bold"
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

          <button
            onClick={() => {
              setCustomUrlInput(backendUrl);
              setShowServerModal(true);
            }}
            title="Configure Cloud Backend / Sandbox"
            className="flex items-center gap-1.5 pl-2 border-l border-slate-800 hover:opacity-85 transition cursor-pointer"
          >
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{
                backgroundColor: socketConnected ? '#10b981' : '#00f0ff',
                boxShadow: socketConnected ? '0 0 10px rgba(16, 185, 129, 0.8)' : '0 0 10px rgba(0, 240, 255, 0.6)'
              }}
            ></span>
            <span className="text-[10px] font-bold font-mono tracking-wider hidden sm:inline" style={{ color: socketConnected ? '#34d399' : '#38bdf8' }}>
              {socketConnected ? 'CLOUD ENGINE // ONLINE' : 'RADAR // STANDALONE'}
            </span>
            <Server className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>
        </div>
      </header>

      {/* 2. MAIN CENTER AREA: Feed + Realistic Space 3D Globe */}
      <div className="flex-1 relative flex overflow-hidden w-full">
        
        {/* LEFT SIDEBAR: Live Packet Feed */}
        {!sidebarCollapsed && (
          <aside
            className="w-72 md:w-80 tactical-panel border-r flex flex-col z-20 h-full flex-shrink-0"
            style={{ borderColor: currentTheme.border }}
          >
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
            onGlobeReady={configureGlobeLighting}
            // Ultra-realistic NASA Earth Night Lights with country glows
            globeImageUrl="https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"
            bumpImageUrl="https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png"
            backgroundImageUrl="https://cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png"
            showAtmosphere={true}
            atmosphereColor={currentTheme.atmosphere}
            atmosphereAltitude={0.20}
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
          <div
            className="absolute top-4 right-4 tactical-panel p-2.5 rounded-lg border text-xs backdrop-blur-md shadow-2xl z-10 max-w-[210px]"
            style={{ borderColor: currentTheme.border }}
          >
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
          <div
            className="absolute right-4 top-48 tactical-panel p-1.5 rounded-lg border flex flex-col gap-1 z-10 shadow-xl"
            style={{ borderColor: currentTheme.border }}
          >
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
          <aside
            className="absolute right-0 top-0 bottom-0 w-80 md:w-96 tactical-panel border-l p-5 z-30 flex flex-col justify-between shadow-2xl animate-slide-in-right overflow-y-auto"
            style={{ borderColor: currentTheme.border }}
          >
            <div>
              <div className="flex justify-between items-center border-b pb-2.5 mb-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
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
                  className="bg-black/70 p-3 rounded-lg border space-y-1.5"
                  style={{
                    borderColor: currentTheme.border
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
      <footer
        className="h-16 bottom-command-deck z-30 px-4 flex items-center justify-between border-t flex-shrink-0"
        style={{ borderColor: currentTheme.border }}
      >
        {/* Left: Destination Coordinates & Server Location */}
        <div className="flex items-center gap-3 max-w-[35%] truncate">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/70 border flex-shrink-0"
            style={{
              borderColor: currentTheme.border
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
                  className="font-mono font-bold px-1.5 py-0.5 rounded border text-[11px]"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    borderColor: currentTheme.border,
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
              className="px-2.5 py-1.5 rounded border text-xs font-bold flex items-center gap-1 transition hover:bg-white/5 active:scale-95"
              style={{
                backgroundColor: 'rgba(0,0,0,0.6)',
                borderColor: currentTheme.border,
                color: currentTheme.primary
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
          <div
            className="tactical-panel w-full max-w-4xl max-h-[88vh] rounded-xl flex flex-col overflow-hidden border shadow-2xl"
            style={{ borderColor: currentTheme.border }}
          >
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

      {/* 5. MODAL: Cloud Backend & Engine Configuration */}
      {showServerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className="tactical-panel w-full max-w-lg rounded-xl flex flex-col overflow-hidden border shadow-2xl"
            style={{ borderColor: currentTheme.border }}
          >
            <div className="p-3.5 border-b flex items-center justify-between bg-black/70" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4" style={{ color: currentTheme.primary }} />
                <h3 className="text-xs font-bold text-slate-100 tracking-wider">
                  DOOMWIRE CLOUD ENGINE LINK
                </h3>
              </div>
              <button
                onClick={() => setShowServerModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4 text-xs text-slate-300 bg-slate-950/90">
              <div className="p-3 rounded-lg border border-slate-800 bg-black/50 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Active Pipeline State</div>
                  <div className="font-bold font-mono text-sm mt-0.5" style={{ color: socketConnected ? '#34d399' : '#38bdf8' }}>
                    {socketConnected ? '⚡ CLOUD PLAYWRIGHT SANDBOX ACTIVE' : '🛡️ ZERO-SERVER DOH ENGINE ACTIVE'}
                  </div>
                </div>
                <span
                  className="w-3 h-3 rounded-full animate-ping"
                  style={{ backgroundColor: socketConnected ? '#10b981' : '#00f0ff' }}
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1.5 uppercase tracking-wider">
                  Cloud Backend WebSocket URL (Render / Railway / Localhost)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://doomwire-engine.onrender.com"
                    className="flex-1 bg-black/80 border border-slate-700 rounded px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={() => {
                      const trimmed = customUrlInput.trim();
                      setBackendUrl(trimmed);
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('doomwire_backend_url', trimmed);
                      }
                      setShowServerModal(false);
                    }}
                    className="px-4 py-2 font-bold font-mono text-slate-950 rounded transition"
                    style={{ backgroundColor: currentTheme.primary }}
                  >
                    LINK
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/80 pt-3">
                <span className="text-slate-200 font-semibold">Deployment Blueprint:</span>
                <ul className="list-disc pl-4 mt-1.5 space-y-1">
                  <li><strong>Render Free Web Service:</strong> Connect this repo to Render.com. It reads <code>render.yaml</code> and builds the isolated Chromium sandbox automatically.</li>
                  <li><strong>Zero-Server Standalone:</strong> When no container is connected, DOOMWIRE resolves real Google DNS-over-HTTPS records and scrapes live third-party tracking scripts in any browser.</li>
                </ul>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    setCustomUrlInput('http://localhost:5000');
                    setBackendUrl('http://localhost:5000');
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('doomwire_backend_url', 'http://localhost:5000');
                    }
                  }}
                  className="text-[10px] text-slate-500 hover:text-slate-300 underline font-mono"
                >
                  Reset to localhost:5000
                </button>
                <button
                  onClick={() => setShowServerModal(false)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono text-[11px]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
