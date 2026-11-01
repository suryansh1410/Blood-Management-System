import React from "react";
import { Card } from "@/components/ui/Card";
import { Droplet, ShieldCheck, Database, Award, Heart, CheckCircle2 } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          About LifePulse BMS
        </h1>
        <p className="text-base text-slate-500 max-w-xl mx-auto">
          A modern blood bank and inventory management platform designed to guarantee transparent,
          auditable blood distribution.
        </p>
      </div>

      <div className="prose prose-slate max-w-none text-slate-600 text-sm leading-relaxed space-y-4">
        <p>
          The <strong>Blood Management System (BMS)</strong> was developed to address critical
          logistical hurdles faced by regional blood banks, healthcare providers, and emergency
          response units. Traditional blood bank systems often face data synchronization issues,
          leading to inadvertent double-deductions, inventory phantom counts, or communication
          bottlenecks during life-threatening crises.
        </p>
        <p>
          LifePulse implements strict state-machine validation using atomic database transactions.
          When a donor logs a donation, inventory is only adjusted once certified staff verify the
          event. Similarly, hospital requests reserve intent upon approval, but stock is strictly
          deducted only when physical fulfillment takes place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="space-y-2 text-center p-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900">Zero Inconsistent States</h3>
          <p className="text-xs text-slate-500">
            Prisma ACID transactions guarantee stock cannot go negative or double-decrement.
          </p>
        </Card>

        <Card className="space-y-2 text-center p-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900">Donor Engagement</h3>
          <p className="text-xs text-slate-500">
            Donors maintain real-time availability and track verified contribution records.
          </p>
        </Card>

        <Card className="space-y-2 text-center p-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-2">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900">Live Hospital Audits</h3>
          <p className="text-xs text-slate-500">
            Hospitals track requisition lifecycles from emergency intake to courier dispatch.
          </p>
        </Card>
      </div>
    </div>
  );
}
