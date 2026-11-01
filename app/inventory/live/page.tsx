"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Layers,
  Building2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Minus,
  Edit,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  History,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import { ALL_BLOOD_GROUPS, BLOOD_GROUP_DISPLAY, StockStatus } from "@/lib/constants";
import { useToast } from "@/components/ui/Toast";

interface StockRow {
  bloodGroup: string;
  displayGroup: string;
  component: string;
  units: number;
  reservedUnits: number;
  netAvailable: number;
  status: StockStatus;
  statusLabel: string;
  lastUpdated: string;
}

interface StockHistoryRow {
  id: string;
  bloodGroup: string;
  displayGroup: string;
  component: string;
  changeType: string;
  unitsDelta: number;
  previousUnits: number;
  newUnits: number;
  reason: string;
  performedBy: string;
  createdAt: string;
}

export default function LiveBloodStockMonitoringPage() {
  const { data: session } = useSession();
  const { success: toastSuccess, error: toastError } = useToast();

  const user = session?.user as any;
  const isAuthorizedStaff = user?.role === "HOSPITAL" || user?.role === "ADMIN";

  const [centers, setCenters] = useState<any[]>([]);
  const [selectedCenterId, setSelectedCenterId] = useState<number>(1);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Adjustment Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>("B_POS");
  const [action, setAction] = useState<"add" | "remove" | "set">("add");
  const [unitsInput, setUnitsInput] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  // Fetch centers list
  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const res = await fetch("/api/centers/search?limit=40");
        const json = await res.json();
        if (json.success && json.data) {
          setCenters(json.data);
          // If hospital staff, pre-select their assigned center
          if (user?.centerId) {
            setSelectedCenterId(user.centerId);
          } else if (json.data.length > 0) {
            setSelectedCenterId(json.data[0].id);
          }
        }
      } catch {
        toastError("Failed to fetch centres list");
      }
    };
    fetchCenters();
  }, [user]);

  // Fetch center inventory
  const fetchInventory = async () => {
    if (!selectedCenterId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory/center/${selectedCenterId}`);
      const json = await res.json();
      if (json.success) {
        setInventoryData(json.data);
      }
    } catch {
      toastError("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [selectedCenterId]);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjusting(true);

    try {
      const res = await fetch(`/api/inventory/center/${selectedCenterId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bloodGroup: selectedBloodGroup,
          action,
          units: Number(unitsInput),
          reason: adjustReason.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toastError(json.error || "Failed to update stock");
      } else {
        toastSuccess(json.message || "Stock updated successfully");
        setModalOpen(false);
        setAdjustReason("");
        fetchInventory();
      }
    } catch {
      toastError("Network error while adjusting stock");
    } finally {
      setAdjusting(false);
    }
  };

  const centerInfo = inventoryData?.center;
  const summary = inventoryData?.summary;
  const rows: StockRow[] = inventoryData?.inventory || [];
  const history: StockHistoryRow[] = inventoryData?.history || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider mb-3">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Feature 3 &bull; Live Hospital Inventory & Audit Trail</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">
              Live Blood Stock Monitoring
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Real-time multi-centre inventory levels with cold-chain reserves, audit timestamps, and
              concurrency-guarded transaction logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchInventory}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-2 border border-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
              Refresh Live Feed
            </button>
            {isAuthorizedStaff && (
              <button
                onClick={() => setModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Record / Adjust Units
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Centre Selector & Freshness Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Building2 className="w-5 h-5 text-rose-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
              Selected Hospital / Blood Centre
            </label>
            <select
              value={selectedCenterId}
              onChange={(e) => setSelectedCenterId(parseInt(e.target.value, 10))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {centers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city}, {c.state})
                </option>
              ))}
            </select>
          </div>
        </div>

        {centerInfo && (
          <div className="flex items-center gap-2 text-xs text-slate-400 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6 shrink-0">
            <Clock className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-slate-500">Last Stock Report: </span>
              <span className="font-semibold text-slate-200">
                {new Date(centerInfo.lastStockUpdate).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })} &bull; {new Date(centerInfo.lastStockUpdate).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Summary KPI Badges */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="text-xs text-slate-400 font-medium">Total Physical Units</div>
            <div className="text-3xl font-black text-slate-100 mt-1 tabular-nums">
              {summary.totalUnits}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="text-xs text-rose-400 font-medium">Critical Stock Groups</div>
            <div className="text-3xl font-black text-rose-400 mt-1 tabular-nums">
              {summary.criticalCount}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="text-xs text-amber-400 font-medium">Low Stock Groups</div>
            <div className="text-3xl font-black text-amber-400 mt-1 tabular-nums">
              {summary.lowStockCount}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="text-xs text-slate-400 font-medium">Depleted / Out of Stock</div>
            <div className="text-3xl font-black text-slate-400 mt-1 tabular-nums">
              {summary.outOfStockCount}
            </div>
          </div>
        </div>
      )}

      {/* 8 Blood Groups Inventory Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" /> Current Reserve Levels by Blood Group
        </h2>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-36 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {rows.map((r) => (
              <div
                key={r.bloodGroup}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-lg text-slate-100">
                    {r.displayGroup}
                  </div>
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      r.status === "AVAILABLE"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : r.status === "LOW_STOCK"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : r.status === "CRITICAL"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {r.statusLabel}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-slate-100 tabular-nums">
                      {r.units} <span className="text-xs font-normal text-slate-400">units</span>
                    </span>
                    {r.reservedUnits > 0 && (
                      <span className="text-[10px] text-amber-400 font-bold">
                        {r.reservedUnits} on hold
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 mt-1">
                    Net Available: <strong className="text-slate-200">{r.netAvailable}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stock History Audit Log Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" /> Stock Transaction & Audit History
          </h3>
          <span className="text-xs text-slate-400">Immutable ledger of recorded updates</span>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400 bg-slate-800/40 rounded-xl">
            No stock modification records logged for this center yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Blood Group</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Delta</th>
                  <th className="py-3 px-3">Balance</th>
                  <th className="py-3 px-3">Authorized By</th>
                  <th className="py-3 px-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(h.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })} &bull; {new Date(h.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-100">{h.displayGroup}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          h.changeType === "DONATION"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : h.changeType === "ISSUED"
                            ? "bg-rose-500/20 text-rose-400"
                            : "bg-cyan-500/20 text-cyan-400"
                        }`}
                      >
                        {h.changeType}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold">
                      {h.unitsDelta > 0 ? `+${h.unitsDelta}` : h.unitsDelta}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {h.previousUnits} &rarr; <span className="text-slate-100 font-bold">{h.newUnits}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-sans">{h.performedBy}</td>
                    <td className="py-3 px-3 text-slate-400 font-sans">{h.reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Authorized Stock Adjustment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Edit className="w-5 h-5" />
                <span>Hospital Inventory Update</span>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Blood Group</label>
                <select
                  value={selectedBloodGroup}
                  onChange={(e) => setSelectedBloodGroup(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-100"
                >
                  {ALL_BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {BLOOD_GROUP_DISPLAY[bg]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Operation Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAction("add")}
                    className={`py-2 text-xs font-bold rounded-xl border ${
                      action === "add"
                        ? "bg-emerald-600/30 border-emerald-500 text-emerald-300"
                        : "bg-slate-800 border-slate-700 text-slate-400"
                    }`}
                  >
                    + Add Units (Donation)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAction("remove")}
                    className={`py-2 text-xs font-bold rounded-xl border ${
                      action === "remove"
                        ? "bg-rose-600/30 border-rose-500 text-rose-300"
                        : "bg-slate-800 border-slate-700 text-slate-400"
                    }`}
                  >
                    - Issue Units
                  </button>
                  <button
                    type="button"
                    onClick={() => setAction("set")}
                    className={`py-2 text-xs font-bold rounded-xl border ${
                      action === "set"
                        ? "bg-cyan-600/30 border-cyan-500 text-cyan-300"
                        : "bg-slate-800 border-slate-700 text-slate-400"
                    }`}
                  >
                    Set Count
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Units</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={unitsInput}
                  onChange={(e) => setUnitsInput(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Audit Reason / Clinical Reference <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Received voluntary donation camp batch or emergency issue #REQ-9041"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-colors disabled:opacity-50"
                >
                  {adjusting ? "Updating..." : "Commit Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
