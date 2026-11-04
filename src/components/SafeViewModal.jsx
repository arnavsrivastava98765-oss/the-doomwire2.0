import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function SafeViewModal({
  showSafeViewModal,
  setShowSafeViewModal,
  safeViewImg,
  currentTheme
}) {
  if (!showSafeViewModal || !safeViewImg) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className="tactical-panel w-full max-w-4xl max-h-[88vh] rounded-xl flex flex-col overflow-hidden border shadow-2xl"
        style={{ borderColor: currentTheme.border }}
      >
        <div
          className="p-3.5 border-b flex items-center justify-between bg-black/60"
          style={{ borderColor: 'rgba(255,255,255,0.1)' }}
        >
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
        <div
          className="p-3 bg-black/70 border-t flex items-center justify-between text-xs text-slate-400"
          style={{ borderColor: 'rgba(255,255,255,0.1)' }}
        >
          <span>All severed surveillance trackers stripped before network arrival.</span>
          <button
            onClick={() => setShowSafeViewModal(false)}
            className="px-3 py-1 font-bold rounded text-slate-950 transition"
            style={{ backgroundColor: currentTheme.primary }}
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}

