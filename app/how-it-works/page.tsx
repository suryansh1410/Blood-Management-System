import React from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Heart,
  FileCheck,
  ShieldCheck,
  Building2,
  CheckCircle2,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          How LifePulse Works
        </h1>
        <p className="text-base text-slate-500 max-w-xl mx-auto">
          A clear, accountable pipeline from life-saving donors to hospitals and patients in urgent
          need.
        </p>
      </div>

      {/* Donor Journey */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-black">
            <Heart className="w-5 h-5 fill-rose-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">The Blood Donor Journey</h2>
            <p className="text-xs text-slate-500">Every donation record is authenticated by hospital staff.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-rose-600">Step 1</div>
            <h3 className="text-base font-bold text-slate-900">Register as a Donor</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Create your donor profile with your blood group, contact phone, and city. Set your
              availability to Available whenever you are ready to donate.
            </p>
          </Card>

          <Card className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-rose-600">Step 2</div>
            <h3 className="text-base font-bold text-slate-900">Record a Donation</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              After giving blood at a blood drive or certified center, submit a donation record
              indicating the date, blood group, and units donated.
            </p>
          </Card>

          <Card className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-rose-600">Step 3</div>
            <h3 className="text-base font-bold text-slate-900">Staff Verification</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Blood bank staff authenticate your donation. Verification triggers an automatic,
              atomic increase in the inventory and updates your verified donation history.
            </p>
          </Card>
        </div>
      </section>

      {/* Patient & Hospital Journey */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-black">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">The Patient & Hospital Journey</h2>
            <p className="text-xs text-slate-500">Fast, validated requisition for surgical and emergency units.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-teal-600">Step 1</div>
            <h3 className="text-base font-bold text-slate-900">Check Stock & Submit Request</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Search real-time blood stock. Submit a request detailing the patient name, hospital,
              urgency (Normal/Urgent/Emergency), and required date.
            </p>
          </Card>

          <Card className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-teal-600">Step 2</div>
            <h3 className="text-base font-bold text-slate-900">Admin Review & Approval</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Blood bank staff evaluate the request and mark it Approved. No units are deducted yet
              — approval indicates intent and preparation.
            </p>
          </Card>

          <Card className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-teal-600">Step 3</div>
            <h3 className="text-base font-bold text-slate-900">Physical Handover & Fulfillment</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              When the blood units are physically transferred, staff mark the request Fulfilled.
              Inventory is safely decremented and you receive a completion notification.
            </p>
          </Card>
        </div>
      </section>

      {/* Action CTA */}
      <div className="bg-gradient-to-r from-teal-700 to-slate-900 rounded-3xl p-8 text-white text-center space-y-4">
        <h3 className="text-2xl font-bold">Ready to Make an Impact?</h3>
        <p className="text-slate-300 text-sm max-w-md mx-auto">
          Join hundreds of registered life-savers or connect your hospital for immediate supply
          transfers.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a href="/register?role=DONOR">
            <Button variant="danger" size="md" className="gap-2">
              <Heart className="w-4 h-4 fill-white" />
              Register as Donor
            </Button>
          </a>
          <a href="/register?role=PATIENT">
            <Button variant="outline" size="md" className="bg-white/10 text-white border-white/20">
              Hospital Requisition
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
