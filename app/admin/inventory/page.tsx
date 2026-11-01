"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingSpinner, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import {
  Layers,
  Plus,
  Minus,
  Edit,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Info,
  Building2,
} from "lucide-react";
import { STOCK_THRESHOLDS } from "@/lib/constants";
import CentersAdminPanel from "@/components/admin/CentersAdminPanel";


export default function AdminInventoryPage() {
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<"main" | "centers">("main");
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // Modal state
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"DELTA" | "SET">("DELTA");
  const [amount, setAmount] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  const fetchStock = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/blood-stock");
      if (!res.ok) throw new Error("Failed to load blood inventory");
      const json = await res.json();
      setStocks(json.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const openAdjustmentModal = (item: any, initialMode: "DELTA" | "SET" = "DELTA", initialAmt = 1) => {
    setSelectedItem(item);
    setMode(initialMode);
    setAmount(initialMode === "SET" ? item.units : initialAmt);
    setModalOpen(true);
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/blood-stock/${selectedItem.bloodGroup}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          units: Number(amount),
          mode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || "Failed to update blood stock");
      } else {
        success(data.message || "Blood stock adjusted successfully");
        setModalOpen(false);
        fetchStock();
      }
    } catch {
      toastError("Network error while adjusting blood stock");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Blood Stock Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage Main Blood Bank stock and partner center inventories.
          </p>
        </div>
        {activeTab === "main" && (
          <Button variant="outline" size="sm" onClick={fetchStock} className="gap-1.5 self-start">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Stock
          </Button>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          id="tabMainInventory"
          onClick={() => setActiveTab("main")}
          className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === "main"
              ? "border-teal-600 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <span className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Main Inventory
          </span>
        </button>
        <button
          id="tabPartnerCenters"
          onClick={() => setActiveTab("centers")}
          className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === "centers"
              ? "border-teal-600 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <span className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Partner Centers
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "centers" ? (
        <CentersAdminPanel />
      ) : (
      <div className="space-y-6">

      {/* Threshold Guide */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <span className="font-bold text-slate-700 uppercase tracking-wider">
          System Thresholds:
        </span>
        <div className="flex flex-wrap items-center gap-4 text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <strong>Available:</strong> &gt; {STOCK_THRESHOLDS.LOW_MAX}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <strong>Low Stock:</strong> 6 – {STOCK_THRESHOLDS.LOW_MAX}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <strong>Critical:</strong> 1 – {STOCK_THRESHOLDS.CRITICAL_MAX}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-800"></span>
            <strong>Out of Stock:</strong> 0 units
          </span>
        </div>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <LoadingSpinner text="Loading current blood stocks..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchStock} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Blood Group</th>
                  <th className="py-3.5 px-6">Current Stock</th>
                  <th className="py-3.5 px-6">Inventory Status</th>
                  <th className="py-3.5 px-6">Last Updated</th>
                  <th className="py-3.5 px-6 text-right">Quick Stock Adjustment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stocks.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 font-black text-base flex items-center justify-center border border-rose-100">
                          {item.displayGroup}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">{item.displayGroup}</span>
                          <span className="text-xs text-slate-400 block font-mono">{item.bloodGroup}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-2xl font-black text-slate-900">{item.units}</span>
                      <span className="text-xs text-slate-400 ml-1.5">units</span>
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {new Date(item.lastUpdated).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAdjustmentModal(item, "DELTA", 1)}
                          className="gap-1 text-xs"
                          title="Add Units"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-600" />
                          Add
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAdjustmentModal(item, "DELTA", -1)}
                          className="gap-1 text-xs"
                          disabled={item.units <= 0}
                          title="Deduct Units"
                        >
                          <Minus className="w-3.5 h-3.5 text-rose-600" />
                          Remove
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openAdjustmentModal(item, "SET", item.units)}
                          className="gap-1 text-xs"
                          title="Set Exact Count"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Set Count
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {selectedItem && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`Adjust ${selectedItem.displayGroup} Stock`}
          description={`Current balance: ${selectedItem.units} units.`}
          confirmText="Apply Adjustment"
          onConfirm={undefined}
        >
          <form onSubmit={handleAdjustStock} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Adjustment Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode("DELTA")}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    mode === "DELTA"
                      ? "border-teal-500 bg-teal-50 text-teal-900"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  Increment / Decrement (Delta)
                </button>
                <button
                  type="button"
                  onClick={() => setMode("SET")}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    mode === "SET"
                      ? "border-teal-500 bg-teal-50 text-teal-900"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  Set Exact Count
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {mode === "DELTA"
                  ? "Units to Adjust (Positive to add, Negative to deduct)"
                  : "New Exact Units Count"}
              </label>
              <input
                type="number"
                required
                value={amount}
                min={mode === "SET" ? 0 : -selectedItem.units}
                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                className="w-full text-base font-bold rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                {mode === "DELTA"
                  ? `New balance will be: ${Math.max(0, selectedItem.units + Number(amount))} units.`
                  : `Stock will be set directly to ${amount} units.`}
              </span>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
                Save Adjustment
              </Button>
            </div>
          </form>
        </Modal>
      )}
      </div>
      )}
    </div>
  );
}
