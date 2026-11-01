"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import ParticleCanvas from "@/components/3d/ParticleCanvas";
import {
  Sparkles,
  ArrowRight,
  Microscope,
  Cpu,
  BarChart3,
  FileSpreadsheet,
  Layers,
  Sliders,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Compass,
  FileText,
  Activity,
  Atom,
} from "lucide-react";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"raw" | "segmented" | "stats">("segmented");

  return (
    <div className="relative min-h-screen text-slate-100 overflow-x-hidden">
      {/* 3D Microscopic Particle Background */}
      <ParticleCanvas />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none z-0" />

      {/* Top Navigation Bar */}
      <nav className="relative z-20 border-b border-cyan-500/10 bg-navy-950/80 backdrop-blur-md sticky top-0 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-glow-cyan">
              <Atom className="w-6 h-6 text-white group-hover:rotate-180 transition-transform duration-700" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Nano<span className="text-cyan-400">Vision</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                  AI v1.0
                </span>
              </span>
              <p className="text-[11px] text-slate-400 tracking-wide font-mono">Microscopy Metrology</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">How It Works</a>
            <a href="#ai-detection" className="hover:text-cyan-400 transition-colors">AI Detection</a>
            <a href="#measurements" className="hover:text-cyan-400 transition-colors">Metrology</a>
            <a href="#analytics" className="hover:text-cyan-400 transition-colors">Analytics</a>
            <a href="#applications" className="hover:text-cyan-400 transition-colors">Applications</a>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-cyan-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard/new-analysis"
              className="relative group px-5 py-2.5 rounded-lg text-sm font-semibold text-white overflow-hidden shadow-glow-cyan"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300 group-hover:scale-105" />
              <span className="relative flex items-center gap-2">
                Launch Platform <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-xs font-mono mb-8 backdrop-blur-md shadow-glow-cyan"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>AI-Assisted Electron Microscopy Metrology</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto"
          >
            See Beyond the <span className="text-gradient-cyan">Visible</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-light"
          >
            Transform SEM and TEM microscopy images into intelligent nanoparticle insights with AI-powered precision. Automated segmentation, watershed separation, calibrated size distributions, and academic reports.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <Link
              href="/dashboard/new-analysis"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-600 text-navy-950 font-bold text-base hover:brightness-110 shadow-glow-cyan flex items-center justify-center gap-3 transition-all"
            >
              <Microscope className="w-5 h-5" /> Start Analysis
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-slate-700 bg-navy-900/60 hover:bg-navy-800/80 text-slate-200 font-semibold text-base backdrop-blur-md flex items-center justify-center gap-2 transition-all hover:border-cyan-500/40"
            >
              Explore Technology <ChevronRight className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Interactive Hero Micrograph Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="max-w-4xl mx-auto rounded-2xl glass-panel p-2 shadow-glow-mixed border border-cyan-500/20"
          >
            <div className="p-3 border-b border-cyan-500/10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>SPECIMEN: AuNP_Colloidal_FE-SEM_15kV</span>
                <span className="text-cyan-400 ml-2">Scale: 1.67 nm/px</span>
              </div>
              <div className="flex rounded-lg bg-navy-950/80 p-1 border border-slate-800">
                <button
                  onClick={() => setActiveTab("raw")}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    activeTab === "raw" ? "bg-cyan-500 text-navy-950 font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Raw Micrograph
                </button>
                <button
                  onClick={() => setActiveTab("segmented")}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    activeTab === "segmented" ? "bg-cyan-500 text-navy-950 font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Watershed Overlay
                </button>
                <button
                  onClick={() => setActiveTab("stats")}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    activeTab === "stats" ? "bg-cyan-500 text-navy-950 font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Metrology Metrics
                </button>
              </div>
            </div>

            <div className="relative aspect-video rounded-xl overflow-hidden bg-navy-950 flex items-center justify-center border border-cyan-900/30">
              {activeTab === "raw" && (
                <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-black p-8">
                  <div className="w-full h-full rounded-lg border border-slate-800 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center relative overflow-hidden">
                    {/* Simulated realistic particle clusters */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-85">
                      <div className="w-72 h-72 rounded-full border border-slate-700/50 flex items-center justify-center relative">
                        <div className="w-20 h-20 rounded-full bg-slate-300 blur-sm absolute top-12 left-14 shadow-lg shadow-white/20" />
                        <div className="w-16 h-16 rounded-full bg-slate-400 blur-sm absolute top-24 right-16 shadow-lg shadow-white/20" />
                        <div className="w-24 h-24 rounded-full bg-slate-300 blur-sm absolute bottom-12 left-28 shadow-lg shadow-white/20" />
                        <div className="w-14 h-14 rounded-full bg-slate-400 blur-sm absolute bottom-16 right-20 shadow-lg shadow-white/20" />
                      </div>
                    </div>
                    <div className="absolute bottom-4 right-4 bg-black/80 px-3 py-1.5 rounded border border-slate-700 font-mono text-[11px] text-slate-300">
                      ─── 200 nm ─── (FE-SEM)
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "segmented" && (
                <div className="relative w-full h-full flex flex-col items-center justify-center bg-black p-6">
                  {/* Visual overlay simulation */}
                  <div className="relative w-full h-full rounded-lg border border-cyan-500/30 overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/20 via-black to-blue-950/20" />
                    {/* Glowing particle contours */}
                    <div className="relative z-10 w-80 h-80 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full border-2 border-cyan-400 shadow-[0_0_15px_#22d3ee] flex items-center justify-center absolute top-10 left-12 animate-pulse">
                        <span className="font-mono text-xs text-cyan-200">ID: 01 (32.4 nm)</span>
                      </div>
                      <div className="w-16 h-16 rounded-full border-2 border-emerald-400 shadow-[0_0_15px_#34d399] flex items-center justify-center absolute top-20 right-14">
                        <span className="font-mono text-xs text-emerald-200">ID: 02 (21.8 nm)</span>
                      </div>
                      <div className="w-28 h-28 rounded-full border-2 border-amber-400 shadow-[0_0_15px_#fbbf24] flex items-center justify-center absolute bottom-10 left-20">
                        <span className="font-mono text-xs text-amber-200">ID: 03 (38.9 nm)</span>
                      </div>
                      <div className="w-20 h-20 rounded-full border-2 border-cyan-400 shadow-[0_0_15px_#22d3ee] flex items-center justify-center absolute bottom-16 right-16">
                        <span className="font-mono text-xs text-cyan-200">ID: 04 (27.1 nm)</span>
                      </div>
                    </div>
                    <div className="absolute top-4 left-4 bg-navy-950/90 border border-cyan-500/40 rounded px-2.5 py-1 text-xs font-mono text-cyan-300">
                      Watershed Separation: ACTIVE
                    </div>
                    <div className="absolute bottom-4 right-4 bg-navy-950/90 border border-slate-700 rounded px-3 py-1 font-mono text-xs text-slate-300">
                      Calibration: 1.667 nm/pixel
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "stats" && (
                <div className="w-full h-full p-8 flex flex-col justify-center">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="glass-panel p-4 rounded-xl border border-cyan-500/20 text-center">
                      <div className="text-xs font-mono text-slate-400 mb-1">PARTICLES</div>
                      <div className="text-3xl font-extrabold text-cyan-300">53</div>
                    </div>
                    <div className="glass-panel p-4 rounded-xl border border-cyan-500/20 text-center">
                      <div className="text-xs font-mono text-slate-400 mb-1">MEAN ECD</div>
                      <div className="text-3xl font-extrabold text-white">31.2 <span className="text-sm font-normal text-cyan-400">nm</span></div>
                    </div>
                    <div className="glass-panel p-4 rounded-xl border border-cyan-500/20 text-center">
                      <div className="text-xs font-mono text-slate-400 mb-1">STD DEV (σ)</div>
                      <div className="text-3xl font-extrabold text-blue-300">± 4.6 <span className="text-sm font-normal text-blue-400">nm</span></div>
                    </div>
                    <div className="glass-panel p-4 rounded-xl border border-cyan-500/20 text-center">
                      <div className="text-xs font-mono text-slate-400 mb-1">POLYDISPERSITY</div>
                      <div className="text-3xl font-extrabold text-emerald-300">14.7% <span className="text-xs block text-slate-400 font-sans font-normal">(Monodisperse)</span></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 font-mono hover:underline"
                    >
                      View complete project results in live dashboard →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How NanoVision Works Section */}
      <section id="how-it-works" className="relative z-10 py-24 px-6 border-t border-cyan-500/10 bg-navy-900/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-3">SCIENTIFIC PIPELINE</h2>
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
              How NanoVision Works
            </h3>
            <p className="text-slate-400 max-w-xl mx-auto font-light">
              From raw electron micrograph to publication-grade statistical size distributions in 5 automated stages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              {
                step: "01",
                icon: Microscope,
                title: "Image Ingestion",
                desc: "Upload SEM or TEM files (TIFF, PNG, JPG, BMP). Automatic dimension extraction & deep magic-byte validation.",
              },
              {
                step: "02",
                icon: Sliders,
                title: "Scale Calibration",
                desc: "Manual two-point baseline or scale bar recognition. Converts pixel dimensions to physical SI units (nm, µm, Å).",
              },
              {
                step: "03",
                icon: Cpu,
                title: "AI & Watershed",
                desc: "CLAHE contrast enhancement, Otsu binarization, and Euclidean distance transforms to separate touching particles.",
              },
              {
                step: "04",
                icon: Layers,
                title: "Metrology Extraction",
                desc: "Computes Equivalent Circular Diameter (ECD), Feret caliper distance, area, perimeter, and circularity.",
              },
              {
                step: "05",
                icon: FileSpreadsheet,
                title: "Peer-Review Reports",
                desc: "Interactive histograms, cumulative distribution curves, and downloadable PDF, Excel, and CSV datasets.",
              },
            ].map((s, idx) => (
              <div
                key={idx}
                className="glass-panel p-6 rounded-2xl glass-panel-hover flex flex-col justify-between relative group border-t-2 border-t-cyan-500/30"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-2xl font-black text-cyan-500/40 group-hover:text-cyan-400 transition-colors">
                      {s.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-navy-800/80 flex items-center justify-center text-cyan-300">
                      <s.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">{s.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-light">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Metrology & Particle Size Measurement */}
      <section id="measurements" className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2 block">
                METROLOGICAL RIGOR
              </span>
              <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-6">
                Scientifically Accurate 2D & 3D Morphological Parameters
              </h3>
              <p className="text-slate-300 mb-6 leading-relaxed font-light">
                Standard image software often misinterprets touching aggregates as oversized single particles. NanoVision separates contact necks with topological watershed segmentation and isolates boundary particles to prevent truncation bias.
              </p>

              <div className="space-y-4">
                {[
                  {
                    name: "Equivalent Circular Diameter (ECD)",
                    formula: "ECD = 2 · √(Area / π)",
                    desc: "Rotational-invariant size descriptor matching Dynamic Light Scattering (DLS) hydrodynamic diameter.",
                  },
                  {
                    name: "Maximum Feret Caliper Distance",
                    formula: "Max caliper span between convex hull vertices",
                    desc: "Critical for characterizing nanorods, nanowires, and irregular core-shell structures.",
                  },
                  {
                    name: "Circularity & Aspect Ratio",
                    formula: "Circularity = 4π · Area / Perimeter²",
                    desc: "Differentiates true spherical colloids from aggregates, flakes, and fragmented precursors.",
                  },
                ].map((m, idx) => (
                  <div key={idx} className="glass-panel p-4 rounded-xl border border-slate-800 hover:border-cyan-500/30 transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-white text-sm">{m.name}</h4>
                      <code className="text-[11px] font-mono text-cyan-300 bg-navy-950 px-2 py-0.5 rounded border border-cyan-900/50">
                        {m.formula}
                      </code>
                    </div>
                    <p className="text-xs text-slate-400">{m.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Scientific Diagram Card */}
            <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20 shadow-glow-mixed">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <span className="text-xs font-mono text-slate-300 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  PARTICLE PROJECTION METRICS
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                  ISO 13322-1 COMPLIANT
                </span>
              </div>

              <div className="space-y-6">
                <div className="bg-navy-950/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">Mean ECD</div>
                    <div className="text-2xl font-bold text-white">31.2 nm</div>
                  </div>
                  <div className="h-8 w-px bg-slate-800" />
                  <div>
                    <div className="text-xs text-slate-400">Median (D50)</div>
                    <div className="text-2xl font-bold text-cyan-300">29.8 nm</div>
                  </div>
                  <div className="h-8 w-px bg-slate-800" />
                  <div>
                    <div className="text-xs text-slate-400">Std Deviation</div>
                    <div className="text-2xl font-bold text-blue-300">± 4.6 nm</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-navy-900/30 text-xs text-slate-400 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-300 font-medium">
                    <ShieldCheck className="w-4 h-4" /> Uncertainty & Border Detection
                  </div>
                  <p>
                    Particles intersecting image borders are automatically marked with uncertainty flags rather than discarding or misreporting sliced cross-sections.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Research Applications Section */}
      <section id="applications" className="relative z-10 py-24 px-6 border-t border-cyan-500/10 bg-navy-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-3">APPLIED NANOTECHNOLOGY</h2>
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Built for Modern Materials Science
            </h3>
            <p className="text-slate-400 max-w-xl mx-auto font-light">
              From synthetic chemistry to semiconductor manufacturing, NanoVision accelerates characterization pipelines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Colloidal Gold & Silver",
                desc: "Surface Plasmon Resonance (SPR) depends strictly on particle diameter and aspect ratio. Confirm monodispersity in seconds.",
                tag: "PLASMONICS",
              },
              {
                title: "Semiconductor Quantum Dots",
                desc: "Quantum confinement alters emission wavelengths by fractions of a nanometer. High-precision ECD distributions ensure color purity.",
                tag: "OPTOELECTRONICS",
              },
              {
                title: "Lipid Nanoparticles & Drug Delivery",
                desc: "Analyze cryo-TEM formulations for mRNA vaccine encapsulation, verifying vesicle size and absence of micron-scale agglomerates.",
                tag: "NANOMEDICINE",
              },
              {
                title: "Battery & Energy Nanomaterials",
                desc: "Measure cathode/anode active material morphology (LFP, NMC, silicon nanoparticles) to optimize ion diffusion kinetics.",
                tag: "ENERGY STORAGE",
              },
              {
                title: "Heterogeneous Catalysis",
                desc: "Determine active surface area and dispersion of supported metal catalysts (Pt, Pd, Ru on carbon/titania).",
                tag: "CATALYSIS",
              },
              {
                title: "Academic & Laboratory Teaching",
                desc: "Equip undergraduate and graduate students with an intuitive, reproducible microscopy characterization suite.",
                tag: "EDUCATION",
              },
            ].map((app, idx) => (
              <div key={idx} className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-cyan-500/30 transition-all flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40 mb-3 inline-block">
                    {app.tag}
                  </span>
                  <h4 className="text-lg font-bold text-white mb-2">{app.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-light">{app.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto rounded-3xl p-10 md:p-14 glass-panel border border-cyan-500/40 text-center relative overflow-hidden shadow-glow-mixed">
          <div className="relative z-10">
            <h3 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
              Ready to Accelerate Your Nanoparticle Research?
            </h3>
            <p className="text-slate-300 max-w-xl mx-auto mb-8 font-light">
              Experience automated scale calibration, watershed segmentation, and publication-ready metrology reports today.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/dashboard/new-analysis"
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 text-navy-950 font-bold text-sm shadow-glow-cyan hover:brightness-110 transition-all flex items-center gap-2"
              >
                Start New Analysis <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="px-6 py-3.5 rounded-xl border border-slate-700 bg-navy-900/80 text-white font-semibold text-sm hover:border-cyan-500/40 transition-all"
              >
                Open Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-cyan-500/10 py-10 px-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Atom className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-200">NanoVision AI</span> — Automated Electron Microscopy Metrology
          </div>
          <div>
            Built with OpenCV, Scikit-Image, FastAPI & Next.js. ISO 13322 Compliant Metrology.
          </div>
          <div className="flex items-center gap-2 text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            API Metrology Engine: Online
          </div>
        </div>
      </footer>
    </div>
  );
}

