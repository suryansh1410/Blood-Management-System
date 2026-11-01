"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingSpinner, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { CheckCircle, XCircle, Info, Activity } from "lucide-react";

export default function DonorAvailabilityPage() {
  const { success, error: toastError } = useToast();
  const [currentStatus, setCurrentStatus] = useState<string>("AVAILABLE");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/donor/profile");
      if (!res.ok) throw new Error("Failed to load availability status");
      const json = await res.json();
      setCurrentStatus(json.data?.availabilityStatus || "AVAILABLE");
    } catch (err: any) {
      setError(err.message || "Failed to load status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleToggle = async (newStatus: "AVAILABLE" | "UNAVAILABLE") => {
    if (newStatus === currentStatus) return;
    setUpdating(true);
    try {
      const res = await fetch("/api/donor/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availabilityStatus: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || "Failed to update availability");
      } else {
        setCurrentStatus(newStatus);
        success(`Your status is now ${newStatus === "AVAILABLE" ? "Available" : "Unavailable"}`);
      }
    } catch {
      toastError("Network error while updating status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading availability status..." />;
  if (error) return <ErrorState message={error} onRetry={fetchStatus} />;

  const isAvailable = currentStatus === "AVAILABLE";

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Donation Availability Status
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Indicate whether you are currently available to be contacted for emergency blood donations.
        </p>
      </div>

      <Card className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Status</p>
            <div className="mt-1">
              <StatusBadge status={currentStatus} />
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500">Live system indicator</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            disabled={updating}
            onClick={() => handleToggle("AVAILABLE")}
            className={`p-5 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all ${
              isAvailable
                ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 text-emerald-950 shadow-xs"
                : "border-slate-200 bg-white hover:border-slate-300 text-slate-600"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isAvailable ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"
                }`}
              >
                <CheckCircle className="w-5 h-5" />
              </div>
              {isAvailable && (
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                  Active
                </span>
              )}
            </div>
            <div>
              <p className="font-bold text-base text-slate-900">Available to Donate</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Visible to regional blood bank staff when filtering ready donors.
              </p>
            </div>
          </button>

          <button
            type="button"
            disabled={updating}
            onClick={() => handleToggle("UNAVAILABLE")}
            className={`p-5 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all ${
              !isAvailable
                ? "border-slate-700 bg-slate-100 ring-2 ring-slate-700/20 text-slate-900 shadow-xs"
                : "border-slate-200 bg-white hover:border-slate-300 text-slate-600"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  !isAvailable ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-400"
                }`}
              >
                <XCircle className="w-5 h-5" />
              </div>
              {!isAvailable && (
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Active
                </span>
              )}
            </div>
            <div>
              <p className="font-bold text-base text-slate-900">Temporarily Unavailable</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Paused due to travel, recent donation recovery, or personal schedule.
              </p>
            </div>
          </button>
        </div>

        <div className="text-xs text-slate-500 flex items-start gap-2 bg-slate-50 p-3 rounded-xl">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            You can toggle this status at any time. Updating does not affect your previous verified
            donation history.
          </span>
        </div>
      </Card>
    </div>
  );
}
