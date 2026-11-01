"use client";

import React, { useState, useRef, useEffect } from "react";
import { Ruler, CheckCircle, Crosshair, HelpCircle, ArrowRight } from "lucide-react";

interface CalibrationToolProps {
  imageUrl: string;
  onCalibrationComplete: (data: {
    method: "manual" | "scale_bar";
    point1?: [number, number];
    point2?: [number, number];
    scale_bar_bbox?: [number, number, number, number];
    known_distance: number;
    unit: string;
    factor: number;
  }) => void;
  initialFactor?: number;
  initialUnit?: string;
}

export default function CalibrationTool({
  imageUrl,
  onCalibrationComplete,
  initialFactor,
  initialUnit = "nm",
}: CalibrationToolProps) {
  const [method, setMethod] = useState<"manual" | "scale_bar">("manual");
  const [unit, setUnit] = useState<string>(initialUnit);
  const [knownDistance, setKnownDistance] = useState<number>(100);
  const [points, setPoints] = useState<[number, number][]>([]);
  const [boxStart, setBoxStart] = useState<[number, number] | null>(null);
  const [boxEnd, setBoxEnd] = useState<[number, number] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pixelDistance, setPixelDistance] = useState<number | null>(null);
  const [calculatedFactor, setCalculatedFactor] = useState<number | null>(initialFactor || null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load Image onto Canvas
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      imageRef.current = img;
      redrawCanvas();
    };
  }, [imageUrl]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions to image natural size or scaled size
    canvas.width = imageRef.current.naturalWidth || 800;
    canvas.height = imageRef.current.naturalHeight || 600;

    // Draw base micrograph
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);

    // Draw manual calibration points & line
    if (method === "manual") {
      if (points.length > 0) {
        ctx.strokeStyle = "#22d3ee";
        ctx.fillStyle = "#22d3ee";
        ctx.lineWidth = 3;

        points.forEach(([x, y], idx) => {
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Text label
          ctx.font = "bold 14px monospace";
          ctx.fillStyle = "#ffffff";
          ctx.fillText(`P${idx + 1}`, x + 10, y - 10);
        });

        if (points.length === 2) {
          ctx.beginPath();
          ctx.setLineDash([6, 4]);
          ctx.moveTo(points[0][0], points[0][1]);
          ctx.lineTo(points[1][0], points[1][1]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Midpoint distance label
          const mx = (points[0][0] + points[1][0]) / 2;
          const my = (points[0][1] + points[1][1]) / 2;
          const dist = Math.sqrt(
            Math.pow(points[1][0] - points[0][0], 2) + Math.pow(points[1][1] - points[0][1], 2)
          );
          ctx.fillStyle = "rgba(6, 13, 36, 0.85)";
          ctx.fillRect(mx - 40, my - 25, 80, 24);
          ctx.strokeStyle = "#22d3ee";
          ctx.strokeRect(mx - 40, my - 25, 80, 24);
          ctx.fillStyle = "#22d3ee";
          ctx.font = "12px monospace";
          ctx.fillText(`${dist.toFixed(1)} px`, mx - 30, my - 9);
        }
      }
    } else if (method === "scale_bar") {
      // Scale bar box
      if (boxStart && boxEnd) {
        const x = Math.min(boxStart[0], boxEnd[0]);
        const y = Math.min(boxStart[1], boxEnd[1]);
        const w = Math.abs(boxEnd[0] - boxStart[0]);
        const h = Math.abs(boxEnd[1] - boxStart[1]);

        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.fillStyle = "rgba(56, 189, 248, 0.2)";
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);

        // Width label
        ctx.font = "12px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`Scale Bar: ${w.toFixed(1)} px`, x + 5, y - 8);
      }
    }
  };

  useEffect(() => {
    redrawCanvas();
  }, [points, boxStart, boxEnd, method]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (method !== "manual") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (points.length === 2) {
      setPoints([[x, y]]);
      setPixelDistance(null);
      setCalculatedFactor(null);
    } else {
      const updated: [number, number][] = [...points, [x, y]];
      setPoints(updated);
      if (updated.length === 2) {
        const dist = Math.sqrt(
          Math.pow(updated[1][0] - updated[0][0], 2) + Math.pow(updated[1][1] - updated[0][1], 2)
        );
        setPixelDistance(dist);
        if (knownDistance > 0 && dist > 0) {
          setCalculatedFactor(knownDistance / dist);
        }
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (method !== "scale_bar") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setBoxStart([x, y]);
    setBoxEnd([x, y]);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (method !== "scale_bar" || !isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setBoxEnd([x, y]);
  };

  const handleMouseUp = () => {
    if (method !== "scale_bar" || !isDragging) return;
    setIsDragging(false);
    if (boxStart && boxEnd) {
      const w = Math.abs(boxEnd[0] - boxStart[0]);
      if (w > 5) {
        setPixelDistance(w);
        if (knownDistance > 0) {
          setCalculatedFactor(knownDistance / w);
        }
      }
    }
  };

  const updateKnownDistance = (val: number) => {
    setKnownDistance(val);
    if (pixelDistance && pixelDistance > 0 && val > 0) {
      setCalculatedFactor(val / pixelDistance);
    }
  };

  const handleConfirm = () => {
    if (!calculatedFactor || !pixelDistance) return;

    onCalibrationComplete({
      method,
      point1: points[0],
      point2: points[1],
      scale_bar_bbox:
        boxStart && boxEnd
          ? [
              Math.min(boxStart[0], boxEnd[0]),
              Math.min(boxStart[1], boxEnd[1]),
              Math.abs(boxEnd[0] - boxStart[0]),
              Math.abs(boxEnd[1] - boxStart[1]),
            ]
          : undefined,
      known_distance: knownDistance,
      unit,
      factor: calculatedFactor,
    });
  };

  return (
    <div className="space-y-6">
      {/* Method selector and inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Calibration Method */}
        <div className="glass-panel p-4 rounded-xl border border-cyan-500/20">
          <label className="text-xs font-semibold text-slate-300 block mb-2 flex items-center gap-1.5">
            <Ruler className="w-4 h-4 text-cyan-400" /> Calibration Method
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setMethod("manual");
                setPoints([]);
                setPixelDistance(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                method === "manual"
                  ? "bg-cyan-500 text-navy-950 shadow-glow-cyan"
                  : "bg-navy-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              Manual Two-Point
            </button>
            <button
              onClick={() => {
                setMethod("scale_bar");
                setBoxStart(null);
                setBoxEnd(null);
                setPixelDistance(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                method === "scale_bar"
                  ? "bg-cyan-500 text-navy-950 shadow-glow-cyan"
                  : "bg-navy-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              Scale-Bar Box
            </button>
          </div>
        </div>

        {/* Known Physical Length */}
        <div className="glass-panel p-4 rounded-xl border border-cyan-500/20">
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Known Physical Length
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0.001"
              step="any"
              value={knownDistance}
              onChange={(e) => updateKnownDistance(parseFloat(e.target.value) || 0)}
              className="flex-1 bg-navy-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="bg-navy-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
            >
              <option value="nm">nm (Nanometers)</option>
              <option value="µm">µm (Micrometers)</option>
              <option value="Å">Å (Angstroms)</option>
            </select>
          </div>
        </div>

        {/* Live Factor Output & Confirm */}
        <div className="glass-panel p-4 rounded-xl border border-cyan-500/20 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-1">Scale Factor</div>
            {calculatedFactor ? (
              <div className="font-mono text-sm text-cyan-300 font-bold">
                1 px = {calculatedFactor.toFixed(4)} {unit}
                <span className="block text-[10px] text-slate-400 font-normal">
                  ({(1 / calculatedFactor).toFixed(2)} px / {unit})
                </span>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic font-light">
                {method === "manual" ? "Click 2 points on image..." : "Drag box over scale bar..."}
              </div>
            )}
          </div>
          <button
            onClick={handleConfirm}
            disabled={!calculatedFactor}
            className="w-full mt-2 py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-navy-950 font-bold text-xs shadow-glow-cyan hover:brightness-110 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
          >
            <CheckCircle className="w-3.5 h-3.5" /> Apply Scale Calibration
          </button>
        </div>
      </div>

      {/* Interactive Canvas Viewer */}
      <div className="relative glass-panel rounded-2xl p-3 border border-cyan-500/30 overflow-hidden">
        <div className="p-2 mb-2 bg-navy-950/80 rounded-lg border border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-cyan-400" />
            <span>
              {method === "manual"
                ? "Click 2 points across a known distance (e.g. micron bar endpoints)."
                : "Click and drag a rectangle over the embedded scale bar."}
            </span>
          </div>
          {pixelDistance && (
            <div className="font-mono text-cyan-300">
              Measured: <span className="font-bold">{pixelDistance.toFixed(1)} pixels</span>
            </div>
          )}
        </div>

        <div className="overflow-auto max-h-[550px] rounded-xl bg-black flex justify-center">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="cursor-crosshair max-w-full h-auto object-contain"
          />
        </div>
      </div>
    </div>
  );
}

