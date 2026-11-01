"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner, ErrorState } from "@/components/ui/States";
import { StockBarChart, RequestStatusChart } from "@/components/admin/Charts";
import { BarChart3, Printer, RefreshCw, FileText, TrendingUp, CheckCircle2 } from "lucide-react";

export default function AdminReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to generate analytics report");
      const json = await res.json();
      setStats(json.data);
    } catch (err: any) {
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <LoadingSpinner text="Generating real-time analytics reports..." />;
  if (error) return <ErrorState message={error} onRetry={fetchReports} />;
  if (!stats) return null;

  return (
    <div className="space-y-8 print:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            System Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Auditable distribution metrics, inventory levels, and requisition velocity.
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={fetchReports} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <Button variant="secondary" size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="w-3.5 h-3.5" />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Summary Matrix Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Current Stock Reserve
          </span>
          <span className="text-3xl font-black text-teal-600 mt-1 block">{stats.totalUnits}</span>
          <span className="text-xs text-slate-500">Units available</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Donor Base
          </span>
          <span className="text-3xl font-black text-rose-600 mt-1 block">{stats.totalDonors}</span>
          <span className="text-xs text-slate-500">Registered donors</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Hospital Requisitions
          </span>
          <span className="text-3xl font-black text-slate-900 mt-1 block">
            {stats.requestsByStatus?.reduce((s: number, r: any) => s + r.count, 0) || 0}
          </span>
          <span className="text-xs text-slate-500">Total submitted</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Fulfillment Rate
          </span>
          <span className="text-3xl font-black text-emerald-600 mt-1 block">
            {stats.fulfilledThisMonth}
          </span>
          <span className="text-xs text-slate-500">Fulfilled this month</span>
        </Card>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <CardHeader
            title="Blood Reserves by Group"
            subtitle="Current live units across all 8 ABO/Rh blood groups"
          />
          <StockBarChart data={stats.stockDistribution || []} />
        </Card>

        <Card className="p-6">
          <CardHeader
            title="Requisition Status Breakdown"
            subtitle="Distribution of hospital orders across state machine lifecycles"
          />
          <RequestStatusChart data={stats.requestsByStatus || []} />
        </Card>
      </div>

      {/* Detailed Stock Table for Auditing */}
      <Card className="p-6 space-y-4">
        <CardHeader
          title="Stock Audit Log Table"
          subtitle="Inventory status breakdown verified directly against SQLite database records."
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Blood Group</th>
                <th className="py-3 px-4">Units Available</th>
                <th className="py-3 px-4">Inventory Status</th>
                <th className="py-3 px-4">Threshold Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.stockDistribution?.map((item: any) => (
                <tr key={item.group} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-900">{item.group}</td>
                  <td className="py-3 px-4 font-black text-slate-800">{item.units} units</td>
                  <td className="py-3 px-4 capitalize font-semibold text-slate-700">
                    {item.status.replace("_", " ")}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500">
                    {item.units === 0
                      ? "Zero reserves (Out of Stock)"
                      : item.units <= 5
                      ? "Critical low balance (Priority drive required)"
                      : item.units <= 15
                      ? "Moderate reserves"
                      : "Healthy reserves"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
