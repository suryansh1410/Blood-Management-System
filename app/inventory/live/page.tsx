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
  RefreshCw,
  History,
  CheckCircle2,
  AlertCircle,
  Filter,
  Calendar,
  HelpCircle,
} from "lucide-react";
import {
  ALL_BLOOD_GROUPS,
  BLOOD_GROUP_DISPLAY,
  SUPPORTED_BLOOD_COMPONENTS,
  StockStatus,
} from "@/lib/constants";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select, Input } from "@/components/ui/Input";
import { SkeletonCard, SkeletonTable } from "@/components/ui/Skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";

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

  // Filters for the live view
  const [filterGroup, setFilterGroup] = useState<string>("All");
  const [filterComponent, setFilterComponent] = useState<string>("All");

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
  const rawRows: StockRow[] = inventoryData?.inventory || [];
  const history: StockHistoryRow[] = inventoryData?.history || [];

  // Filter rows based on dropdown selections
  const rows = rawRows.filter((r) => {
    if (filterGroup !== "All" && r.bloodGroup !== filterGroup) return false;
    if (filterComponent !== "All" && r.component !== filterComponent) return false;
    return true;
  });

  // Calculate Data Freshness
  const lastUpdateDate = centerInfo?.lastStockUpdate ? new Date(centerInfo.lastStockUpdate) : null;
  const hoursSinceUpdate = lastUpdateDate
    ? Math.round((Date.now() - lastUpdateDate.getTime()) / (1000 * 60 * 60))
    : 999;
  const isStale = hoursSinceUpdate > 48;

  const renderStatusBadge = (status: StockStatus, units: number) => {
    if (isStale) {
      return (
        <Badge variant="warning" size="sm">
          Stale ({hoursSinceUpdate}h ago)
        </Badge>
      );
    }

    switch (status) {
      case "AVAILABLE":
        return <Badge variant="success" size="sm">Available</Badge>;
      case "LOW_STOCK":
        return <Badge variant="warning" size="sm">Low Stock</Badge>;
      case "CRITICAL":
        return <Badge variant="critical" size="sm">Critical</Badge>;
      case "OUT_OF_STOCK":
        return <Badge variant="danger" size="sm">Out of Stock</Badge>;
      case "AVAILABILITY_NOT_UPDATED":
      default:
        return <Badge variant="neutral" size="sm">Not Updated</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider mb-3">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Hospital Blood Reserves & Audit Ledger</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-100 tracking-tight">
              Live Blood Stock Monitoring
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Real-time multi-center certified inventory with quarantine reservation holds, audit timestamps, and
              concurrency-guarded transaction logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchInventory}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-teal-400" : ""}`} />
              Refresh Feed
            </Button>
            {isAuthorizedStaff && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setModalOpen(true)}
                className="gap-2 shadow-lg shadow-teal-950/60"
              >
                <Plus className="w-4 h-4" /> Adjust Center Units
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Controls & Freshness Indicator */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Selected Hospital / Blood Centre"
            value={selectedCenterId}
            onChange={(e) => setSelectedCenterId(parseInt(e.target.value, 10))}
          >
            {centers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.city}, {c.state})
              </option>
            ))}
          </Select>

          <Select
            label="Filter Blood Group"
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
          >
            <option value="All">All Blood Groups</option>
            {ALL_BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>
                {BLOOD_GROUP_DISPLAY[bg]}
              </option>
            ))}
          </Select>

          <Select
            label="Filter Blood Component"
            value={filterComponent}
            onChange={(e) => setFilterComponent(e.target.value)}
          >
            <option value="All">All Components</option>
            {SUPPORTED_BLOOD_COMPONENTS.map((comp) => (
              <option key={comp} value={comp}>
                {comp}
              </option>
            ))}
          </Select>
        </div>

        {/* Center & Freshness Meta Strip */}
        {centerInfo && (
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>
                <strong className="text-white">{centerInfo.name}</strong> &bull; {centerInfo.address}, {centerInfo.city} ({centerInfo.state})
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Last Updated: </span>
                <span className="font-semibold text-slate-200">
                  {lastUpdateDate ? `${lastUpdateDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (${hoursSinceUpdate}h ago)` : "Unknown"}
                </span>
              </div>

              {isStale && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" /> Stale Data Warning
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Units in Stock</div>
            <div className="text-3xl font-black text-slate-100 mt-1 tabular-nums">
              {summary.totalUnits}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Verified on-premises inventory</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="text-xs text-rose-400 font-semibold uppercase tracking-wider">Critical Groups</div>
            <div className="text-3xl font-black text-rose-400 mt-1 tabular-nums">
              {summary.criticalCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">&lt; 3 units available</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="text-xs text-amber-400 font-semibold uppercase tracking-wider">Low Stock Groups</div>
            <div className="text-3xl font-black text-amber-400 mt-1 tabular-nums">
              {summary.lowStockCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">3 &ndash; 7 units available</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Depleted / Zero Stock</div>
            <div className="text-3xl font-black text-slate-400 mt-1 tabular-nums">
              {summary.outOfStockCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Immediate restock required</div>
          </div>
        </div>
      )}

      {/* Detailed Stock Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-400" /> Current Certified Reserve Inventory
          </h2>
          <span className="text-xs text-slate-400">{rows.length} blood groups displayed</span>
        </div>

        {loading ? (
          <SkeletonTable rows={8} cols={6} />
        ) : rows.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <HelpCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <div className="font-bold text-slate-300">No stock rows match the current filter</div>
            <p className="text-xs text-slate-500 mt-1">Select "All Blood Groups" and "All Components" to see full inventory.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Blood Group</TableHead>
                <TableHead>Component</TableHead>
                <TableHead>Total Physical Units</TableHead>
                <TableHead>On-Hold / Reserved</TableHead>
                <TableHead>Net Available</TableHead>
                <TableHead>Stock Status</TableHead>
                <TableHead>Last Verified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.bloodGroup}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-500/30 flex items-center justify-center font-black text-rose-300 text-xs">
                        {r.displayGroup}
                      </div>
                      <span className="font-bold text-slate-100">{r.displayGroup}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300">{r.component}</TableCell>
                  <TableCell>
                    <span className="font-bold text-slate-100 text-base tabular-nums">{r.units}</span>
                    <span className="text-xs text-slate-400 ml-1">units</span>
                  </TableCell>
                  <TableCell>
                    {r.reservedUnits > 0 ? (
                      <span className="text-xs font-semibold text-amber-400">
                        {r.reservedUnits} on hold
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-black text-teal-300 text-base tabular-nums">{r.netAvailable}</span>
                  </TableCell>
                  <TableCell>{renderStatusBadge(r.status, r.units)}</TableCell>
                  <TableCell className="text-xs text-slate-400">
                    {new Date(r.lastUpdated).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Stock Transaction & Audit History */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-400" /> Stock Audit Ledger & Transaction History
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Immutable ledger of all additions, fulfillment deductions, and staff adjustments.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">{history.length} records</span>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400 bg-slate-950/60 rounded-2xl border border-slate-800">
            No stock modification records logged for this center yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Blood Group</TableHead>
                <TableHead>Action Type</TableHead>
                <TableHead>Delta</TableHead>
                <TableHead>Balance Shift</TableHead>
                <TableHead>Authorized Staff</TableHead>
                <TableHead>Audit Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="text-xs text-slate-400 font-mono">
                    {new Date(h.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })} &bull; {new Date(h.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-bold text-slate-100">{h.displayGroup}</TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell className="font-bold">
                    <span className={h.unitsDelta > 0 ? "text-emerald-400" : "text-rose-400"}>
                      {h.unitsDelta > 0 ? `+${h.unitsDelta}` : h.unitsDelta}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-400">
                    {h.previousUnits} &rarr; <span className="text-slate-100 font-bold">{h.newUnits}</span>
                  </TableCell>
                  <TableCell className="text-slate-300">{h.performedBy}</TableCell>
                  <TableCell className="text-slate-400 text-xs">{h.reason || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Adjustment Modal for Authorized Staff */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 text-slate-100">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100">Record Manual Stock Adjustment</h3>
              <p className="text-xs text-slate-400 mt-1">
                Authorized staff entry for {centerInfo?.name}. Recorded in immutable audit trail.
              </p>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4">
              <Select
                label="Target Blood Group"
                value={selectedBloodGroup}
                onChange={(e) => setSelectedBloodGroup(e.target.value)}
              >
                {ALL_BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {BLOOD_GROUP_DISPLAY[bg]}
                  </option>
                ))}
              </Select>

              <Select
                label="Adjustment Operation"
                value={action}
                onChange={(e) => setAction(e.target.value as any)}
              >
                <option value="add">Add Units (e.g. Inflow / Batch Arrival)</option>
                <option value="remove">Deduct Units (e.g. Discard / Testing / Relocation)</option>
                <option value="set">Set Exact Count (Physical Audit Recalibration)</option>
              </Select>

              <Input
                label="Unit Quantity"
                type="number"
                min={1}
                max={500}
                required
                value={unitsInput}
                onChange={(e) => setUnitsInput(parseInt(e.target.value, 10) || 1)}
              />

              <Input
                label="Reason / Audit Note"
                required
                placeholder="e.g. Regular morning physical audit verification"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <Button variant="outline" size="sm" type="button" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" isLoading={adjusting} disabled={adjusting}>
                  Confirm & Commit Stock
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
