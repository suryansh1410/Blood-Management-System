"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { LoadingSpinner, EmptyState, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import {
  Building2, Plus, Search, Edit2, ChevronDown, ChevronUp,
  ShieldCheck, PowerOff, Power, RefreshCw, Minus,
} from "lucide-react";

interface BloodStockRow {
  bloodGroup: string;
  displayGroup: string;
  units: number;
  status: string;
  statusLabel: string;
}

interface BloodCenter {
  id: number;
  name: string;
  type: string;
  city: string;
  address: string;
  phone: string;
  isMain: boolean;
  isActive: boolean;
  stocks: BloodStockRow[];
}

const BLOOD_GROUPS = ["A_POS","A_NEG","B_POS","B_NEG","AB_POS","AB_NEG","O_POS","O_NEG"];
const BG_DISPLAY: Record<string, string> = {
  A_POS:"A+", A_NEG:"A-", B_POS:"B+", B_NEG:"B-",
  AB_POS:"AB+", AB_NEG:"AB-", O_POS:"O+", O_NEG:"O-"
};

export default function CentersAdminPanel() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [centers, setCenters] = useState<BloodCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Add center modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", type: "BLOOD_BANK", city: "", address: "", phone: "" });
  const [addLoading, setAddLoading] = useState(false);

  // Edit modal
  const [editCenter, setEditCenter] = useState<BloodCenter | null>(null);
  const [editForm, setEditForm] = useState({ name: "", city: "", address: "", phone: "", type: "BLOOD_BANK" });
  const [editLoading, setEditLoading] = useState(false);

  // Stock editing
  const [stockAction, setStockAction] = useState<Record<string, { action: string; units: string }>>({});

  const fetchCenters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (typeFilter) params.set("type", typeFilter);
      const res = await fetch(`/api/centers?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch centers");
      setCenters(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, typeFilter]);

  useEffect(() => { fetchCenters(); }, [fetchCenters]);

  async function handleAddCenter(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await fetch("/api/centers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create center");
      toastSuccess(json.message || "Center created successfully");
      setShowAddModal(false);
      setAddForm({ name: "", type: "BLOOD_BANK", city: "", address: "", phone: "" });
      fetchCenters();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setAddLoading(false);
    }
  }

  async function handleEditCenter(e: React.FormEvent) {
    e.preventDefault();
    if (!editCenter) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/centers/${editCenter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update center");
      toastSuccess(json.message || "Center updated successfully");
      setEditCenter(null);
      fetchCenters();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setEditLoading(false);
    }
  }

  async function handleToggleActive(center: BloodCenter) {
    if (center.isMain) {
      toastError("The Main Blood Bank cannot be deactivated.");
      return;
    }
    try {
      const res = await fetch(`/api/centers/${center.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !center.isActive }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toastSuccess(json.message || "Updated successfully");
      fetchCenters();
    } catch (err: any) {
      toastError(err.message);
    }
  }

  async function handleStockAdjust(centerId: number, bloodGroup: string) {
    const key = `${centerId}-${bloodGroup}`;
    const { action, units } = stockAction[key] || { action: "add", units: "" };
    if (!units) return;
    try {
      const res = await fetch(`/api/centers/${centerId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bloodGroup, action, units: parseInt(units) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toastSuccess(json.message || "Stock updated");
      setStockAction((prev) => ({ ...prev, [key]: { action: "add", units: "" } }));
      fetchCenters();
    } catch (err: any) {
      toastError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-teal-500 w-48"
              id="centersSearch"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            id="centersTypeFilter"
          >
            <option value="">All Types</option>
            <option value="BLOOD_BANK">Blood Bank</option>
            <option value="HOSPITAL">Hospital</option>
          </select>
          <Button variant="outline" size="sm" onClick={fetchCenters} className="gap-1">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)} className="gap-1.5" id="addCenterBtn">
          <Plus className="w-4 h-4" />
          Add Center
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner text="Loading partner centers..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCenters} />
      ) : centers.length === 0 ? (
        <EmptyState
          title="No centers found"
          description="Add a partner blood bank or hospital to get started."
          action={{ label: "Add Center", onClick: () => setShowAddModal(true) }}
        />
      ) : (
        <div className="space-y-3">
          {centers.map((center) => {
            const isExpanded = expandedId === center.id;
            return (
              <Card key={center.id} className="overflow-hidden">
                {/* Center Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900">{center.name}</span>
                      <Badge variant={center.type === "HOSPITAL" ? "info" : "neutral"} size="sm">
                        <Building2 className="w-3 h-3" />
                        {center.type === "BLOOD_BANK" ? "Blood Bank" : "Hospital"}
                      </Badge>
                      {center.isMain && (
                        <Badge variant="success" size="sm">
                          <ShieldCheck className="w-3 h-3" /> Main
                        </Badge>
                      )}
                      {!center.isActive && (
                        <Badge variant="danger" size="sm">Inactive</Badge>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">{center.city} — {center.address}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      id={`editCenter-${center.id}`}
                      onClick={() => {
                        setEditCenter(center);
                        setEditForm({ name: center.name, city: center.city, address: center.address, phone: center.phone, type: center.type });
                      }}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant={center.isActive ? "outline" : "success"}
                      size="sm"
                      className="gap-1.5"
                      id={`toggleActive-${center.id}`}
                      onClick={() => handleToggleActive(center)}
                      disabled={center.isMain}
                      title={center.isMain ? "Main center cannot be deactivated" : ""}
                    >
                      {center.isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                      {center.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-1"
                      onClick={() => setExpandedId(isExpanded ? null : center.id)}
                      id={`expandStock-${center.id}`}
                    >
                      Stock
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                {/* Stock Editor (Expanded) */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-4">
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                      Stock Management — {center.name}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {center.stocks.map((s) => {
                        const key = `${center.id}-${s.bloodGroup}`;
                        const current = stockAction[key] || { action: "add", units: "" };
                        return (
                          <div key={s.bloodGroup} className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 font-black text-sm flex items-center justify-center border border-rose-100 shrink-0">
                              {s.displayGroup}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-sm font-bold text-slate-900">{s.units}</span>
                                <span className="text-xs text-slate-400">units</span>
                                <StatusBadge status={s.status} />
                              </div>
                              <div className="flex items-center gap-1">
                                <select
                                  value={current.action}
                                  onChange={(e) => setStockAction((prev) => ({ ...prev, [key]: { ...current, action: e.target.value } }))}
                                  className="text-xs rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                  id={`stockAction-${center.id}-${s.bloodGroup}`}
                                >
                                  <option value="add">Add</option>
                                  <option value="remove">Remove</option>
                                  <option value="set">Set to</option>
                                </select>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="units"
                                  value={current.units}
                                  onChange={(e) => setStockAction((prev) => ({ ...prev, [key]: { ...current, units: e.target.value } }))}
                                  className="w-16 text-xs rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                  id={`stockUnits-${center.id}-${s.bloodGroup}`}
                                />
                                <button
                                  onClick={() => handleStockAdjust(center.id, s.bloodGroup)}
                                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-2 py-1 text-xs font-semibold transition-colors"
                                  id={`stockSave-${center.id}-${s.bloodGroup}`}
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Center Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Partner Center"
      >
        <form onSubmit={handleAddCenter} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {[
              { label: "Center Name", field: "name", type: "text", placeholder: "e.g. Metro City Blood Depot" },
              { label: "City", field: "city", type: "text", placeholder: "e.g. Metro City" },
              { label: "Address", field: "address", type: "text", placeholder: "e.g. 100 Healthcare Blvd" },
              { label: "Phone (10 digits)", field: "phone", type: "text", placeholder: "e.g. 5550001234" },
            ].map(({ label, field, type, placeholder }) => (
              <div key={field}>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
                <input
                  type={type}
                  required
                  placeholder={placeholder}
                  value={(addForm as any)[field]}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, [field]: e.target.value }))}
                  className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  id={`addCenter-${field}`}
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Center Type</label>
              <select
                value={addForm.type}
                onChange={(e) => setAddForm((prev) => ({ ...prev, type: e.target.value }))}
                className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                id="addCenter-type"
              >
                <option value="BLOOD_BANK">Blood Bank</option>
                <option value="HOSPITAL">Hospital</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={addLoading}>
              {addLoading ? "Creating..." : "Create Center"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Center Modal */}
      {editCenter && (
        <Modal
          isOpen={!!editCenter}
          onClose={() => setEditCenter(null)}
          title={`Edit — ${editCenter.name}`}
        >
          <form onSubmit={handleEditCenter} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {[
                { label: "Center Name", field: "name", placeholder: "Center name" },
                { label: "City", field: "city", placeholder: "City" },
                { label: "Address", field: "address", placeholder: "Address" },
                { label: "Phone (10 digits)", field: "phone", placeholder: "10-digit phone" },
              ].map(({ label, field, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={(editForm as any)[field]}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, [field]: e.target.value }))}
                    className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    id={`editCenter-${field}`}
                  />
                </div>
              ))}
              {!editCenter.isMain && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Center Type</label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, type: e.target.value }))}
                    className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    id="editCenter-type"
                  >
                    <option value="BLOOD_BANK">Blood Bank</option>
                    <option value="HOSPITAL">Hospital</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditCenter(null)}>Cancel</Button>
              <Button type="submit" variant="primary" size="sm" disabled={editLoading}>
                {editLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}