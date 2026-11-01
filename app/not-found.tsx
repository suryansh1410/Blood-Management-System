import React from "react";
import { FileQuestion, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto my-16 text-center space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto border border-slate-200">
        <FileQuestion className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">404 — Not Found</h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          The requested page or record could not be found. Please check the address or return to the
          homepage.
        </p>
      </div>
      <div className="pt-2">
        <a href="/">
          <Button variant="primary" size="sm" className="gap-2">
            <Home className="w-4 h-4" />
            Back to Homepage
          </Button>
        </a>
      </div>
    </div>
  );
}
