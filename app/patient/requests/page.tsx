"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge, UrgencyBadge } from "@/components/ui/Badge";
import { LoadingSpinner, EmptyState, ErrorState } from "@/components/ui/States";
import { PlusCircle, RefreshCw, Eye, Calendar, Building2 } from "lucide-react";

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/patient/requests");
      if (!res.ok) throw new Error("Failed to load requests");
      const json = await res.json();
      setRequests(json.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load blood requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filtered = requests.filter((r) => {
    if (!statusFilter) return true;
    return r.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            My Blood Requests
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track requisition reviews, authorizations, and fulfillment statuses in real-time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchRequests} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <a href="/patient/requests/new">
            <Button variant="danger" size="sm" className="gap-1.5">
              <PlusCircle className="w-4 h-4" />
              New Blood Request
            </Button>
          </a>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setStatusFilter("")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            statusFilter === ""
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          All ({requests.length})
        </button>
        <button
          onClick={() => setStatusFilter("PENDING")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            statusFilter === "PENDING"
              ? "bg-amber-600 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Pending ({requests.filter((r) => r.status === "PENDING").length})
        </button>
        <button
          onClick={() => setStatusFilter("APPROVED")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            statusFilter === "APPROVED"
              ? "bg-sky-600 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Approved ({requests.filter((r) => r.status === "APPROVED").length})
        </button>
        <button
          onClick={() => setStatusFilter("FULFILLED")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            statusFilter === "FULFILLED"
              ? "bg-emerald-600 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Fulfilled ({requests.filter((r) => r.status === "FULFILLED").length})
        </button>
        <button
          onClick={() => setStatusFilter("REJECTED")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            statusFilter === "REJECTED"
              ? "bg-rose-600 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Rejected ({requests.filter((r) => r.status === "REJECTED").length})
        </button>
        <button
          onClick={() => setStatusFilter("CANCELLED")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            statusFilter === "CANCELLED"
              ? "bg-slate-600 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Cancelled ({requests.filter((r) => r.status === "CANCELLED").length})
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading your blood requests..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchRequests} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No blood requests found"
          description="Do you need blood units for a patient or surgical procedure?"
          action={{
            label: "Create Blood Request",
            onClick: () => (window.location.href = "/patient/requests/new"),
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Patient & Hospital</th>
                  <th className="py-3.5 px-6">Blood Group</th>
                  <th className="py-3.5 px-6">Units</th>
                  <th className="py-3.5 px-6">Urgency</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Required By</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{item.patientName}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{item.hospitalName} ({item.city})</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center justify-center font-black text-rose-600 bg-rose-50 border border-rose-200 w-8 h-8 rounded-lg">
                        {item.bloodGroupDisplay}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-800">
                      {item.unitsRequired} unit(s)
                    </td>
                    <td className="py-4 px-6">
                      <UrgencyBadge urgency={item.urgency} />
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {new Date(item.requiredDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <a href={`/patient/requests/${item.id}`}>
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </Button>
                      </a>
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
