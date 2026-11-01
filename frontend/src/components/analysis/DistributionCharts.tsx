"use client";

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { BarChart3, TrendingUp, Sliders, Info, ShieldAlert } from "lucide-react";

interface HistogramBin {
  bin_start: number;
  bin_end: number;
  bin_mid: number;
  count: number;
  frequency: number;
}

interface CumulativePoint {
  diameter: number;
  cumulative_percentage: number;
}

interface StatisticsProps {
  total_detected: number;
  valid_count: number;
  uncertain_count: number;
  unit: string;
  mean_diameter: number;
  median_diameter: number;
  std_diameter: number;
  min_diameter: number;
  max_diameter: number;
  p25_diameter: number;
  p75_diameter: number;
  cv_percent: number;
  mean_aspect_ratio: number;
  mean_circularity: number;
  histogram: HistogramBin[];
  cumulative_distribution: CumulativePoint[];
}

interface DistributionChartsProps {
  stats: StatisticsProps;
}

export default function DistributionCharts({ stats }: DistributionChartsProps) {
  const [activeChart, setActiveChart] = useState<"histogram" | "cdf" | "frequency">("histogram");

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-2.5 rounded-lg border border-cyan-500/40 text-xs font-mono shadow-glow-cyan">
          <p className="text-cyan-300 font-bold">
            Diameter: {label} {stats.unit}
          </p>
          <p className="text-white">
            Count: <span className="font-bold">{payload[0].value}</span>
          </p>
          {payload[0].payload.frequency && (
            <p className="text-slate-400">
              Frequency: {payload[0].payload.frequency}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const customCdfTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-2.5 rounded-lg border border-cyan-500/40 text-xs font-mono shadow-glow-cyan">
          <p className="text-cyan-300 font-bold">
            Diameter: {label} {stats.unit}
          </p>
          <p className="text-white">
            Cumulative: <span className="font-bold">{payload[0].value.toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Primary Metrology Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="glass-panel p-3.5 rounded-xl border border-cyan-500/20 text-center">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">MEAN ECD (μ)</div>
          <div className="text-2xl font-black text-white mt-1">
            {stats.mean_diameter}{" "}
            <span className="text-xs font-normal text-cyan-400 font-mono">{stats.unit}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">± {stats.std_diameter} {stats.unit} (1σ)</div>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border border-cyan-500/20 text-center">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">MEDIAN (D50)</div>
          <div className="text-2xl font-black text-cyan-300 mt-1">
            {stats.median_diameter}{" "}
            <span className="text-xs font-normal text-cyan-400 font-mono">{stats.unit}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">50th Percentile</div>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border border-cyan-500/20 text-center">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">POLYDISPERSITY (CV)</div>
          <div className="text-2xl font-black text-emerald-300 mt-1">
            {stats.cv_percent}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {stats.cv_percent < 15 ? "Monodisperse" : "Polydisperse"}
          </div>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border border-cyan-500/20 text-center">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">SIZE RANGE</div>
          <div className="text-xl font-bold text-slate-200 mt-1">
            {stats.min_diameter} - {stats.max_diameter}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{stats.unit} (Min - Max)</div>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border border-cyan-500/20 text-center">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">IQR (P25 - P75)</div>
          <div className="text-xl font-bold text-slate-200 mt-1">
            {stats.p25_diameter} - {stats.p75_diameter}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{stats.unit} (Interquartile)</div>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border border-cyan-500/20 text-center">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">MORPHOLOGY</div>
          <div className="text-xl font-bold text-white mt-1">
            {stats.mean_circularity.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Mean Circularity (0-1)</div>
        </div>
      </div>

      {/* Interactive Chart Container */}
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 shadow-glow-mixed">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              Particle Size Distribution Metrology
            </h3>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              Based on {stats.valid_count} validated particles ({stats.uncertain_count} flagged/uncertain excluded from pure stats).
            </p>
          </div>

          <div className="flex rounded-lg bg-navy-950 p-1 border border-slate-800">
            <button
              onClick={() => setActiveChart("histogram")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeChart === "histogram"
                  ? "bg-cyan-500 text-navy-950 shadow-glow-cyan"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Frequency Histogram
            </button>
            <button
              onClick={() => setActiveChart("cdf")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeChart === "cdf"
                  ? "bg-cyan-500 text-navy-950 shadow-glow-cyan"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Cumulative Distribution (CDF)
            </button>
            <button
              onClick={() => setActiveChart("frequency")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeChart === "frequency"
                  ? "bg-cyan-500 text-navy-950 shadow-glow-cyan"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Relative % Density Curve
            </button>
          </div>
        </div>

        {/* Chart Rendering */}
        <div className="h-72 w-full">
          {activeChart === "histogram" && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.histogram} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="bin_mid"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(val) => `${val}`}
                  label={{ value: `ECD Diameter (${stats.unit})`, position: "insideBottom", offset: -10, fill: "#94a3b8", fontSize: 11 }}
                />
                <YAxis stroke="#94a3b8" fontSize={11} label={{ value: "Particle Count", angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip content={customTooltip} />
                <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {activeChart === "cdf" && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.cumulative_distribution} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="diameter"
                  stroke="#94a3b8"
                  fontSize={11}
                  label={{ value: `Particle Diameter (${stats.unit})`, position: "insideBottom", offset: -10, fill: "#94a3b8", fontSize: 11 }}
                />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} label={{ value: "Cumulative % (CDF)", angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip content={customCdfTooltip} />
                <Line
                  type="monotone"
                  dataKey="cumulative_percentage"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  dot={{ r: 2, fill: "#22d3ee" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {activeChart === "frequency" && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.histogram} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="freqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="bin_mid"
                  stroke="#94a3b8"
                  fontSize={11}
                  label={{ value: `ECD Diameter (${stats.unit})`, position: "insideBottom", offset: -10, fill: "#94a3b8", fontSize: 11 }}
                />
                <YAxis stroke="#94a3b8" fontSize={11} label={{ value: "Relative Frequency (%)", angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip content={customTooltip} />
                <Area type="monotone" dataKey="frequency" stroke="#06b6d4" fillOpacity={1} fill="url(#freqGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

