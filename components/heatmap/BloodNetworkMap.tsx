"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  MapPin,
  Building2,
  Navigation,
  Phone,
  Clock,
  ShieldCheck,
  Filter,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { BLOOD_GROUP_DISPLAY, ALL_BLOOD_GROUPS } from "@/lib/constants";

interface CenterMapData {
  id: number;
  name: string;
  type: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  facilityType: string;
  verificationStatus: string;
  components: string;
  latitude: number;
  longitude: number;
  hasLiveStock: boolean;
  unitsAvailable: number;
  visualStatus: "green" | "yellow" | "red" | "grey";
  statusLabel: string;
  lastStockUpdate: string;
  groupStocks: Record<string, number>;
  directionsUrl: string;
}

const STATUS_COLORS = {
  green: { hex: "#10b981", glow: "rgba(16, 185, 129, 0.4)", label: "Available Stock" },
  yellow: { hex: "#f59e0b", glow: "rgba(245, 158, 11, 0.4)", label: "Low Stock" },
  red: { hex: "#ef4444", glow: "rgba(239, 68, 68, 0.4)", label: "Critical Stock" },
  grey: { hex: "#64748b", glow: "rgba(100, 116, 139, 0.2)", label: "Availability Not Updated" },
};

function createCustomPin(colorHex: string, units: number, isPulsing = false) {
  const html = `
    <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
      ${
        isPulsing
          ? `<div style="position: absolute; inset: 0; border-radius: 9999px; background-color: ${colorHex}; opacity: 0.4; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
          : ""
      }
      <div style="position: relative; width: 28px; height: 28px; border-radius: 9999px; background: #0f172a; border: 2.5px solid ${colorHex}; box-shadow: 0 4px 14px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: #f8fafc; font-family: monospace;">
        ${units > 0 ? units : "&bull;"}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-leaflet-marker",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
}

