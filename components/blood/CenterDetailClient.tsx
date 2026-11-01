"use client";

import { StatusBadge, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Building2, MapPin, Phone, ArrowRight, ShieldCheck } from "lucide-react";

interface StockRow {
  bloodGroup: string;
  displayGroup: string;
  units: number;
  status: string;
  statusLabel: string;
}

interface CenterInfo {
  id: number;
  name: string;
  type: string;
  city: string;
  address: string;
  phone: string;
  isMain: boolean;
}

export default function CenterDetailClient({
  center,
  stocks,
  isAuthenticated,
}: {
  center: CenterInfo;
  stocks: StockRow[];
  isAuthenticated: boolean;
}) {
  function buildRequestUrl(bloodGroup: string) {
    const additionalInfo = `Requested via Blood Finder — preferred location: ${center.name}, ${center.city}`;
    const dest = `/patient/requests/new?group=${bloodGroup}&additionalInfo=${encodeURIComponent(additionalInfo)}`;
    if (!isAuthenticated) {
      return `/login?callbackUrl=${encodeURIComponent(dest)}`;
    }
    return dest;
  }

  return (
    <div className="space-y-8">
      {/* Back */}
      <a href="/blood-availability" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
        ← Back to Blood Finder
      </a>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start gap-4 justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{center.name}</h1>
            <Badge variant={center.type === "HOSPITAL" ? "info" : "neutral"}>
              <Building2 className="w-3.5 h-3.5" />
              {center.type === "BLOOD_BANK" ? "Blood Bank" : "Hospital"}
            </Badge>
            {center.isMain && (
              <Badge variant="success">
                <ShieldCheck className="w-3.5 h-3.5" />
                Main Center
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin className="w-4 h-4 text-slate-400" />
            {center.address}, {center.city}
          </div>
          <a
            href={`tel:${center.phone}`}
            className="inline-flex items-center gap-1.5 text-teal-700 font-semibold hover:text-teal-900 transition-colors text-sm"
            id="centerPhone"
          >
            <Phone className="w-4 h-4" />
            {center.phone}
          </a>
        </div>
        <a href="/blood-availability">
          <Button variant="outline" size="sm" className="gap-1.5">
            Search other locations
          </Button>
        </a>
      </div>

      {/* Stock Table */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">Blood Availability</h2>
          <p className="text-xs text-slate-500 mt-0.5">Current inventory at this location.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/75 text-[11px] font-bold text-slate-600 uppercase tracking-wider text-left">
                <th className="py-3 px-5">Blood Group</th>
                <th className="py-3 px-5">Units Available</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stocks.map((s) => (
                <tr key={s.bloodGroup} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 font-black text-sm flex items-center justify-center border border-rose-100">
                        {s.displayGroup}
                      </div>
                      <span className="font-semibold text-slate-800">{s.displayGroup}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="text-xl font-black text-slate-900">{s.units}</span>
                    <span className="text-xs text-slate-400 ml-1">units</span>
                  </td>
                  <td className="py-3.5 px-5">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <a href={buildRequestUrl(s.bloodGroup)} id={`requestBlood-${s.bloodGroup}`}>
                      <Button
                        variant={s.units > 0 ? "primary" : "outline"}
                        size="sm"
                        className="gap-1.5"
                      >
                        Request Blood
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
