"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingSpinner, ErrorState } from "@/components/ui/States";
import {
  Heart,
  Calendar,
  CheckCircle2,
  Clock,
  PlusCircle,
  Activity,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function DonorDashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, donationsRes] = await Promise.all([
        fetch("/api/donor/profile"),
        fetch("/api/donor/donations"),
      ]);

      if (!profileRes.ok || !donationsRes.ok) {
        throw new Error("Failed to load donor dashboard records");
      }

      const profileData = await profileRes.json();
      const donationsData = await donationsRes.json();

      setProfile(profileData.data);
      setDonations(donationsData.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <LoadingSpinner text="Loading donor profile and stats..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  const isAvailable = profile?.availabilityStatus === "AVAILABLE";

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-xs">
            <Heart className="w-3.5 h-3.5 fill-white" />
            Verified Donor Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {profile?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 max-w-xl">
            Thank you for being part of the life-saving blood supply network. Every unit of your blood
            helps save up to three patients in critical need.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a href="/donor/donations/new">
            <Button variant="outline" size="md" className="bg-white text-slate-900 border-white hover:bg-slate-100 gap-2">
              <PlusCircle className="w-4 h-4 text-rose-600" />
              Record Donation
            </Button>
          </a>
          <a href="/donor/availability">
            <Button
              variant="outline"
              size="md"
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 gap-2"
            >
              Toggle Availability
            </Button>
          </a>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 font-black text-xl shrink-0">
            {profile?.bloodGroupDisplay}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Blood Group</p>
            <p className="text-xl font-black text-slate-900">{profile?.bloodGroupDisplay}</p>
            <p className="text-[11px] text-slate-500 font-mono">{profile?.bloodGroup}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Verified Donations
            </p>
            <p className="text-xl font-black text-slate-900">
              {profile?.totalDonations || 0}{" "}
              <span className="text-xs font-normal text-slate-500">unit(s)</span>
            </p>
            <p className="text-[11px] text-slate-500">Audited by blood bank</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Last Donation</p>
            <p className="text-sm font-black text-slate-900 truncate">
              {profile?.lastDonationDate
                ? new Date(profile.lastDonationDate).toLocaleDateString()
                : "No verified record yet"}
            </p>
            <p className="text-[11px] text-slate-500">Computed live</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isAvailable
                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                : "bg-slate-100 text-slate-500 border border-slate-200"
            }`}
          >
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Availability</p>
            <div className="mt-0.5">
              <StatusBadge status={profile?.availabilityStatus} />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{profile?.city}</p>
          </div>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent Donation Records</h2>
          <a href="/donor/donations" className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1">
            View All ({donations.length})
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {donations.length === 0 ? (
          <Card className="text-center py-8 text-slate-500 text-sm">
            <p>You haven&apos;t recorded any blood donations yet.</p>
            <a href="/donor/donations/new" className="inline-block mt-3">
              <Button variant="primary" size="sm">
                Record First Donation
              </Button>
            </a>
          </Card>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Donation Date</th>
                  <th className="py-3 px-6">Blood Group</th>
                  <th className="py-3 px-6">Units</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Verification Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donations.slice(0, 5).map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-6 font-medium text-slate-900">
                      {new Date(d.donationDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-rose-600">{d.bloodGroupDisplay}</td>
                    <td className="py-3.5 px-6 font-semibold">{d.units} unit(s)</td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="py-3.5 px-6 text-xs text-slate-500">
                      {d.status === "VERIFIED"
                        ? `Verified on ${d.verifiedAt ? new Date(d.verifiedAt).toLocaleDateString() : "file"}`
                        : d.status === "PENDING"
                        ? "Pending blood bank staff review"
                        : "Rejected by staff"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
