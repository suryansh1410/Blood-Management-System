"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge, UrgencyBadge } from "@/components/ui/Badge";
import { LoadingSpinner, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Phone,
  User,
  CheckCircle2,
  PackageCheck,
  XCircle,
  AlertTriangle,
  Clock,
  Layers,
} from "lucide-react";

export default function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const { success, error: toastError } = useToast();

  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionType, setActionType] = useState<"APPROVE" | "FULFILL" | "REJECT" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchRequest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/requests/${id}`);
      if (!res.ok) throw new Error("Failed to load request details");
      const json = await res.json();
      setRequest(json.data);
    } catch (err: any) {
      setError(err.message || "Failed to load request");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const handleAction = async () => {
    if (!actionType) return;
    setActionLoading(true);

    try {
      let endpoint = "";
      let options: RequestInit = { method: "POST" };

      if (actionType === "APPROVE") {
        endpoint = `/api/admin/requests/${id}/approve`;
      } else if (actionType === "FULFILL") {
        endpoint = `/api/admin/requests/${id}/fulfill`;
      } else if (actionType === "REJECT") {
        endpoint = `/api/admin/requests/${id}/reject`;
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
        success(data.message || `Request updated successfully`);
        setActionType(null);
        setRejectReason("");
        fetchRequest();
      }
    } catch {
      toastError(`Network error while performing ${actionType}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading request details..." />;
  if (error) return <ErrorState message={error} onRetry={fetchRequest} />;
  if (!request) return <ErrorState message="Request not found" />;

  const isPending = request.status === "PENDING";
  const isApproved = request.status === "APPROVED";
  const hasEnoughStock = request.currentStockUnits >= request.unitsRequired;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <a href="/admin/requests">
            <Button variant="outline" size="sm" className="p-2" aria-label="Back to requests">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </a>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Request #{request.id.slice(-6).toUpperCase()}
            </h1>
            <p className="text-xs text-slate-500">
              Submitted: {new Date(request.requestDate).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPending && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActionType("APPROVE")}
                className="gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve Request
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setActionType("REJECT")}
                className="gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </Button>
            </>
          )}

          {isApproved && (
            <>
              <Button
                variant="success"
                size="sm"
                onClick={() => setActionType("FULFILL")}
                className="gap-1.5"
              >
                <PackageCheck className="w-4 h-4" />
                Fulfill & Handover
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setActionType("REJECT")}
                className="gap-1.5"
              >
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stock Availability Comparison Card */}
      <Card className="p-5 bg-gradient-to-r from-slate-900 to-teal-950 text-white border-0 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center font-black text-xl text-rose-400 border border-white/20">
              {request.bloodGroupDisplay}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Inventory Stock Comparison
              </p>
              <div className="flex items-center gap-4 mt-1">
                <div>
                  <span className="text-xs text-slate-400 block">Required:</span>
                  <span className="text-xl font-black">{request.unitsRequired} units</span>
                </div>
                <div className="text-slate-500">/</div>
                <div>
                  <span className="text-xs text-slate-400 block">Current Stock:</span>
                  <span
                    className={`text-xl font-black ${
                      hasEnoughStock ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {request.currentStockUnits} units
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            {hasEnoughStock ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4" />
                Sufficient Reserves
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30">
                <AlertTriangle className="w-4 h-4" />
                Insufficient Stock to Fulfill
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-3">
          <CardHeader title="Clinical Requisition" />
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Patient:</span>
              <span className="font-bold text-slate-900">{request.patientName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Blood Group:</span>
              <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                {request.bloodGroupDisplay}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Required By:</span>
              <span className="font-semibold text-slate-800">
                {new Date(request.requiredDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Urgency:</span>
              <UrgencyBadge urgency={request.urgency} />
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Current Status:</span>
              <StatusBadge status={request.status} />
            </div>
          </div>
        </Card>

        <Card className="space-y-3">
          <CardHeader title="Hospital & Requester Info" />
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Hospital:</span>
              <span className="font-bold text-slate-900">{request.hospitalName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">City:</span>
              <span className="font-semibold text-slate-800">{request.city}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Emergency Phone:</span>
              <span className="font-semibold text-slate-800">{request.contactNumber}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Submitted By:</span>
              <span className="font-semibold text-slate-800">
                {request.requester?.name} ({request.requester?.email})
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Confirmation Modals */}
      {actionType === "APPROVE" && (
        <Modal
          isOpen={true}
          onClose={() => setActionType(null)}
          onConfirm={handleAction}
          title="Approve Requisition"
          description="Approve this blood request? The requester will be notified that units are being prepared."
          confirmText="Approve"
          variant="primary"
          isLoading={actionLoading}
        />
      )}

      {actionType === "FULFILL" && (
        <Modal
          isOpen={true}
          onClose={() => setActionType(null)}
          onConfirm={handleAction}
          title="Confirm Handover & Fulfill"
          description={`Confirm that ${request.unitsRequired} unit(s) of ${request.bloodGroupDisplay} have been handed over? This will atomically decrement inventory by ${request.unitsRequired} units.`}
          confirmText="Confirm & Deduct Stock"
          variant="success"
          isLoading={actionLoading}
        />
      )}

      {actionType === "REJECT" && (
        <Modal
          isOpen={true}
          onClose={() => setActionType(null)}
          title="Reject Request"
          description="Are you sure you want to reject this request?"
          confirmText="Reject"
          variant="danger"
          isLoading={actionLoading}
          onConfirm={handleAction}
        >
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Reason</label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection"
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-900 focus:outline-none"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
