"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

export const dynamic = "force-dynamic";

import {
  Calendar,
  Clock,
  Building2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Heart,
  ChevronRight,
  ShieldCheck,
  User,
  Sparkles,
} from "lucide-react";
import { ALL_BLOOD_GROUPS, BLOOD_GROUP_DISPLAY, SUPPORTED_BLOOD_COMPONENTS } from "@/lib/constants";
import { useToast } from "@/components/ui/Toast";

interface SlotInfo {
  timeSlot: string;
  maxCapacity: number;
  booked: number;
  remaining: number;
  isAvailable: boolean;
}

function AppointmentBookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCenterId = searchParams.get("centerId");
  const preselectedGroup = searchParams.get("group") || "A_POS";

  const { data: session } = useSession();
  const { success: toastSuccess, error: toastError } = useToast();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split("T")[0];

  const [centers, setCenters] = useState<any[]>([]);
  const [selectedCenterId, setSelectedCenterId] = useState<number | null>(
    preselectedCenterId ? parseInt(preselectedCenterId, 10) : null
  );
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [bloodGroup, setBloodGroup] = useState(preselectedGroup);
  const [component, setComponent] = useState("Whole Blood");
  const [notes, setNotes] = useState("");

  const [loadingCenters, setLoadingCenters] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState<any>(null);

  // Fetch registered blood centers
  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const res = await fetch("/api/centers/search?limit=30");
        const json = await res.json();
        if (json.success && json.data) {
          setCenters(json.data);
          if (!selectedCenterId && json.data.length > 0) {
            setSelectedCenterId(json.data[0].id);
          }
        }
      } catch {
        toastError("Failed to fetch blood centres");
      } finally {
        setLoadingCenters(false);
      }
    };
    fetchCenters();
  }, []);

  // Fetch slots whenever center or date changes
  useEffect(() => {
    if (!selectedCenterId || !selectedDate) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const res = await fetch(
          `/api/appointments/slots?centerId=${selectedCenterId}&date=${selectedDate}`
        );
        const json = await res.json();
        if (json.success && json.data?.slots) {
          setSlots(json.data.slots);
          const firstAvail = json.data.slots.find((s: SlotInfo) => s.isAvailable);
          if (firstAvail) setSelectedSlot(firstAvail.timeSlot);
        }
      } catch {
        toastError("Failed to load available slots");
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedCenterId, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCenterId || !selectedSlot) {
      toastError("Please select a blood centre and time slot.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          centerId: selectedCenterId,
          appointmentDate: selectedDate,
          timeSlot: selectedSlot,
          bloodGroup,
          component,
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toastError(json.error || "Failed to schedule appointment");
      } else {
        toastSuccess(json.message || "Appointment scheduled successfully!");
        setBookedAppointment(json.data);
      }
    } catch {
      toastError("Network error while booking appointment");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCenter = centers.find((c) => c.id === selectedCenterId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider mb-3">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Feature 4 &bull; Voluntary Donation Coordination</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">
          Blood Donation Appointment Booking
        </h1>
        <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
          Schedule an in-person voluntary donation at registered blood centres in Gwalior and
          across Madhya Pradesh. Real-time slot capacity prevents overbooking.
        </p>
      </div>

      {bookedAppointment ? (
        /* Booking Confirmation Card */
        <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3 text-emerald-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <h2 className="text-2xl font-black text-slate-100">
                Donation Appointment Scheduled!
              </h2>
              <p className="text-xs text-slate-400">
                Appointment Reference ID: #{bookedAppointment.id}
              </p>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Blood Centre:</span>
              <span className="font-extrabold text-slate-100 text-sm block">
                {bookedAppointment.centerName}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Date & Time Slot:</span>
              <span className="font-extrabold text-cyan-300 text-sm block">
                {new Date(bookedAppointment.appointmentDate).toLocaleDateString("en-IN")} &bull;{" "}
                {bookedAppointment.timeSlot}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Blood Group:</span>
              <span className="font-extrabold text-rose-400 text-sm block">
                {bookedAppointment.bloodGroupDisplay}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Status:</span>
              <span className="font-extrabold text-emerald-400 text-sm block">
                {bookedAppointment.status} (Reserved Slot)
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl text-xs text-slate-400 space-y-1">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Clinical Screening Notice:
            </div>
            <p>
              Please carry a valid government photo ID (Aadhaar / Voter ID). Inventory is credited
              only after authorized medical screening and processing at the centre.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setBookedAppointment(null)}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              Book Another Appointment
            </button>
            <a
              href="/donor/dashboard"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
            >
              View in Donor Dashboard &rarr;
            </a>
          </div>
        </div>
      ) : (
        /* Booking Form */
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-md">
            {/* Step 1: Centre Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-rose-500" /> Select Registered Blood Centre
              </label>
              <select
                value={selectedCenterId || ""}
                onChange={(e) => setSelectedCenterId(parseInt(e.target.value, 10))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.city}, {c.state} ({c.facilityType ? c.facilityType.replace(/_/g, " ") : "Hospital"})
                  </option>
                ))}
              </select>

              {selectedCenter && (
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{selectedCenter.address}</span>
                  <span className="text-slate-600">&bull;</span>
                  <span>{selectedCenter.phone}</span>
                </p>
              )}
            </div>

            {/* Step 2: Date & Blood Group */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Appointment Date
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {ALL_BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {BLOOD_GROUP_DISPLAY[bg]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Component Preference
                </label>
                <select
                  value={component}
                  onChange={(e) => setComponent(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {SUPPORTED_BLOOD_COMPONENTS.map((comp) => (
                    <option key={comp} value={comp}>
                      {comp}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 3: Available Time Slots */}
            <div className="pt-4 border-t border-slate-800">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-400" /> Available Time Slots (Capacity Guarded)
                </span>
                {loadingSlots && <span className="text-slate-400 text-xs font-normal">Loading slots...</span>}
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {slots.map((slot) => {
                  const isSelected = selectedSlot === slot.timeSlot;
                  return (
                    <button
                      key={slot.timeSlot}
                      type="button"
                      disabled={!slot.isAvailable}
                      onClick={() => setSelectedSlot(slot.timeSlot)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "bg-emerald-600/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30"
                          : slot.isAvailable
                          ? "bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700/80"
                          : "bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed opacity-50"
                      }`}
                    >
                      <div className="font-extrabold text-xs">{slot.timeSlot}</div>
                      <div className="text-[10px] mt-1 text-slate-400">
                        {slot.isAvailable ? (
                          <span className="text-emerald-400 font-semibold">
                            {slot.remaining}/{slot.maxCapacity} slots left
                          </span>
                        ) : (
                          <span className="text-rose-500 font-semibold">Fully Booked</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Notes */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Notes for Staff / Screening (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. First-time voluntary donor, or donating for camp drive"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Submit Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Overbooking prevented via database transactions</span>
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedSlot}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-600/30 transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? "Booking Appointment..." : "Confirm Donation Slot"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

export default function AppointmentBookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 animate-pulse">Loading booking form…</div>
      </div>
    }>
      <AppointmentBookingContent />
    </Suspense>
  );
}
