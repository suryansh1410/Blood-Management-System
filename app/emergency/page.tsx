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
  ChevronRight,
  ChevronLeft,
  Info,
  Navigation,
  ArrowRight,
  Droplet,
  HeartHandshake,
  FileText,
} from "lucide-react";
import {
  ALL_BLOOD_GROUPS,
  BLOOD_GROUP_DISPLAY,
  SUPPORTED_BLOOD_COMPONENTS,
} from "@/lib/constants";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

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

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    patientName: "",
    requesterName: "",
    relationship: "Family Member",
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

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!form.patientName.trim()) {
        errors.patientName = "Patient name is required";
      } else if (form.patientName.trim().length < 2) {
        errors.patientName = "Patient name must be at least 2 characters";
      }

      if (!form.requesterName.trim()) {
        errors.requesterName = "Requester name is required";
      }

      if (!form.contactNumber.trim()) {
        errors.contactNumber = "Emergency contact number is required";
      } else if (!/^[0-9+\-\s()]{7,15}$/.test(form.contactNumber.trim())) {
        errors.contactNumber = "Enter a valid phone number (7-15 digits)";
      }
    }

    if (step === 2) {
      if (!form.unitsRequired || form.unitsRequired < 1) {
        errors.unitsRequired = "Must request at least 1 unit";
      } else if (form.unitsRequired > 50) {
        errors.unitsRequired = "Maximum 50 units allowed per request";
      }

      if (!form.requiredDate) {
        errors.requiredDate = "Required date is mandatory";
      }
    }

    if (step === 3) {
      if (!form.hospitalName.trim()) {
        errors.hospitalName = "Hospital name is required";
      }
      if (!form.state.trim()) {
        errors.state = "State is required";
      }
      if (!form.city.trim()) {
        errors.city = "City/District is required";
      }
      if (!form.hospitalAddress.trim()) {
        errors.hospitalAddress = "Hospital ward or address is required";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep((prev) => (prev + 1) as 2 | 3);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setSubmitting(true);

    try {
      // Append relationship cleanly if provided
      const finalNotes = form.relationship
        ? `[Requester Relation: ${form.relationship}] ${form.additionalInfo || ""}`.trim()
        : form.additionalInfo || undefined;

      const res = await fetch("/api/emergency/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: form.patientName.trim(),
          requesterName: form.requesterName.trim(),
          contactNumber: form.contactNumber.trim(),
          bloodGroup: form.bloodGroup,
          component: form.component,
          unitsRequired: Number(form.unitsRequired),
          state: form.state.trim(),
          city: form.city.trim(),
          hospitalName: form.hospitalName.trim(),
          hospitalAddress: form.hospitalAddress.trim(),
          urgency: form.urgency,
          requiredDate: form.requiredDate,
          additionalInfo: finalNotes,
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-black uppercase tracking-wider mb-3">
              <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>Priority Emergency Transfusion Coordination</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-100 tracking-tight">
              Emergency Blood Request System
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Submit critical transfusion requirements for automated real-time matching against certified
              blood banks and consented voluntary donors in Gwalior and Madhya Pradesh.
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
              href="/donors/finder"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Navigation className="w-4 h-4 text-rose-400" /> Find Nearby Donors
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
                Emergency Requisition Registered Successfully
              </h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
              Tracking code generated:{" "}
              <strong className="text-emerald-400 font-mono text-lg underline ml-1">
                {submissionResult.requestCode}
              </strong>
              . Hospital reserves have received a hold inquiry, and notification alerts were dispatched
              to qualified nearby voluntary donors.
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-5">
              <a
                href={`/track/${submissionResult.requestCode}`}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-emerald-950/50"
              >
                Track Live Fulfillment <ChevronRight className="w-4 h-4" />
              </a>
              <button
                onClick={() => setSubmissionResult(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                Submit Another Request
              </button>
            </div>
          </div>

          {/* Alert Broadcast Metric */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-black">
                {submissionResult.alertedDonorsCount}
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Consented Donors Notified</h3>
                <p className="text-xs text-slate-400">
                  Voluntary donors within notification radius of {form.city} received priority emergency alerts.
                </p>
              </div>
            </div>
            <a
              href={`/donors/finder?group=${form.bloodGroup}&city=${encodeURIComponent(form.city)}`}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 self-start sm:self-auto"
            >
              Inspect Donor Proximity Matrix <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Matching Certified Centers */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-100">
                  Matching Blood Centers in {form.city}
                </h3>
                <p className="text-xs text-slate-400">
                  Physical reserves for {form.bloodGroup.replace("_", "+")} in {form.city}.
                </p>
              </div>
            </div>

            {submissionResult.matchingCentres.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-sm">
                No local blood banks found in {form.city}. Regional centers have been queried automatically.
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
        /* Guided Three-Step Emergency Form */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-8">
          {/* Step Indicator Header */}
          <div className="border-b border-slate-800 pb-6">
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {/* Step 1 */}
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={`flex items-center gap-3 p-3 rounded-2xl text-left transition-all cursor-pointer ${
                  currentStep === 1
                    ? "bg-rose-500/15 border border-rose-500/30 text-rose-300"
                    : currentStep > 1
                    ? "bg-slate-800/80 text-emerald-400"
                    : "bg-slate-800/40 text-slate-500"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                    currentStep === 1
                      ? "bg-rose-500 text-white"
                      : currentStep > 1
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-700 text-slate-400"
                  }`}
                >
                  {currentStep > 1 ? "✓" : "1"}
                </div>
                <div className="hidden sm:block min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-75">Step 1</div>
                  <div className="text-xs font-bold truncate">Patient Info</div>
                </div>
              </button>

              {/* Step 2 */}
              <button
                type="button"
                onClick={() => validateStep(1) && setCurrentStep(2)}
                className={`flex items-center gap-3 p-3 rounded-2xl text-left transition-all cursor-pointer ${
                  currentStep === 2
                    ? "bg-rose-500/15 border border-rose-500/30 text-rose-300"
                    : currentStep > 2
                    ? "bg-slate-800/80 text-emerald-400"
                    : "bg-slate-800/40 text-slate-500"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                    currentStep === 2
                      ? "bg-rose-500 text-white"
                      : currentStep > 2
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-700 text-slate-400"
                  }`}
                >
                  {currentStep > 2 ? "✓" : "2"}
                </div>
                <div className="hidden sm:block min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-75">Step 2</div>
                  <div className="text-xs font-bold truncate">Blood Requisition</div>
                </div>
              </button>

              {/* Step 3 */}
              <button
                type="button"
                onClick={() => validateStep(1) && validateStep(2) && setCurrentStep(3)}
                className={`flex items-center gap-3 p-3 rounded-2xl text-left transition-all cursor-pointer ${
                  currentStep === 3
                    ? "bg-rose-500/15 border border-rose-500/30 text-rose-300"
                    : "bg-slate-800/40 text-slate-500"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                    currentStep === 3
                      ? "bg-rose-500 text-white"
                      : "bg-slate-700 text-slate-400"
                  }`}
                >
                  3
                </div>
                <div className="hidden sm:block min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-75">Step 3</div>
                  <div className="text-xs font-bold truncate">Hospital & Summary</div>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* STEP 1: Patient Information */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-800/80">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/25 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-100">Step 1: Patient & Requester Details</h2>
                    <p className="text-xs text-slate-400">
                      Primary patient identification and emergency attendant contact details.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="Patient Full Name"
                    required
                    placeholder="e.g. Ramesh Verma"
                    value={form.patientName}
                    error={formErrors.patientName}
                    onChange={(e) => {
                      setForm({ ...form, patientName: e.target.value });
                      if (formErrors.patientName) setFormErrors({ ...formErrors, patientName: "" });
                    }}
                  />

                  <Input
                    label="Requester / Attendant Name"
                    required
                    placeholder="e.g. Dr. Alok / Family Member"
                    value={form.requesterName}
                    error={formErrors.requesterName}
                    onChange={(e) => {
                      setForm({ ...form, requesterName: e.target.value });
                      if (formErrors.requesterName) setFormErrors({ ...formErrors, requesterName: "" });
                    }}
                  />

                  <Input
                    label="Emergency Contact Phone Number"
                    type="tel"
                    required
                    placeholder="+91-98260-XXXXX"
                    hint="Staff and matched centers will use this number for urgent dispatch."
                    value={form.contactNumber}
                    error={formErrors.contactNumber}
                    onChange={(e) => {
                      setForm({ ...form, contactNumber: e.target.value });
                      if (formErrors.contactNumber) setFormErrors({ ...formErrors, contactNumber: "" });
                    }}
                  />

                  <Select
                    label="Relationship with Patient"
                    value={form.relationship}
                    onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                  >
                    <option value="Self / Patient">Self / Patient</option>
                    <option value="Family Member">Family Member</option>
                    <option value="Attending Physician / Doctor">Attending Physician / Doctor</option>
                    <option value="Hospital Staff / Nurse">Hospital Staff / Nurse</option>
                    <option value="Other Authorized Caregiver">Other Authorized Caregiver</option>
                  </Select>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleNext}
                    className="gap-2 px-6"
                  >
                    Continue to Blood Details <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: Blood Requirement */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-800/80">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/25 flex items-center justify-center">
                    <Droplet className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-100">Step 2: Blood Requirement & Urgency</h2>
                    <p className="text-xs text-slate-400">
                      Specify the required blood group, component, units, and urgency level.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <Select
                    label="Blood Group"
                    required
                    value={form.bloodGroup}
                    onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                  >
                    {ALL_BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {BLOOD_GROUP_DISPLAY[bg]}
                      </option>
                    ))}
                  </Select>

                  <Select
                    label="Blood Component"
                    required
                    value={form.component}
                    onChange={(e) => setForm({ ...form, component: e.target.value })}
                  >
                    {SUPPORTED_BLOOD_COMPONENTS.map((comp) => (
                      <option key={comp} value={comp}>
                        {comp}
                      </option>
                    ))}
                  </Select>

                  <Input
                    label="Required Units"
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={form.unitsRequired}
                    error={formErrors.unitsRequired}
                    onChange={(e) => {
                      setForm({ ...form, unitsRequired: parseInt(e.target.value, 10) || 1 });
                      if (formErrors.unitsRequired) setFormErrors({ ...formErrors, unitsRequired: "" });
                    }}
                  />

                  <Input
                    label="Required By Date"
                    type="date"
                    required
                    value={form.requiredDate}
                    error={formErrors.requiredDate}
                    onChange={(e) => {
                      setForm({ ...form, requiredDate: e.target.value });
                      if (formErrors.requiredDate) setFormErrors({ ...formErrors, requiredDate: "" });
                    }}
                  />

                  <div className="sm:col-span-2">
                    <Select
                      label="Urgency Level"
                      required
                      value={form.urgency}
                      onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                    >
                      <option value="EMERGENCY">
                        🚨 EMERGENCY — Life Critical (Required within 2 hours)
                      </option>
                      <option value="URGENT">
                        ⚠️ URGENT — Needed within 12 hours
                      </option>
                      <option value="NORMAL">
                        NORMAL — Scheduled Elective Procedure
                      </option>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <Button type="button" variant="outline" onClick={handleBack} className="gap-2">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </Button>
                  <Button type="button" variant="primary" onClick={handleNext} className="gap-2 px-6">
                    Continue to Hospital Info <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Hospital Information & Request Confirmation */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-800/80">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/25 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-100">Step 3: Hospital Information & Review</h2>
                    <p className="text-xs text-slate-400">
                      Destination medical facility and review before immediate emergency broadcast.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="Hospital Name"
                    required
                    placeholder="e.g. J.A. Hospital / BIMR Hospital Gwalior"
                    value={form.hospitalName}
                    error={formErrors.hospitalName}
                    onChange={(e) => {
                      setForm({ ...form, hospitalName: e.target.value });
                      if (formErrors.hospitalName) setFormErrors({ ...formErrors, hospitalName: "" });
                    }}
                  />

                  <Input
                    label="Hospital Ward / Room Details"
                    required
                    placeholder="e.g. ICU Bed 4 / Surgical Ward 2"
                    value={form.hospitalAddress}
                    error={formErrors.hospitalAddress}
                    onChange={(e) => {
                      setForm({ ...form, hospitalAddress: e.target.value });
                      if (formErrors.hospitalAddress) setFormErrors({ ...formErrors, hospitalAddress: "" });
                    }}
                  />

                  <Input
                    label="State"
                    required
                    value={form.state}
                    error={formErrors.state}
                    onChange={(e) => {
                      setForm({ ...form, state: e.target.value });
                      if (formErrors.state) setFormErrors({ ...formErrors, state: "" });
                    }}
                  />

                  <Input
                    label="City / District"
                    required
                    placeholder="e.g. Gwalior"
                    value={form.city}
                    error={formErrors.city}
                    onChange={(e) => {
                      setForm({ ...form, city: e.target.value });
                      if (formErrors.city) setFormErrors({ ...formErrors, city: "" });
                    }}
                  />
                </div>

                <Textarea
                  label="Clinical Notes / Additional Information (Optional)"
                  rows={2}
                  placeholder="Doctor's name, surgery time, diagnosis, or cross-matching instructions..."
                  value={form.additionalInfo}
                  onChange={(e) => setForm({ ...form, additionalInfo: e.target.value })}
                />

                {/* Final Requisition Summary Card */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400">
                    <FileText className="w-4 h-4" /> Requisition Summary Preview
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block">Patient</span>
                      <strong className="text-white font-medium">{form.patientName || "—"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Blood Group</span>
                      <strong className="text-rose-400 font-bold">{BLOOD_GROUP_DISPLAY[form.bloodGroup as keyof typeof BLOOD_GROUP_DISPLAY]}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Quantity</span>
                      <strong className="text-white font-medium">{form.unitsRequired} unit(s) ({form.component})</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Urgency</span>
                      <strong className={form.urgency === "EMERGENCY" ? "text-rose-400 font-bold" : "text-amber-400 font-medium"}>
                        {form.urgency}
                      </strong>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block">Facility</span>
                      <strong className="text-white font-medium">{form.hospitalName || "—"}, {form.city}</strong>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block">Contact</span>
                      <strong className="text-white font-medium">{form.contactNumber || "—"} ({form.requesterName})</strong>
                    </div>
                  </div>
                </div>

                {/* Submission CTA */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
                  <Button type="button" variant="outline" onClick={handleBack} className="gap-2 w-full sm:w-auto">
                    <ChevronLeft className="w-4 h-4" /> Back to Blood Details
                  </Button>

                  <Button
                    type="submit"
                    variant="danger"
                    size="lg"
                    disabled={submitting}
                    isLoading={submitting}
                    className="w-full sm:w-auto px-8 py-3.5 shadow-xl shadow-rose-950/60 font-black text-sm gap-2"
                  >
                    <ShieldAlert className="w-5 h-5 text-white" />
                    Submit Emergency Request Now
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
