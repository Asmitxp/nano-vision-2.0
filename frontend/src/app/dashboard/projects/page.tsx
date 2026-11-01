"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { api } from "@/lib/api";
import {
  FolderKanban,
  Microscope,
  Trash2,
  Edit2,
  FileText,
  FileSpreadsheet,
  Download,
  Eye,
  PlusCircle,
  Search,
  Scale,
  CheckSquare,
  Square,
  X,
  Check,
} from "lucide-react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "SEM" | "TEM">("ALL");
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
  const [comparisonResults, setComparisonResults] = useState<any[] | null>(null);

  // Edit Title Modal
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await api.listProjects();
      setProjects(data);
    } catch (err) {
      console.error("Error loading projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this project and its particle data?")) return;
    try {
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setSelectedForCompare((prev) => prev.filter((pId) => pId !== id));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleSaveTitle = async () => {
    if (!editingProject) return;
    try {
      await api.updateProject(editingProject.id, { title: editTitle });
      setProjects((prev) =>
        prev.map((p) => (p.id === editingProject.id ? { ...p, title: editTitle } : p))
      );
      setEditingProject(null);
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const toggleSelectForCompare = (id: number) => {
    setSelectedForCompare((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const runComparison = async () => {
    if (selectedForCompare.length < 2) {
      alert("Please select at least 2 projects to compare distributions.");
      return;
    }
    try {
      const res = await api.compareProjects(selectedForCompare);
      setComparisonResults(res.samples);
    } catch (err: any) {
      alert(`Comparison failed: ${err.message}`);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "ALL" || p.image_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex min-h-screen bg-navy-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Project & Sample Management"
          subtitle="Manage microscopy datasets, reopen analyses, and compare particle size distributions"
        />

        <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Action and Filter Bar */}
          <div className="glass-panel p-4 rounded-2xl border border-cyan-500/20 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search project title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-navy-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-52"
                />
              </div>

              {/* Type Filter */}
              <div className="flex rounded-lg bg-navy-900 p-0.5 border border-slate-800 text-xs">
                {(["ALL", "SEM", "TEM"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-3 py-1 rounded font-medium transition-colors ${
                      filterType === t
                        ? "bg-cyan-500 text-navy-950 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {selectedForCompare.length > 0 && (
                <button
                  onClick={runComparison}
                  className="px-4 py-2 rounded-lg bg-purple-900/80 border border-purple-500/50 text-purple-200 text-xs font-bold hover:bg-purple-800 transition-all flex items-center gap-1.5"
                >
                  <Scale className="w-4 h-4 text-purple-300" />
                  Compare {selectedForCompare.length} Selected Samples
                </button>
              )}

              <Link
                href="/dashboard/new-analysis"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-navy-950 font-bold text-xs shadow-glow-cyan hover:brightness-110 transition-all flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" /> New Specimen
              </Link>
            </div>
          </div>

          {/* Multi-Sample Comparison Table Modal / Section */}
          {comparisonResults && (
            <div className="glass-panel p-6 rounded-2xl border border-purple-500/40 shadow-glow-mixed space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">
                    Multi-Sample Particle Metrology Comparison
                  </h3>
                </div>
                <button
                  onClick={() => setComparisonResults(null)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-navy-900 text-slate-300 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Project Sample</th>
                      <th className="py-2.5 px-3">Modality</th>
                      <th className="py-2.5 px-3">Valid Particles</th>
                      <th className="py-2.5 px-3 text-cyan-300 font-bold">Mean ECD</th>
                      <th className="py-2.5 px-3">Median (D50)</th>
                      <th className="py-2.5 px-3">Std Dev (σ)</th>
                      <th className="py-2.5 px-3">CV %</th>
                      <th className="py-2.5 px-3">Range (Min - Max)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {comparisonResults.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-3 font-bold text-white">{s.title}</td>
                        <td className="py-2.5 px-3 text-cyan-400">{s.image_type}</td>
                        <td className="py-2.5 px-3">{s.total_particles}</td>
                        <td className="py-2.5 px-3 font-bold text-cyan-300">
                          {s.mean_diameter} {s.unit}
                        </td>
                        <td className="py-2.5 px-3">{s.median_diameter} {s.unit}</td>
                        <td className="py-2.5 px-3">± {s.std_diameter} {s.unit}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-300">{s.cv_percent}%</td>
                        <td className="py-2.5 px-3">
                          {s.min_diameter} - {s.max_diameter} {s.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Project Cards Grid */}
          {loading ? (
            <div className="p-12 text-center font-mono text-xs text-slate-400">
              Loading projects from database...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3 glass-panel rounded-2xl border border-slate-800">
              <FolderKanban className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No projects found</p>
              <p className="text-xs text-slate-500">
                {searchTerm ? "No projects match your search query." : "Upload an electron micrograph to create a project."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((proj) => {
                const isSelected = selectedForCompare.includes(proj.id);
                return (
                  <div
                    key={proj.id}
                    className={`glass-panel rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? "border-purple-500 shadow-glow-mixed"
                        : "border-cyan-500/20 hover:border-cyan-500/40"
                    }`}
                  >
                    <div>
                      {/* Image Thumbnail Header */}
                      <div className="relative aspect-video bg-black overflow-hidden border-b border-slate-800">
                        {proj.overlay_image || proj.original_image ? (
                          <img
                            src={api.getImageUrl(proj.overlay_image || proj.original_image)}
                            alt={proj.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <Microscope className="w-8 h-8" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 flex items-center gap-1.5">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-navy-950/90 text-cyan-300 border border-cyan-500/30">
                            {proj.image_type}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-navy-950/90 text-slate-300 border border-slate-800">
                            {proj.calibration_factor} {proj.calibration_unit}/px
                          </span>
                        </div>

                        {/* Compare Checkbox */}
                        <button
                          onClick={() => toggleSelectForCompare(proj.id)}
                          className="absolute top-2 right-2 p-1 rounded-md bg-navy-950/90 border border-slate-700 text-purple-300 hover:text-white"
                          title="Select for Comparison"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-purple-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm text-white line-clamp-1">{proj.title}</h4>
                          <button
                            onClick={() => {
                              setEditingProject(proj);
                              setEditTitle(proj.title);
                            }}
                            className="text-slate-400 hover:text-cyan-300 p-1 rounded hover:bg-slate-800"
                            title="Rename"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 font-light">
                          {proj.description || "No description recorded."}
                        </p>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 font-mono text-[11px]">
                          <div>
                            <span className="text-slate-500 block text-[10px]">PARTICLES</span>
                            <span className="text-white font-bold">{proj.total_particles}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">MEAN ECD</span>
                            <span className="text-cyan-300 font-bold">
                              {proj.mean_diameter ? `${proj.mean_diameter} ${proj.calibration_unit}` : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 bg-navy-950/80 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <a
                          href={api.getReportPdfUrl(proj.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
                          title="Download PDF"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={api.getReportExcelUrl(proj.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
                          title="Download Excel"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDelete(proj.id)}
                          className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <Link
                        href={`/dashboard/new-analysis?project_id=${proj.id}`}
                        className="px-3.5 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500 hover:text-navy-950 font-bold text-xs flex items-center gap-1 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> Re-open
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rename Modal */}
          {editingProject && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 max-w-md w-full space-y-4">
                <h3 className="text-base font-bold text-white">Rename Project</h3>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-navy-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setEditingProject(null)}
                    className="px-4 py-2 rounded-lg border border-slate-700 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTitle}
                    className="px-5 py-2 rounded-lg bg-cyan-500 text-navy-950 text-xs font-bold hover:brightness-110"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

