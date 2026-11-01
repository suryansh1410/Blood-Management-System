"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { LoadingSpinner, EmptyState, ErrorState } from "@/components/ui/States";
import { ALL_BLOOD_GROUPS, BLOOD_GROUP_DISPLAY, STOCK_THRESHOLDS } from "@/lib/constants";
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
} from "lucide-react";

interface BloodFinderProps {
  isAuthenticated: boolean;
  patientCity?: string | null;
}

interface CenterResult {
  id: number;
  name: string;
  type: string;
  city: string;
  address: string;
  phone: string;
  unitsAvailable: number;
  status: string;
  statusLabel: string;
}

interface AggregateStock {
  bloodGroup: string;
  displayGroup: string;
  units: number;
  status: string;
  statusLabel: string;
}

export default function BloodFinder({ isAuthenticated, patientCity }: BloodFinderProps) {
  const [cities, setCities] = useState<string[]>([]);
  const [overview, setOverview] = useState<AggregateStock[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Search state
  const [bloodGroup, setBloodGroup] = useState("");
  const [city, setCity] = useState("");
  const [emergency, setEmergency] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Results state
  const [results, setResults] = useState<CenterResult[]>([]);
  const [resultsMeta, setResultsMeta] = useState<{
    bloodGroup: string;
    displayGroup: string;
    city: string | null;
    emergency: boolean;
  } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Load cities and overview on mount
  useEffect(() => {
    fetch("/api/centers/cities")
      .then((r) => r.json())
      .then((j) => setCities(j.data || []))
      .catch(() => {});

    fetch("/api/blood-stock")
      .then((r) => r.json())
      .then((j) => {
        setOverview(j.data || []);
        setOverviewLoading(false);
      })
      .catch(() => setOverviewLoading(false));
  }, []);

  const handleSearch = useCallback(async () => {
    if (!bloodGroup) return;
    setHasSearched(true);
    setSearchLoading(true);
    setSearchError(null);

    try {
      const params = new URLSearchParams({ bloodGroup });
      if (city) params.set("city", city);
      if (emergency) params.set("emergency", "true");

      const res = await fetch(`/api/centers/search?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        setSearchError(json.error || "Search failed");
        setResults([]);
        setResultsMeta(null);
      } else {
        setResults(json.data || []);
        setResultsMeta({
          bloodGroup: json.bloodGroup,
          displayGroup: json.displayGroup,
          city: json.city,
          emergency: json.emergency,
        });
      }
    } catch {
      setSearchError("Network error — please try again");
      setResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [bloodGroup, city, emergency]);

  const handleReset = () => {
    setBloodGroup("");
    setCity("");
    setEmergency(false);
    setHasSearched(false);
    setResults([]);
    setResultsMeta(null);
    setSearchError(null);
  };

  const buildRequestUrl = (targetBloodGroup: string, centerName: string, centerCity: string) => {
    const additionalInfo = `Requested via finder — preferred location: ${centerName}, ${centerCity}`;
    const urgency = emergency ? "EMERGENCY" : "";
    const params = new URLSearchParams({ group: targetBloodGroup });
    if (additionalInfo) params.set("additionalInfo", additionalInfo);
    if (urgency) params.set("urgency", urgency);
    const dest = `/patient/requests/new?${params.toString()}`;
    if (!isAuthenticated) {
      return `/login?callbackUrl=${encodeURIComponent(dest)}`;
    }
    return dest;
  };

  // ─── Empty state logic (Section 11) ─────────────────────────────────────────
  const renderEmptyState = () => {
    if (!resultsMeta) return null;
    const bg = resultsMeta.displayGroup;
    const searchedCity = resultsMeta.city;

    if (searchedCity && results.length === 0) {
      return (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">
            There are no registered blood banks or hospitals in {searchedCity} yet.
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            Try searching across all locations or submit a blood request.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" size="sm" onClick={() => setCity("")} className="gap-1.5">
              <Search className="w-3.5 h-3.5" />
              Search all locations
            </Button>
            <a href={buildRequestUrl(resultsMeta.bloodGroup, "", "")}>
              <Button variant="primary" size="sm" className="gap-1.5">
                Submit a Blood Request
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>
        </div>
      );
    }

    const allZero = results.every((r) => r.unitsAvailable === 0);
    if (allZero && results.length > 0) {
      const msg = searchedCity
        ? `${bg} is currently unavailable in ${searchedCity}.`
        : `${bg} is currently unavailable at any location.`;
      return (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <Droplet className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">{msg}</h3>
          <p className="text-sm text-slate-500 mb-6">
            {searchedCity
              ? "Units may be available in other cities."
              : "Please check back later or submit a request to be notified."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {searchedCity && (
              <Button variant="outline" size="sm" onClick={() => setCity("")} className="gap-1.5">
                <Search className="w-3.5 h-3.5" />
                Try another city
              </Button>
            )}
            <a href={buildRequestUrl(resultsMeta.bloodGroup, "", searchedCity || "")}>
              <Button variant="primary" size="sm" className="gap-1.5">
                Submit a Blood Request
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>
        </div>
      );
    }

    return null;
  };

  const displayedResults = results.filter((r) => r.unitsAvailable > 0);
  const unavailableResults = results.filter((r) => r.unitsAvailable === 0);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Blood Availability & Finder
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search by blood group across all registered blood banks and hospitals.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 self-start">
          <RefreshCw className="w-3.5 h-3.5" />
          Reset
        </Button>
      </div>

      {/* Threshold Legend */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <span className="font-bold text-slate-700 uppercase tracking-wider">Stock Thresholds:</span>
        <div className="flex flex-wrap items-center gap-4 text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <strong>Available:</strong> &gt; {STOCK_THRESHOLDS.LOW_MAX} units
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <strong>Low Stock:</strong> 6–{STOCK_THRESHOLDS.LOW_MAX}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <strong>Critical:</strong> 1–{STOCK_THRESHOLDS.CRITICAL_MAX}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-800" />
            <strong>Out of Stock:</strong> 0 units
          </span>
        </div>
      </div>

      {/* Search Form */}
      <Card className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Blood Group <span className="text-rose-500">*</span>
            </label>
            <select
              id="bloodGroupSelect"
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">— Select Blood Group —</option>
              {ALL_BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {BLOOD_GROUP_DISPLAY[bg]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              City (optional)
            </label>
            <select
              id="citySelect"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 pt-5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                id="emergencyCheck"
                checked={emergency}
                onChange={(e) => setEmergency(e.target.checked)}
                className="w-4 h-4 accent-rose-600"
              />
              <span className="text-sm font-semibold text-slate-700">
                🚨 Emergency / Urgent need
              </span>
            </label>
          </div>

          <div className="flex items-end gap-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleSearch}
              disabled={!bloodGroup || searchLoading}
              className="w-full gap-1.5"
              id="findBloodBtn"
            >
              <Search className="w-4 h-4" />
              Find Blood
            </Button>
          </div>
        </div>
      </Card>

      {/* Results Section */}
      {!hasSearched ? (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-700">
            System-wide Blood Availability Overview
          </h2>
          <p className="text-xs text-slate-500">
            Combined units across all active blood banks and hospitals.
          </p>
          {overviewLoading ? (
            <LoadingSpinner text="Loading overview..." />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {overview.map((item) => (
                <Card key={item.bloodGroup} className="p-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 font-black text-lg flex items-center justify-center mx-auto mb-2 border border-rose-100">
                    {item.displayGroup}
                  </div>
                  <div className="text-2xl font-black text-slate-900">{item.units}</div>
                  <div className="text-xs text-slate-400 mb-2">total units</div>
                  <StatusBadge status={item.status} />
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : searchLoading ? (
        <LoadingSpinner text="Searching blood banks and hospitals..." />
      ) : searchError ? (
        <ErrorState message={searchError} onRetry={handleSearch} />
      ) : (
        <div className="space-y-4">
          {/* Emergency banner */}
          {resultsMeta?.emergency && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-rose-800 font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              🚨 Emergency search — centers with any available units shown first.
            </div>
          )}

          {/* Result count header */}
          {resultsMeta && (
            <div className="flex items-center justify-between">
              <div>
                <span className="text-base font-bold text-slate-800">
                  {BLOOD_GROUP_DISPLAY[resultsMeta.bloodGroup as keyof typeof BLOOD_GROUP_DISPLAY] || resultsMeta.displayGroup}
                </span>
                {resultsMeta.city && (
                  <span className="text-sm text-slate-500 ml-2">in {resultsMeta.city}</span>
                )}
                <span className="text-sm text-slate-500 ml-2">
                  — {displayedResults.length} location{displayedResults.length !== 1 ? "s" : ""} with stock
                </span>
              </div>
            </div>
          )}

          {/* Empty state if all centers have 0 */}
          {results.length === 0 || (results.length > 0 && results.every((r) => r.unitsAvailable === 0)) ? (
            renderEmptyState()
          ) : (
            <div className="space-y-3">
              {displayedResults.map((center) => (
                <CenterResultCard
                  key={center.id}
                  center={center}
                  bloodGroup={resultsMeta?.bloodGroup || ""}
                  displayGroup={resultsMeta?.displayGroup || ""}
                  emergency={resultsMeta?.emergency || false}
                  requestUrl={buildRequestUrl(resultsMeta?.bloodGroup || "", center.name, center.city)}
                />
              ))}

              {displayedResults.length > 0 && unavailableResults.length > 0 && (
                <details className="group">
                  <summary className="cursor-pointer text-xs text-slate-400 font-semibold py-2 select-none hover:text-slate-600 transition-colors">
                    {unavailableResults.length} location{unavailableResults.length > 1 ? "s" : ""} with no {resultsMeta?.displayGroup} stock (click to expand)
                  </summary>
                  <div className="mt-2 space-y-3 opacity-60">
                    {unavailableResults.map((center) => (
                      <CenterResultCard
                        key={center.id}
                        center={center}
                        bloodGroup={resultsMeta?.bloodGroup || ""}
                        displayGroup={resultsMeta?.displayGroup || ""}
                        emergency={false}
                        requestUrl={buildRequestUrl(resultsMeta?.bloodGroup || "", center.name, center.city)}
                      />
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Center Result Card ───────────────────────────────────────────────────────
function CenterResultCard({
  center,
  bloodGroup,
  displayGroup,
  emergency,
  requestUrl,
}: {
  center: CenterResult;
  bloodGroup: string;
  displayGroup: string;
  emergency: boolean;
  requestUrl: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Blood group indicator */}
        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-rose-50 text-rose-700 font-black text-xl flex items-center justify-center border border-rose-100">
          {displayGroup}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-bold text-slate-900 text-base">{center.name}</span>
            <Badge variant={center.type === "HOSPITAL" ? "info" : "neutral"} size="sm">
              <Building2 className="w-3 h-3" />
              {center.type === "BLOOD_BANK" ? "Blood Bank" : "Hospital"}
            </Badge>
            <StatusBadge status={center.status} />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-3">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {center.city} — {center.address}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div>
              {center.unitsAvailable > 0 ? (
                <span>
                  <span className="text-xl font-black text-slate-900">{center.unitsAvailable}</span>
                  <span className="text-slate-400 text-xs ml-1">units available</span>
                </span>
              ) : (
                <span className="text-slate-400 font-medium">Currently unavailable</span>
              )}
            </div>

            <a
              href={`tel:${center.phone}`}
              className="flex items-center gap-1 text-teal-600 font-semibold hover:text-teal-800 transition-colors"
              id={`tel-${center.id}`}
            >
              <Phone className="w-3.5 h-3.5" />
              {center.phone}
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex flex-col gap-2 sm:items-end">
          <a href={`/centers/${center.id}`} id={`viewDetails-${center.id}`}>
            <Button variant="outline" size="sm" className="gap-1.5 w-full sm:w-auto">
              <ExternalLink className="w-3.5 h-3.5" />
              View Details
            </Button>
          </a>
          <a href={requestUrl} id={`requestBlood-${center.id}`}>
            <Button
              variant={emergency && center.unitsAvailable > 0 ? "danger" : "primary"}
              size="sm"
              className="gap-1.5 w-full sm:w-auto"
            >
              {emergency && center.unitsAvailable > 0 && <AlertTriangle className="w-3.5 h-3.5" />}
              Request Blood
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
