import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  RotateCw
} from 'lucide-react';

export default function NavigationPod({
  currentTheme,
  zoomIn,
  zoomOut,
  shiftUp,
  shiftDown,
  shiftLeft,
  shiftRight,
  resetCamera,
  autoRotate,
  setAutoRotate
}) {
  return (
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
        <RotateCw
          className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`}
          style={{ animationDuration: '8s' }}
        />
      </button>
    </div>
  );
}

