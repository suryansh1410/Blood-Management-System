"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { LoadingSpinner, EmptyState, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { Building2, Search, RefreshCw, UserCheck, UserX, FileText } from "lucide-react";

export default function AdminPatientsPage() {
  const { success, error: toastError } = useToast();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");

  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (city.trim()) params.set("city", city.trim());

      const res = await fetch(`/api/admin/patients?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load patient accounts");
      const json = await res.json();
      setPatients(json.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, [search, city]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleToggleActive = async () => {
    if (!selectedPatient) return;
    setToggleLoading(true);

    try {
      const res = await fetch(`/api/admin/patients/${selectedPatient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !selectedPatient.isActive }),
      });

      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || "Failed to update account status");
      } else {
        success(data.message || "Account status updated");
        setSelectedPatient(null);
        fetchPatients();
      }
    } catch {
      toastError("Network error while updating account status");
    } finally {
      setToggleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Patient & Hospital Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review registered hospitals, clinical coordinators, and patient requisition volume.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPatients} className="gap-1.5 self-start">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Accounts
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Name, hospital name, email, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pl-8 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-end">
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setSearch("");
                setCity("");
              }}
              className="w-full text-xs"
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Patients Table */}
      {loading ? (
        <LoadingSpinner text="Loading accounts directory..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchPatients} />
      ) : patients.length === 0 ? (
        <EmptyState
          title="No patient/hospital accounts found"
          description="Try broadening your search query."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Requester</th>
                  <th className="py-3.5 px-6">Hospital / Organization</th>
                  <th className="py-3.5 px-6">City & Phone</th>
                  <th className="py-3.5 px-6">Total Requests</th>
                  <th className="py-3.5 px-6">Fulfilled</th>
                  <th className="py-3.5 px-6">Account Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-xs text-slate-400">{p.email}</div>
                    </td>
                    <td className="py-3.5 px-6">
                      {p.organizationName ? (
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>{p.organizationName}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Individual Requester</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="font-semibold text-slate-800">{p.city}</div>
                      <div className="text-xs text-slate-400">{p.phone}</div>
                    </td>
                    <td className="py-3.5 px-6 font-bold text-slate-900">
                      {p.totalRequests} <span className="text-xs font-normal text-slate-400">total</span>
                    </td>
                    <td className="py-3.5 px-6 font-bold text-emerald-600">
                      {p.fulfilledRequests} <span className="text-xs font-normal text-slate-400">received</span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          p.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {p.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Button
                        variant={p.isActive ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setSelectedPatient(p)}
                        className="text-xs"
                      >
                        {p.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {selectedPatient && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPatient(null)}
          onConfirm={handleToggleActive}
          title={selectedPatient.isActive ? "Deactivate Account" : "Activate Account"}
          description={
            selectedPatient.isActive
              ? `Deactivate ${selectedPatient.name}'s account? The user will be unable to log in or create new blood requests. Existing requisition history will remain intact.`
              : `Reactivate ${selectedPatient.name}'s account?`
          }
          confirmText={selectedPatient.isActive ? "Deactivate" : "Activate"}
          variant={selectedPatient.isActive ? "danger" : "primary"}
          isLoading={toggleLoading}
        />
      )}
    </div>
  );
}
