"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  FilePlus,
  AlertCircle,
  Building2,
  Calendar,
  Phone,
  User,
  MapPin,
  Clock,
  ShieldAlert,
  Info,
} from "lucide-react";
import { ALL_BLOOD_GROUPS, BLOOD_GROUP_DISPLAY } from "@/lib/constants";

export const dynamic = "force-dynamic";

function NewBloodRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedGroup = searchParams.get("group") || "A_POS";
  const preselectedHospital = searchParams.get("hospitalName") || "";
  const preselectedCity = searchParams.get("city") || "";
  const preselectedComponent = searchParams.get("component") || "";
  const preselectedUrgency = searchParams.get("urgency") || "NORMAL";

  const { success, error: toastError } = useToast();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultRequiredDate = tomorrow.toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    patientName: "",
    bloodGroup: preselectedGroup,
    unitsRequired: 1,
    hospitalName: preselectedHospital,
    city: preselectedCity,
    contactNumber: "",
    requiredDate: defaultRequiredDate,
    urgency: preselectedUrgency,
    additionalInfo: preselectedComponent ? `Required Component: ${preselectedComponent}` : "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatientProfile = async () => {
      try {
        const res = await fetch("/api/patient/profile");
        if (res.ok) {
          const json = await res.json();
          setFormData((prev) => ({
            ...prev,
            hospitalName: prev.hospitalName || json.data?.organizationName || "",
            city: prev.city || json.data?.city || "",
            contactNumber: prev.contactNumber || json.data?.phone || "",
          }));
        }
      } catch {
        // Ignore fallback
      }
    };
    fetchPatientProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/patient/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: formData.patientName.trim(),
          bloodGroup: formData.bloodGroup,
          unitsRequired: Number(formData.unitsRequired),
          hospitalName: formData.hospitalName.trim(),
          city: formData.city.trim(),
          contactNumber: formData.contactNumber.trim(),
          requiredDate: new Date(formData.requiredDate).toISOString(),
          urgency: formData.urgency,
          additionalInfo: formData.additionalInfo.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to submit blood request");
        toastError(data.error || "Failed to submit blood request");
        setSubmitting(false);
        return;
      }

      success("Blood request submitted! Blood bank administration will review your request.");
      router.push(`/patient/requests/${data.data.id}`);
    } catch {
      setErrorMessage("Network error while submitting request.");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Request Blood Supply
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Submit clinical blood requisition details for emergency or scheduled surgical procedures.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-teal-900 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Requisition Lifecycle:</strong> Once submitted, the request status is{" "}
          <span className="font-bold text-amber-700">Pending</span>. When staff review and accept
          it, it transitions to <span className="font-bold text-blue-700">Approved</span>. Units are
          strictly decremented when physically handed over (
          <span className="font-bold text-emerald-700">Fulfilled</span>).
        </p>
      </div>

      <Card>
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <CardHeader
            title="Patient & Clinical Details"
            subtitle="Please ensure all required medical details are filled accurately."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Patient Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Robert Anderson"
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 pl-9 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Blood Group Required
              </label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full text-sm font-bold rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {ALL_BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {BLOOD_GROUP_DISPLAY[bg]} ({bg})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Units Required
              </label>
              <input
                type="number"
                min="1"
                max="50"
                required
                value={formData.unitsRequired}
                onChange={(e) =>
                  setFormData({ ...formData, unitsRequired: parseInt(e.target.value) || 1 })
                }
                className="w-full text-sm font-bold rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Urgency Level
              </label>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                className="w-full text-sm font-semibold rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="NORMAL">Normal (Routine)</option>
                <option value="URGENT">Urgent (&lt; 24h)</option>
                <option value="EMERGENCY">Emergency (Immediate)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Required By Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={formData.requiredDate}
                  onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                  className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hospital / Clinic Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. St. Jude Memorial Hospital"
                  value={formData.hospitalName}
                  onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                  className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 pl-9 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 pl-9 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contact Phone for Blood Bank Coordinator
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                placeholder="+1-555-0201"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 pl-9 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Clinical Context / Additional Notes (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Emergency bypass surgery, trauma ward 4B"
              value={formData.additionalInfo}
              onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
              className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <a href="/patient/requests">
              <Button variant="outline" size="md" type="button">
                Cancel
              </Button>
            </a>
            <Button
              type="submit"
              variant="danger"
              size="md"
              isLoading={submitting}
              className="gap-2 shadow-sm"
            >
              <FilePlus className="w-4 h-4" />
              Submit Blood Request
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function NewBloodRequestPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-sm text-slate-500">Loading form...</div>}>
      <NewBloodRequestForm />
    </Suspense>
  );
}
