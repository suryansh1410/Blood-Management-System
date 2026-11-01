"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Clock, ArrowRight, Activity, HelpCircle, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function TrackSearchPage() {
  const router = useRouter();
  const [requestCode, setRequestCode] = useState("");
  const [searching, setSearching] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = requestCode.trim();
    if (clean) {
      setSearching(true);
      router.push(`/track/${encodeURIComponent(clean)}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold">
          <Activity className="w-3.5 h-3.5 text-teal-400" />
          <span>Real-time Transfusion & Requisition Tracking</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-100 tracking-tight">
          Track Your Blood Request
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Monitor your requisition in real time across clinical triage, hospital stock quarantine, and final transfusion delivery.
        </p>
      </div>

      {/* Large Visible Search Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md max-w-2xl mx-auto space-y-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Enter Request Tracking Code or ID
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                required
                value={requestCode}
                onChange={(e) => setRequestCode(e.target.value)}
                placeholder="e.g. REQ-GWL-2026-9041 or LP-20261101-ABCD"
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl pl-12 pr-4 py-4 text-slate-100 text-base font-mono placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all shadow-inner"
              />
            </div>
            <p className="text-xs text-slate-400">
              Format: Unique alphanumeric code received after submitting emergency request.
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={searching}
            disabled={searching || !requestCode.trim()}
            className="w-full py-4 text-base font-bold shadow-xl shadow-teal-950/60 gap-2"
          >
            <span>Inspect Live Status & Timeline</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        {/* Quick Demo Search Chips */}
        <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-2.5">
          <span className="font-semibold text-slate-300 block">Sample Active Request Codes:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setRequestCode("REQ-GWL-2026-9041");
                router.push("/track/REQ-GWL-2026-9041");
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-mono text-xs border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-teal-400" /> REQ-GWL-2026-9041 (Gwalior B+ Emergency)
            </button>
          </div>
        </div>
      </div>

      {/* 5 High-Level Presentation Milestones */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl mx-auto space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-teal-400" /> Transfusion Coordination Milestones
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center">
          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold flex items-center justify-center mx-auto mb-1.5">1</div>
            <div className="text-xs font-bold text-slate-200">Request Submitted</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold flex items-center justify-center mx-auto mb-1.5">2</div>
            <div className="text-xs font-bold text-slate-200">Under Review</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center mx-auto mb-1.5">3</div>
            <div className="text-xs font-bold text-slate-200">Centre Responded</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold flex items-center justify-center mx-auto mb-1.5">4</div>
            <div className="text-xs font-bold text-slate-200">Fulfilment Hold</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center justify-center mx-auto mb-1.5">5</div>
            <div className="text-xs font-bold text-slate-200">Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
}
