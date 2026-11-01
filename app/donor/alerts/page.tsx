"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  Clock,
  ShieldAlert,
  ArrowRight,
  Radio,
  RefreshCw,
  Navigation,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function DonorAlertsPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/donor/alerts");
      const json = await res.json();
      if (json.success) {
        setAlerts(json.data || []);
      }
    } catch {
      toastError("Failed to fetch alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleRespond = async (alertId: string, status: "ACCEPTED" | "DECLINED") => {
    setRespondingId(alertId);
    try {
      const res = await fetch(`/api/donor/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const json = await res.json();
      if (!res.ok) {
        toastError(json.error || "Failed to update alert");
      } else {
        toastSuccess(json.message);
        fetchAlerts();
      }
    } catch {
      toastError("Network error while responding");
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold mb-2">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>Emergency Coordination Feed</span>
          </div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">
            Incoming Emergency Donor Alerts
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time requests in your area where your blood group is urgently needed.
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          <Bell className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h3 className="font-bold text-slate-200">No Active Emergency Alerts</h3>
          <p className="text-xs text-slate-500 mt-1">
            When a patient nearby requests your blood group, a high-priority alert will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const req = alert.request;
            if (!req) return null;

            const isPending = alert.status === "SENT";

            return (
              <div
                key={alert.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 backdrop-blur-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center font-black text-rose-300 text-sm">
                      {req.bloodGroupDisplay}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-sm">{req.patientName}</span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          {req.urgency}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {req.unitsRequired} unit(s) of {req.component} &bull; {req.hospitalName}, {req.city}
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        alert.status === "ACCEPTED"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : alert.status === "DECLINED"
                          ? "bg-slate-800 text-slate-400"
                          : "bg-cyan-500/20 text-cyan-400 animate-pulse"
                      }`}
                    >
                      {alert.status === "SENT" ? "Awaiting Your Response" : alert.status}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {new Date(alert.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-300 flex items-center justify-between">
                  <span>
                    Hospital Ward / Address: <strong className="text-slate-100">{req.hospitalAddress || "Emergency Unit"}</strong>
                  </span>
                </div>

                {isPending ? (
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleRespond(alert.id, "ACCEPTED")}
                      disabled={respondingId === alert.id}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Accept & Ready to Donate
                    </button>
                    <button
                      onClick={() => handleRespond(alert.id, "DECLINED")}
                      disabled={respondingId === alert.id}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                ) : alert.status === "ACCEPTED" ? (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                    <span>
                      Accepted! Please report to {req.hospitalName} for voluntary screening.
                    </span>
                    <a
                      href={`/track/${encodeURIComponent(req.requestCode || req.id)}`}
                      className="font-bold underline ml-2 shrink-0"
                    >
                      View Live Tracker &rarr;
                    </a>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
