"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge, UrgencyBadge } from "@/components/ui/Badge";
import { LoadingSpinner, EmptyState, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import {
  Search,
  RefreshCw,
  CheckCircle2,
  PackageCheck,
  XCircle,
  Eye,
  Building2,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { ALL_BLOOD_GROUPS, BLOOD_GROUP_DISPLAY } from "@/lib/constants";

export default function AdminRequestsPage() {
  const { success, error: toastError } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [bloodGroupFilter, setBloodGroupFilter] = useState<string>("");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Action modals
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "FULFILL" | "REJECT" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (bloodGroupFilter) params.set("bloodGroup", bloodGroupFilter);
      if (urgencyFilter) params.set("urgency", urgencyFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/admin/requests?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load blood requests");
      const json = await res.json();
      setRequests(json.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, bloodGroupFilter, urgencyFilter, searchQuery]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async () => {
    if (!selectedReq || !actionType) return;
    setActionLoading(true);

    try {
      let endpoint = "";
      let options: RequestInit = { method: "POST" };

      if (actionType === "APPROVE") {
        endpoint = `/api/admin/requests/${selectedReq.id}/approve`;
      } else if (actionType === "FULFILL") {
        endpoint = `/api/admin/requests/${selectedReq.id}/fulfill`;
      } else if (actionType === "REJECT") {
        endpoint = `/api/admin/requests/${selectedReq.id}/reject`;
        options = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectReason.trim() || undefined }),
        };
      }

      const res = await fetch(endpoint, options);
      const data = await res.json();

      if (!res.ok) {
        toastError(data.error || `Failed to ${actionType.toLowerCase()} request`);
      } else {
        success(data.message || `Request ${actionType.toLowerCase()}ed successfully`);
        setActionType(null);
        setSelectedReq(null);
        setRejectReason("");
        fetchRequests();
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
            Blood Request Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review incoming hospital requests, authorize reservations, and confirm physical handover.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRequests} className="gap-1.5 self-start">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh List
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Patient, Hospital, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pl-8 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved (Awaiting Fulfill)</option>
              <option value="FULFILLED">Fulfilled</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
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

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Urgency</label>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Urgencies</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="URGENT">Urgent</option>
              <option value="NORMAL">Normal</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Requests Table */}
      {loading ? (
        <LoadingSpinner text="Loading requests queue..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchRequests} />
      ) : requests.length === 0 ? (
        <EmptyState
          title="No requests match your filter"
          description="Try broadening your criteria or reset filters."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">ID & Patient</th>
                  <th className="py-3.5 px-6">Hospital & City</th>
                  <th className="py-3.5 px-6">Group & Units</th>
                  <th className="py-3.5 px-6">Urgency</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Required Date</th>
                  <th className="py-3.5 px-6 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => {
                  const isPending = r.status === "PENDING";
                  const isApproved = r.status === "APPROVED";

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-slate-900">{r.patientName}</div>
                        <span className="font-mono text-[11px] text-slate-400">
                          #{r.id.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="font-semibold text-slate-800">{r.hospitalName}</div>
                        <div className="text-xs text-slate-400">{r.city}</div>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md text-xs">
                            {r.bloodGroupDisplay}
                          </span>
                          <span className="font-bold text-slate-900">{r.unitsRequired} unit(s)</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <UrgencyBadge urgency={r.urgency} />
                      </td>
                      <td className="py-3.5 px-6">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-3.5 px-6 text-xs text-slate-600">
                        {new Date(r.requiredDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {isPending && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  setSelectedReq(r);
                                  setActionType("APPROVE");
                                }}
                                className="text-xs gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Approve
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  setSelectedReq(r);
                                  setActionType("REJECT");
                                }}
                                className="text-xs gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Reject
                              </Button>
                            </>
                          )}

                          {isApproved && (
                            <>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => {
                                  setSelectedReq(r);
                                  setActionType("FULFILL");
                                }}
                                className="text-xs gap-1"
                              >
                                <PackageCheck className="w-3.5 h-3.5" />
                                Fulfill
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  setSelectedReq(r);
                                  setActionType("REJECT");
                                }}
                                className="text-xs gap-1"
                              >
                                Reject
                              </Button>
                            </>
                          )}

                          <a href={`/admin/requests/${r.id}`}>
                            <Button variant="outline" size="sm" className="text-xs">
                              Detail
                            </Button>
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modals for Actions */}
      {selectedReq && actionType === "APPROVE" && (
        <Modal
          isOpen={true}
          onClose={() => {
            setActionType(null);
            setSelectedReq(null);
          }}
          onConfirm={handleAction}
          title="Approve Blood Request"
          description={`Approve request #${selectedReq.id.slice(-6).toUpperCase()} for ${selectedReq.patientName} (${selectedReq.unitsRequired} units of ${selectedReq.bloodGroupDisplay})? Stock is not yet deducted until physical fulfillment.`}
          confirmText="Approve Request"
          variant="primary"
          isLoading={actionLoading}
        />
      )}

      {selectedReq && actionType === "FULFILL" && (
        <Modal
          isOpen={true}
          onClose={() => {
            setActionType(null);
            setSelectedReq(null);
          }}
          onConfirm={handleAction}
          title="Confirm Handover & Fulfill Request"
          description={`Confirm that ${selectedReq.unitsRequired} unit(s) of ${selectedReq.bloodGroupDisplay} have been handed over to ${selectedReq.hospitalName}? This action will atomically deduct ${selectedReq.unitsRequired} units from inventory balance.`}
          confirmText="Confirm & Deduct Stock"
          variant="success"
          isLoading={actionLoading}
        />
      )}

      {selectedReq && actionType === "REJECT" && (
        <Modal
          isOpen={true}
          onClose={() => {
            setActionType(null);
            setSelectedReq(null);
            setRejectReason("");
          }}
          title="Reject Blood Request"
          description={`Reject request #${selectedReq.id.slice(-6).toUpperCase()} for ${selectedReq.patientName}?`}
          confirmText="Reject Request"
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
              placeholder="e.g. Clinical criteria not met or alternative supply arranged"
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
