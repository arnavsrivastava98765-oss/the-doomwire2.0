import React from 'react';
import { Server } from 'lucide-react';

export default function ServerModal({
  showServerModal,
  setShowServerModal,
  currentTheme,
  socketConnected,
  customUrlInput,
  setCustomUrlInput,
  setBackendUrl
}) {
  if (!showServerModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className="tactical-panel w-full max-w-lg rounded-xl flex flex-col overflow-hidden border shadow-2xl"
        style={{ borderColor: currentTheme.border }}
      >
        <div
          className="p-3.5 border-b flex items-center justify-between bg-black/70"
          style={{ borderColor: 'rgba(255,255,255,0.1)' }}
        >
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
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                Active Pipeline State
              </div>
              <div
                className="font-bold font-mono text-sm mt-0.5"
                style={{ color: socketConnected ? '#34d399' : '#38bdf8' }}
              >
                {socketConnected
                  ? '⚡ CLOUD PLAYWRIGHT SANDBOX ACTIVE'
                  : '🛡️ ZERO-SERVER DOH ENGINE ACTIVE'}
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
                placeholder="https://the-doomwire2-0-2.onrender.com"
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
              <li>
                <strong>Render Free Web Service:</strong> Connect this repo to Render.com. It reads{' '}
                <code>render.yaml</code> and builds the isolated Chromium sandbox automatically.
              </li>
              <li>
                <strong>Zero-Server Standalone:</strong> When no container is connected, DOOMWIRE
                resolves real Google DNS-over-HTTPS records and scrapes live third-party tracking scripts
                in any browser.
              </li>
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
  );
}

