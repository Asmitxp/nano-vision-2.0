"use client";

import React, { useState, useRef } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from "lucide-react";

interface ParticleData {
  id: number;
  particle_number: number;
  center_x: number;
  center_y: number;
  bbox_x: number;
  bbox_y: number;
  bbox_w: number;
  bbox_h: number;
  ecd_physical: number;
  area_physical: number;
  aspect_ratio: number;
  circularity: number;
  is_valid: boolean;
  is_uncertain: boolean;
  contour_points?: string;
}

interface ImageComparisonViewerProps {
  originalUrl: string;
  processedUrl?: string;
  overlayUrl?: string;
  particles: ParticleData[];
  selectedParticleId?: number | null;
  onSelectParticle?: (id: number) => void;
  onToggleParticle?: (id: number, isValid: boolean) => void;
  unit: string;
}

export default function ImageComparisonViewer({
  originalUrl,
  processedUrl,
  overlayUrl,
  particles,
  selectedParticleId,
  onSelectParticle,
  onToggleParticle,
  unit,
}: ImageComparisonViewerProps) {
  const [viewMode, setViewMode] = useState<"overlay" | "side_by_side" | "original" | "processed">("overlay");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [hoveredParticle, setHoveredParticle] = useState<ParticleData | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 4));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && e.altKey) {
      // Pan with Alt + Left Click
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="glass-panel p-3 rounded-xl border border-cyan-500/20 flex flex-wrap items-center justify-between gap-4">
        {/* View Mode Tabs */}
        <div className="flex rounded-lg bg-navy-950 p-1 border border-slate-800">
          <button
            onClick={() => setViewMode("overlay")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === "overlay"
                ? "bg-cyan-500 text-navy-950 shadow-glow-cyan"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Detection Overlay
          </button>
          <button
            onClick={() => setViewMode("side_by_side")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === "side_by_side"
                ? "bg-cyan-500 text-navy-950 shadow-glow-cyan"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Side-by-Side Comparison
          </button>
          <button
            onClick={() => setViewMode("original")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === "original"
                ? "bg-cyan-500 text-navy-950 shadow-glow-cyan"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Raw Micrograph
          </button>
          {processedUrl && (
            <button
              onClick={() => setViewMode("processed")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === "processed"
                  ? "bg-cyan-500 text-navy-950 shadow-glow-cyan"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Binary Mask
            </button>
          )}
        </div>

        {/* Zoom & Pan Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-navy-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-cyan-300 px-2 min-w-[45px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={handleResetZoom}
            className="p-2 text-slate-400 hover:text-white bg-navy-950 rounded-lg border border-slate-800 hover:bg-slate-800"
            title="Reset Zoom & Pan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Display Window */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative min-h-[500px] max-h-[650px] overflow-hidden rounded-2xl glass-panel border border-cyan-500/20 bg-black flex items-center justify-center select-none"
      >
        {/* Helper Badge */}
        <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded bg-navy-950/80 border border-slate-800 text-[11px] font-mono text-slate-400 backdrop-blur-md">
          Hold <kbd className="text-cyan-300 font-bold">Alt</kbd> + Drag to Pan • Click Particle to Inspect/Toggle
        </div>

        {/* Hovered Particle Card */}
        {hoveredParticle && (
          <div className="absolute top-3 right-3 z-10 glass-panel p-3 rounded-xl border border-cyan-500/40 text-xs shadow-glow-cyan">
            <div className="font-bold text-white flex items-center gap-2">
              <span>Particle #{hoveredParticle.particle_number}</span>
              {hoveredParticle.is_uncertain && (
                <span className="text-[10px] text-amber-400 bg-amber-950/80 px-1.5 rounded border border-amber-600/40">
                  Uncertain
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono text-slate-300 space-y-0.5 mt-1">
              <div>ECD: <span className="text-cyan-300 font-bold">{hoveredParticle.ecd_physical} {unit}</span></div>
              <div>Area: <span className="text-slate-200">{hoveredParticle.area_physical} {unit}²</span></div>
              <div>Circularity: <span className="text-slate-200">{hoveredParticle.circularity}</span></div>
              <div>Aspect Ratio: <span className="text-slate-200">{hoveredParticle.aspect_ratio}</span></div>
            </div>
          </div>
        )}

        {/* View Mode: Overlay or Single */}
        {viewMode !== "side_by_side" ? (
          <div
            className="relative transition-transform duration-75 cursor-grab active:cursor-grabbing"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
            }}
          >
            <img
              src={
                viewMode === "overlay" && overlayUrl
                  ? overlayUrl
                  : viewMode === "processed" && processedUrl
                  ? processedUrl
                  : originalUrl
              }
              alt="Microscopy Analysis"
              className="max-h-[600px] w-auto object-contain rounded-lg pointer-events-none"
            />

            {/* Interactive Particle Selection Hotspots on Overlay */}
            {viewMode === "overlay" && (
              <svg className="absolute inset-0 w-full h-full pointer-events-auto">
                {particles.map((p) => {
                  const isSelected = selectedParticleId === p.id;
                  let pointsStr = "";
                  if (p.contour_points) {
                    try {
                      const pts = JSON.parse(p.contour_points);
                      pointsStr = pts.map((pt: [number, number]) => `${pt[0]},${pt[1]}`).join(" ");
                    } catch {}
                  }

                  return (
                    <g
                      key={p.id}
                      className="cursor-pointer group"
                      onMouseEnter={() => setHoveredParticle(p)}
                      onMouseLeave={() => setHoveredParticle(null)}
                      onClick={() => {
                        if (onSelectParticle) onSelectParticle(p.id);
                        if (onToggleParticle) onToggleParticle(p.id, !p.is_valid);
                      }}
                    >
                      {pointsStr ? (
                        <polygon
                          points={pointsStr}
                          className={`transition-all ${
                            !p.is_valid
                              ? "fill-slate-800/60 stroke-slate-600 stroke-1"
                              : isSelected
                              ? "fill-cyan-400/40 stroke-cyan-300 stroke-2"
                              : p.is_uncertain
                              ? "fill-amber-500/20 stroke-amber-400 stroke-1 group-hover:stroke-2"
                              : "fill-cyan-500/15 stroke-cyan-400 stroke-1 group-hover:fill-cyan-500/30 group-hover:stroke-2"
                          }`}
                        />
                      ) : (
                        <circle
                          cx={p.center_x}
                          cy={p.center_y}
                          r={Math.max(4, p.bbox_w / 2)}
                          className={`transition-all ${
                            !p.is_valid
                              ? "fill-transparent stroke-slate-600 stroke-1"
                              : isSelected
                              ? "fill-cyan-400/40 stroke-cyan-300 stroke-2"
                              : "fill-transparent stroke-cyan-400 stroke-1 group-hover:stroke-2"
                          }`}
                        />
                      )}
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        ) : (
          /* View Mode: Side by Side */
          <div
            className="flex gap-4 p-4 transition-transform duration-75"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
            }}
          >
            <div className="flex-1 text-center">
              <span className="text-xs font-mono text-slate-400 block mb-2">Original Raw Micrograph</span>
              <img
                src={originalUrl}
                alt="Original Micrograph"
                className="max-h-[500px] w-auto object-contain rounded-lg border border-slate-800"
              />
            </div>
            <div className="flex-1 text-center">
              <span className="text-xs font-mono text-cyan-400 block mb-2">
                Watershed Segmented Overlay ({particles.length} Particles)
              </span>
              <img
                src={overlayUrl || originalUrl}
                alt="Detected Overlay"
                className="max-h-[500px] w-auto object-contain rounded-lg border border-cyan-500/30 shadow-glow-cyan"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