export default function BloodNetworkMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [centers, setCenters] = useState<CenterMapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCenter, setSelectedCenter] = useState<CenterMapData | null>(null);

  // Filters
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const [availableCities, setAvailableCities] = useState<string[]>([]);

  // Fetch heatmap data
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCity !== "All Cities") params.set("city", selectedCity);
      if (selectedGroup !== "All") params.set("bloodGroup", selectedGroup);
      if (selectedStatus !== "All") params.set("status", selectedStatus);

      const res = await fetch(`/api/heatmap/centers?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCenters(json.data);

        // Extract distinct cities
        const cities = Array.from(new Set(json.data.map((c: CenterMapData) => c.city))) as string[];
        cities.sort();
        setAvailableCities(cities);
      }
    } catch (err) {
      console.error("Heatmap fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCity, selectedGroup, selectedStatus]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on Gwalior / MP by default
    const map = L.map(mapContainerRef.current, {
      center: [26.2183, 78.1828], // Gwalior
      zoom: 12,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // CartoDB Dark Matter tile layer (crisp, beautiful dark theme, fast, open)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map markers whenever centers data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    if (centers.length === 0) return;

    const bounds = L.latLngBounds([]);

    centers.forEach((c) => {
      const color = STATUS_COLORS[c.visualStatus]?.hex || "#64748b";
      const isCritical = c.visualStatus === "red";
      const icon = createCustomPin(color, c.unitsAvailable, isCritical);

      const marker = L.marker([c.latitude, c.longitude], { icon });

      // Custom Dark Theme Popup
      const popupContent = `
        <div style="font-family: inherit; color: #f8fafc; padding: 2px; min-width: 230px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 6px; border-radius: 4px; background: ${color}25; color: ${color}; border: 1px solid ${color}50;">
              ${c.statusLabel}
            </span>
            <span style="font-size: 11px; color: #94a3b8;">${c.city}</span>
          </div>
          <div style="font-size: 14px; font-weight: 800; color: #f1f5f9; line-height: 1.25; margin-bottom: 4px;">
            ${c.name}
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">
            ${c.facilityType ? c.facilityType.replace(/_/g, " ") : "Hospital Blood Bank"}
          </div>
          <div style="font-size: 11px; color: #cbd5e1; border-top: 1px solid #334155; padding-top: 6px; margin-bottom: 8px;">
            <strong>${c.unitsAvailable} Units</strong> available &bull; Updated recently
          </div>
          <div style="display: flex; gap: 6px;">
            <a href="${c.directionsUrl}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; font-size: 11px; font-weight: 600; padding: 6px 8px; border-radius: 6px; background: #1e293b; color: #38bdf8; text-decoration: none; border: 1px solid #334155;">
              Directions &rarr;
            </a>
            <a href="/patient/requests/new?hospitalName=${encodeURIComponent(c.name)}&city=${encodeURIComponent(c.city)}" style="flex: 1; text-align: center; font-size: 11px; font-weight: 700; padding: 6px 8px; border-radius: 6px; background: #e11d48; color: #ffffff; text-decoration: none;">
              Request
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: "dark-custom-leaflet-popup",
      });

      marker.on("click", () => {
        setSelectedCenter(c);
      });

      markersLayerRef.current?.addLayer(marker);
      bounds.extend([c.latitude, c.longitude]);
    });

    // Fit map bounds if there are markers
    if (centers.length > 0 && selectedCity !== "All Cities") {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [centers, selectedCity]);

  // Quick navigation to target city
  const panToCity = (cityName: string, coords: [number, number], zoom = 13) => {
    setSelectedCity(cityName);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(coords, zoom, { animate: true });
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-2">
              <Filter className="w-3.5 h-3.5 text-rose-500" /> Focus Hub:
            </span>

            {/* Quick Priority City Buttons */}
            <button
              onClick={() => panToCity("Gwalior", [26.2183, 78.1828], 13)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedCity === "Gwalior"
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-400"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              Gwalior (Priority)
            </button>
            <button
              onClick={() => panToCity("Indore", [22.7196, 75.8577], 12)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedCity === "Indore"
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              Indore
            </button>
            <button
              onClick={() => panToCity("Bhopal", [23.2599, 77.4126], 12)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedCity === "Bhopal"
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              Bhopal
            </button>
            <button
              onClick={() => panToCity("Jabalpur", [23.1815, 79.9864], 12)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedCity === "Jabalpur"
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              Jabalpur
            </button>
            <button
              onClick={() => {
                setSelectedCity("All Cities");
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.setView([23.5, 78.5], 7, { animate: true });
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedCity === "All Cities"
                  ? "bg-slate-700 text-white ring-1 ring-slate-500"
                  : "bg-slate-800/60 text-slate-400 hover:bg-slate-800"
              }`}
            >
              All India / MP
            </button>
          </div>

          {/* Right Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500"
              aria-label="Filter by Blood Group"
            >
              <option value="All">All Blood Groups</option>
              {ALL_BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {BLOOD_GROUP_DISPLAY[bg]}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500"
              aria-label="Filter by Availability"
            >
              <option value="All">All Stock Levels</option>
              <option value="Available">Available Only (Green)</option>
              <option value="Low_Stock">Low Stock (Yellow)</option>
              <option value="Critical">Critical Stock (Red)</option>
              <option value="Unavailable">Not Updated / 0 (Grey)</option>
            </select>

            <button
              onClick={fetchData}
              disabled={loading}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
              title="Refresh Heatmap"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-rose-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30"></span>
            <span>Available (&gt;15 units)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/30"></span>
            <span>Low Stock (6–15)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/30 animate-pulse"></span>
            <span>Critical (1–5)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
            <span>Unavailable / Not Updated</span>
          </div>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
        <div
          ref={mapContainerRef}
          className="w-full h-[540px] sm:h-[620px] z-0"
          style={{ background: "#090d16" }}
        />

        {/* Floating Selected Center Quick-Card */}
        {selectedCenter && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md bg-slate-900/95 border border-slate-700 rounded-xl p-4 shadow-2xl backdrop-blur-md z-10 animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                      selectedCenter.visualStatus === "green"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : selectedCenter.visualStatus === "yellow"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : selectedCenter.visualStatus === "red"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {selectedCenter.statusLabel}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" /> {selectedCenter.city}
                  </span>
                </div>
                <h4 className="font-extrabold text-slate-100 text-base leading-tight">
                  {selectedCenter.name}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{selectedCenter.address}</p>
              </div>
              <button
                onClick={() => setSelectedCenter(null)}
                className="text-slate-400 hover:text-white p-1"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {/* Quick stats chips */}
            <div className="grid grid-cols-4 gap-1.5 my-3 pt-2 border-t border-slate-800">
              {ALL_BLOOD_GROUPS.slice(0, 4).map((bg) => (
                <div key={bg} className="bg-slate-800/80 rounded px-2 py-1 text-center">
                  <div className="text-[10px] text-slate-400">{BLOOD_GROUP_DISPLAY[bg]}</div>
                  <div className="text-xs font-bold text-slate-200">
                    {selectedCenter.groupStocks[bg] !== undefined ? selectedCenter.groupStocks[bg] : "-"}
                  </div>
                </div>
              ))}
              {ALL_BLOOD_GROUPS.slice(4, 8).map((bg) => (
                <div key={bg} className="bg-slate-800/80 rounded px-2 py-1 text-center">
                  <div className="text-[10px] text-slate-400">{BLOOD_GROUP_DISPLAY[bg]}</div>
                  <div className="text-xs font-bold text-slate-200">
                    {selectedCenter.groupStocks[bg] !== undefined ? selectedCenter.groupStocks[bg] : "-"}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <a
                href={selectedCenter.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Navigation className="w-3.5 h-3.5 text-cyan-400" /> Get Directions
              </a>
              <a
                href={`/patient/requests/new?hospitalName=${encodeURIComponent(
                  selectedCenter.name
                )}&city=${encodeURIComponent(selectedCenter.city)}`}
                className="flex-1 text-center bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30"
              >
                Request Blood <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
