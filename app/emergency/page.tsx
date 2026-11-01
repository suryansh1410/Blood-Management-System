"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ShieldAlert,
  AlertTriangle,
  Building2,
  Calendar,
  Phone,
  User,
  MapPin,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Info,
  Navigation,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  ALL_BLOOD_GROUPS,
  BLOOD_GROUP_DISPLAY,
  SUPPORTED_BLOOD_COMPONENTS,
} from "@/lib/constants";
import { useToast } from "@/components/ui/Toast";

interface MatchingCenter {
  id: number;
  name: string;
  type: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  verificationStatus: string;
  unitsAvailable: number | null;
  status: string;
  statusLabel: string;
  hasLiveStock: boolean;
  lastStockUpdate: string;
  latitude?: number;
  longitude?: number;
}

export default function EmergencyBloodRequestPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { success: toastSuccess, error: toastError } = useToast();

  const [form, setForm] = useState({
    patientName: "",
    requesterName: "",
    contactNumber: "",
    bloodGroup: "B_POS",
    component: "Whole Blood",
    unitsRequired: 2,
    state: "Madhya Pradesh",
    city: "Gwalior",
    hospitalName: "",
    hospitalAddress: "",
    urgency: "EMERGENCY",
    requiredDate: new Date().toISOString().split("T")[0],
    additionalInfo: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    requestCode: string;
    id: string;
    matchingCentres: MatchingCenter[];
    alertedDonorsCount: number;
  } | null>(null);

  // Pre-fill user information if authenticated
  useEffect(() => {
    if (session?.user) {
      setForm((prev) => ({
        ...prev,
        requesterName: prev.requesterName || session.user?.name || "",
      }));
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/emergency/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          unitsRequired: Number(form.unitsRequired),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toastError(json.error || "Failed to submit emergency request");
      } else {
        toastSuccess(`Emergency Request #${json.data.requestCode} registered!`);
        setSubmissionResult({
          requestCode: json.data.requestCode,
          id: json.data.id,
          matchingCentres: json.data.matchingCentres || [],
          alertedDonorsCount: json.data.alertedDonorsCount || 0,
        });
      }
    } catch {
      toastError("Network connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-black uppercase tracking-wider mb-3">
              <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>Feature 1 &bull; Priority Emergency Coordination</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">
              Emergency Blood Request System
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Submit critical transfusion requests for immediate matching across verified hospital
              reserves and consented emergency donors in Gwalior and Madhya Pradesh.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/track"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4 text-cyan-400" /> Track Existing Request
            </a>
            <a
              href="/heatmap"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4 text-rose-400" /> View Live Heatmap
            </a>
          </div>
        </div>
      </div>

      {/* Submission Success State with Instant Matching Matrix */}
      {submissionResult ? (
        <div className="space-y-6 animate-in zoom-in-95 duration-200">
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 text-emerald-400 font-bold mb-2">
              <CheckCircle2 className="w-7 h-7 shrink-0 text-emerald-400" />
              <h2 className="text-2xl font-black text-slate-100">
                Emergency Request Registered Successfully
              </h2>
            </div>
            <p className="text-sm text-slate-300 ml-10">
              Your emergency tracking identifier is{" "}
              <span className="font-mono font-extrabold text-emerald-300 text-base px-2 py-0.5 bg-emerald-900/60 rounded border border-emerald-500/30">
                #{submissionResult.requestCode}
              </span>
              . An automated alert was dispatched to {submissionResult.alertedDonorsCount} nearby
              consenting donors.
            </p>

            <div className="flex flex-wrap items-center gap-3 ml-10 mt-5">
              <a
                href={`/track/${encodeURIComponent(submissionResult.requestCode)}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all"
              >
                Open Live Tracking Timeline <ArrowRight className="w-4 h-4" />
              </a>
              <button
                onClick={() => setSubmissionResult(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Submit Another Request
              </button>
            </div>
          </div>

          {/* Matching Centres Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-rose-500" /> Matching Verified Blood Centres
                </h3>
                <p className="text-xs text-slate-400">
                  Real physical inventory for {form.bloodGroup.replace("_", "+")} in {form.city}.
                  Old or unconfirmed stock is accurately marked.
                </p>
              </div>
            </div>

            {submissionResult.matchingCentres.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-sm">
                No local blood banks found in {form.city}. System is expanding radius to nearby
                district hubs.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {submissionResult.matchingCentres.map((center) => (
                  <div
                    key={center.id}
                    className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                            center.status === "AVAILABLE"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : center.status === "LOW_STOCK"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : center.status === "CRITICAL"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}
                        >
                          {center.statusLabel}
                        </span>
                        <h4 className="font-extrabold text-slate-100 text-base mt-1.5 leading-snug">
                          {center.name}
                        </h4>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs text-slate-400">Verified Units</div>
                        <div className="text-xl font-black text-slate-100">
                          {center.unitsAvailable !== null ? center.unitsAvailable : "—"}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{center.address}</span>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{center.phone}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80">
                      {center.latitude && center.longitude && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Navigation className="w-3.5 h-3.5 text-cyan-400" /> Directions
                        </a>
                      )}
                      <a
                        href={`/appointments/book?centerId=${center.id}&group=${form.bloodGroup}`}
                        className="flex-1 text-center bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold py-2 rounded-xl transition-colors"
                      >
                        Book Camp Visit
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Emergency Request Form */
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-md">
            <h2 className="text-lg font-black text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <User className="w-5 h-5 text-rose-500" /> Patient & Requester Verification
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Patient Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.patientName}
                  onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                  placeholder="e.g. Ramesh Verma"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Requester / Attendant Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.requesterName}
                  onChange={(e) => setForm({ ...form, requesterName: e.target.value })}
                  placeholder="e.g. Dr. Alok / Family Member"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Emergency Contact Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={form.contactNumber}
                  onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                  placeholder="+91-98260-XXXXX"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Urgency Level <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.urgency}
                  onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                >
                  <option value="EMERGENCY" className="text-rose-400">
                    🚨 EMERGENCY — Life Critical (&lt; 2 hours)
                  </option>
                  <option value="URGENT" className="text-amber-400">
                    ⚠️ URGENT — Needed within 12 hours
                  </option>
                  <option value="NORMAL" className="text-slate-300">
                    NORMAL — Scheduled Elective Procedure
                  </option>
                </select>
              </div>
            </div>

            <h2 className="text-lg font-black text-slate-100 flex items-center gap-2 border-b border-slate-800 pt-4 pb-3">
              <Building2 className="w-5 h-5 text-rose-500" /> Blood Specifications & Hospital Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Blood Group <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.bloodGroup}
                  onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 font-black focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {ALL_BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {BLOOD_GROUP_DISPLAY[bg]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Blood Component <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.component}
                  onChange={(e) => setForm({ ...form, component: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {SUPPORTED_BLOOD_COMPONENTS.map((comp) => (
                    <option key={comp} value={comp}>
                      {comp}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Required Units <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={form.unitsRequired}
                  onChange={(e) => setForm({ ...form, unitsRequired: parseInt(e.target.value, 10) || 1 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  State <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  City / District <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. Gwalior"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Required By Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.requiredDate}
                  onChange={(e) => setForm({ ...form, requiredDate: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Hospital Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.hospitalName}
                  onChange={(e) => setForm({ ...form, hospitalName: e.target.value })}
                  placeholder="e.g. J.A. Hospital / BIMR Hospital Gwalior"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Hospital Ward / Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.hospitalAddress}
                  onChange={(e) => setForm({ ...form, hospitalAddress: e.target.value })}
                  placeholder="e.g. Lashkar / ICU Bed 4"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Clinical Notes / Case Summary (Optional)
              </label>
              <textarea
                rows={2}
                value={form.additionalInfo}
                onChange={(e) => setForm({ ...form, additionalInfo: e.target.value })}
                placeholder="Doctor's name, surgery time, diagnosis, or cross-matching instructions..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>Generates secure tracking ID & dispatches live center verification</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm shadow-xl shadow-rose-600/30 transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Broadcasting Emergency Alert...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" /> Submit Emergency Request
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
