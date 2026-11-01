import React from "react";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ForbiddenPage() {
  return (
    <div className="max-w-md mx-auto my-16 text-center space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">403 — Forbidden</h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          You are authenticated, but your account does not have permission to view this specific
          role dashboard or resource.
        </p>
      </div>
      <div className="flex items-center justify-center gap-3 pt-2">
        <a href="/">
          <Button variant="outline" size="sm" className="gap-2">
            <Home className="w-4 h-4" />
            Home
          </Button>
        </a>
        <a href="/login">
          <Button variant="primary" size="sm" className="gap-2">
            Sign In with Different Account
          </Button>
        </a>
      </div>
    </div>
  );
}
