"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Building2,
  Calendar,
  User,
  ShieldCheck,
  MapPin,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowLeft,
  Lock,
} from "lucide-react";
import { TRACKING_STATUSES, TrackingStatus } from "@/lib/constants";

const TIMELINE_STEPS: { status: TrackingStatus; label: string; desc: string }[] = [
  { status: "SUBMITTED", label: "Submitted", desc: "Request logged in national coordination system" },
  { status: "VERIFICATION_PENDING", label: "Verification Pending", desc: "Patient & hospital medical check" },
  { status: "VERIFIED", label: "Verified", desc: "Urgency verified by clinical triage" },
  { status: "SEARCHING", label: "Searching", desc: "Broadcasting to verified blood centres & donors" },
  { status: "HOSPITAL_RESPONDED", label: "Hospital Responded", desc: "Blood centre acknowledged alert" },
  { status: "AVAILABILITY_CONFIRMED", label: "Availability Confirmed", desc: "Blood units verified in physical stock" },
  { status: "RESERVED", label: "Reserved", desc: "Units quarantined & tagged for patient" },
  { status: "FULFILLED", label: "Fulfilled", desc: "Units delivered for clinical transfusion" },
];

export default function RequestTrackingDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrackData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/track/${encodeURIComponent(code)}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Request not found");
      }
      setData(json.data);
    } catch (err: any) {
      setError(err.message || "Failed to load tracking information");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackData();
  }, [code]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-slate-400">Fetching live request tracking timeline...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">Tracking Record Not Found</h2>
        <p className="text-xs text-slate-400">{error || "Could not find a blood request with that ID."}</p>
        <div className="pt-2">
          <Link
            href="/track"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Try another Request ID
          </Link>
        </div>
      </div>
    );
  }

  const isTerminalNegative =
    data.trackingStatus === "REJECTED" ||
    data.trackingStatus === "CANCELLED" ||
    data.trackingStatus === "EXPIRED";

  // Calculate current active step index in standard flow
  const currentStepIndex = TIMELINE_STEPS.findIndex((s) => s.status === data.trackingStatus);
  const activeStepIdx = currentStepIndex !== -1 ? currentStepIndex : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back and Status Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/track"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tracker
        </Link>
        <button
          onClick={fetchTrackData}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
        </button>
      </div>

      {/* Main Request Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-slate-400">REQUEST ID:</span>
              <span className="font-mono text-sm font-black text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded border border-rose-500/20">
                #{data.requestCode}
              </span>
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded ${
                  data.urgency === "EMERGENCY"
                    ? "bg-rose-600 text-white animate-pulse"
                    : data.urgency === "URGENT"
                    ? "bg-amber-500 text-slate-950"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {data.urgency}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-100">
              {data.patientName} &bull; {data.unitsRequired} Unit(s) of {data.bloodGroupDisplay}
            </h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>{data.component}</span>
              <span>&bull;</span>
              <span>{data.hospitalName}, {data.city}</span>
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <div className="text-xs text-slate-500">Current Lifecycle Status</div>
            <div
              className={`text-lg font-black mt-0.5 ${
                data.trackingStatus === "FULFILLED"
                  ? "text-emerald-400"
                  : data.trackingStatus === "RESERVED"
                  ? "text-emerald-400"
                  : isTerminalNegative
                  ? "text-rose-400"
                  : "text-cyan-400"
              }`}
            >
              {data.statusLabel}
            </div>
          </div>
        </div>

        {/* Cold-chain Hold / Reservation Badge if Reserved */}
        {data.reservedUnits > 0 && (
          <div className="my-5 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-emerald-300 text-xs">
                  COLD-CHAIN QUARANTINE HOLD ACTIVE
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  {data.reservedUnits} unit(s) of {data.bloodGroupDisplay} are allocated and
                  held in reservation for this patient.
                </div>
              </div>
            </div>
            {data.assignedCenter && (
              <span className="text-xs text-emerald-400 font-bold shrink-0">
                {data.assignedCenter.name}
              </span>
            )}
          </div>
        )}

        {/* Visual 8-Step Timeline Stepper (Feature 5) */}
        {!isTerminalNegative ? (
          <div className="my-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
              Official Blood Request Lifecycle Tracker
            </h3>

            <div className="relative">
              {/* Stepper Progress Bar */}
              <div className="hidden md:block absolute top-4 left-6 right-6 h-1 bg-slate-800 z-0">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
                  style={{
                    width: `${(activeStepIdx / (TIMELINE_STEPS.length - 1)) * 100}%`,
                  }}
                />
              </div>

              {/* Steps Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 relative z-10">
                {TIMELINE_STEPS.map((step, idx) => {
                  const isPassed = idx < activeStepIdx;
                  const isCurrent = idx === activeStepIdx;

                  return (
                    <div key={step.status} className="flex flex-col items-center text-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                          isPassed
                            ? "bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20 shadow-lg shadow-emerald-500/30"
                            : isCurrent
                            ? "bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/30 animate-pulse shadow-lg shadow-cyan-500/40"
                            : "bg-slate-800 border border-slate-700 text-slate-400"
                        }`}
                      >
                        {isPassed ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <div
                        className={`text-[11px] font-bold mt-2 leading-tight ${
                          isCurrent
                            ? "text-cyan-300"
                            : isPassed
                            ? "text-slate-200"
                            : "text-slate-500"
                        }`}
                      >
                        {step.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="my-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-xs">
            <XCircle className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold">Request {data.statusLabel}: </span>
              {data.rejectionReason || "This request has concluded."}
            </div>
          </div>
        )}

        {/* Detailed Timeline Events Log */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <h3 className="text-sm font-black text-slate-200 flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-cyan-400" /> Audit Timeline & Verification Log
          </h3>

          <div className="space-y-4">
            {data.timeline.map((event: any, idx: number) => (
              <div
                key={event.id || idx}
                className="flex items-start gap-4 p-3.5 rounded-xl bg-slate-800/40 border border-slate-800"
              >
                <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-200 text-xs">{event.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(event.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })} &bull; {new Date(event.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    {event.description}
                  </p>
                  <span className="inline-block text-[9px] font-mono text-slate-500 uppercase mt-1">
                    Logged by {event.performedBy}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hospital Response Notes */}
        {data.hospitalResponses && data.hospitalResponses.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-800">
            <h3 className="text-sm font-black text-slate-200 flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-emerald-400" /> Hospital Staff Response Details
            </h3>

            <div className="space-y-3">
              {data.hospitalResponses.map((hr: any) => (
                <div
                  key={hr.id}
                  className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 text-xs">
                      {hr.center?.name || "Blood Centre Staff"}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                      {hr.responseType.replace(/_/g, " ")}
                    </span>
                  </div>
                  {hr.notes && <p className="text-xs text-slate-300">{hr.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
