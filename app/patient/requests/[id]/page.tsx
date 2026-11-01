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
  Calendar,
  Building2,
  User,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react";

export default function PatientRequestDetailPage({
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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchRequest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/patient/requests/${id}`);
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

  const handleCancelRequest = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/patient/requests/${id}/cancel`, {
        method: "PATCH",
      });
      const data = await res.json();

      if (!res.ok) {
        toastError(data.error || "Failed to cancel request");
      } else {
        success("Blood request cancelled successfully");
        setShowCancelModal(false);
        fetchRequest();
      }
    } catch {
      toastError("Network error while cancelling request");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading request details..." />;
  if (error) return <ErrorState message={error} onRetry={fetchRequest} />;
  if (!request) return <ErrorState message="Blood request not found" />;

  const canCancel = request.status === "PENDING" || request.status === "APPROVED";

  // Step calculations for timeline
  const isPending = request.status === "PENDING";
  const isApproved = request.status === "APPROVED";
  const isFulfilled = request.status === "FULFILLED";
  const isRejected = request.status === "REJECTED";
  const isCancelled = request.status === "CANCELLED";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <a href="/patient/requests">
            <Button variant="outline" size="sm" className="p-2" aria-label="Back to requests">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </a>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Request #{request.id.slice(-6).toUpperCase()}
            </h1>
            <p className="text-xs text-slate-500">
              Submitted on {new Date(request.requestDate).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canCancel && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowCancelModal(true)}
              className="gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel Request
            </Button>
          )}
        </div>
      </div>

      {/* Progress Timeline */}
      <Card className="p-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
          Lifecycle Progression
        </h2>

        {isRejected || isCancelled ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold">This request was {isRejected ? "Rejected" : "Cancelled"}</p>
              <p className="text-slate-500 mt-0.5">
                Terminal state. No inventory units were deducted from the blood bank.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 relative">
            {/* Step 1: Submitted */}
            <div className="text-center space-y-2 relative">
              <div className="w-10 h-10 rounded-2xl mx-auto bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900">1. Submitted</p>
                <p className="text-[10px] text-slate-400">
                  {new Date(request.requestDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Step 2: Approved */}
            <div className="text-center space-y-2 relative">
              <div
                className={`w-10 h-10 rounded-2xl mx-auto flex items-center justify-center font-bold shadow-xs ${
                  isApproved || isFulfilled
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-400 border border-slate-200"
                }`}
              >
                {isApproved || isFulfilled ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900">2. Approved</p>
                <p className="text-[10px] text-slate-400">
                  {request.approvedAt
                    ? new Date(request.approvedAt).toLocaleDateString()
                    : "Pending Staff Review"}
                </p>
              </div>
            </div>

            {/* Step 3: Fulfilled */}
            <div className="text-center space-y-2 relative">
              <div
                className={`w-10 h-10 rounded-2xl mx-auto flex items-center justify-center font-bold shadow-xs ${
                  isFulfilled
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-400 border border-slate-200"
                }`}
              >
                {isFulfilled ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900">3. Fulfilled</p>
                <p className="text-[10px] text-slate-400">
                  {request.fulfilledAt
                    ? new Date(request.fulfilledAt).toLocaleDateString()
                    : "Awaiting Transfer"}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Request Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <CardHeader title="Clinical Information" />
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Patient Name:</span>
              <span className="font-bold text-slate-900">{request.patientName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Blood Group:</span>
              <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                {request.bloodGroupDisplay}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Units Required:</span>
              <span className="font-bold text-slate-900">{request.unitsRequired} unit(s)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Urgency Level:</span>
              <UrgencyBadge urgency={request.urgency} />
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Required Date:</span>
              <span className="font-semibold text-slate-800">
                {new Date(request.requiredDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Current Status:</span>
              <StatusBadge status={request.status} />
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <CardHeader title="Hospital & Contact" />
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Hospital:</span>
              <span className="font-bold text-slate-900">{request.hospitalName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">City:</span>
              <span className="font-semibold text-slate-800">{request.city}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Contact Number:</span>
              <span className="font-semibold text-slate-800">{request.contactNumber}</span>
            </div>
            {request.additionalInfo && (
              <div className="pt-2">
                <span className="text-xs font-semibold text-slate-500 block mb-1">
                  Clinical Notes:
                </span>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {request.additionalInfo}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Confirmation Modal for Cancelling Request */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelRequest}
        title="Cancel Blood Request"
        description="Are you sure you want to cancel this blood request? Once cancelled, this action cannot be undone."
        confirmText="Yes, Cancel Request"
        variant="danger"
        isLoading={cancelling}
      />
    </div>
  );
}
