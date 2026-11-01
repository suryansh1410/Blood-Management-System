"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  MapPin,
  ShieldCheck,
  CheckCircle,
  Clock,
  Heart,
  Send,
  Sparkles,
  Navigation,
  Lock,
  AlertCircle,
  Radio,
} from "lucide-react";
import { ALL_BLOOD_GROUPS, BLOOD_GROUP_DISPLAY } from "@/lib/constants";
import { useToast } from "@/components/ui/Toast";

interface DonorCard {
  id: string;
  displayName: string;
  bloodGroup: string | null;
  bloodGroupDisplay: string;
  city: string;
  approxDistanceKm: number | null;
  availabilityStatus: string;
  notificationConsent: boolean;
  donationCount: number;
  lastDonationInfo: string;
  isEligible: boolean;
}

export default function SmartNearbyDonorFinderPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  const [donors, setDonors] = useState<DonorCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [bloodGroup, setBloodGroup] = useState("All");
  const [state, setState] = useState("Madhya Pradesh");
  const [city, setCity] = useState("Gwalior");
  const [radiusKm, setRadiusKm] = useState("25");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyConsenting, setOnlyConsenting] = useState(true);

  // Browser Geolocation
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  // Alert Modal
  const [selectedDonor, setSelectedDonor] = useState<DonorCard | null>(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [sendingAlert, setSendingAlert] = useState(false);

  // Request browser location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toastError("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocating(false);
        toastSuccess("Device location detected for accurate proximity calculation.");
      },
      (err) => {
        setLocating(false);
        toastError("Location permission denied. Proximity will be based on city defaults.");
      }
    );
  };

  const fetchDonors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (bloodGroup !== "All") params.set("bloodGroup", bloodGroup);
      if (state && state !== "All") params.set("state", state);
      if (city && city !== "All") params.set("city", city);
      if (radiusKm && radiusKm !== "All") params.set("radiusKm", radiusKm);
      params.set("onlyConsenting", onlyConsenting ? "true" : "false");
      params.set("onlyAvailable", onlyAvailable ? "true" : "false");

      if (userCoords) {
        params.set("lat", userCoords.lat.toString());
        params.set("lng", userCoords.lng.toString());
      }

      const res = await fetch(`/api/donors/search?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setDonors(json.data || []);
      }
    } catch {
      toastError("Failed to search donors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, [bloodGroup, state, city, radiusKm, onlyAvailable, onlyConsenting, userCoords]);

  const handleSendAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDonor) return;

    setSendingAlert(true);
    try {
      const res = await fetch("/api/donors/alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorId: selectedDonor.id,
          city,
          message: alertMessage.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toastError(json.error || "Failed to alert donor");
      } else {
        toastSuccess(json.message || "Alert transmitted securely.");
        setSelectedDonor(null);
        setAlertMessage("");
      }
    } catch {
      toastError("Failed to dispatch alert");
    } finally {
      setSendingAlert(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-wider mb-3">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Feature 2 &bull; Privacy-Guaranteed Discovery</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">
              Smart Nearby Donor Finder
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Connect with consenting voluntary blood donors nearby while strictly safeguarding
              identities, phone numbers, and exact personal coordinates.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleGetLocation}
              disabled={locating}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-2"
            >
              <Navigation className={`w-4 h-4 ${locating ? "animate-spin" : ""}`} />
              {userCoords ? "Location Calibrated (GPS Active)" : "Calibrate Device Proximity"}
            </button>
            <a
              href="/donor/profile"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-slate-700"
            >
              <Lock className="w-4 h-4 text-emerald-400" /> My Donor Privacy Settings
            </a>
          </div>
        </div>
      </div>

      {/* Filter Matrix */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Blood Group
            </label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-black text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="All">All Groups</option>
              {ALL_BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {BLOOD_GROUP_DISPLAY[bg]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              State
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="Madhya Pradesh">Madhya Pradesh (Primary)</option>
              <option value="All">All India</option>
              <option value="Delhi">Delhi</option>
              <option value="Rajasthan">Rajasthan</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Maharashtra">Maharashtra</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              City / District
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="Gwalior">Gwalior (Priority Hub)</option>
              <option value="Indore">Indore</option>
              <option value="Bhopal">Bhopal</option>
              <option value="Jabalpur">Jabalpur</option>
              <option value="Rewa">Rewa</option>
              <option value="Sagar">Sagar</option>
              <option value="Ujjain">Ujjain</option>
              <option value="All">All Cities</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Proximity Radius
            </label>
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
              <option value="All">Any Distance</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <label className="inline-flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer py-2">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
              />
              <span>Available Only</span>
            </label>
          </div>

          <div className="flex flex-col justify-end">
            <label className="inline-flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer py-2">
              <input
                type="checkbox"
                checked={onlyConsenting}
                onChange={(e) => setOnlyConsenting(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
              />
              <span>Consenting Only</span>
            </label>
          </div>
        </div>

        {/* Privacy Callout */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Zero Personal Exposure:</strong> Donors are displayed via privacy aliases.
            Phone numbers, home addresses, and GPS coordinates are never exposed over public APIs.
          </span>
        </div>
      </div>

      {/* Donor Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" /> Consenting Donors in Network
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {donors.length} Verified
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-44 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse p-5"
              />
            ))}
          </div>
        ) : donors.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <Users className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <div className="font-bold text-slate-300">No matching donors in this filter</div>
            <p className="text-xs text-slate-500 mt-1">
              Try widening the radius or selecting "All Groups" to locate nearby voluntary reserves.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {donors.map((d) => (
              <div
                key={d.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-100 text-base">{d.displayName}</span>
                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Consented
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{d.city}</span>
                        {d.approxDistanceKm !== null && (
                          <>
                            <span className="text-slate-600">&bull;</span>
                            <span className="text-cyan-400 font-semibold">
                              ~{d.approxDistanceKm} km away
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="w-11 h-11 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-300 font-black text-sm shrink-0">
                      {d.bloodGroupDisplay}
                    </div>
                  </div>

                  <div className="bg-slate-800/60 rounded-xl p-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500">Donation History:</span>
                      <span className="font-bold">{d.donationCount} verified donations</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500">Eligibility Notice:</span>
                      <span
                        className={`font-semibold ${
                          d.isEligible ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {d.lastDonationInfo}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setSelectedDonor(d)}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <Send className="w-3.5 h-3.5" /> Dispatch Emergency Request Alert
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Secure Alert Modal */}
      {selectedDonor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <Send className="w-5 h-5 text-rose-500" />
                <span>Send Emergency Donor Alert</span>
              </div>
              <button
                onClick={() => setSelectedDonor(null)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-2">
              <p>
                Sending notification to{" "}
                <strong className="text-slate-100">{selectedDonor.displayName}</strong> (
                {selectedDonor.bloodGroupDisplay} in {selectedDonor.city}).
              </p>
              <p className="text-slate-400">
                The donor will receive a priority in-app notification with request details and can
                accept or decline directly. Neither party's phone number or home address is exposed.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Urgent Message / Hospital Note
              </label>
              <textarea
                rows={3}
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                placeholder="e.g. Critical B+ blood needed at J.A. Hospital Gwalior for emergency surgery. Please respond if you are nearby and willing to donate."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedDonor(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSendAlert}
                disabled={sendingAlert}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {sendingAlert ? "Dispatching..." : "Send Alert"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
