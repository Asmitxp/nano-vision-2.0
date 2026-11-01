"use client";

import React, { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { api } from "@/lib/api";
import {
  Bot,
  Send,
  Atom,
  Sparkles,
  Layers,
  Microscope,
  HelpCircle,
  FileText,
  RotateCcw,
  Activity,
  CheckCircle2,
} from "lucide-react";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export default function DedicatedAssistantPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Welcome to the **NanoBot Microscopy Intelligence Center**.\n\nI am connected to your database and can inspect specific project metrics, explain electron beam-specimen physics (SEM/TEM), or discuss colloidal crystallization, Ostwald ripening, and polydispersity reduction. Select an active specimen above to ground our conversation in your exact experimental data.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await api.listProjects();
        setProjects(data);
        if (data.length > 0) {
          setSelectedProjectId(data[0].id);
        }
      } catch (err) {
        console.error("Project load error:", err);
      }
    }
    loadProjects();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (customPrompt?: string) => {
    const query = (customPrompt || input).trim();
    if (!query || loading) return;

    const newMsgs: Message[] = [...messages, { role: "user", content: query }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const res = await api.queryChatbot({
        message: query,
        project_id: selectedProjectId || undefined,
        history: newMsgs.slice(-8).map((m) => ({ role: m.role, content: m.content })),
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.reply || "No response received." },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Error communicating with NanoBot: ${err.message || "Failed to query AI service."}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="flex min-h-screen bg-navy-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          title="NanoBot AI Metrology Assistant"
          subtitle="Grounded scientific dialogue, electron microscopy physics & statistical interpretation"
        />

        <main className="flex-1 flex flex-col p-6 max-w-6xl mx-auto w-full overflow-hidden">
          {/* Context Selector Bar */}
          <div className="glass-panel p-3.5 rounded-2xl border border-cyan-500/20 flex flex-wrap items-center justify-between gap-4 mb-4 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Microscope className="w-4 h-4 text-cyan-400" /> Active Specimen Context:
              </span>
              <select
                value={selectedProjectId || ""}
                onChange={(e) => setSelectedProjectId(parseInt(e.target.value, 10) || null)}
                className="bg-navy-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
              >
                <option value="">None (General Microscopy Theory)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.id} - {p.title} ({p.image_type}, {p.total_particles} particles)
                  </option>
                ))}
              </select>
            </div>

            {selectedProject && (
              <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                <span>
                  Mean ECD:{" "}
                  <span className="text-white font-bold">
                    {selectedProject.mean_diameter || "N/A"} {selectedProject.calibration_unit}
                  </span>
                </span>
                <span>
                  CV:{" "}
                  <span className="text-emerald-400 font-bold">
                    {selectedProject.cv_diameter || "N/A"}%
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Quick Scientific Prompts */}
          <div className="flex items-center gap-2 pb-3 overflow-x-auto text-xs shrink-0 no-scrollbar">
            <span className="text-[11px] font-mono text-slate-400 shrink-0">Prompt Presets:</span>
            {[
              "What is the average nanoparticle size of this sample?",
              "Explain the Equivalent Circular Diameter formula",
              "Why are some particles overlapping and how does Watershed separate them?",
              "What does the standard deviation and CV% tell about my sample?",
              "Compare SEM secondary electrons vs TEM mass-thickness contrast",
            ].map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(preset)}
                className="px-3 py-1 rounded-full bg-navy-900/80 hover:bg-cyan-500/15 border border-slate-800 hover:border-cyan-500/30 text-slate-300 text-[11px] whitespace-nowrap shrink-0 transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto glass-panel rounded-2xl p-6 border border-cyan-500/20 space-y-6">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-4 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 mt-1 shadow-glow-cyan">
                    <Atom className="w-5 h-5" />
                  </div>
                )}
                <div
                  className={`p-5 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none font-medium shadow-glow-cyan"
                      : "bg-navy-900/80 border border-cyan-500/15 text-slate-200 rounded-tl-none whitespace-pre-wrap shadow-lg"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-4 items-center text-slate-400 font-mono text-xs">
                <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 animate-pulse">
                  <Atom className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-navy-900/80 border border-cyan-500/20">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-2 text-cyan-300">NanoBot synthesizing scientific analysis...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="pt-4 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about particle diameter, standard deviation, scale calibration, or SEM/TEM microscopy..."
                className="flex-1 bg-navy-900/90 border border-cyan-500/20 rounded-xl px-5 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors shadow-inner"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-navy-950 font-bold text-xs shadow-glow-cyan hover:brightness-110 disabled:opacity-40 transition-all flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Ask NanoBot</span>
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

