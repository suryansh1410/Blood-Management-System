"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingSpinner, EmptyState, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import {
  Heart,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  User,
  AlertCircle,
} from "lucide-react";
import { ALL_BLOOD_GROUPS, BLOOD_GROUP_DISPLAY } from "@/lib/constants";

export default function AdminDonationsPage() {
  const { success, error: toastError } = useToast();
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [bloodGroupFilter, setBloodGroupFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Action state
  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  const [actionType, setActionType] = useState<"VERIFY" | "REJECT" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (bloodGroupFilter) params.set("bloodGroup", bloodGroupFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/admin/donations?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load donations");
      const json = await res.json();
      setDonations(json.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load donations queue");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, bloodGroupFilter, searchQuery]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const handleAction = async () => {
    if (!selectedDonation || !actionType) return;
    setActionLoading(true);

    try {
      let endpoint = "";
      let options: RequestInit = { method: "POST" };

      if (actionType === "VERIFY") {
        endpoint = `/api/admin/donations/${selectedDonation.id}/verify`;
      } else if (actionType === "REJECT") {
        endpoint = `/api/admin/donations/${selectedDonation.id}/reject`;
        options = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectReason.trim() || undefined }),
        };
      }

      const res = await fetch(endpoint, options);
      const data = await res.json();

      if (!res.ok) {
        toastError(data.error || `Failed to ${actionType.toLowerCase()} donation`);
      } else {
        success(data.message || `Donation record updated successfully`);
        setActionType(null);
        setSelectedDonation(null);
        setRejectReason("");
        fetchDonations();
      }
    } catch {
      toastError(`Network error while performing ${actionType}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Donation Verification Queue
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review donor-submitted records. Verifying a donation triggers an atomic inventory
            increment.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDonations} className="gap-1.5 self-start">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Queue
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setStatusFilter("")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            statusFilter === ""
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          All Records ({donations.length})
        </button>
        <button
          onClick={() => setStatusFilter("PENDING")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            statusFilter === "PENDING"
              ? "bg-amber-600 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Pending Review ({donations.filter((d) => d.status === "PENDING").length})
        </button>
        <button
          onClick={() => setStatusFilter("VERIFIED")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            statusFilter === "VERIFIED"
              ? "bg-emerald-600 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Verified ({donations.filter((d) => d.status === "VERIFIED").length})
        </button>
        <button
          onClick={() => setStatusFilter("REJECTED")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            statusFilter === "REJECTED"
              ? "bg-rose-600 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Rejected ({donations.filter((d) => d.status === "REJECTED").length})
        </button>
      </div>

      {/* Search & Blood Group Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Donor Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Donor name, city, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pl-8 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Blood Group</label>
            <select
              value={bloodGroupFilter}
              onChange={(e) => setBloodGroupFilter(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Blood Groups</option>
              {ALL_BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {BLOOD_GROUP_DISPLAY[bg]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setSearchQuery("");
                setBloodGroupFilter("");
              }}
              className="w-full text-xs"
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Donations Table */}
      {loading ? (
        <LoadingSpinner text="Loading donation verification queue..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchDonations} />
      ) : donations.length === 0 ? (
        <EmptyState
          title="No donation records found"
          description="There are currently no donation submissions matching your criteria."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Donor Info</th>
                  <th className="py-3.5 px-6">Blood Group</th>
                  <th className="py-3.5 px-6">Units</th>
                  <th className="py-3.5 px-6">Donation Date</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Verified Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donations.map((d) => {
                  const isPending = d.status === "PENDING";
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-slate-900">{d.donorName}</div>
                        <div className="text-xs text-slate-400">
                          {d.donorCity} • {d.donorPhone}
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="font-black text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg text-xs">
                          {d.bloodGroupDisplay}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-bold text-slate-800">{d.units} unit(s)</td>
                      <td className="py-3.5 px-6 text-slate-700">
                        {new Date(d.donationDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-6">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="py-3.5 px-6 text-xs text-slate-500">
                        {d.verifiedAt ? new Date(d.verifiedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        {isPending ? (
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => {
                                setSelectedDonation(d);
                                setActionType("VERIFY");
                              }}
                              className="text-xs gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Verify
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => {
                                setSelectedDonation(d);
                                setActionType("REJECT");
                              }}
                              className="text-xs gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Archived</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      {selectedDonation && actionType === "VERIFY" && (
        <Modal
          isOpen={true}
          onClose={() => {
            setActionType(null);
            setSelectedDonation(null);
          }}
          onConfirm={handleAction}
          title="Verify Blood Donation"
          description={`Authenticate that ${selectedDonation.donorName} donated ${selectedDonation.units} unit(s) of ${selectedDonation.bloodGroupDisplay} on ${new Date(selectedDonation.donationDate).toLocaleDateString()}? This will immediately increment ${selectedDonation.bloodGroupDisplay} blood inventory by ${selectedDonation.units} unit(s).`}
          confirmText="Verify & Increment Inventory"
          variant="success"
          isLoading={actionLoading}
        />
      )}

      {selectedDonation && actionType === "REJECT" && (
        <Modal
          isOpen={true}
          onClose={() => {
            setActionType(null);
            setSelectedDonation(null);
            setRejectReason("");
          }}
          title="Reject Donation Record"
          description={`Reject the donation record submitted by ${selectedDonation.donorName}? No inventory changes will occur.`}
          confirmText="Reject Record"
          variant="danger"
          isLoading={actionLoading}
          onConfirm={handleAction}
        >
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Reason for Rejection (Optional)
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Ineligible donation record or duplicate entry"
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
