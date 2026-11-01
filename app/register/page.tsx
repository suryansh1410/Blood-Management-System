"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  Droplet,
  Heart,
  Building2,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { ALL_BLOOD_GROUPS, BLOOD_GROUP_DISPLAY } from "@/lib/constants";

export const dynamic = "force-dynamic";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "DONOR" ? "DONOR" : "PATIENT";

  const { success, error: toastError } = useToast();

  const [role, setRole] = useState<"DONOR" | "PATIENT">(initialRole);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    city: "",
    address: "",
    organizationName: "",
    bloodGroup: "O_POS",
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "DONOR" || roleParam === "PATIENT") {
      setRole(roleParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const payload: any = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim(),
        role,
        city: formData.city.trim(),
        address: formData.address.trim() || undefined,
      };

      if (role === "DONOR") {
        payload.bloodGroup = formData.bloodGroup;
      } else {
        if (formData.organizationName.trim()) {
          payload.organizationName = formData.organizationName.trim();
        }
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to register account");
        toastError(data.error || "Failed to register account");
        setLoading(false);
        return;
      }

      success("Account registered successfully! Please sign in.");
      router.push("/login");
    } catch {
      setErrorMessage("An unexpected network error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto border border-teal-100 shadow-xs">
          <Droplet className="w-6 h-6 fill-teal-600" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Create Your Account
        </h1>
        <p className="text-xs text-slate-500">
          Join LifePulse as a certified donor or healthcare patient/facility.
        </p>
      </div>

      <Card>
        {/* Role Picker */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Select Account Role:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("DONOR")}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                role === "DONOR"
                  ? "border-rose-500 bg-rose-50/50 text-rose-900 shadow-xs ring-2 ring-rose-500/20 font-bold"
                  : "border-slate-200 hover:border-slate-300 text-slate-600"
              }`}
            >
              <Heart
                className={`w-6 h-6 ${role === "DONOR" ? "fill-rose-500 text-rose-500" : "text-slate-400"}`}
              />
              <span className="text-sm">Blood Donor</span>
              <span className="text-[10px] text-slate-400 font-normal">Report donations & availability</span>
            </button>

            <button
              type="button"
              onClick={() => setRole("PATIENT")}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                role === "PATIENT"
                  ? "border-teal-500 bg-teal-50/50 text-teal-900 shadow-xs ring-2 ring-teal-500/20 font-bold"
                  : "border-slate-200 hover:border-slate-300 text-slate-600"
              }`}
            >
              <Building2
                className={`w-6 h-6 ${role === "PATIENT" ? "text-teal-600" : "text-slate-400"}`}
              />
              <span className="text-sm">Patient / Hospital</span>
              <span className="text-[10px] text-slate-400 font-normal">Requisition & track blood supplies</span>
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 pl-9 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="e.g. john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 pl-9 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password (min 8 chars, 1 number)
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 pl-9 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="+1-555-0100"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 pl-9 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {role === "DONOR" ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Blood Group
                </label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                >
                  {ALL_BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {BLOOD_GROUP_DISPLAY[bg]}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hospital / Organization Name (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. St. Jude Hospital"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Address (Optional)
            </label>
            <input
              type="text"
              placeholder="Street address or ward details"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full mt-4" isLoading={loading}>
            Create {role === "DONOR" ? "Donor" : "Patient"} Account
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <a href="/login" className="text-teal-600 font-bold hover:underline">
            Sign in here
          </a>
        </div>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-sm text-slate-500">Loading registration...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
