"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Droplet, Lock, Mail, ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react";

export const dynamic = "force-dynamic";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        const role = session?.user?.role;

        if (role === "ADMIN") {
          router.push("/admin/dashboard");
        } else if (role === "DONOR") {
          router.push("/donor/dashboard");
        } else if (role === "PATIENT") {
          router.push("/patient/dashboard");
        } else {
          router.push(callbackUrl);
        }
        router.refresh();
      }
    } catch {
      setError("An unexpected authentication error occurred");
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto my-8 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20 shadow-lg shadow-rose-950/40">
          <Droplet className="w-7 h-7 fill-rose-500" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
          Sign In to LifePulse
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
          Access your verified healthcare dashboard, emergency alerts, or inventory records.
        </p>
      </div>

      <Card className="p-6 sm:p-8 space-y-5 bg-slate-900/95 border-slate-800 shadow-2xl">
        {error && (
          <Alert variant="danger" title="Authentication Failed">
            {error}
          </Alert>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. admin@lifepulse.org"
            leftIcon={<Mail className="w-4 h-4" />}
          />

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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            disabled={loading}
            className="w-full font-bold shadow-lg shadow-teal-950/60 mt-2 gap-2"
          >
            <span>Sign In to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        {/* Demo Credentials Section */}
        <div className="pt-4 border-t border-slate-800 space-y-2.5">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            Demo Sandbox Accounts:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillDemo("admin@lifepulse.org", "Admin@12345")}
              className="px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-rose-400">Admin Account</div>
              <div className="text-[10px] text-slate-400 truncate">admin@lifepulse.org</div>
            </button>
            <button
              type="button"
              onClick={() => fillDemo("hospital@ja.org", "Hospital@12345")}
              className="px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-teal-400">Hospital Staff</div>
              <div className="text-[10px] text-slate-400 truncate">hospital@ja.org</div>
            </button>
            <button
              type="button"
              onClick={() => fillDemo("donor.rajesh@gmail.com", "Donor@12345")}
              className="px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-cyan-400">Voluntary Donor</div>
              <div className="text-[10px] text-slate-400 truncate">donor.rajesh@gmail.com</div>
            </button>
            <button
              type="button"
              onClick={() => fillDemo("patient.anita@gmail.com", "Patient@12345")}
              className="px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-amber-400">Patient / Requester</div>
              <div className="text-[10px] text-slate-400 truncate">patient.anita@gmail.com</div>
            </button>
          </div>
        </div>

        <div className="pt-2 text-center text-xs text-slate-400">
          Don't have an account yet?{" "}
          <Link href="/register" className="font-bold text-teal-400 hover:text-teal-300 hover:underline">
            Register for LifePulse
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="text-slate-400 animate-pulse text-sm">Loading sign in...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
