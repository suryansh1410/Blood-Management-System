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
  ShieldAlert,
  Users,
  Layers,
  Calendar,
  Clock,
  Sparkles,
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
            <a href="/emergency">
              <Button variant="danger" size="lg" className="gap-2 shadow-lg shadow-rose-950/60 font-semibold px-6 py-3">
                <ShieldAlert className="w-5 h-5 text-white" />
                Emergency Blood Request
              </Button>
            </a>
            <a href="/inventory/live">
              <Button
                variant="outline"
                size="lg"
                className="bg-slate-900/80 hover:bg-slate-800 text-teal-300 border-teal-500/40 hover:border-teal-400 gap-2 font-semibold px-6 py-3"
              >
                <Search className="w-4 h-4 text-teal-400" />
                Find Blood / Check Availability
              </Button>
            </a>
            <a href="/register?role=DONOR">
              <Button
                variant="ghost"
                size="lg"
                className="text-slate-300 hover:text-white hover:bg-slate-800/60 gap-2 font-medium"
              >
                <Heart className="w-4 h-4 text-rose-400" />
                Become a Voluntary Donor
              </Button>
            </a>
          </div>
        </div>

        {/* Hero Background Pattern */}
        <div className="absolute -right-16 -bottom-16 opacity-10 pointer-events-none">
          <Droplet className="w-96 h-96 fill-white" />
        </div>
      </section>

      {/* Integrated Five-Feature Coordination Platform */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">
              <Sparkles className="w-4 h-4" />
              Integrated Coordination System
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Five Real-World Healthcare Features
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Connected emergency matching, privacy-preserving donor coordination, and live audit-safe
              reserves centered on Gwalior & Madhya Pradesh.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Feature 1 */}
          <a
            href="/emergency"
            className="group bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 rounded-2xl p-6 shadow-xl transition-all duration-200 hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                24x7 Priority
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-100 group-hover:text-rose-400 transition-colors">
              Emergency Blood Request
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Instant requisition matching with verified local stocks, automated donor broadcast, and hospital reservation hold.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-rose-400">
              Submit Requisition &rarr;
            </div>
          </a>

          {/* Feature 2 */}
          <a
            href="/donors/finder"
            className="group bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 shadow-xl transition-all duration-200 hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Privacy-Safe
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-100 group-hover:text-cyan-400 transition-colors">
              Smart Nearby Donor Finder
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Locate consenting voluntary donors in proximity without public phone exposure or exact address sharing.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-cyan-400">
              Discover Donors &rarr;
            </div>
          </a>

          {/* Feature 3 */}
          <a
            href="/inventory/live"
            className="group bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 shadow-xl transition-all duration-200 hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Audit Verified
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-100 group-hover:text-emerald-400 transition-colors">
              Live Blood Stock Monitoring
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Hospital reserves across all 8 groups and components with concurrency safety and immutable audit logging.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              Inspect Live Stock &rarr;
            </div>
          </a>

          {/* Feature 4 */}
          <a
            href="/appointments/book"
            className="group bg-slate-900/90 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-6 shadow-xl transition-all duration-200 hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Slot Guarded
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-100 group-hover:text-teal-400 transition-colors">
              Donation Appointment Booking
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Schedule in-person voluntary donations at registered centres with real-time capacity and overbooking prevention.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-teal-400">
              Book Donation Slot &rarr;
            </div>
          </a>

          {/* Feature 5 */}
          <a
            href="/track"
            className="group bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-6 shadow-xl transition-all duration-200 hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                11-Stage Stepper
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-100 group-hover:text-purple-400 transition-colors">
              Blood Request Tracking
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Follow every step from clinical submission and hospital verification to cold-chain quarantine reservation.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-purple-400">
              Track Status &rarr;
            </div>
          </a>
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

      {/* How It Works Overview - 4-Step Healthcare Pipeline */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How The LifePulse Workflow Works
          </h2>
          <p className="text-sm text-slate-400">
            A real-world verified 4-step pipeline ensuring clinical safety, accountability, and accurate reserves.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="space-y-3 p-5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/25 text-teal-400 flex items-center justify-center font-bold text-base">
              1
            </div>
            <h3 className="text-base font-bold text-white">Donation / Verification</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Donors register and complete blood screening. Blood bank staff verify each unit, which safely increments verified inventory atomically.
            </p>
          </Card>

          <Card className="space-y-3 p-5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/25 text-sky-400 flex items-center justify-center font-bold text-base">
              2
            </div>
            <h3 className="text-base font-bold text-white">Patient / Hospital Request</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Patients and hospital staff submit specific clinical requisitions with required units, components, and priority level.
            </p>
          </Card>

          <Card className="space-y-3 p-5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 flex items-center justify-center font-bold text-base">
              3
            </div>
            <h3 className="text-base font-bold text-white">Centre Response</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Regional blood banks and hospitals check live reserves, confirm physical availability, and place matching blood units on hold.
            </p>
          </Card>

          <Card className="space-y-3 p-5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center font-bold text-base">
              4
            </div>
            <h3 className="text-base font-bold text-white">Approval / Fulfilment</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Admins approve distribution and mark fulfillment upon cold-chain handover. Inventory is strictly deducted with an immutable audit record.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
