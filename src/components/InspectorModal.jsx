import React from 'react';
import {
  Terminal,
  X,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Scissors,
  Skull
} from 'lucide-react';

export default function InspectorModal({
  showInspectorModal,
  setShowInspectorModal,
  selectedPacket,
  currentTheme,
  blockedDomains,
  restoreWire,
  cutTheWire,
  poisonTheWire
}) {
  if (!showInspectorModal || !selectedPacket) return null;

  return (
    <aside
      className="absolute right-0 top-0 bottom-0 w-80 md:w-96 tactical-panel border-l p-5 z-30 flex flex-col justify-between shadow-2xl animate-slide-in-right overflow-y-auto"
      style={{ borderColor: currentTheme.border }}
    >
      <div>
        <div
          className="flex justify-between items-center border-b pb-2.5 mb-3"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4" style={{ color: currentTheme.primary }} />
            <h2
              className="text-xs font-bold tracking-wider uppercase"
              style={{ color: currentTheme.primary }}
            >
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
            {selectedPacket.requestCount > 1 && (
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Captured Telemetry:</span>
                <span
                  className="font-mono font-bold px-1.5 py-0.5 rounded border"
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    borderColor: 'rgba(56, 189, 248, 0.45)',
                    color: '#38bdf8'
                  }}
                >
                  {selectedPacket.requestCount}× IN-FLIGHT REQUESTS
                </span>
              </div>
            )}
          </div>

          {/* EXACT STORAGE LOCATION & COORDINATES */}
          <div
            className="bg-black/70 p-3 rounded-lg border space-y-1.5"
            style={{ borderColor: currentTheme.border }}
          >
            <div
              className="text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5"
              style={{ color: currentTheme.primary }}
            >
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
                <li
                  key={i}
                  className="flex items-start gap-1.5 bg-slate-950/70 p-1.5 rounded border border-slate-900"
                >
                  <span className="text-red-400 font-bold">▸</span>
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* In-drawer action buttons */}
      <div
        className="space-y-2 pt-3 border-t mt-3"
        style={{ borderColor: 'rgba(255,255,255,0.1)' }}
      >
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
  );
}

