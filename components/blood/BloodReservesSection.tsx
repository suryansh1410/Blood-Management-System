"use client";

import React, { useState, useEffect, useRef } from "react";
import { Droplet, X, ArrowRight, Building2, MapPin } from "lucide-react";
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
  AVAILABLE:    { bar: "bg-emerald-500", text: "text-emerald-400", dot: "bg-emerald-400 shadow-xs shadow-emerald-400/50" },
  LOW_STOCK:    { bar: "bg-amber-400",   text: "text-amber-400",   dot: "bg-amber-400 shadow-xs shadow-amber-400/50" },
  CRITICAL:     { bar: "bg-rose-500",    text: "text-rose-400",    dot: "bg-rose-500 shadow-xs shadow-rose-400/50" },
  OUT_OF_STOCK: { bar: "bg-slate-700",   text: "text-slate-400",   dot: "bg-slate-500" },
};

const GROUP_ACCENT: Record<string, {
  gradient: string;
  border: string;
  ring: string;
  iconBg: string;
  iconText: string;
  badgeBg: string;
  accentBar: string;
}> = {
  A: {
    gradient: "from-rose-950/40 via-slate-900 to-slate-900",
    border: "border-rose-900/30 hover:border-rose-500/50",
    ring: "ring-rose-500/20 hover:ring-rose-500/40",
    iconBg: "bg-rose-500/15 border border-rose-500/25",
    iconText: "text-rose-400",
    badgeBg: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    accentBar: "bg-rose-500",
  },
  B: {
    gradient: "from-sky-950/40 via-slate-900 to-slate-900",
    border: "border-sky-900/30 hover:border-sky-500/50",
    ring: "ring-sky-500/20 hover:ring-sky-500/40",
    iconBg: "bg-sky-500/15 border border-sky-500/25",
    iconText: "text-sky-400",
    badgeBg: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    accentBar: "bg-sky-500",
  },
  AB: {
    gradient: "from-violet-950/40 via-slate-900 to-slate-900",
    border: "border-violet-900/30 hover:border-violet-500/50",
    ring: "ring-violet-500/20 hover:ring-violet-500/40",
    iconBg: "bg-violet-500/15 border border-violet-500/25",
    iconText: "text-violet-400",
    badgeBg: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    accentBar: "bg-violet-500",
  },
  O: {
    gradient: "from-teal-950/40 via-slate-900 to-slate-900",
    border: "border-teal-900/30 hover:border-teal-500/50",
    ring: "ring-teal-500/20 hover:ring-teal-500/40",
    iconBg: "bg-teal-500/15 border border-teal-500/25",
    iconText: "text-teal-400",
    badgeBg: "bg-teal-500/15 text-teal-300 border-teal-500/30",
    accentBar: "bg-teal-500",
  },
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
    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden" aria-hidden="true">
      <div
        className={`h-full rounded-full ${cfg.bar} transition-[width] duration-700 ease-out`}
        style={{ width: `${units > 0 ? Math.max(pct, 5) : 0}%` }}
      />
    </div>
  );
}

// ─── SubgroupCard (Side-by-Side in Modal) ──────────────────────────────────────

