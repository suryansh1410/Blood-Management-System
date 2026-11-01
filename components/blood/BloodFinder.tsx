"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner, EmptyState, ErrorState } from "@/components/ui/States";
import { ALL_BLOOD_GROUPS, BLOOD_GROUP_DISPLAY, StockStatus } from "@/lib/constants";
import {
  Search,
  Droplet,
  MapPin,
  Phone,
  AlertTriangle,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Building2,
  Heart,
  ShieldCheck,
  Clock,
  Filter,
  Layers,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Info,
  X,
  CheckCircle2,
  Compass,
} from "lucide-react";

interface BloodFinderProps {
  isAuthenticated: boolean;
  patientCity?: string | null;
}

interface CenterCardData {
  id: number;
  name: string;
  type: string;
  city: string;
  state: string;
  country: string;
  address: string;
  phone: string;
  facilityType: string;
  verificationStatus: string;
  components: string;
  dataSource: string;
  popularRank: number;
  hasLiveStock: boolean;
  unitsAvailable: number | null;
  status: string;
  statusLabel: string;
  groupStocks: Record<string, { units: number; status: string; statusLabel: string } | null>;
  lastStockUpdate: string;
}

interface LocationsData {
  countries: string[];
  states: string[];
  citiesByState: Record<string, string[]>;
  allCities: string[];
}

const BLOOD_GROUPS_LIST = [
  { key: "ALL", label: "All Groups" },
  { key: "A_POS", label: "A+" },
  { key: "A_NEG", label: "A-" },
  { key: "B_POS", label: "B+" },
  { key: "B_NEG", label: "B-" },
  { key: "AB_POS", label: "AB+" },
  { key: "AB_NEG", label: "AB-" },
  { key: "O_POS", label: "O+" },
  { key: "O_NEG", label: "O-" },
];

const COMPONENTS_LIST = [
  { key: "ALL", label: "All Components" },
  { key: "Whole Blood", label: "Whole Blood" },
  { key: "PRBC", label: "Packed Red Blood Cells (PRBC)" },
  { key: "Platelets", label: "Platelets / SDP / RDP" },
  { key: "FFP", label: "Fresh Frozen Plasma (FFP)" },
  { key: "Cryoprecipitate", label: "Cryoprecipitate" },
];

const AVAILABILITY_OPTIONS = [
  { key: "ALL", label: "All Availability" },
  { key: "AVAILABLE", label: "Available (>15 units)" },
  { key: "LOW_STOCK", label: "Low Stock (6–15 units)" },
  { key: "CRITICAL", label: "Critical (1–5 units)" },
  { key: "OUT_OF_STOCK", label: "Out of Stock (0 units)" },
  { key: "NOT_UPDATED", label: "Availability Not Updated" },
];

const SORT_OPTIONS = [
  { key: "popular", label: "Most Popular & Featured" },
  { key: "stock", label: "Highest Available Stock" },
  { key: "name", label: "Hospital Name (A–Z)" },
  { key: "city", label: "City (A–Z)" },
];

