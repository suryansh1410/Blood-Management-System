"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
  XCircle,
  User,
  ShieldCheck,
  RefreshCw,
  Plus,
  Filter,
  Check,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function AdminAppointmentsPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");

  // Complete Donation Modal
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [unitsCollected, setUnitsCollected] = useState(1);
  const [completing, setCompleting] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "All") params.set("status", statusFilter);

      const res = await fetch(`/api/appointments?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setAppointments(json.data || []);
      }
    } catch {
      toastError("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) {
        toastError(json.error || "Failed to update appointment");
      } else {
        toastSuccess(`Appointment marked ${status}`);
        fetchAppointments();
      }
    } catch {
      toastError("Network error");
    }
  };

  const handleCompleteDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;

    setCompleting(true);
    try {
      const res = await fetch(`/api/appointments/${selectedAppt.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ units: Number(unitsCollected) }),
      });

      const json = await res.json();
      if (!res.ok) {
        toastError(json.error || "Failed to process completed donation");
      } else {
        toastSuccess(json.message || "Donation verified and stock updated!");
        setSelectedAppt(null);
        fetchAppointments();
      }
    } catch {
      toastError("Network error while recording donation");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">
            Appointment Management & Donation Screening
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review donor bookings, mark clinical attendance, and credit verified units to centre inventory.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 font-bold focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="BOOKED">Booked</option>
            <option value="APPROVED">Approved</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button
            onClick={fetchAppointments}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No appointment records found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider bg-slate-950/40">
                  <th className="py-3.5 px-4">Date & Slot</th>
                  <th className="py-3.5 px-4">Donor Information</th>
                  <th className="py-3.5 px-4">Blood Centre</th>
                  <th className="py-3.5 px-4">Blood Group</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
                {appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100">
                        {new Date(a.appointmentDate).toLocaleDateString("en-IN")}
                      </div>
                      <div className="text-[11px] text-cyan-400 font-mono mt-0.5">{a.timeSlot}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-200">{a.donor?.name || "Anonymous Donor"}</div>
                      <div className="text-[11px] text-slate-400">{a.donor?.phone || a.donor?.email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-200">{a.center?.name}</div>
                      <div className="text-[11px] text-slate-500">{a.center?.city}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded border border-rose-500/20">
                        {a.bloodGroupDisplay}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                          a.status === "COMPLETED"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : a.status === "APPROVED"
                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                            : a.status === "CANCELLED"
                            ? "bg-slate-800 text-slate-400"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {a.status === "COMPLETED" ? (
                        <span className="text-emerald-400 text-xs font-bold flex items-center justify-end gap-1">
                          <Check className="w-3.5 h-3.5" /> Stock Credited
                        </span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {a.status === "BOOKED" && (
                            <button
                              onClick={() => handleUpdateStatus(a.id, "APPROVED")}
                              className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px]"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedAppt(a);
                              setUnitsCollected(1);
                            }}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm shadow-emerald-600/30"
                          >
                            Mark Completed
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(a.id, "CANCELLED")}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[11px]"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Complete Donation Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Verify & Record Completed Donation</span>
              </div>
              <button
                onClick={() => setSelectedAppt(null)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCompleteDonation} className="space-y-4">
              <div className="text-xs text-slate-300 space-y-1 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                <p>
                  Donor: <strong className="text-slate-100">{selectedAppt.donor?.name}</strong>
                </p>
                <p>
                  Blood Group:{" "}
                  <strong className="text-rose-400">{selectedAppt.bloodGroupDisplay}</strong>
                </p>
                <p>
                  Centre: <strong className="text-slate-100">{selectedAppt.center?.name}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Verified Units Collected
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  required
                  value={unitsCollected}
                  onChange={(e) => setUnitsCollected(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-100"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Completing this action will automatically increase centre physical stock and log an audit entry.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedAppt(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completing}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-colors disabled:opacity-50"
                >
                  {completing ? "Recording Donation..." : "Confirm & Credit Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