function SubgroupCard({ sg }: { sg: SubgroupData }) {
  const isPos = sg.label.endsWith("+");
  const cfg = STATUS_CONFIG[sg.status];
  const maxUnits = Math.max(...sg.records.map((r) => r.units), 1);

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-800/90 overflow-hidden shadow-lg flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-slate-700/70 bg-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border
              ${isPos
                ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                : "bg-sky-500/15 text-sky-300 border-sky-500/30"
              }`}
          >
            {sg.label}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-100 truncate">
              {sg.label} &mdash; {isPos ? "Rh Positive" : "Rh Negative"}
            </h4>
            <div className={`text-xs font-medium flex items-center gap-1.5 mt-0.5 ${cfg.text}`}>
              <StatusDot status={sg.status} />
              <span>{sg.totalUnits} units in stock</span>
              <span className="text-slate-500">&bull;</span>
              <span className="truncate">{sg.statusLabel}</span>
            </div>
          </div>
        </div>
        <div className="shrink-0">
          <StockBadge status={sg.status} label={sg.statusLabel} />
        </div>
      </div>

      {/* Hospital-wise Table */}
      <div className="flex-1 overflow-x-auto">
        {sg.records.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            No center inventory records registered for {sg.label}.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-900/40 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="px-4 py-2.5 font-semibold">Blood Bank / Hospital</th>
                <th className="px-3 py-2.5 font-semibold hidden sm:table-cell">City</th>
                <th className="px-4 py-2.5 font-semibold text-right">Units</th>
                <th className="px-4 py-2.5 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {sg.records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-200 text-xs leading-snug truncate max-w-[150px] sm:max-w-[200px]" title={r.center.name}>
                      {r.center.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-500" />
                      <span>{r.center.type === "BLOOD_BANK" ? "Blood Bank" : "Hospital"}</span>
                      <span className="sm:hidden text-slate-500">&bull; {r.center.city}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-400 text-xs hidden sm:table-cell whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{r.center.city}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="font-black text-slate-100 tabular-nums text-sm">{r.units}</div>
                    <div className="w-16 sm:w-20 ml-auto mt-1">
                      <ProgressBar units={r.units} maxUnits={maxUnits} status={r.status} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <StockBadge status={r.status} label={r.statusLabel} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── BloodGroupCard (Grid on Page) ───────────────────────────────────────────

function BloodGroupCard({
  group,
  isSelected,
  onSelect,
  animateTrigger,
}: {
  group: BloodGroupData;
  isSelected: boolean;
  onSelect: () => void;
  animateTrigger: boolean;
}) {
  const accent = GROUP_ACCENT[group.key];
  const cfg = STATUS_CONFIG[group.overallStatus];
  const animatedTotal = useCountUp(group.totalUnits, 900, animateTrigger);
  const maxInGroup = Math.max(...group.subgroups.map((s) => s.totalUnits), 1);

  return (
    <button
      id={`blood-group-card-${group.key}`}
      onClick={onSelect}
      aria-haspopup="dialog"
      aria-expanded={isSelected}
      className={[
        "group relative w-full text-left rounded-2xl border bg-gradient-to-br",
        accent.gradient,
        accent.border,
        "ring-1",
        accent.ring,
        "shadow-md cursor-pointer select-none",
        "hover:shadow-xl hover:-translate-y-1 hover:border-teal-500/40",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500 focus-visible:ring-offset-slate-950",
        "transition-all duration-200",
        "p-5 flex flex-col justify-between",
      ].join(" ")}
    >
      <div>
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className={`w-12 h-12 rounded-2xl ${accent.iconBg} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
            <span className={`text-2xl font-black ${accent.iconText}`}>{group.key}</span>
          </div>
          <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${accent.badgeBg}`}>
            {group.label}
          </span>
        </div>

        {/* Total units */}
        <div className="mb-1">
          <span className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tight">
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

        {/* Mini subgroup progress bars */}
        <div className="space-y-2.5 py-2 border-t border-slate-800/80">
          {group.subgroups.map((sg) => (
            <div key={sg.bloodGroup} className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300 w-7 shrink-0">{sg.label}</span>
              <div className="flex-1">
                <ProgressBar units={sg.totalUnits} maxUnits={maxInGroup} status={sg.status} />
              </div>
              <span className="text-xs font-bold text-slate-200 tabular-nums w-8 text-right shrink-0">
                {sg.totalUnits}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action CTA */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-teal-400 group-hover:text-teal-300 transition-colors">
        <span>View Side-by-Side Details</span>
        <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
}

// ─── Modal Dialog ─────────────────────────────────────────────────────────────

interface BloodGroupModalProps {
  group: BloodGroupData;
  onClose: () => void;
}

function BloodGroupModal({ group, onClose }: BloodGroupModalProps) {
  const accent = GROUP_ACCENT[group.key];
  const cfg = STATUS_CONFIG[group.overallStatus];
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Lock body scroll while modal is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Escape key listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Focus modal
    modalRef.current?.focus();

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="blood-modal-title"
    >
      {/* Dark Translucent Backdrop with Strong Blur */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Foreground Centered Modal Window */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/90 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 outline-none"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-20">
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-2xl ${accent.iconBg} flex items-center justify-center font-black text-xl ${accent.iconText} shrink-0`}>
              {group.key}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="blood-modal-title" className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Blood Group {group.key} &mdash; Detailed Inventory
                </h3>
                <span className={`hidden sm:inline-flex px-2.5 py-0.5 text-xs font-bold rounded-full border ${accent.badgeBg}`}>
                  {group.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>Total Reserves: <strong className="text-white tabular-nums">{group.totalUnits} units</strong></span>
                <span className="text-slate-600">&bull;</span>
                <span className={`font-semibold flex items-center gap-1 ${cfg.text}`}>
                  <StatusDot status={group.overallStatus} />
                  {group.overallStatus.replace(/_/g, " ")}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            aria-label="Close modal dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Side-by-Side 2-Column Subgroup Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 items-stretch">
            {group.subgroups.map((sg) => (
              <SubgroupCard key={sg.bloodGroup} sg={sg} />
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 border-t border-slate-800 bg-slate-900/95">
          <a
            href="/blood-availability"
            className="text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1.5"
          >
            Open Full Availability Table
            <ArrowRight className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer w-full sm:w-auto"
          >
            Close Dialog
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function BloodReservesSection({ groups }: BloodReservesSectionProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
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

  const selectedGroup = groups.find((g) => g.key === selectedKey) || null;

  return (
    <>
      <div ref={sectionRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {groups.map((group) => (
          <BloodGroupCard
            key={group.key}
            group={group}
            isSelected={selectedKey === group.key}
            onSelect={() => setSelectedKey(group.key)}
            animateTrigger={hasAnimated}
          />
        ))}
      </div>

      {/* Centered Modal with Strong Blur and Side-by-Side Subgroup Grid */}
      {selectedGroup && (
        <BloodGroupModal
          group={selectedGroup}
          onClose={() => setSelectedKey(null)}
        />
      )}
    </>
  );
}
