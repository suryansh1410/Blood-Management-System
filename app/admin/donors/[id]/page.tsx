"use client";

import React, { useState, useEffect, use } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingSpinner, ErrorState } from "@/components/ui/States";
import { ArrowLeft, User, Phone, MapPin, Mail, Calendar, Droplet, Heart } from "lucide-react";

export default function AdminDonorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [donor, setDonor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDonor = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/donors/${id}`);
        if (!res.ok) throw new Error("Failed to load donor details");
        const json = await res.json();
        setDonor(json.data);
      } catch (err: any) {
        setError(err.message || "Failed to load donor");
      } finally {
        setLoading(false);
      }
    };
    fetchDonor();
  }, [id]);

  if (loading) return <LoadingSpinner text="Loading donor records..." />;
  if (error) return <ErrorState message={error} />;
  if (!donor) return <ErrorState message="Donor not found" />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <a href="/admin/donors">
          <Button variant="outline" size="sm" className="p-2" aria-label="Back to donors">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </a>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {donor.name}
          </h1>
          <p className="text-xs text-slate-500">
            Registered: {new Date(donor.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 font-black text-xl shrink-0">
            {donor.bloodGroupDisplay}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Blood Group</p>
            <p className="text-xl font-black text-slate-900">{donor.bloodGroupDisplay}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Verified</p>
            <p className="text-xl font-black text-slate-900">
              {donor.totalDonations} <span className="text-xs font-normal text-slate-500">units</span>
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Availability</p>
            <div className="mt-0.5">
              <StatusBadge status={donor.availabilityStatus} />
            </div>
          </div>
        </Card>
      </div>

      {/* Details & Donation History */}
      <div className="space-y-6">
        <Card className="space-y-3">
          <CardHeader title="Contact Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-slate-400 block">Email Address:</span>
              <span className="font-semibold text-slate-800">{donor.email}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Phone:</span>
              <span className="font-semibold text-slate-800">{donor.phone}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">City:</span>
              <span className="font-semibold text-slate-800">{donor.city}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Address:</span>
              <span className="font-semibold text-slate-800">{donor.address || "Not provided"}</span>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <CardHeader
            title="Complete Donation Timeline"
            subtitle={`${donor.donations?.length || 0} recorded submissions`}
          />
          {donor.donations?.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No donations recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Blood Group</th>
                    <th className="py-2.5 px-4">Units</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Verified At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {donor.donations.map((d: any) => (
                    <tr key={d.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {new Date(d.donationDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-black text-rose-600">{d.bloodGroupDisplay}</td>
                      <td className="py-3 px-4 font-bold">{d.units} unit(s)</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {d.verifiedAt ? new Date(d.verifiedAt).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
