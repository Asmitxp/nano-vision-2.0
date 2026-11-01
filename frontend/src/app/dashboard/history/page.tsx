"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { api } from "@/lib/api";
import { History, Microscope, FileText, Download, Eye, Calendar, ArrowRight } from "lucide-react";

export default function HistoryPage() {
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
          title="Microscopy Analysis History"
          subtitle="Audit log and chronological index of processed SEM and TEM electron micrographs"
        />

        <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="glass-panel rounded-2xl border border-cyan-500/20 overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-navy-950/80 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                Chronological Audit Records ({projects.length})
              </h3>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs font-mono text-slate-400">
                Loading analysis history...
              </div>
            ) : projects.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Microscope className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs">No analysis history recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-navy-900 text-slate-300 border-b border-slate-800 text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Date / Time</th>
                      <th className="py-3 px-4">Specimen Title</th>
                      <th className="py-3 px-4">Modality</th>
                      <th className="py-3 px-4">Scale Factor</th>
                      <th className="py-3 px-4">Particles</th>
                      <th className="py-3 px-4 text-cyan-300 font-bold">Mean ECD</th>
                      <th className="py-3 px-4">CV %</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {projects.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4 text-slate-400">
                          {new Date(p.created_at).toLocaleDateString()} {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 font-bold text-white font-sans">{p.title}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40 text-[10px]">
                            {p.image_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {p.calibration_factor} {p.calibration_unit}/px
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-100">{p.total_particles}</td>
                        <td className="py-3 px-4 font-bold text-cyan-300">
                          {p.mean_diameter ? `${p.mean_diameter} ${p.calibration_unit}` : "N/A"}
                        </td>
                        <td className="py-3 px-4 text-emerald-400">
                          {p.cv_diameter ? `${p.cv_diameter}%` : "N/A"}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <a
                            href={api.getReportPdfUrl(p.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block px-2.5 py-1 rounded bg-navy-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white text-[11px]"
                          >
                            PDF
                          </a>
                          <Link
                            href={`/dashboard/new-analysis?project_id=${p.id}`}
                            className="inline-block px-3 py-1 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500 hover:text-navy-950 font-bold text-[11px]"
                          >
                            Inspect
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