export default function BloodFinder({ isAuthenticated, patientCity }: BloodFinderProps) {
  // ─── Filter States ─────────────────────────────────────────────────────────
  const [country, setCountry] = useState("All India");
  const [state, setState] = useState("All States");
  const [city, setCity] = useState("All Cities");
  const [bloodGroup, setBloodGroup] = useState("ALL");
  const [component, setComponent] = useState("ALL");
  const [availability, setAvailability] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popular");

  // ─── Location Hierarchy Data ───────────────────────────────────────────────
  const [locations, setLocations] = useState<LocationsData>({
    countries: ["India"],
    states: [],
    citiesByState: {},
    allCities: [],
  });
  const [locationsLoading, setLocationsLoading] = useState(true);

  // ─── Results & Pagination ──────────────────────────────────────────────────
  const [results, setResults] = useState<CenterCardData[]>([]);
  const [meta, setMeta] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
    suggestedCities: string[];
  }>({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
    hasMore: false,
    suggestedCities: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Quick Donation Modal ───────────────────────────────────────────────────
  const [donationModalCenter, setDonationModalCenter] = useState<CenterCardData | null>(null);

  // 1. Fetch dynamic location hierarchy on mount
  useEffect(() => {
    fetch("/api/centers/locations")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setLocations(res.data);
        }
      })
      .catch((err) => console.error("Error loading location hierarchy:", err))
      .finally(() => setLocationsLoading(false));
  }, []);

  // 2. Compute available cities based on selected state
  const availableCities = useMemo(() => {
    if (state === "All States" || !state) {
      return locations.allCities;
    }
    return locations.citiesByState[state] || [];
  }, [state, locations]);

  // When state changes, reset city to "All Cities" if currently selected city is not in new state
  const handleStateChange = (newState: string) => {
    setState(newState);
    if (newState === "All States") {
      setCity("All Cities");
    } else {
      const stateCities = locations.citiesByState[newState] || [];
      if (!stateCities.includes(city)) {
        setCity("All Cities");
      }
    }
  };

  // 3. Fetch search results from API
  const fetchResults = useCallback(
    async (pageToLoad = 1, append = false) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (country && country !== "All India") params.set("country", country);
        if (state && state !== "All States") params.set("state", state);
        if (city && city !== "All Cities") params.set("city", city);
        if (bloodGroup && bloodGroup !== "ALL") params.set("bloodGroup", bloodGroup);
        if (component && component !== "ALL") params.set("component", component);
        if (availability && availability !== "ALL") params.set("availability", availability);
        if (searchQuery.trim()) params.set("q", searchQuery.trim());
        if (sortBy) params.set("sortBy", sortBy);
        params.set("page", String(pageToLoad));
        params.set("limit", "12");

        const res = await fetch(`/api/centers/search?${params.toString()}`);
        const json = await res.json();

        if (!res.ok) {
          setError(json.error || "Failed to search blood centres");
          if (!append) setResults([]);
        } else {
          if (append) {
            setResults((prev) => [...prev, ...(json.data || [])]);
          } else {
            setResults(json.data || []);
          }
          setMeta({
            total: json.meta?.total || 0,
            page: json.meta?.page || 1,
            limit: json.meta?.limit || 12,
            totalPages: json.meta?.totalPages || 1,
            hasMore: json.meta?.hasMore || false,
            suggestedCities: json.meta?.suggestedCities || [],
          });
        }
      } catch {
        setError("Network connection issue — please try again.");
        if (!append) setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [country, state, city, bloodGroup, component, availability, searchQuery, sortBy]
  );

  // Trigger search whenever filters change
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchResults(1, false);
    }, 250);
    return () => clearTimeout(timeout);
  }, [fetchResults]);

  // Reset all filters to initial nationwide state
  const handleResetFilters = () => {
    setCountry("All India");
    setState("All States");
    setCity("All Cities");
    setBloodGroup("ALL");
    setComponent("ALL");
    setAvailability("ALL");
    setSearchQuery("");
    setSortBy("popular");
  };

  // Helper for Request Blood button link
  const getRequestBloodUrl = (center: CenterCardData) => {
    const params = new URLSearchParams();
    if (bloodGroup !== "ALL") params.set("group", bloodGroup);
    if (component !== "ALL") params.set("component", component);
    params.set("centerId", String(center.id));
    params.set("hospitalName", center.name);
    params.set("city", center.city);
    params.set("urgency", "NORMAL");

    const dest = `/patient/requests/new?${params.toString()}`;
    if (!isAuthenticated) {
      return `/login?callbackUrl=${encodeURIComponent(dest)}`;
    }
    return dest;
  };

  // Helper for Donate Blood button link
  const getDonateBloodUrl = (center: CenterCardData) => {
    const params = new URLSearchParams();
    params.set("centerId", String(center.id));
    params.set("location", `${center.name}, ${center.city}`);

    const dest = `/donor/donations/new?${params.toString()}`;
    if (!isAuthenticated) {
      return `/login?callbackUrl=${encodeURIComponent(dest)}`;
    }
    return dest;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ─── Hero / Header ─────────────────────────────────────────────────── */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold tracking-wide uppercase">
            <Droplet className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            National Blood Availability & Finder
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            Find Blood Reserves & Hospitals <span className="text-rose-500">Across India</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Search verified licensed blood centres, hospitals, and real-time inventory in Gwalior, Madhya Pradesh, and across India backed by official registries.
          </p>
        </div>

        {/* ─── Search & Multi-Level Filters Card ─────────────────────────────── */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl p-5 sm:p-7 backdrop-blur-md space-y-5">
          {/* Main Keyword Search Bar */}
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by hospital name, blood centre, landmark, or district..."
              className="w-full pl-12 pr-10 py-3.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Three-Level Location Hierarchy + Blood Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
            {/* Level 1: Country */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-rose-400" />
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              >
                <option value="All India">All India</option>
                {locations.countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Level 2: State */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                State
              </label>
              <select
                value={state}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              >
                <option value="All States">All States</option>
                {locations.states.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Level 3: City / District */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-teal-400" />
                City / District
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              >
                <option value="All Cities">
                  {state !== "All States" ? `All Cities in ${state}` : "All Cities"}
                </option>
                {availableCities.map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
            </div>

            {/* Blood Group */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-rose-500" />
                Blood Group
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              >
                {BLOOD_GROUPS_LIST.map((bg) => (
                  <option key={bg.key} value={bg.key}>
                    {bg.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Blood Component */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Component
              </label>
              <select
                value={component}
                onChange={(e) => setComponent(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              >
                {COMPONENTS_LIST.map((comp) => (
                  <option key={comp.key} value={comp.key}>
                    {comp.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Availability Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-emerald-400" />
                Stock Status
              </label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                {AVAILABILITY_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Row: Sort by + Active Filter Badges + Clear Filters */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Sort results by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-950 border border-slate-700/70 rounded-lg px-2.5 py-1 text-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-medium">
                Showing <strong className="text-white">{results.length}</strong> of{" "}
                <strong className="text-white">{meta.total}</strong> verified centres
              </span>
              {(state !== "All States" ||
                city !== "All Cities" ||
                bloodGroup !== "ALL" ||
                component !== "ALL" ||
                availability !== "ALL" ||
                searchQuery ||
                sortBy !== "popular") && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300 font-semibold transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── Search Results Section ────────────────────────────────────────── */}
        <div>
          {/* Loading Skeleton */}
          {loading && results.length === 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-64 rounded-2xl border border-slate-800/80 bg-slate-900/60 animate-pulse p-6 space-y-4"
                >
                  <div className="h-6 bg-slate-800 rounded-lg w-2/3" />
                  <div className="h-4 bg-slate-800/60 rounded w-1/2" />
                  <div className="h-16 bg-slate-800/40 rounded-xl" />
                  <div className="h-10 bg-slate-800/60 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="p-8 text-center bg-slate-900 border border-rose-500/20 rounded-3xl space-y-3">
              <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Search Error</h3>
              <p className="text-sm text-slate-400">{error}</p>
              <Button variant="secondary" onClick={() => fetchResults(1, false)}>
                Retry Search
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && results.length === 0 && (
            <div className="p-12 text-center bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4 max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">No Matching Blood Centres Found</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                We could not find any verified centres matching your exact location or filters.
                {city !== "All Cities" && state !== "All States" && (
                  <span>
                    {" "}You searched for <strong>{city}</strong> in {state}.
                  </span>
                )}
              </p>

              {/* Suggestions */}
              {meta.suggestedCities && meta.suggestedCities.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Try searching nearby cities with verified centres:
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {meta.suggestedCities.map((sc) => (
                      <button
                        key={sc}
                        onClick={() => setCity(sc)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
                      >
                        {sc}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                {city !== "All Cities" && (
                  <Button
                    variant="secondary"
                    onClick={() => setCity("All Cities")}
                    className="text-xs"
                  >
                    Search All Centres in {state}
                  </Button>
                )}
                <Button variant="outline" onClick={handleResetFilters} className="text-xs">
                  Clear All Filters
                </Button>
              </div>
            </div>
          )}

          {/* Hospital Results Grid */}
          {!error && results.length > 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {results.map((center) => {
                  const facilityBadgeConfig: Record<string, { label: string; color: string }> = {
                    BLOOD_BANK: {
                      label: "Licensed Blood Bank",
                      color: "bg-teal-500/10 text-teal-300 border-teal-500/30",
                    },
                    HOSPITAL_WITH_BLOOD_BANK: {
                      label: "Hospital with Blood Bank",
                      color: "bg-blue-500/10 text-blue-300 border-blue-500/30",
                    },
                    BLOOD_STORAGE: {
                      label: "Blood Storage Centre",
                      color: "bg-amber-500/10 text-amber-300 border-amber-500/30",
                    },
                    TRANSFUSION_FACILITY: {
                      label: "Transfusion Facility",
                      color: "bg-purple-500/10 text-purple-300 border-purple-500/30",
                    },
                  };

                  const facBadge =
                    facilityBadgeConfig[center.facilityType] || facilityBadgeConfig.HOSPITAL_WITH_BLOOD_BANK;

                  const isVerified = center.verificationStatus === "VERIFIED";

                  return (
                    <div
                      key={center.id}
                      className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl hover:border-slate-700/80 transition-all p-5 sm:p-6 flex flex-col justify-between space-y-5"
                    >
                      {/* Top Header Row */}
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-2.5">
                          {/* Badges: Facility Type & Verification */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${facBadge.color}`}
                            >
                              {facBadge.label}
                            </span>
                            {isVerified ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                Verified Centre
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                <Clock className="w-3.5 h-3.5 text-amber-400" />
                                Verification Pending
                              </span>
                            )}
                          </div>

                          {/* City & State Location Chip */}
                          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50">
                            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>
                              {center.city}, {center.state}
                            </span>
                          </div>
                        </div>

                        {/* Hospital Name */}
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug break-words">
                            {center.name}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {center.address}
                          </p>
                        </div>
                      </div>

                      {/* Middle: Stock Availability Section (Strict Data Integrity) */}
                      <div className="rounded-xl border border-slate-800/90 bg-slate-950/70 p-4 space-y-3">
                        {/* If a specific blood group is chosen */}
                        {bloodGroup !== "ALL" ? (
                          center.hasLiveStock && center.unitsAvailable !== null ? (
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center font-black text-rose-300 text-sm">
                                  {BLOOD_GROUP_DISPLAY[bloodGroup as keyof typeof BLOOD_GROUP_DISPLAY] || bloodGroup}
                                </div>
                                <div>
                                  <div className="text-xs text-slate-400">Available Stock</div>
                                  <div className="text-xl font-black text-white tabular-nums">
                                    {center.unitsAvailable} <span className="text-xs font-normal text-slate-400">Units</span>
                                  </div>
                                </div>
                              </div>
                              <span
                                className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                                  center.status === "AVAILABLE"
                                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                                    : center.status === "LOW_STOCK"
                                    ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                                    : center.status === "CRITICAL"
                                    ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                                    : "bg-slate-700/30 text-slate-400 border-slate-700"
                                }`}
                              >
                                {center.statusLabel}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2 text-slate-400">
                                <Info className="w-4 h-4 text-slate-500 shrink-0" />
                                <span>Availability for {BLOOD_GROUP_DISPLAY[bloodGroup as keyof typeof BLOOD_GROUP_DISPLAY] || bloodGroup}:</span>
                              </div>
                              <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                                Availability Not Updated
                              </span>
                            </div>
                          )
                        ) : (
                          /* When "All Groups" is chosen: Show Mini Badges for all 8 Blood Groups */
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                                <Droplet className="w-3.5 h-3.5 text-rose-500" />
                                Blood Reserves Breakdown:
                              </span>
                              {center.hasLiveStock && center.unitsAvailable !== null ? (
                                <span className="font-bold text-white tabular-nums">
                                  {center.unitsAvailable} Total Units
                                </span>
                              ) : (
                                <span className="text-[11px] font-medium text-slate-400">
                                  Availability Not Updated
                                </span>
                              )}
                            </div>

                            {center.hasLiveStock ? (
                              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-1">
                                {ALL_BLOOD_GROUPS.map((bg) => {
                                  const stock = center.groupStocks[bg];
                                  const units = stock?.units ?? 0;
                                  const label = BLOOD_GROUP_DISPLAY[bg];
                                  const isAvail = units > 0;

                                  return (
                                    <div
                                      key={bg}
                                      className={`p-1.5 rounded-lg border text-center transition-all ${
                                        isAvail
                                          ? "bg-slate-900 border-slate-700/80 text-slate-200"
                                          : "bg-slate-950/50 border-slate-800 text-slate-500"
                                      }`}
                                      title={`${label}: ${units} units (${stock?.statusLabel || "Out of Stock"})`}
                                    >
                                      <div className="text-[10px] font-black">{label}</div>
                                      <div className="text-xs font-black tabular-nums mt-0.5">
                                        {units}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-400 leading-tight">
                                Live inventory figures have not yet been synchronized from this centre. Transfusion and request services remain active.
                              </p>
                            )}
                          </div>
                        )}

                        {/* Supported Components Tags */}
                        {center.components && (
                          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="text-slate-400 font-medium">Components:</span>
                            {center.components.split(",").map((c) => (
                              <span
                                key={c.trim()}
                                className="px-2 py-0.5 bg-slate-900 text-slate-300 rounded border border-slate-800 font-medium"
                              >
                                {c.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Bottom Contact & Verification Metadata */}
                      <div className="space-y-3 pt-1">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                          {center.phone && (
                            <a
                              href={`tel:${center.phone}`}
                              className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white font-medium transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5 text-teal-400" />
                              <span>{center.phone}</span>
                            </a>
                          )}
                          <div className="text-[11px] text-slate-400">
                            Source: <span className="text-slate-300 font-medium">{center.dataSource}</span>
                          </div>
                        </div>

                        {/* Action Buttons: Donate Blood & Request Blood */}
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                          <button
                            onClick={() => setDonationModalCenter(center)}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-slate-700/80 transition-all cursor-pointer shadow-sm hover:shadow"
                          >
                            <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            Donate Blood
                          </button>

                          <a
                            href={getRequestBloodUrl(center)}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md hover:shadow-rose-600/30"
                          >
                            <Droplet className="w-3.5 h-3.5 shrink-0" />
                            Request Blood
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load More Pagination Button */}
              {meta.hasMore && (
                <div className="text-center pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => fetchResults(meta.page + 1, true)}
                    disabled={loading}
                    className="px-6 py-3 text-xs sm:text-sm font-bold inline-flex items-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    Load More Centres ({meta.total - results.length} remaining)
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Quick Donate Blood Info / Interest Modal ───────────────────────── */}
        {donationModalCenter && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
              onClick={() => setDonationModalCenter(null)}
              aria-hidden="true"
            />
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl z-10 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Donate Blood</h3>
                    <p className="text-xs text-slate-400">{donationModalCenter.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDonationModalCenter(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 rounded-2xl bg-slate-950 p-4 border border-slate-800 text-xs">
                <div className="flex items-start gap-2.5 text-slate-300">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Centre Address:</strong>
                    <p className="text-slate-400 mt-0.5">{donationModalCenter.address}</p>
                    <p className="text-slate-400">{donationModalCenter.city}, {donationModalCenter.state}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-slate-300 pt-2 border-t border-slate-800/80">
                  <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                  <div>
                    <strong className="text-white">Helpline / Reception: </strong>
                    <a
                      href={`tel:${donationModalCenter.phone}`}
                      className="text-teal-400 hover:underline font-bold"
                    >
                      {donationModalCenter.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-slate-300 pt-2 border-t border-slate-800/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Verification Status: <strong className="text-emerald-400">{donationModalCenter.verificationStatus}</strong>
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Thank you for your willingness to save lives. Blood donations are conducted after confidential on-site donor health screening by certified medical personnel.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={getDonateBloodUrl(donationModalCenter)}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold transition-all shadow-lg hover:shadow-rose-600/30 text-center"
                >
                  <Heart className="w-4 h-4" />
                  Proceed to Schedule Donation
                </a>
                <button
                  onClick={() => setDonationModalCenter(null)}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
