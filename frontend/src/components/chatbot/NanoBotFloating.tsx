"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import {
  Bot,
  X,
  Send,
  Sparkles,
  Maximize2,
  Minimize2,
  Atom,
  HelpCircle,
  Activity,
  Layers,
  ChevronDown,
} from "lucide-react";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export default function NanoBotFloating() {
  const pathname = usePathname();
  // Don't show floating button on the dedicated /dashboard/assistant page to avoid clutter
  const isDedicatedAssistant = pathname === "/dashboard/assistant";

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I am **NanoBot**, your AI microscopy research assistant. I can explain SEM/TEM contrast mechanisms, interpret your particle size distribution, or explain watershed segmentation parameters. What would you like to explore?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: query }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // Find active project id if on analysis page
      let activeProjectId: number | undefined = undefined;
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const pid = urlParams.get("project_id");
        if (pid) activeProjectId = parseInt(pid, 10);
      }

      const res = await api.queryChatbot({
        message: query,
        project_id: activeProjectId,
        history: newMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
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
          content: `⚠️ Error contacting NanoBot: ${err.message || "Failed to query engine."}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (isDedicatedAssistant) return null;

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-navy-950 font-bold shadow-glow-cyan hover:scale-105 active:scale-95 transition-all group"
        >
          <div className="relative">
            <Atom className="w-6 h-6 text-navy-950 animate-spin-slow group-hover:rotate-180 transition-transform duration-500" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-navy-950 animate-pulse" />
          </div>
          <div className="text-left font-sans">
            <span className="text-xs uppercase tracking-wider block font-bold">NanoBot</span>
            <span className="text-[10px] text-navy-900/80 font-mono block -mt-0.5">Microscopy AI</span>
          </div>
        </button>
      )}

      {/* Glassmorphic Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex flex-col glass-panel rounded-2xl shadow-glow-mixed border border-cyan-500/30 overflow-hidden transition-all duration-300 ${
            isExpanded
              ? "w-[90vw] md:w-[680px] h-[85vh]"
              : "w-[92vw] sm:w-[420px] h-[580px]"
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-cyan-500/15 bg-navy-950/90 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-navy-950">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  NanoBot <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">RESEARCH AI</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Grounded Metrology Mode
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompt Badges */}
          <div className="px-3 py-2 bg-navy-900/60 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono no-scrollbar">
            <span className="text-slate-400 shrink-0 text-[10px]">Ask:</span>
            {[
              "What is Equivalent Circular Diameter?",
              "How does Watershed separate particles?",
              "Explain SEM vs TEM contrast",
              "What is a good CV% for monodispersity?",
            ].map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="px-2.5 py-1 rounded-full bg-navy-800/80 text-cyan-300 hover:bg-cyan-500/20 border border-cyan-500/20 whitespace-nowrap shrink-0 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
                    <Atom className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed ${
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
              <div className="flex gap-3 items-center text-slate-400 font-mono text-xs">
                <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 animate-pulse">
                  <Atom className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-navy-900/60 border border-cyan-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-1 text-[11px] text-cyan-300">NanoBot analyzing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-navy-950/90 border-t border-cyan-500/15">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about particle sizing, SEM/TEM physics, or calibration..."
                className="flex-1 bg-navy-900/90 border border-cyan-500/20 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-navy-950 font-bold hover:brightness-110 disabled:opacity-40 transition-all shadow-glow-cyan"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

