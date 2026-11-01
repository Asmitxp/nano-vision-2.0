"use client";

import React from "react";
import Link from "next/link";
import { PlusCircle, Activity, ShieldCheck, Microscope } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="border-b border-cyan-500/10 bg-navy-950/70 backdrop-blur-md px-8 py-5 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-0.5 font-light">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900 border border-cyan-500/20 text-xs font-mono text-cyan-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>CV Engine Active</span>
        </div>

        <Link
          href="/dashboard/new-analysis"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-navy-950 font-bold text-xs shadow-glow-cyan hover:brightness-110 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Analysis</span>
        </Link>
      </div>
    </header>
  );
}

