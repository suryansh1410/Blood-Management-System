"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge, UrgencyBadge } from "@/components/ui/Badge";
import { LoadingSpinner, ErrorState } from "@/components/ui/States";
import {
  Activity,
  PlusCircle,
  Search,
  FileText,
  CheckCircle2,
  Clock,
  Building2,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";

export default function PatientDashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, requestsRes] = await Promise.all([
        fetch("/api/patient/profile"),
        fetch("/api/patient/requests"),
      ]);

      if (!profileRes.ok || !requestsRes.ok) {
        throw new Error("Failed to load patient records");
      }

      const profileData = await profileRes.json();
      const requestsData = await requestsRes.json();

      setProfile(profileData.data);
      setRequests(requestsData.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <LoadingSpinner text="Loading patient dashboard records..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const fulfilledCount = requests.filter((r) => r.status === "FULFILLED").length;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-xs">
            <Building2 className="w-3.5 h-3.5" />
            Hospital & Patient Requisition Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome, {profile?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 max-w-xl">
            {profile?.organizationName
              ? `Representing ${profile.organizationName}. Track live requisitions and order emergency blood supplies.`
              : "Track your blood supply requisitions and submit emergency requests."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a href="/patient/requests/new">
            <Button variant="danger" size="md" className="gap-2 shadow-md shadow-rose-950/30">
              <PlusCircle className="w-4 h-4" />
              New Blood Request
            </Button>
          </a>
          <a href="/patient/search">
            <Button
              variant="outline"
              size="md"
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 gap-2"
            >
              <Search className="w-4 h-4" />
              Search Stock
            </Button>
          </a>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Requests</p>
            <p className="text-2xl font-black text-slate-900">{requests.length}</p>
            <p className="text-[11px] text-slate-500">Historical records</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Review</p>
            <p className="text-2xl font-black text-amber-600">{pendingCount}</p>
            <p className="text-[11px] text-slate-500">Awaiting admin review</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Approved</p>
            <p className="text-2xl font-black text-sky-600">{approvedCount}</p>
            <p className="text-[11px] text-slate-500">Ready for pickup/handover</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Fulfilled</p>
            <p className="text-2xl font-black text-emerald-600">{fulfilledCount}</p>
            <p className="text-[11px] text-slate-500">Stock physically received</p>
          </div>
        </Card>
      </div>

      {/* Recent Requests */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent Requisitions</h2>
          <a
            href="/patient/requests"
            className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1"
          >
            View All ({requests.length})
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {requests.length === 0 ? (
          <Card className="text-center py-8 text-slate-500 text-sm">
            <p>You have not submitted any blood requests yet.</p>
            <a href="/patient/requests/new" className="inline-block mt-3">
              <Button variant="primary" size="sm">
                Submit First Request
              </Button>
            </a>
          </Card>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-6">Patient & Hospital</th>
                    <th className="py-3 px-6">Blood Group</th>
                    <th className="py-3 px-6">Units</th>
                    <th className="py-3 px-6">Urgency</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Required Date</th>
                    <th className="py-3 px-6 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.slice(0, 5).map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-slate-900">{r.patientName}</div>
                        <div className="text-xs text-slate-500">{r.hospitalName}</div>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="inline-flex items-center justify-center font-black text-rose-600 bg-rose-50 border border-rose-200 w-8 h-8 rounded-lg">
                          {r.bloodGroupDisplay}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-semibold">{r.unitsRequired} unit(s)</td>
                      <td className="py-3.5 px-6">
                        <UrgencyBadge urgency={r.urgency} />
                      </td>
                      <td className="py-3.5 px-6">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-3.5 px-6 text-xs text-slate-500">
                        {new Date(r.requiredDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <a href={`/patient/requests/${r.id}`}>
                          <Button variant="outline" size="sm">
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
    </div>
  );
}
