"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import {
  LayoutDashboard,
  PlusCircle,
  FolderKanban,
  History,
  Bot,
  FileText,
  Settings,
  LogOut,
  Atom,
  ChevronRight,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "New Analysis", href: "/dashboard/new-analysis", icon: PlusCircle, highlight: true },
    { label: "My Projects", href: "/dashboard/projects", icon: FolderKanban },
    { label: "Analysis History", href: "/dashboard/history", icon: History },
    { label: "AI Research Assistant", href: "/dashboard/assistant", icon: Bot },
    { label: "Reports", href: "/dashboard/reports", icon: FileText },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-navy-950/95 border-r border-cyan-500/10 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 backdrop-blur-md">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-cyan-500/10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-glow-cyan">
              <Atom className="w-5 h-5 text-white group-hover:rotate-180 transition-transform duration-700" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1">
                Nano<span className="text-cyan-400">Vision</span>
              </span>
              <p className="text-[10px] text-slate-400 font-mono">Microscopy Suite</p>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-glow-cyan"
                    : item.highlight
                    ? "bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-200 border border-cyan-500/20 hover:border-cyan-500/40"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : item.highlight ? "text-cyan-300" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.highlight && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info & Sign Out Footer */}
      <div className="p-4 border-t border-cyan-500/10 bg-navy-900/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs shrink-0">
              {user?.full_name ? user.full_name[0] : "R"}
            </div>
            <div className="min-w-0 truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {user?.full_name || "Elena Vance, Ph.D."}
              </p>
              <p className="text-[10px] text-slate-400 truncate font-mono">
                {user?.role || "Lead Metrologist"}
              </p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Log out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

