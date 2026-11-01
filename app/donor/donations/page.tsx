"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingSpinner, EmptyState, ErrorState } from "@/components/ui/States";
import { PlusCircle, Calendar, RefreshCw, Filter, CheckCircle2, Clock, XCircle } from "lucide-react";

export default function DonorDonationsPage() {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const fetchDonations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/donor/donations");
      if (!res.ok) throw new Error("Failed to load donation history");
      const json = await res.json();
      setDonations(json.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load donation records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const filtered = donations.filter((d) => {
    if (!statusFilter) return true;
    return d.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            My Donation History
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track all submitted blood donations and administrative verification statuses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchDonations} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <a href="/donor/donations/new">
            <Button variant="primary" size="sm" className="gap-1.5">
              <PlusCircle className="w-4 h-4" />
              Record New Donation
            </Button>
          </a>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setStatusFilter("")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            statusFilter === ""
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          All ({donations.length})
        </button>
        <button
          onClick={() => setStatusFilter("VERIFIED")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            statusFilter === "VERIFIED"
              ? "bg-emerald-600 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Verified ({donations.filter((d) => d.status === "VERIFIED").length})
        </button>
        <button
          onClick={() => setStatusFilter("PENDING")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            statusFilter === "PENDING"
              ? "bg-amber-600 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Pending Review ({donations.filter((d) => d.status === "PENDING").length})
        </button>
        <button
          onClick={() => setStatusFilter("REJECTED")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            statusFilter === "REJECTED"
              ? "bg-rose-600 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Rejected ({donations.filter((d) => d.status === "REJECTED").length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner text="Loading donation history..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchDonations} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No donation records found"
          description="Have you recently donated? Submit your donation record for staff authentication."
          action={{
            label: "Record Donation Now",
            onClick: () => (window.location.href = "/donor/donations/new"),
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Donation Date</th>
                  <th className="py-3.5 px-6">Blood Group</th>
                  <th className="py-3.5 px-6">Units</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Verified At</th>
                  <th className="py-3.5 px-6">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      {new Date(item.donationDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center justify-center font-black text-rose-600 bg-rose-50 border border-rose-200 w-8 h-8 rounded-lg">
                        {item.bloodGroupDisplay}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-800">{item.units} unit(s)</td>
                    <td className="py-4 px-6">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {item.verifiedAt ? new Date(item.verifiedAt).toLocaleString() : "—"}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
