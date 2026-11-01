"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingSpinner, ErrorState } from "@/components/ui/States";
import { StockBarChart, RequestStatusChart } from "@/components/admin/Charts";
import {
  Users,
  Building2,
  Droplet,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Heart,
  FileText,
  Layers,
  ArrowRight,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to load admin stats");
      const json = await res.json();
      setStats(json.data);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner text="Querying database statistics..." />;
  if (error) return <ErrorState message={error} onRetry={fetchStats} />;
  if (!stats) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 mb-1">
            System Administration
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Blood Bank Overview
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Live database counts, inventory distribution, and active medical requisitions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchStats} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Metrics
          </Button>
          <a href="/admin/inventory">
            <Button variant="primary" size="sm" className="gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Manage Inventory
            </Button>
          </a>
        </div>
      </div>

      {/* Critical Stock Alert Banner if any groups are low/critical/out-of-stock */}
      {stats.attentionGroups && stats.attentionGroups.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Attention: Blood Groups Below Available Threshold ({stats.attentionGroups.length})</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {stats.attentionGroups.map((g: any) => (
              <span
                key={g.bloodGroup}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-xs font-semibold shadow-2xs"
              >
                <span className="font-black text-rose-600">{g.display}:</span>
                <span>{g.units} units</span>
                <StatusBadge status={g.status} />
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Units</p>
          <p className="text-2xl font-black text-teal-600 mt-1">{stats.totalUnits}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">8 Blood Groups</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Requests</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{stats.pendingRequests}</p>
          <a href="/admin/requests?status=PENDING" className="text-[11px] text-teal-600 font-semibold hover:underline mt-0.5 block">
            Review Queue &rarr;
          </a>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Donations</p>
          <p className="text-2xl font-black text-rose-600 mt-1">{stats.pendingDonations}</p>
          <a href="/admin/donations?status=PENDING" className="text-[11px] text-teal-600 font-semibold hover:underline mt-0.5 block">
            Verify Now &rarr;
          </a>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Approved Requisitions</p>
          <p className="text-2xl font-black text-sky-600 mt-1">{stats.approvedRequests}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Awaiting handover</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Fulfilled (Month)</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.fulfilledThisMonth}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Physical transfers</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Donors</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalDonors}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{stats.totalPatients} hospitals/patients</p>
        </Card>
      </div>

      {/* 2 Live Visual Charts (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <CardHeader
            title="Blood Stock Distribution (Units)"
            subtitle="Bar colors indicate status: Green=Available, Amber=Low, Rose=Critical/Out"
          />
          <StockBarChart data={stats.stockDistribution || []} />
        </Card>

        <Card className="p-6">
          <CardHeader
            title="Requisitions by Status"
            subtitle="Distribution of hospital blood requests across current lifecycles"
          />
          <RequestStatusChart data={stats.requestsByStatus || []} />
        </Card>
      </div>

      {/* Quick Action Navigation Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <a href="/admin/inventory" className="block">
          <Card className="p-4 hover:border-teal-400 transition-colors flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900">Manage Inventory</p>
              <p className="text-xs text-slate-500">Add, remove or set stock</p>
            </div>
          </Card>
        </a>

        <a href="/admin/requests" className="block">
          <Card className="p-4 hover:border-teal-400 transition-colors flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900">Blood Requests</p>
              <p className="text-xs text-slate-500">Approve, reject, fulfill</p>
            </div>
          </Card>
        </a>

        <a href="/admin/donations" className="block">
          <Card className="p-4 hover:border-teal-400 transition-colors flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900">Verify Donations</p>
              <p className="text-xs text-slate-500">Audit donor submissions</p>
            </div>
          </Card>
        </a>

        <a href="/admin/donors" className="block">
          <Card className="p-4 hover:border-teal-400 transition-colors flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900">Donor Directory</p>
              <p className="text-xs text-slate-500">Manage donor accounts</p>
            </div>
          </Card>
        </a>
      </div>
    </div>
  );
}
