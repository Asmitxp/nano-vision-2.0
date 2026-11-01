"use client";

import React, { useState, useMemo } from "react";
import {
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  CheckSquare,
  Square,
  HelpCircle,
} from "lucide-react";

interface ParticleItem {
  id: number;
  particle_number: number;
  center_x: number;
  center_y: number;
  area_physical: number;
  perimeter_physical: number;
  ecd_physical: number;
  major_axis_physical: number;
  minor_axis_physical: number;
  feret_physical?: number;
  aspect_ratio: number;
  circularity: number;
  is_valid: boolean;
  is_uncertain: boolean;
}

interface ParticleTableProps {
  particles: ParticleItem[];
  selectedParticleId?: number | null;
  onSelectParticle?: (id: number) => void;
  onToggleParticle?: (id: number, isValid: boolean) => void;
  unit: string;
}

export default function ParticleTable({
  particles,
  selectedParticleId,
  onSelectParticle,
  onToggleParticle,
  unit,
}: ParticleTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "valid" | "uncertain" | "excluded">("all");
  const [sortField, setSortField] = useState<keyof ParticleItem>("particle_number");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const handleSort = (field: keyof ParticleItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredParticles = useMemo(() => {
    return particles.filter((p) => {
      // Search by ID
      if (searchTerm && !p.particle_number.toString().includes(searchTerm)) {
        return false;
      }
      // Status filter
      if (statusFilter === "valid" && (!p.is_valid || p.is_uncertain)) return false;
      if (statusFilter === "uncertain" && !p.is_uncertain) return false;
      if (statusFilter === "excluded" && p.is_valid) return false;
      return true;
    });
  }, [particles, searchTerm, statusFilter]);

  const sortedParticles = useMemo(() => {
    return [...filteredParticles].sort((a, b) => {
      const aVal = a[sortField] ?? 0;
      const bVal = b[sortField] ?? 0;
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredParticles, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedParticles.length / pageSize) || 1;
  const paginatedParticles = sortedParticles.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="glass-panel rounded-2xl border border-cyan-500/20 overflow-hidden">
      {/* Table Header and Filters */}
      <div className="p-4 border-b border-slate-800 bg-navy-950/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            Individual Particle Registry
            <span className="text-xs font-mono font-normal text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/40">
              {filteredParticles.length} of {particles.length}
            </span>
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="bg-navy-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-32"
            />
          </div>

          {/* Status Filter */}
          <div className="flex rounded-lg bg-navy-900 p-0.5 border border-slate-800 text-xs">
            {(["all", "valid", "uncertain", "excluded"] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded capitalize font-medium transition-colors ${
                  statusFilter === st
                    ? "bg-cyan-500 text-navy-950 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-navy-900/90 text-slate-300 font-mono text-[11px] sticky top-0 z-10 border-b border-slate-800 backdrop-blur-md">
            <tr>
              <th className="py-2.5 px-3">Include</th>
              <th
                onClick={() => handleSort("particle_number")}
                className="py-2.5 px-3 cursor-pointer hover:text-cyan-400"
              >
                <div className="flex items-center gap-1">
                  ID <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("ecd_physical")}
                className="py-2.5 px-3 cursor-pointer hover:text-cyan-400"
              >
                <div className="flex items-center gap-1 text-cyan-300 font-bold">
                  ECD ({unit}) <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("area_physical")}
                className="py-2.5 px-3 cursor-pointer hover:text-cyan-400"
              >
                <div className="flex items-center gap-1">
                  Area ({unit}²) <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("major_axis_physical")}
                className="py-2.5 px-3 cursor-pointer hover:text-cyan-400"
              >
                <div className="flex items-center gap-1">
                  Major ({unit}) <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("minor_axis_physical")}
                className="py-2.5 px-3 cursor-pointer hover:text-cyan-400"
              >
                <div className="flex items-center gap-1">
                  Minor ({unit}) <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("feret_physical")}
                className="py-2.5 px-3 cursor-pointer hover:text-cyan-400"
              >
                <div className="flex items-center gap-1">
                  Feret ({unit}) <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("aspect_ratio")}
                className="py-2.5 px-3 cursor-pointer hover:text-cyan-400"
              >
                <div className="flex items-center gap-1">
                  Aspect Ratio <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("circularity")}
                className="py-2.5 px-3 cursor-pointer hover:text-cyan-400"
              >
                <div className="flex items-center gap-1">
                  Circularity <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {paginatedParticles.map((p) => {
              const isSelected = selectedParticleId === p.id;
              return (
                <tr
                  key={p.id}
                  onClick={() => onSelectParticle && onSelectParticle(p.id)}
                  className={`cursor-pointer transition-colors ${
                    !p.is_valid
                      ? "opacity-40 bg-slate-900/30 line-through"
                      : isSelected
                      ? "bg-cyan-500/20 text-white"
                      : "hover:bg-cyan-500/5 text-slate-300"
                  }`}
                >
                  <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleParticle && onToggleParticle(p.id, !p.is_valid)}
                      className="text-cyan-400 hover:text-cyan-300"
                    >
                      {p.is_valid ? (
                        <CheckSquare className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </button>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-white">#{p.particle_number}</td>
                  <td className="py-2.5 px-3 font-bold text-cyan-300">{p.ecd_physical}</td>
                  <td className="py-2.5 px-3">{p.area_physical}</td>
                  <td className="py-2.5 px-3">{p.major_axis_physical}</td>
                  <td className="py-2.5 px-3">{p.minor_axis_physical}</td>
                  <td className="py-2.5 px-3">{p.feret_physical || p.major_axis_physical}</td>
                  <td className="py-2.5 px-3">{p.aspect_ratio.toFixed(2)}</td>
                  <td className="py-2.5 px-3">{p.circularity.toFixed(3)}</td>
                  <td className="py-2.5 px-3">
                    {p.is_uncertain ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                        <AlertTriangle className="w-3 h-3" /> Uncertain
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                        <CheckCircle2 className="w-3 h-3" /> Valid
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-slate-800 bg-navy-950/80 flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing {(page - 1) * pageSize + 1} to{" "}
          {Math.min(page * pageSize, sortedParticles.length)} of {sortedParticles.length} entries
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-2.5 py-1 rounded bg-navy-900 border border-slate-800 disabled:opacity-30 hover:text-white"
          >
            Prev
          </button>
          <span className="px-2 py-1 font-mono text-cyan-300">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-2.5 py-1 rounded bg-navy-900 border border-slate-800 disabled:opacity-30 hover:text-white"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

