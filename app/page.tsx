import React from "react";
import { prisma } from "@/lib/prisma";
import { BLOOD_GROUP_DISPLAY, getStockStatus, getStockStatusLabel } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  BloodReservesSection,
  type BloodGroupData,
  type SubgroupData,
  type CenterStock,
} from "@/components/blood/BloodReservesSection";
import {
  Droplet,
  Heart,
  ArrowRight,
  Activity,
  Search,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [stocksWithCenter, totalDonors, totalRequests, totalDonations] = await Promise.all([
    prisma.bloodStock.findMany({
      orderBy: { bloodGroup: "asc" },
      include: {
        center: {
          select: { id: true, name: true, type: true, city: true, isActive: true },
        },
      },
      where: { center: { isActive: true } },
    }),
    prisma.user.count({ where: { role: "DONOR" } }),
    prisma.bloodRequest.count(),
    prisma.donation.count({ where: { status: "VERIFIED" } }),
  ]);

  const totalUnits = stocksWithCenter.reduce((sum, s) => sum + s.units, 0);

  // ── Build grouped data for BloodReservesSection ──────────────────────────
  type GroupKey = "A" | "B" | "AB" | "O";
  const GROUP_MAP: Record<string, { key: GroupKey; pos: string; neg: string }> = {
    A:  { key: "A",  pos: "A_POS",  neg: "A_NEG"  },
    B:  { key: "B",  pos: "B_POS",  neg: "B_NEG"  },
    AB: { key: "AB", pos: "AB_POS", neg: "AB_NEG" },
    O:  { key: "O",  pos: "O_POS",  neg: "O_NEG"  },
  };

  function buildSubgroup(bloodGroupKey: string): SubgroupData {
    const records = stocksWithCenter
      .filter((s) => s.bloodGroup === bloodGroupKey)
      .map((s): CenterStock => ({
        id: s.id,
        bloodGroup: s.bloodGroup,
        units: s.units,
        status: getStockStatus(s.units),
        statusLabel: getStockStatusLabel(getStockStatus(s.units)),
        center: {
          id: s.center.id,
          name: s.center.name,
          type: s.center.type,
          city: s.center.city,
        },
      }));
    const totalUnitsSubgroup = records.reduce((sum, r) => sum + r.units, 0);
    const status = getStockStatus(totalUnitsSubgroup);
    return {
      label: BLOOD_GROUP_DISPLAY[bloodGroupKey as keyof typeof BLOOD_GROUP_DISPLAY],
      bloodGroup: bloodGroupKey,
      totalUnits: totalUnitsSubgroup,
      status,
      statusLabel: getStockStatusLabel(status),
      records,
    };
  }

  const bloodGroups: BloodGroupData[] = Object.values(GROUP_MAP).map((g) => {
    const posData = buildSubgroup(g.pos);
    const negData = buildSubgroup(g.neg);
    const groupTotal = posData.totalUnits + negData.totalUnits;
    const overallStatus = getStockStatus(groupTotal);
    return {
      key: g.key,
      label: `${g.key} Group`,
      totalUnits: groupTotal,
      overallStatus,
      subgroups: [posData, negData],
    };
  });

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white p-8 sm:p-12 lg:p-16 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30">
            <Droplet className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
            Verified Hospital & Community Blood Network
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none">
            Bridging donors with those in{" "}
            <span className="text-rose-400 underline decoration-rose-500/50 underline-offset-4">
              critical need.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
            LifePulse provides a transparent, provably consistent blood management platform. Real-time
            inventory tracking, direct verified donations, and rapid hospital request fulfillment.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a href="/register?role=DONOR">
              <Button variant="danger" size="lg" className="gap-2 shadow-lg shadow-rose-900/40">
                <Heart className="w-5 h-5 fill-white" />
                Become a Blood Donor
              </Button>
            </a>
            <a href="/register?role=PATIENT">
              <Button
                variant="outline"
                size="lg"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 gap-2"
              >
                Request Blood Supply
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
            <a href="/blood-availability">
              <Button
                variant="ghost"
                size="lg"
                className="text-slate-300 hover:text-white hover:bg-white/10 gap-2"
              >
                <Search className="w-4 h-4" />
                Check Availability
              </Button>
            </a>
          </div>
        </div>

        {/* Hero Background Pattern */}
        <div className="absolute -right-16 -bottom-16 opacity-10 pointer-events-none">
          <Droplet className="w-96 h-96 fill-white" />
        </div>
      </section>

      {/* Live Blood Inventory Snapshot */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">
              <Activity className="w-4 h-4" />
              Real-Time Stock Snapshot
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Current Blood Bank Reserves
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Live counts across all eight blood groups verified by blood bank administrators. Click any group to view details.
            </p>
          </div>
          <a href="/blood-availability">
            <Button variant="outline" size="sm" className="gap-1.5 self-start">
              View Detailed Table
              <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
        </div>

        <BloodReservesSection groups={bloodGroups} />
      </section>

      {/* Key Metrics Strip */}
      <section className="bg-slate-900/90 rounded-3xl border border-slate-800 p-8 shadow-md">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-teal-400 tabular-nums">{totalUnits}</p>
            <p className="text-xs sm:text-sm font-semibold text-slate-200">Total Units in Stock</p>
            <p className="text-xs text-slate-400">Across 8 Blood Groups</p>
          </div>
          <div className="space-y-1 pt-4 md:pt-0">
            <p className="text-3xl sm:text-4xl font-black text-rose-400 tabular-nums">{totalDonors}</p>
            <p className="text-xs sm:text-sm font-semibold text-slate-200">Registered Donors</p>
            <p className="text-xs text-slate-400">Ready to save lives</p>
          </div>
          <div className="space-y-1 pt-4 md:pt-0">
            <p className="text-3xl sm:text-4xl font-black text-slate-100 tabular-nums">{totalDonations}</p>
            <p className="text-xs sm:text-sm font-semibold text-slate-200">Verified Donations</p>
            <p className="text-xs text-slate-400">Staff verified records</p>
          </div>
          <div className="space-y-1 pt-4 md:pt-0">
            <p className="text-3xl sm:text-4xl font-black text-sky-400 tabular-nums">{totalRequests}</p>
            <p className="text-xs sm:text-sm font-semibold text-slate-200">Hospital Requests</p>
            <p className="text-xs text-slate-400">Tracked end-to-end</p>
          </div>
        </div>
      </section>

      {/* How It Works Overview */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How The LifePulse Workflow Works
          </h2>
          <p className="text-sm text-slate-400">
            A real-world verified pipeline ensuring safety, accountability, and accurate inventory.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/25 text-teal-400 flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h3 className="text-lg font-bold text-white">Donation & Verification</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Donors register and record donation details. Blood bank staff review and verify each
              donation, which automatically increments inventory atomically.
            </p>
          </Card>

          <Card className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/25 text-blue-400 flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h3 className="text-lg font-bold text-white">Patient & Hospital Request</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Hospitals and patients submit specific blood requests with required dates and urgency
              levels. Requesters receive instant status updates.
            </p>
          </Card>

          <Card className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h3 className="text-lg font-bold text-white">Approval & Fulfillment</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Admins approve requests, and upon physical handover, mark them fulfilled. Stock is
              strictly deducted without risk of negative inventory or double-deduction.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
