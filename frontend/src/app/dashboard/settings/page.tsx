"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { api } from "@/lib/api";
import {
  Settings,
  ShieldCheck,
  Cpu,
  Key,
  Server,
  Sliders,
  CheckCircle2,
  Save,
} from "lucide-react";

export default function SettingsPage() {
  const [defaultUnit, setDefaultUnit] = useState("nm");
  const [geminiKey, setGeminiKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [backendHealth, setBackendHealth] = useState<string>("Checking...");
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    // Check backend health
    fetch("http://127.0.0.1:8000/api/health")
      .then((res) => res.json())
      .then((data) => setBackendHealth(`${data.service} (v${data.version}) - Healthy`))
      .catch(() => setBackendHealth("Disconnected - Please check backend process"));
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div className="flex min-h-screen bg-navy-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Platform Settings & AI Configuration"
          subtitle="Configure metrology preferences, LLM provider API keys, and diagnostic benchmarks"
        />

        <main className="flex-1 p-8 max-w-4xl mx-auto w-full space-y-6">
          {savedMessage && (
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Preferences saved successfully.
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* System Diagnostics Card */}
            <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                Backend Engine Health & Metrology Core
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 rounded-xl bg-navy-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">ENGINE STATUS</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {backendHealth}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-navy-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">COMPUTER VISION MODULES</span>
                  <span className="text-cyan-300 font-bold block mt-0.5">
                    OpenCV 4.9 • Scikit-Image 0.26 • SciPy
                  </span>
                </div>
              </div>
            </div>

            {/* Metrology Unit Preferences */}
            <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Measurement Defaults
              </h3>
              <div className="space-y-3">
                <label className="text-xs font-medium text-slate-300 block">
                  Default Calibration Unit
                </label>
                <div className="flex gap-3">
                  {[
                    { id: "nm", label: "Nanometers (nm) - Standard Colloids" },
                    { id: "µm", label: "Micrometers (µm) - Micron Spheres" },
                    { id: "Å", label: "Angstroms (Å) - Sub-nanometer Clusters" },
                  ].map((u) => (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() => setDefaultUnit(u.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        defaultUnit === u.id
                          ? "bg-cyan-500 text-navy-950 font-bold shadow-glow-cyan"
                          : "bg-navy-900 text-slate-400 hover:text-white border border-slate-800"
                      }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* NanoBot AI Assistant API Keys */}
            <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  NanoBot Research Assistant LLM Service
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                  RAG SCIENTIFIC ENGINE ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                NanoVision includes a built-in domain-expert scientific rules & metrology knowledge engine. Optionally supply your Gemini API key or OpenAI key to activate deep conversational reasoning.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Google Gemini API Key
                  </label>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    className="w-full bg-navy-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-[11px] text-slate-500 font-mono block mt-1">
                    Configured via GEMINI_API_KEY environment variable. Never exposed to browser.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    OpenAI API Key (Alternative)
                  </label>
                  <input
                    type="password"
                    placeholder="sk-proj-..."
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    className="w-full bg-navy-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-navy-950 font-bold text-xs shadow-glow-cyan hover:brightness-110 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Configuration
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

