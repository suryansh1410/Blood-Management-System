"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Activity, MapPin, ShieldAlert, Sparkles, Navigation } from "lucide-react";

// Dynamically import map component with SSR disabled for Leaflet compatibility
const BloodNetworkMap = dynamic(
  () => import("@/components/heatmap/BloodNetworkMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-medium">Initializing Real-time Blood Network Heatmap...</span>
      </div>
    ),
  }
);

export default function HeatmapPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold mb-3">
            <Activity className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>Feature 6: Geographic Coordination Heatmap</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">
            Blood Network Heatmap
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-1 max-w-2xl">
            Live geographic distribution of verified blood reserves. Centered on Gwalior and
            Madhya Pradesh with seamless India-wide expansion.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/emergency"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.02]"
          >
            <ShieldAlert className="w-4 h-4" /> Emergency Blood Request
          </a>
        </div>
      </div>

      {/* Main Map */}
      <BloodNetworkMap />

      {/* Regional Focus Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 font-bold text-slate-200 text-sm mb-1">
            <MapPin className="w-4 h-4 text-rose-500" />
            Gwalior Priority Hub
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Connected to J.A. Hospital, BIMR Hospitals, Cancer Hospital, Red Cross Society, and
            District Hospital Morar for rapid regional dispatch.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 font-bold text-slate-200 text-sm mb-1">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Live Verified Cold-Chain
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Color-coded indicators represent real hospital stock reports. Missing or delayed reports
            are accurately marked as Availability Not Updated.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 font-bold text-slate-200 text-sm mb-1">
            <Navigation className="w-4 h-4 text-cyan-400" />
            Proximity & Directions
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Click any pin to inspect specific blood group availability, active components, or
            launch instant turn-by-turn navigation via Google Maps.
          </p>
        </div>
      </div>
    </div>
  );
}
