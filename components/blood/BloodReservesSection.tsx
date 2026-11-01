"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, ChevronUp, Droplet, X, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { StockStatus } from "@/lib/constants";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CenterStock {
  id: string;
  bloodGroup: string;
  units: number;
  status: StockStatus;
  statusLabel: string;
  center: {
    id: number;
    name: string;
    type: string;
    city: string;
  };
}

export interface SubgroupData {
  label: string;
  bloodGroup: string;
  totalUnits: number;
  status: StockStatus;
  statusLabel: string;
  records: CenterStock[];
}

export interface BloodGroupData {
  key: "A" | "B" | "AB" | "O";
  label: string;
  totalUnits: number;
  overallStatus: StockStatus;
  subgroups: [SubgroupData, SubgroupData];
}

interface BloodReservesSectionProps {
  groups: BloodGroupData[];
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<StockStatus, { bar: string; text: string; dot: string }> = {
  AVAILABLE:    { bar: "bg-emerald-500", text: "text-emerald-700", dot: "bg-emerald-500" },
  LOW_STOCK:    { bar: "bg-amber-400",   text: "text-amber-700",   dot: "bg-amber-400"   },
  CRITICAL:     { bar: "bg-rose-500",    text: "text-rose-700",    dot: "bg-rose-500"    },
  OUT_OF_STOCK: { bar: "bg-slate-300",   text: "text-slate-400",   dot: "bg-slate-400"   },
};

const GROUP_ACCENT: Record<string, { gradient: string; ring: string; iconBg: string; iconText: string }> = {
  A:  { gradient: "from-rose-50 to-rose-100/60",     ring: "ring-rose-200",   iconBg: "bg-rose-100",   iconText: "text-rose-600"   },
  B:  { gradient: "from-sky-50 to-sky-100/60",       ring: "ring-sky-200",    iconBg: "bg-sky-100",    iconText: "text-sky-600"    },
  AB: { gradient: "from-violet-50 to-violet-100/60", ring: "ring-violet-200", iconBg: "bg-violet-100", iconText: "text-violet-600" },
  O:  { gradient: "from-teal-50 to-teal-100/60",     ring: "ring-teal-200",   iconBg: "bg-teal-100",   iconText: "text-teal-600"   },
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration: number, trigger: boolean): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    if (target === 0) { setValue(0); return; }
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) { setValue(target); return; }
    const start = performance.now();
    let raf: number;
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, trigger]);
  return value;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusDot({ status }: { status: StockStatus }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${STATUS_CONFIG[status].dot} shrink-0`}
      aria-hidden="true"
    />
  );
}

function StockBadge({ status, label }: { status: StockStatus; label: string }) {
  const map: Record<StockStatus, "success" | "warning" | "critical" | "danger" | "neutral"> = {
    AVAILABLE:    "success",
    LOW_STOCK:    "warning",
    CRITICAL:     "critical",
    OUT_OF_STOCK: "neutral",
  };
  return <Badge variant={map[status]}>{label}</Badge>;
}

function ProgressBar({
  units,
  maxUnits,
  status,
}: {
  units: number;
  maxUnits: number;
  status: StockStatus;
}) {
  const pct = maxUnits > 0 ? Math.round((units / maxUnits) * 100) : 0;
  const cfg = STATUS_CONFIG[status];
  return (
    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden" aria-hidden="true">
      <div
        className={`h-full rounded-full ${cfg.bar} transition-[width] duration-700 ease-out`}
        style={{ width: `${units > 0 ? Math.max(pct, 4) : 0}%` }}
      />
    </div>
  );
}

// ─── SubgroupPanel ────────────────────────────────────────────────────────────

function SubgroupPanel({ sg }: { sg: SubgroupData }) {
  const isPos = sg.label.endsWith("+");
  const cfg = STATUS_CONFIG[sg.status];
  const maxUnits = Math.max(...sg.records.map((r) => r.units), 1);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm
              ${isPos ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-600"}`}
          >
            {sg.label}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">
              {sg.label} &mdash; {isPos ? "Positive" : "Negative"}
            </p>
            <p className={`text-xs font-medium flex items-center gap-1 mt-0.5 ${cfg.text}`}>
              <StatusDot status={sg.status} />
              {sg.totalUnits} units &bull; {sg.statusLabel}
            </p>
          </div>
        </div>
        <StockBadge status={sg.status} label={sg.statusLabel} />
      </div>

      {/* Per-center table */}
      {sg.records.length === 0 ? (
        <p className="text-sm text-slate-400 px-4 py-5 text-center">No records found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-4 py-2.5">
                  Blood Bank / Hospital
                </th>
                <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2.5 hidden sm:table-cell">
                  City
                </th>
                <th className="text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider px-4 py-2.5">
                  Units
                </th>
                <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-4 py-2.5">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sg.records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800 text-xs leading-tight">{r.center.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {r.center.type === "BLOOD_BANK" ? "Blood Bank" : "Hospital"}
                      <span className="sm:hidden"> &bull; {r.center.city}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-500 hidden sm:table-cell">{r.center.city}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-black text-slate-900 tabular-nums text-sm">{r.units}</div>
                    <ProgressBar units={r.units} maxUnits={maxUnits} status={r.status} />
                  </td>
                  <td className="px-4 py-3">
                    <StockBadge status={r.status} label={r.statusLabel} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── BloodGroupCard ───────────────────────────────────────────────────────────

function BloodGroupCard({
  group,
  isExpanded,
  onToggle,
  animateTrigger,
}: {
  group: BloodGroupData;
  isExpanded: boolean;
  onToggle: () => void;
  animateTrigger: boolean;
}) {
  const accent = GROUP_ACCENT[group.key];
  const cfg = STATUS_CONFIG[group.overallStatus];
  const animatedTotal = useCountUp(group.totalUnits, 900, animateTrigger);
  const maxInGroup = Math.max(...group.subgroups.map((s) => s.totalUnits), 1);

  return (
    <div className="flex flex-col">
      {/* Card button */}
      <button
        id={`blood-group-card-${group.key}`}
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`blood-group-panel-${group.key}`}
        className={[
          "group relative w-full text-left rounded-2xl border bg-gradient-to-br",
          accent.gradient,
          "ring-1",
          accent.ring,
          "shadow-sm cursor-pointer select-none",
          "hover:shadow-md hover:-translate-y-0.5",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500",
          "transition-all duration-200",
          "p-5",
          isExpanded ? "ring-2 shadow-md" : "",
        ].join(" ")}
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className={`w-12 h-12 rounded-2xl ${accent.iconBg} flex items-center justify-center shrink-0 shadow-xs`}>
            <span className={`text-2xl font-black ${accent.iconText}`}>{group.key}</span>
          </div>
          <div className={`p-1.5 rounded-lg ${isExpanded ? "bg-white/60" : "bg-white/40"} transition-colors`}>
            {isExpanded
              ? <ChevronUp className="w-4 h-4 text-slate-500" />
              : <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            }
          </div>
        </div>

        {/* Total units */}
        <div className="mb-1">
          <span className="text-3xl font-black text-slate-900 tabular-nums">
            {animateTrigger ? animatedTotal : group.totalUnits}
          </span>
          <span className="text-xs font-semibold text-slate-400 ml-1.5 uppercase tracking-wider">Units</span>
        </div>

        {/* Overall status */}
        <div className="flex items-center gap-1.5 mb-4">
          <StatusDot status={group.overallStatus} />
          <span className={`text-xs font-semibold ${cfg.text}`}>
            {group.overallStatus.replace(/_/g, " ")}
          </span>
        </div>

        {/* Mini subgroup bars */}
        <div className="space-y-2">
          {group.subgroups.map((sg) => (
            <div key={sg.bloodGroup} className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 w-6 shrink-0">{sg.label}</span>
              <div className="flex-1">
                <ProgressBar units={sg.totalUnits} maxUnits={maxInGroup} status={sg.status} />
              </div>
              <span className="text-[11px] font-bold text-slate-700 tabular-nums w-8 text-right shrink-0">
                {sg.totalUnits}
              </span>
            </div>
          ))}
        </div>

        {/* View details hint */}
        <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold text-slate-400 group-hover:text-slate-600 transition-colors">
          <span>{isExpanded ? "Hide details" : "View details"}</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </button>

      {/* Expanded detail panel */}
      <div
        id={`blood-group-panel-${group.key}`}
        role="region"
        aria-labelledby={`blood-group-card-${group.key}`}
        className={[
          "overflow-hidden transition-all duration-300 ease-in-out",
          isExpanded ? "max-h-[3000px] opacity-100 mt-3" : "max-h-0 opacity-0 pointer-events-none",
        ].join(" ")}
      >
        <div className="rounded-2xl border border-slate-200 bg-white shadow-md p-4 space-y-4">
          {/* Panel header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-rose-500 fill-rose-400" />
              <span className="text-sm font-bold text-slate-800">
                Blood Group {group.key} — Details
              </span>
            </div>
            <button
              onClick={onToggle}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
              aria-label={`Close ${group.key} group details`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {group.subgroups.map((sg) => (
              <SubgroupPanel key={sg.bloodGroup} sg={sg} />
            ))}
          </div>

          <div className="text-right pt-1 border-t border-slate-100">
            <a
              href="/blood-availability"
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-800 transition-colors"
            >
              View full availability table <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function BloodReservesSection({ groups }: BloodReservesSectionProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) { setHasAnimated(true); return; }
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasAnimated(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const toggle = useCallback((key: string) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  }, []);

  return (
    <div ref={sectionRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {groups.map((group) => (
        <BloodGroupCard
          key={group.key}
          group={group}
          isExpanded={expandedKey === group.key}
          onToggle={() => toggle(group.key)}
          animateTrigger={hasAnimated}
        />
      ))}
    </div>
  );
}
