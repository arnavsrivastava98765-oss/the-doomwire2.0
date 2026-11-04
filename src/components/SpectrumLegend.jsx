import React from 'react';
import { Layers } from 'lucide-react';

export default function SpectrumLegend({ currentTheme }) {
  return (
    <div
      className="absolute top-4 right-4 tactical-panel p-2.5 rounded-lg border text-xs backdrop-blur-md shadow-2xl z-10 max-w-[210px]"
      style={{ borderColor: currentTheme.border }}
    >
      <div
        className="text-[9px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"
        style={{ color: currentTheme.primary }}
      >
        <Layers className="w-3 h-3" />
        NETWORK SPECTRUM
      </div>
      <div className="space-y-1 text-[10px]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_6px_#00ff88]"></span>
          <span className="text-slate-300">Primary Origin / CDN</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#fbbf24] shadow-[0_0_6px_#fbbf24]"></span>
          <span className="text-slate-300">Analytics & Metrics</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ff7700] shadow-[0_0_6px_#ff7700]"></span>
          <span className="text-slate-300">Session & Interaction</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ff0055] shadow-[0_0_6px_#ff0055]"></span>
          <span className="text-slate-300">Targeted Ad / Broker</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#c084fc] shadow-[0_0_6px_#c084fc]"></span>
          <span className="text-purple-300 font-bold">Decoy Headers</span>
        </div>
      </div>
    </div>
  );
}

