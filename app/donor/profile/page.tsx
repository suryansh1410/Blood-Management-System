"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { User, Phone, MapPin, Mail, Droplet, CheckCircle2 } from "lucide-react";

export default function DonorProfilePage() {
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    bloodGroupDisplay: "",
    availabilityStatus: "",
  });

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/donor/profile");
      if (!res.ok) throw new Error("Failed to load profile");
      const json = await res.json();
      setFormData({
        name: json.data.name || "",
        email: json.data.email || "",
        phone: json.data.phone || "",
        city: json.data.city || "",
        address: json.data.address || "",
        bloodGroupDisplay: json.data.bloodGroupDisplay || "",
        availabilityStatus: json.data.availabilityStatus || "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/donor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          city: formData.city.trim(),
          address: formData.address.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || "Failed to update profile");
      } else {
        success("Profile updated successfully!");
      }
    } catch {
      toastError("Network error while updating profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading donor profile..." />;
  if (error) return <ErrorState message={error} onRetry={fetchProfile} />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Donor Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Keep your contact information and city accurate so regional centers can reach you.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSave} className="space-y-4">
          <CardHeader
            title="Personal & Contact Details"
            subtitle="Updates are saved immediately to the system."
          />

          {/* Blood group notice */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-black">
                <Droplet className="w-4 h-4 fill-rose-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700">Registered Blood Group</p>
                <p className="text-[11px] text-slate-500">
                  Fixed clinical identifier established upon registration
                </p>
              </div>
            </div>
            <span className="text-lg font-black text-rose-600 bg-white px-3 py-1 rounded-lg border border-rose-200">
              {formData.bloodGroupDisplay}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Account)</label>
            <div className="relative">
              <input
                type="email"
                disabled
                value={formData.email}
                className="w-full text-sm rounded-xl border border-slate-200 bg-slate-100/80 px-3 py-2 pl-9 text-slate-500 cursor-not-allowed"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Email address cannot be modified</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 pl-9 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 pl-9 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 pl-9 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. 14 Elm Street, Apt 3B"
              className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" size="md" isLoading={saving}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
