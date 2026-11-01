"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Droplet, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        // Fetch session to determine role redirect
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
    <div className="max-w-md mx-auto my-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 shadow-xs">
          <Droplet className="w-6 h-6 fill-rose-600" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Sign In to LifePulse
        </h1>
        <p className="text-xs text-slate-500">
          Enter your registered email and password to access your role dashboard.
        </p>
      </div>

      <Card>
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 pl-9 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 pl-9 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full mt-2" isLoading={loading}>
            Sign In
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-teal-600 font-bold hover:underline">
            Register here
          </a>
        </div>
      </Card>

      {/* Demo Credentials Quick Fill Box (Crucial for Viva!) */}
      <div className="bg-slate-100/90 rounded-2xl p-4 border border-slate-200 text-xs space-y-3 shadow-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Quick Demo Auto-Fill (Click to test):</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => fillDemo("admin@bloodbank.org", "Admin@123")}
            className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-semibold text-left transition-colors"
          >
            <div className="text-[10px] uppercase font-bold text-purple-600">Admin</div>
            <div className="truncate text-xs">admin@bloodbank.org</div>
          </button>

          <button
            type="button"
            onClick={() => fillDemo("rahul.donor@example.com", "Donor@123")}
            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 font-semibold text-left transition-colors"
          >
            <div className="text-[10px] uppercase font-bold text-rose-600">Donor (O+)</div>
            <div className="truncate text-xs">rahul.donor@...</div>
          </button>

          <button
            type="button"
            onClick={() => fillDemo("sarah.patient@example.com", "Patient@123")}
            className="p-2 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 font-semibold text-left transition-colors"
          >
            <div className="text-[10px] uppercase font-bold text-teal-600">Patient/Hospital</div>
            <div className="truncate text-xs">sarah.patient@...</div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-sm text-slate-500">Loading sign in...</div>}>
      <LoginForm />
    </Suspense>
  );
}
