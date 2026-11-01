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
  Navigation,
  Lock,
  AlertCircle,
  Radio,
  X,
  RotateCcw,
} from "lucide-react";
import { ALL_BLOOD_GROUPS, BLOOD_GROUP_DISPLAY } from "@/lib/constants";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";

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

  // Active applied filters
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
        toastSuccess("Device location detected. Proximity distances updated.");
      },
      () => {
        setLocating(false);
        toastError("Location permission denied. Proximity is calculated from city center.");
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

  const handleClearAllFilters = () => {
    setBloodGroup("All");
    setState("All");
    setCity("All");
    setRadiusKm("All");
    setOnlyAvailable(false);
    setOnlyConsenting(true);
  };

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

  // Active filter chip list
  const activeChips: { label: string; onRemove: () => void }[] = [];
  if (bloodGroup !== "All") {
    activeChips.push({
      label: `Group: ${BLOOD_GROUP_DISPLAY[bloodGroup as keyof typeof BLOOD_GROUP_DISPLAY] || bloodGroup}`,
      onRemove: () => setBloodGroup("All"),
    });
  }
  if (state !== "All") {
    activeChips.push({
      label: `State: ${state}`,
      onRemove: () => setState("All"),
    });
  }
  if (city !== "All") {
    activeChips.push({
      label: `City: ${city}`,
      onRemove: () => setCity("All"),
    });
  }
  if (radiusKm !== "All") {
    activeChips.push({
      label: `Radius: ${radiusKm} km`,
      onRemove: () => setRadiusKm("All"),
    });
  }
  if (onlyAvailable) {
    activeChips.push({
      label: "Available Only",
      onRemove: () => setOnlyAvailable(false),
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-wider mb-3">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Smart Nearby Donor Matching</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-100 tracking-tight">
              Smart Nearby Donor Finder
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Connect with consenting voluntary donors nearby while preserving full identity privacy.
              Phone numbers, home addresses, and exact coordinates are never exposed.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleGetLocation}
              disabled={locating}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Navigation className={`w-4 h-4 ${locating ? "animate-spin text-cyan-400" : "text-cyan-400"}`} />
              {userCoords ? "Device GPS Calibrated" : "Calibrate GPS Proximity"}
            </button>
            <a
              href="/donor/profile"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-slate-700"
            >
              <Lock className="w-4 h-4 text-emerald-400" /> Donor Privacy Controls
            </a>
          </div>
        </div>
      </div>

      {/* Filter Matrix & Removable Chips */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <Select
            label="Blood Group"
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
          >
            <option value="All">All Blood Groups</option>
            {ALL_BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>
                {BLOOD_GROUP_DISPLAY[bg]}
              </option>
            ))}
          </Select>

          <Select
            label="State"
            value={state}
            onChange={(e) => setState(e.target.value)}
          >
            <option value="Madhya Pradesh">Madhya Pradesh</option>
            <option value="All">All States</option>
            <option value="Delhi">Delhi</option>
            <option value="Rajasthan">Rajasthan</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
            <option value="Maharashtra">Maharashtra</option>
          </Select>

          <Select
            label="City / District"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            <option value="Gwalior">Gwalior</option>
            <option value="Indore">Indore</option>
            <option value="Bhopal">Bhopal</option>
            <option value="Jabalpur">Jabalpur</option>
            <option value="Rewa">Rewa</option>
            <option value="Sagar">Sagar</option>
            <option value="Ujjain">Ujjain</option>
            <option value="All">All Cities</option>
          </Select>

          <Select
            label="Proximity Radius"
            value={radiusKm}
            onChange={(e) => setRadiusKm(e.target.value)}
          >
            <option value="10">Within 10 km</option>
            <option value="25">Within 25 km</option>
            <option value="50">Within 50 km</option>
            <option value="100">Within 100 km</option>
            <option value="All">Any Distance</option>
          </Select>

          <div className="flex flex-col justify-end space-y-2 pt-1 sm:pt-0">
            <label className="inline-flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-teal-500 focus:ring-teal-500"
              />
              <span>Available Only</span>
            </label>

            <label className="inline-flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={onlyConsenting}
                onChange={(e) => setOnlyConsenting(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-teal-500 focus:ring-teal-500"
              />
              <span>Consenting Only</span>
            </label>
          </div>
        </div>

        {/* Removable Filter Chips Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-teal-400" /> Active Filters:
            </span>
            {activeChips.length === 0 ? (
              <span className="text-xs text-slate-500 italic">No specific filters applied</span>
            ) : (
              activeChips.map((chip, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200"
                >
                  {chip.label}
                  <button
                    onClick={chip.onRemove}
                    className="hover:text-rose-400 text-slate-400 transition-colors cursor-pointer"
                    aria-label={`Remove filter ${chip.label}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeChips.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAllFilters}
                className="text-xs text-slate-400 hover:text-slate-200 gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear All Filters
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchDonors}
              className="text-xs font-semibold gap-1.5"
            >
              <Search className="w-3.5 h-3.5 text-teal-400" /> Apply Filters
            </Button>
          </div>
        </div>

        {/* Privacy Callout */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-800 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Zero Personal Exposure:</strong> Donors are displayed via privacy-safe aliases.
            Direct personal numbers and GPS markers are shielded; clinical eligibility is verified by licensed medical staff.
          </span>
        </div>
      </div>

      {/* Donor Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Radio className="w-4 h-4 text-rose-500 animate-pulse" /> Consenting Donors in Network
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {donors.length} Result{donors.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-48 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse p-6"
              />
            ))}
          </div>
        ) : donors.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
            <Users className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="font-bold text-slate-200">No matching donors in this criteria</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting the radius, clearing blood group filters, or including nearby districts.
            </p>
            <Button variant="outline" size="sm" onClick={handleClearAllFilters}>
              Reset All Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {donors.map((d) => (
              <div
                key={d.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 shadow-xl transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-100 text-base">{d.displayName}</span>
                        <Badge variant="success" size="sm">
                          Consented
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{d.city}</span>
                        {d.approxDistanceKm !== null && (
                          <>
                            <span className="text-slate-600">&bull;</span>
                            <span className="text-teal-400 font-semibold">
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

                  <div className="bg-slate-950/60 rounded-xl p-3.5 space-y-2 text-xs border border-slate-800/80">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Availability:</span>
                      <span className={`font-semibold ${d.availabilityStatus === "AVAILABLE" ? "text-emerald-400" : "text-amber-400"}`}>
                        {d.availabilityStatus === "AVAILABLE" ? "Ready to Donate" : d.availabilityStatus}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Verified Donations:</span>
                      <span className="font-bold text-slate-200">{d.donationCount} past verified</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800/60">
                      <span className="text-slate-400">Eligibility Window:</span>
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

                <div className="mt-5 pt-4 border-t border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDonor(d)}
                    className="w-full text-xs font-semibold gap-2 border-slate-700 hover:border-rose-500/50 hover:text-rose-300"
                  >
                    <Send className="w-3.5 h-3.5 text-rose-400" /> Dispatch Emergency Request Alert
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Secure Alert Modal with Backdrop Blur */}
      {selectedDonor && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5 text-rose-400 font-bold">
                <Send className="w-5 h-5 text-rose-500" />
                <span>Send Emergency Donor Alert</span>
              </div>
              <button
                onClick={() => setSelectedDonor(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <p>
                Sending high-priority notification to{" "}
                <strong className="text-white">{selectedDonor.displayName}</strong> (
                {selectedDonor.bloodGroupDisplay} in {selectedDonor.city}).
              </p>
              <p className="text-slate-400">
                The donor will receive a priority in-app notification with request details and can
                accept or decline directly. Neither party's phone number or home address is exposed.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Urgent Hospital / Clinical Note
              </label>
              <textarea
                rows={3}
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                placeholder="e.g. Critical B+ blood needed at J.A. Hospital Gwalior for emergency surgery. Please respond if you are nearby and willing to donate."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDonor(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleSendAlert}
                isLoading={sendingAlert}
                disabled={sendingAlert}
                className="gap-2 font-bold"
              >
                <Send className="w-4 h-4" /> Send Emergency Alert
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
