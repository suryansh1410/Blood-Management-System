"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Clock, ShieldCheck, ArrowRight, Activity, HelpCircle } from "lucide-react";

export default function TrackSearchPage() {
  const router = useRouter();
  const [requestCode, setRequestCode] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = requestCode.trim();
    if (clean) {
      router.push(`/track/${encodeURIComponent(clean)}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Feature 5 &bull; Real-time Blood Request Tracker</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight">
          Track Your Blood Request
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Monitor your request across all 11 stages of clinical verification, hospital inventory
          allocation, and cold-chain reservation hold.
        </p>
      </div>

      {/* Tracking Input Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md max-w-2xl mx-auto">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Enter Request Tracking ID
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                required
                value={requestCode}
                onChange={(e) => setRequestCode(e.target.value)}
                placeholder="e.g. REQ-GWL-2026-9041 or request ID"
                className="w-full bg-slate-800/90 border border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-slate-100 text-base font-mono placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all shadow-inner"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-sm shadow-xl shadow-rose-600/30 transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
          >
            <span>Inspect Live Status & Timeline</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast-Track Suggestion */}
        <div className="mt-6 pt-6 border-t border-slate-800 text-xs text-slate-400 space-y-2">
          <span className="font-semibold text-slate-300">Quick Test Demo Request:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push("/track/REQ-GWL-2026-9041")}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" /> REQ-GWL-2026-9041 (Gwalior B+ Emergency)
            </button>
          </div>
        </div>
      </div>

      {/* 11 Status Lifecycle Overview */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 max-w-2xl mx-auto space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-cyan-400" /> Complete 11-Stage Status Lifecycle
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Submitted &rarr; Verification Pending &rarr; Verified &rarr; Searching &rarr; Hospital Responded
          &rarr; Availability Confirmed &rarr; Reserved &rarr; Fulfilled (or Rejected / Cancelled / Expired).
          Only authorized hospital staff and clinical administrators can confirm cold-chain reservations.
        </p>
      </div>
    </div>
  );
}
