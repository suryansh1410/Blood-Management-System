"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
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
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { ALL_BLOOD_GROUPS, BLOOD_GROUP_DISPLAY } from "@/lib/constants";

export const dynamic = "force-dynamic";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "DONOR" ? "DONOR" : "PATIENT";

  const { success: toastSuccess, error: toastError } = useToast();

  const [role, setRole] = useState<"DONOR" | "PATIENT">(initialRole);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    city: "Gwalior",
    address: "",
    organizationName: "",
    bloodGroup: "O_POS",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "DONOR" || roleParam === "PATIENT") {
      setRole(roleParam);
    }
  }, [searchParams]);

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };
  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (formData.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

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

      toastSuccess("Account registered successfully! Please sign in.");
      router.push("/login");
    } catch {
      setErrorMessage("An unexpected network error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-8 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20 shadow-lg shadow-rose-950/40">
          <Droplet className="w-7 h-7 fill-rose-500" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
          Create Your LifePulse Account
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
          Join our verified network as an active blood donor or hospital/patient requester.
        </p>
      </div>

      <Card className="p-6 sm:p-8 space-y-6 bg-slate-900/95 border-slate-800 shadow-2xl">
        {/* Role Selection Cards */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Select Account Role:
          </label>
          <div className="grid grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => setRole("DONOR")}
              className={`p-4 rounded-2xl border flex flex-col items-center gap-2.5 transition-all text-center cursor-pointer ${
                role === "DONOR"
                  ? "border-rose-500/80 bg-rose-500/10 text-rose-200 ring-2 ring-rose-500/20 shadow-lg shadow-rose-950/40"
                  : "border-slate-800 bg-slate-950/40 hover:border-slate-700 text-slate-400"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                role === "DONOR" ? "bg-rose-500/20 text-rose-400" : "bg-slate-800 text-slate-400"
              }`}>
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <div>
                <span className="text-sm font-bold block text-slate-100">Voluntary Donor</span>
                <span className="text-[11px] text-slate-400 mt-0.5 block leading-tight">
                  Book appointments & receive priority alerts
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole("PATIENT")}
              className={`p-4 rounded-2xl border flex flex-col items-center gap-2.5 transition-all text-center cursor-pointer ${
                role === "PATIENT"
                  ? "border-teal-500/80 bg-teal-500/10 text-teal-200 ring-2 ring-teal-500/20 shadow-lg shadow-teal-950/40"
                  : "border-slate-800 bg-slate-950/40 hover:border-slate-700 text-slate-400"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                role === "PATIENT" ? "bg-teal-500/20 text-teal-400" : "bg-slate-800 text-slate-400"
              }`}>
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold block text-slate-100">Patient / Hospital</span>
                <span className="text-[11px] text-slate-400 mt-0.5 block leading-tight">
                  Submit emergency requests & track supply
                </span>
              </div>
            </button>
          </div>
        </div>

        {errorMessage && (
          <Alert variant="danger" title="Registration Error">
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Legal Name"
              required
              placeholder="e.g. Ramesh Verma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              leftIcon={<User className="w-4 h-4" />}
            />

            <Input
              label="Email Address"
              type="email"
              required
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              leftIcon={<Mail className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Password <span className="text-rose-400 font-bold">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Min 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl py-2.5 px-3.5 pl-10 pr-10 text-sm text-slate-100 placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength meter */}
              {formData.password && (
                <div className="flex items-center gap-1.5 pt-1">
                  <div className={`h-1 flex-1 rounded-full ${passwordStrength >= 1 ? "bg-rose-500" : "bg-slate-800"}`} />
                  <div className={`h-1 flex-1 rounded-full ${passwordStrength >= 2 ? "bg-amber-500" : "bg-slate-800"}`} />
                  <div className={`h-1 flex-1 rounded-full ${passwordStrength >= 3 ? "bg-teal-500" : "bg-slate-800"}`} />
                  <div className={`h-1 flex-1 rounded-full ${passwordStrength >= 4 ? "bg-emerald-500" : "bg-slate-800"}`} />
                  <span className="text-[10px] text-slate-400 ml-1">
                    {passwordStrength <= 1 ? "Weak" : passwordStrength <= 2 ? "Fair" : passwordStrength <= 3 ? "Good" : "Strong"}
                  </span>
                </div>
              )}
            </div>

            <Input
              label="Phone Number"
              type="tel"
              required
              placeholder="+91-98260-XXXXX"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              leftIcon={<Phone className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="City / District"
              required
              placeholder="e.g. Gwalior"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              leftIcon={<MapPin className="w-4 h-4" />}
            />

            {role === "DONOR" ? (
              <Select
                label="Blood Group"
                required
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
              >
                {ALL_BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {BLOOD_GROUP_DISPLAY[bg]}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                label="Hospital / Organization (Optional)"
                placeholder="e.g. J.A. Hospital"
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                leftIcon={<Building2 className="w-4 h-4" />}
              />
            )}
          </div>

          <Input
            label="Residential / Facility Address"
            placeholder="Ward / Street Details"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            disabled={loading}
            className="w-full font-bold shadow-lg shadow-teal-950/60 mt-3 gap-2"
          >
            <span>Create Verified Account</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-400">
          Already registered on LifePulse?{" "}
          <Link href="/login" className="font-bold text-teal-400 hover:text-teal-300 hover:underline">
            Sign In Here
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="text-slate-400 animate-pulse text-sm">Loading registration...</div>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
