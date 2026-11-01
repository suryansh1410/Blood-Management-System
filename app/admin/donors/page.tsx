"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingSpinner, EmptyState, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import {
  Users,
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
} from "lucide-react";
import { ALL_BLOOD_GROUPS, BLOOD_GROUP_DISPLAY } from "@/lib/constants";

export default function AdminDonorsPage() {
  const { success, error: toastError } = useToast();
  const [donors, setDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [availability, setAvailability] = useState("");

  // Toggle status modal
  const [selectedDonor, setSelectedDonor] = useState<any>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  const fetchDonors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (bloodGroup) params.set("bloodGroup", bloodGroup);
      if (availability) params.set("availability", availability);

      const res = await fetch(`/api/admin/donors?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load donors list");
      const json = await res.json();
      setDonors(json.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load donors");
    } finally {
      setLoading(false);
    }
  }, [search, bloodGroup, availability]);

  useEffect(() => {
    fetchDonors();
  }, [fetchDonors]);

  const handleToggleActive = async () => {
    if (!selectedDonor) return;
    setToggleLoading(true);

    try {
      const res = await fetch(`/api/admin/donors/${selectedDonor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !selectedDonor.isActive }),
      });

      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || "Failed to update donor status");
      } else {
        success(data.message || "Donor account status updated");
        setSelectedDonor(null);
        fetchDonors();
      }
    } catch {
      toastError("Network error while updating donor status");
    } finally {
      setToggleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Donor Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse registered donors, evaluate contribution records, and manage account statuses.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDonors} className="gap-1.5 self-start">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Donors
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Name, email, phone, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pl-8 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Blood Group</label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Blood Groups</option>
              {ALL_BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {BLOOD_GROUP_DISPLAY[bg]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Availability</label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="UNAVAILABLE">Unavailable</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Donors Table */}
      {loading ? (
        <LoadingSpinner text="Loading donors directory..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchDonors} />
      ) : donors.length === 0 ? (
        <EmptyState
          title="No donors found"
          description="Try broadening your search or clear your filter criteria."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Donor</th>
                  <th className="py-3.5 px-6">Blood Group</th>
                  <th className="py-3.5 px-6">City & Phone</th>
                  <th className="py-3.5 px-6">Availability</th>
                  <th className="py-3.5 px-6">Total Verified</th>
                  <th className="py-3.5 px-6">Account</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donors.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="font-bold text-slate-900">{d.name}</div>
                      <div className="text-xs text-slate-400">{d.email}</div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-black text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg text-xs">
                        {d.bloodGroupDisplay}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="font-semibold text-slate-800">{d.city}</div>
                      <div className="text-xs text-slate-400">{d.phone}</div>
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={d.availabilityStatus} />
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-black text-slate-900">{d.totalDonations}</span>
                      <span className="text-xs text-slate-400 ml-1">unit(s)</span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          d.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {d.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <a href={`/admin/donors/${d.id}`}>
                          <Button variant="outline" size="sm" className="text-xs gap-1">
                            <Eye className="w-3 h-3" />
                            History
                          </Button>
                        </a>
                        <Button
                          variant={d.isActive ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => setSelectedDonor(d)}
                          className="text-xs"
                          title={d.isActive ? "Deactivate Account" : "Reactivate Account"}
                        >
                          {d.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deactivating/Reactivating Donor */}
      {selectedDonor && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedDonor(null)}
          onConfirm={handleToggleActive}
          title={selectedDonor.isActive ? "Deactivate Donor Account" : "Activate Donor Account"}
          description={
            selectedDonor.isActive
              ? `Are you sure you want to deactivate ${selectedDonor.name}'s account? The donor will not be able to sign in, but historical donation records are safely preserved.`
              : `Reactivate ${selectedDonor.name}'s account? The donor will regain access to submit donation records.`
          }
          confirmText={selectedDonor.isActive ? "Deactivate Account" : "Activate Account"}
          variant={selectedDonor.isActive ? "danger" : "primary"}
          isLoading={toggleLoading}
        />
      )}
    </div>
  );
}
