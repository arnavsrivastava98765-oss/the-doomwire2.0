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
  Database,
  ArrowUpRight,
  Sliders,
  X
} from 'lucide-react';

const SOCKET_SERVER_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [muted, setMuted] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  // Client User location coordinates (Origin Terminal)
  const [userLocation, setUserLocation] = useState({ lat: 13.0827, lng: 80.2707, city: 'Local Command Terminal' });

  const globeRef = useRef();
  const globeContainerRef = useRef();
  const [globeDimensions, setGlobeDimensions] = useState({ width: window.innerWidth, height: window.innerHeight - 120 });
  const socketRef = useRef(null);

  // Client location detection
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

  // Three.js OrbitControls configuration
  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = autoRotate;
        controls.autoRotateSpeed = 0.5;
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.enableZoom = true;
        controls.zoomSpeed = 1.3;
        controls.enablePan = true; // Enables easy shifting up/down/left/right
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

  // Sound FX toggle
  const toggleMute = () => {
    audioFX.init();
    audioFX.muted = !muted;
    setMuted(!muted);
  };

  // Start Recon Scan
  const handleStartScan = (e) => {
    if (e) e.preventDefault();
    if (!targetUrl.trim() || isScanning) return;
    audioFX.init();
    audioFX.playBlip(780, 0.08);

    setArcs([]);
    setPackets([]);
    setSelectedPacket(null);
    setSafeViewImg(null);
    setIsScanning(true);
    setScanStatus('LAUNCHING ISOLATED CHROMIUM RECON...');

    if (socketRef.current) {
      socketRef.current.emit('scan_url', { url: targetUrl, userLocation });
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
        if (socketRef.current) {
          socketRef.current.emit('scan_url', { url, userLocation });
        }
      }, 50);
    }
  };

  // Focus and select packet with smooth camera pan
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

  // Wire Actions
  const cutTheWire = (domain) => {
    if (socketRef.current) socketRef.current.emit('cut_wire', domain);
    if (selectedPacket?.domain === domain) {
      setSelectedPacket((prev) => ({ ...prev, isSevered: true, isPoisoned: false }));
    }
  };

  const poisonTheWire = (domain) => {
    if (socketRef.current) socketRef.current.emit('poison_wire', domain);
    if (selectedPacket?.domain === domain) {
      setSelectedPacket((prev) => ({ ...prev, isPoisoned: true, isSevered: false }));
    }
  };

  const restoreWire = (domain) => {
    if (socketRef.current) socketRef.current.emit('restore_wire', domain);
    if (selectedPacket?.domain === domain) {
      setSelectedPacket((prev) => ({ ...prev, isSevered: false, isPoisoned: false }));
    }
  };

  // Master Bulk Actions
  const cutAllTrackers = () => {
    const trackerDomains = packets
      .filter((p) => p.threatLevel !== 'green')
      .map((p) => p.domain);
    const unique = Array.from(new Set(trackerDomains));
    if (unique.length > 0 && socketRef.current) {
      socketRef.current.emit('cut_all', { domains: unique });
    }
  };

  const poisonAllTrackers = () => {
    const trackerDomains = packets
      .filter((p) => p.threatLevel !== 'green')
      .map((p) => p.domain);
    const unique = Array.from(new Set(trackerDomains));
    if (unique.length > 0 && socketRef.current) {
      socketRef.current.emit('poison_all', { domains: unique });
    }
  };

  // Manual Camera Manipulation Controls
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

  // Radar target rings
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

  // Labels for target servers storing user data
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
          color: p.isPoisoned ? '#c084fc' : p.threatLevel === 'red' ? '#ff0055' : '#00f0ff',
          packet: p
        });
      }
    });
    return result;
  }, [packets]);

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

  // Active or selected destination telemetry for prominent bottom display
  const activeDestination = selectedPacket || packets[0] || null;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#020409] text-slate-100 overflow-hidden font-mono select-none relative cyber-canvas-bg">
      <div className="scanline"></div>

      {/* 1. TOP HEADER: Tactical HUD Navigation */}
      <header className="h-14 tactical-panel z-30 flex items-center justify-between px-4 border-b border-cyan-500/25 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/70 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,240,255,0.35)]">
            <ShieldAlert className="text-cyan-400 w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 font-sans">
                DOOMWIRE
              </h1>
              <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                ACTIVE CYBER-RADAR
              </span>
            </div>
          </div>
        </div>

        {/* Recon Target Bar */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleStartScan} className="flex items-center gap-2">
            <div className="relative flex items-center">
              <Crosshair className="absolute left-2.5 w-3.5 h-3.5 text-cyan-500/70" />
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-56 md:w-72 bg-black/70 border border-cyan-500/35 text-xs px-3 py-1 pl-8 rounded text-slate-200 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isScanning}
              className={`px-3 py-1 rounded text-xs font-bold tracking-wider flex items-center gap-1.5 transition ${
                isScanning
                  ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 cursor-wait'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
              }`}
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
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

        {/* Tactical Status & Audio Control */}
        <div className="flex items-center gap-2">
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
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
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
              className={`w-2 h-2 rounded-full ${
                socketConnected ? 'bg-cyan-400 shadow-[0_0_10px_#00f0ff]' : 'bg-red-500 animate-ping'
              }`}
            ></span>
            <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">
              {socketConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </header>

      {/* 2. MAIN CENTER AREA: Feed + 3D Globe (Strictly within screen bounds) */}
      <div className="flex-1 relative flex overflow-hidden w-full">
        
        {/* LEFT SIDEBAR: Live Packet Feed (Collapsible & non-intrusive) */}
        {!sidebarCollapsed && (
          <aside className="w-72 md:w-80 tactical-panel border-r border-cyan-500/20 flex flex-col z-20 h-full flex-shrink-0">
            {/* Telemetry Summary */}
            <div className="p-3 border-b border-slate-800/80 bg-black/50">
              <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">
                <span className="flex items-center gap-1 text-cyan-400 font-bold">
                  <Radio className="w-3 h-3 animate-spin" /> STATUS
                </span>
                <span className="truncate max-w-[150px] text-slate-300">{scanStatus}</span>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-4 gap-1.5 text-center mt-2">
                <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800/80">
                  <div className="text-[8px] text-slate-500 uppercase">Packets</div>
                  <div className="text-cyan-300 font-bold text-xs">{stats.total}</div>
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
                <Activity className="w-3 h-3 text-cyan-400" />
                STREAM ({filteredPackets.length})
              </div>
              <div className="flex gap-1">
                {['ALL', 'THREATS', 'SEVERED', 'POISONED'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFilterMode(mode)}
                    className={`px-1.5 py-0.5 rounded font-bold transition ${
                      filterMode === mode
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
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
                          ? 'bg-cyan-950/50 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                          : isSevered
                          ? 'bg-red-950/15 border-red-900/35 hover:border-red-500/50 opacity-70'
                          : isPoisoned
                          ? 'bg-purple-950/20 border-purple-800/40 hover:border-purple-500/60'
                          : 'bg-slate-950/70 border-slate-800/80 hover:border-cyan-500/40'
                      }`}
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

        {/* CENTER 3D GLOBE CANVAS */}
        <main ref={globeContainerRef} className="flex-1 relative h-full w-full overflow-hidden flex items-center justify-center">
          <Globe
            ref={globeRef}
            width={globeDimensions.width}
            height={globeDimensions.height}
            globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"
            bumpImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png"
            backgroundImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png"
            showAtmosphere={true}
            atmosphereColor="#00f0ff"
            atmosphereAltitude={0.22}
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
            // Animated Radar Rings on target storage cities
            ringsData={ringsData}
            ringColor={(d) => d.color}
            ringMaxRadius={(d) => d.maxR}
            ringPropagationSpeed={(d) => d.propagationSpeed}
            ringRepeatPeriod={(d) => d.repeatPeriod}
            // 3D Destination Labels on Globe
            labelsData={labelsData}
            labelLat="lat"
            labelLng="lng"
            labelText="text"
            labelSize={1.1}
            labelDotRadius={0.4}
            labelColor="color"
            onLabelClick={(label) => selectAndFocusPacket(label.packet)}
          />

          {/* Radar Legend (Top-Right HUD Overlay) */}
          <div className="absolute top-4 right-4 tactical-panel p-2.5 rounded-lg border border-cyan-500/25 text-xs backdrop-blur-md shadow-2xl z-10 max-w-[210px]">
            <div className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
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
                <span className="text-slate-300">Ad / Profiler Tracker</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ff7700] shadow-[0_0_6px_#ff7700]"></span>
                <span className="text-slate-300">Session Replay Spy</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ff0055] shadow-[0_0_6px_#ff0055]"></span>
                <span className="text-slate-300">High-Risk Phishing/FP</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#c084fc] shadow-[0_0_6px_#c084fc]"></span>
                <span className="text-purple-300 font-bold">Poisoned Decoy</span>
              </div>
            </div>
          </div>

          {/* Quick Camera Navigation Overlay on Globe (Right Side) */}
          <div className="absolute right-4 top-48 tactical-panel p-1.5 rounded-lg border border-cyan-500/25 flex flex-col gap-1 z-10 shadow-xl">
            <button
              onClick={zoomIn}
              className="p-1.5 rounded hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={zoomOut}
              className="p-1.5 rounded hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="w-full h-px bg-slate-800 my-0.5"></div>
            <button
              onClick={shiftUp}
              className="p-1.5 rounded hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition"
              title="Shift Up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <div className="flex gap-1">
              <button
                onClick={shiftLeft}
                className="p-1.5 rounded hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition"
                title="Shift Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={shiftRight}
                className="p-1.5 rounded hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition"
                title="Shift Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={shiftDown}
              className="p-1.5 rounded hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition"
              title="Shift Down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className="w-full h-px bg-slate-800 my-0.5"></div>
            <button
              onClick={resetCamera}
              className="p-1.5 rounded hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition"
              title="Reset Orbit"
            >
              <Compass className="w-4 h-4 text-cyan-400" />
            </button>
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`p-1.5 rounded transition ${
                autoRotate ? 'bg-cyan-950/70 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle Auto Rotation"
            >
              <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
            </button>
          </div>
        </main>

        {/* SLIDING PACKET X-RAY MODAL/DRAWER (Overlay mode so it never clips screens) */}
        {showInspectorModal && selectedPacket && (
          <aside className="absolute right-0 top-0 bottom-0 w-80 md:w-96 tactical-panel-glow border-l border-cyan-500/35 p-5 z-30 flex flex-col justify-between shadow-2xl animate-slide-in-right overflow-y-auto">
            <div>
              <div className="flex justify-between items-center border-b border-cyan-500/25 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-xs font-bold text-cyan-300 tracking-wider uppercase">
                    PACKET X-RAY INSPECTOR
                  </h2>
                </div>
                <button
                  onClick={() => setShowInspectorModal(false)}
                  className="text-slate-400 hover:text-cyan-300 font-bold text-sm transition p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* Parent Company & Storage Entity */}
                <div className="bg-black/70 p-3 rounded-lg border border-slate-800 cyber-corner">
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
                  <div className="text-cyan-400 text-xs mt-1 truncate">{selectedPacket.domain}</div>
                </div>

                {/* EXACT STORAGE LOCATION & COORDINATES */}
                <div className="bg-black/70 p-3 rounded-lg border border-cyan-500/30 space-y-1.5 shadow-[0_0_15px_rgba(0,240,255,0.08)]">
                  <div className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    EXACT SERVER DESTINATION & STORAGE
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Server City:</span>
                    <span className="font-bold text-slate-100">{selectedPacket.city}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Exact Coordinates:</span>
                    <span className="text-cyan-300 font-bold font-mono">
                      {selectedPacket.geo?.lat?.toFixed(4)}°, {selectedPacket.geo?.lng?.toFixed(4)}°
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Tracking Vector:</span>
                    <span className="text-orange-400 font-bold">{selectedPacket.trackerType}</span>
                  </div>
                </div>

                {/* Data Leaks Detected */}
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
            <div className="space-y-2 pt-3 border-t border-cyan-500/25 mt-3">
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
                    className="w-full bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold py-2 rounded flex items-center justify-center gap-1.5 transition text-xs shadow-[0_0_12px_rgba(255,0,85,0.35)]"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    CUT WIRE
                  </button>
                  <button
                    onClick={() => poisonTheWire(selectedPacket.domain)}
                    className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold py-2 rounded flex items-center justify-center gap-1.5 transition text-xs shadow-[0_0_12px_rgba(176,38,255,0.35)]"
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

      {/* 3. BOTTOM COMMAND DOCK: Real-time Destination Telemetry, Wire Cut Controls & Camera Deck */}
      <footer className="h-16 bottom-command-deck z-30 px-4 flex items-center justify-between border-t border-cyan-500/30 flex-shrink-0">
        
        {/* Left: Prominent Destination Storage Location & Exact Coordinates */}
        <div className="flex items-center gap-3 max-w-[35%] truncate">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/50 shadow-[0_0_10px_rgba(0,240,255,0.3)] flex-shrink-0">
            <Server className="text-cyan-400 w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-[9px] text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span>DATA DESTINATION & STORAGE COORDINATES:</span>
            </div>
            {activeDestination ? (
              <div className="flex items-center gap-2 text-xs truncate">
                <span className="font-bold text-slate-100 truncate">
                  {activeDestination.company} ({activeDestination.city})
                </span>
                <span className="text-cyan-300 font-mono font-bold bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-500/30 text-[11px]">
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
                    className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(255,0,85,0.4)] transition"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    CUT WIRE
                  </button>
                  <button
                    onClick={() => poisonTheWire(activeDestination.domain)}
                    className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(176,38,255,0.4)] transition"
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
            className="px-3 py-1 rounded bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,0,85,0.4)] transition"
            title="Block and Sever All Detected Tracker Wires"
          >
            <Scissors className="w-3.5 h-3.5" />
            CUT ALL TRACKERS
          </button>

          <button
            onClick={poisonAllTrackers}
            className="px-3 py-1 rounded bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(176,38,255,0.4)] transition"
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

        {/* Right: Quick Camera View Navigation Controls */}
        <div className="flex items-center gap-1.5">
          <div className="hidden lg:flex items-center gap-1 text-[10px] text-slate-400 font-bold bg-black/60 px-2 py-1 rounded border border-slate-800">
            <Compass className="w-3 h-3 text-cyan-400" />
            <span>NAV:</span>
            <button onClick={zoomIn} className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-200" title="Zoom In">+</button>
            <button onClick={zoomOut} className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-200" title="Zoom Out">-</button>
            <button onClick={shiftUp} className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-200" title="Shift Up">↑</button>
            <button onClick={shiftDown} className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-200" title="Shift Down">↓</button>
            <button onClick={resetCamera} className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-cyan-300" title="Reset">RESET</button>
          </div>

          {activeDestination && (
            <button
              onClick={() => setShowInspectorModal(true)}
              className="px-2.5 py-1 rounded bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50 text-xs font-bold flex items-center gap-1 transition"
            >
              <Terminal className="w-3.5 h-3.5" />
              INSPECT PAYLOAD
            </button>
          )}
        </div>
      </footer>

      {/* 4. MODAL: Clean-Room Safe View Modal */}
      {showSafeViewModal && safeViewImg && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="tactical-panel-glow w-full max-w-4xl max-h-[88vh] rounded-xl flex flex-col overflow-hidden border border-cyan-500/40 shadow-2xl">
            <div className="p-3.5 border-b border-cyan-500/30 flex items-center justify-between bg-black/60">
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
            <div className="p-3 bg-black/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>All severed surveillance trackers stripped before network arrival.</span>
              <button
                onClick={() => setShowSafeViewModal(false)}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
