"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error boundary triggered:", error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto my-16 text-center space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">An Error Occurred</h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
      </div>
      <div className="flex items-center justify-center gap-3 pt-2">
        <Button variant="primary" size="sm" onClick={() => reset()} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
        <a href="/">
          <Button variant="outline" size="sm" className="gap-2">
            <Home className="w-4 h-4" />
            Home
          </Button>
        </a>
      </div>
    </div>
  );
}
