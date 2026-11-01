"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { api } from "@/lib/api";
import { FileText, FileSpreadsheet, Download, Microscope, ExternalLink, Calendar } from "lucide-react";

export default function ReportsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.listProjects();
        setProjects(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="flex min-h-screen bg-navy-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Generated Scientific Reports"
          subtitle="Download academic publication-ready PDF, Excel, and CSV datasets"
        />

        <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-navy-900/40 to-navy-950">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Scientific Reporting Standards
            </h3>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed font-light">
              All PDF reports include embedded raw and segmented micrograph figures, statistical frequency tables, and an ISO 13322-1 methodology statement. Excel workbooks include multi-sheet summaries with all individual particle metrics.
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs font-mono text-slate-400">
              Loading report index...
            </div>
          ) : projects.length === 0 ? (
            <div className="p-12 text-center text-slate-400 glass-panel rounded-2xl border border-slate-800">
              No reports available yet. Run an analysis to generate export files.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="glass-panel p-5 rounded-2xl border border-cyan-500/20 glass-panel-hover flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                        {proj.image_type} METROLOGY
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(proj.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-white line-clamp-1">{proj.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 font-light">
                      {proj.description || "Microscopy dataset analysis."}
                    </p>

                    <div className="p-3 rounded-xl bg-navy-900/60 border border-slate-800/80 font-mono text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Particles:</span>
                        <span className="text-white font-bold">{proj.total_particles}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mean ECD:</span>
                        <span className="text-cyan-300 font-bold">
                          {proj.mean_diameter ? `${proj.mean_diameter} ${proj.calibration_unit}` : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Polydispersity (CV):</span>
                        <span className="text-emerald-400 font-bold">
                          {proj.cv_diameter ? `${proj.cv_diameter}%` : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2 mt-4">
                    <a
                      href={api.getReportPdfUrl(proj.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl bg-cyan-500 text-navy-950 font-bold text-xs hover:brightness-110 shadow-glow-cyan text-center flex items-center justify-center gap-1.5 transition-all"
                    >
                      <FileText className="w-3.5 h-3.5" /> PDF
                    </a>
                    <a
                      href={api.getReportExcelUrl(proj.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-3 rounded-xl bg-navy-900 border border-slate-700 hover:border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                      title="Download Excel"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                    </a>
                    <a
                      href={api.getReportCsvUrl(proj.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-3 rounded-xl bg-navy-900 border border-slate-700 text-slate-300 text-xs font-semibold hover:text-white"
                      title="Download CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

