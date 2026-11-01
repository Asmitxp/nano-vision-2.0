"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { api } from "@/lib/api";
import {
  Microscope,
  Cpu,
  Layers,
  ArrowRight,
  TrendingUp,
  Clock,
  FileText,
  Activity,
  PlusCircle,
  Eye,
  CheckCircle2,
} from "lucide-react";

export default function DashboardOverview() {
  const [stats, setStats] = useState<{
    total_images: number;
    total_particles: number;
    avg_particle_diameter: number;
    recent_projects: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  return (
    <div className="flex min-h-screen bg-navy-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Microscopy Analytics Overview"
          subtitle="Real-time electron micrograph metrology and particle population registry"
        />

        <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Scientific Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 glass-panel-hover flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase text-slate-400">Total Micrographs</span>
                <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                  <Microscope className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white">
                  {loading ? "..." : stats?.total_images ?? 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> SEM & TEM Datasets
                </div>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 glass-panel-hover flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase text-slate-400">Total Particles Detected</span>
                <div className="w-9 h-9 rounded-xl bg-blue-950 border border-blue-500/30 flex items-center justify-center text-blue-300">
                  <Cpu className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-cyan-300">
                  {loading ? "..." : (stats?.total_particles ?? 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  Watershed segmented & isolated
                </div>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 glass-panel-hover flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase text-slate-400">Average Particle ECD</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white">
                  {loading ? "..." : stats?.avg_particle_diameter ?? 0}{" "}
                  <span className="text-sm font-normal text-cyan-400 font-mono">nm</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  Global mean equivalent diameter
                </div>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 glass-panel-hover flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase text-slate-400">Metrology Standard</span>
                <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-100">ISO 13322-1</div>
                <div className="text-[11px] text-emerald-400 mt-1 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Calibrated SI Units
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Banner */}
          <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-navy-900/60 to-navy-950/80">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-cyan-400" />
                Start a New Microscopy Characterization
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-light">
                Upload SEM or TEM micrographs, calibrate with manual two-point or scale-bar tools, and generate reports.
              </p>
            </div>
            <Link
              href="/dashboard/new-analysis"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-navy-950 font-bold text-xs shadow-glow-cyan hover:brightness-110 transition-all flex items-center gap-2"
            >
              <span>Launch Analysis Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Recent Analysis Activity */}
          <div className="glass-panel rounded-2xl border border-cyan-500/20 overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-navy-950/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Recent Specimen Analyses</h3>
              </div>
              <Link
                href="/dashboard/projects"
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono hover:underline"
              >
                View all projects →
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 font-mono">
                Loading microscopy project registry...
              </div>
            ) : !stats?.recent_projects || stats.recent_projects.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <Microscope className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No analyzed micrographs yet</p>
                <p className="text-xs text-slate-500">
                  Upload an SEM or TEM image to begin quantitative particle size distribution analysis.
                </p>
                <Link
                  href="/dashboard/new-analysis"
                  className="inline-block px-4 py-2 rounded-lg bg-cyan-500 text-navy-950 text-xs font-bold mt-2"
                >
                  Start First Analysis
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {stats.recent_projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {proj.overlay_image || proj.original_image ? (
                        <img
                          src={api.getImageUrl(proj.overlay_image || proj.original_image)}
                          alt={proj.title}
                          className="w-16 h-12 object-cover rounded-lg border border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-12 bg-navy-900 rounded-lg border border-slate-800 flex items-center justify-center text-slate-600">
                          <Microscope className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{proj.title}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                            {proj.image_type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 font-light">
                          {proj.description || "No description provided"}
                        </p>
                        <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 mt-1">
                          <span>
                            Scale: <span className="text-cyan-400">{proj.calibration_factor} {proj.calibration_unit}/px</span>
                          </span>
                          <span>
                            Particles: <span className="text-slate-200 font-bold">{proj.total_particles}</span>
                          </span>
                          {proj.mean_diameter && (
                            <span>
                              Mean: <span className="text-emerald-400 font-bold">{proj.mean_diameter} {proj.calibration_unit}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <a
                        href={api.getReportPdfUrl(proj.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg border border-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" /> PDF
                      </a>
                      <Link
                        href={`/dashboard/new-analysis?project_id=${proj.id}`}
                        className="px-4 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500 hover:text-navy-950 font-bold text-xs flex items-center gap-1.5 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Analysis
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

