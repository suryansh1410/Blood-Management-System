"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { LoadingSpinner } from "@/components/ui/States";
import { Droplet, Calendar, Heart, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { ALL_BLOOD_GROUPS, BLOOD_GROUP_DISPLAY } from "@/lib/constants";

export default function NewDonationPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bloodGroup, setBloodGroup] = useState<string>("O_POS");
  const [units, setUnits] = useState<number>(1);
  const [donationDate, setDonationDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/donor/profile");
        if (res.ok) {
          const json = await res.json();
          if (json.data?.bloodGroup) {
            setBloodGroup(json.data.bloodGroup);
          }
        }
      } catch {
        // Fallback to default
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/donor/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bloodGroup,
          units: Number(units),
          donationDate: new Date(donationDate).toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to submit donation record");
        toastError(data.error || "Failed to submit donation record");
        setSubmitting(false);
        return;
      }

      success("Donation record submitted! Awaiting blood bank staff verification.");
      router.push("/donor/donations");
    } catch {
      setErrorMessage("Network error while submitting donation record.");
      setSubmitting(false);
    }
  };

  if (loadingProfile) return <LoadingSpinner text="Loading donor profile details..." />;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Record a Blood Donation
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Submit details of blood you have given. Your record will be placed in the administrative
          queue for clinical verification.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-teal-900 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>How Stock is Incremented:</strong> Submitting this record notifies blood bank
          administrators. The system will atomically increase the blood inventory once an admin
          authenticates your physical donation receipt.
        </p>
      </div>

      <Card>
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <CardHeader
            title="Donation Information"
            subtitle="Please ensure the date and blood group correspond to your donation."
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Donated Blood Group
            </label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="w-full text-sm font-bold rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {ALL_BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {BLOOD_GROUP_DISPLAY[bg]} ({bg})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Units Donated (Standard: 1 unit)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                required
                value={units}
                onChange={(e) => setUnits(parseInt(e.target.value) || 1)}
                className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Donation
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={donationDate}
                  onChange={(e) => setDonationDate(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <a href="/donor/donations">
              <Button variant="outline" size="md" type="button">
                Cancel
              </Button>
            </a>
            <Button type="submit" variant="primary" size="md" isLoading={submitting} className="gap-2">
              <Heart className="w-4 h-4 fill-white" />
              Submit For Verification
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
