import React from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Heart, CheckCircle2, ShieldAlert, Users, Award, ArrowRight } from "lucide-react";

export default function BecomeADonorPage() {
  const benefits = [
    "One single donation of whole blood can save up to three lives.",
    "Regular donations help replenish critical regional emergency blood stocks.",
    "Get recognized with verified donation records and community milestone tracking.",
    "Help patients undergoing trauma care, cancer treatments, and major surgeries.",
  ];

  const guidelines = [
    "Must be at least 18 years old and in good general health.",
    "Weigh at least 50 kg (110 lbs).",
    "Stay well hydrated and eat a healthy iron-rich meal prior to donating.",
    "Bring valid photo identification to your blood donation appointment.",
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold border border-rose-100">
          <Heart className="w-3.5 h-3.5 fill-rose-600" />
          Give Blood, Give Life
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
          Become a Registered Blood Donor
        </h1>
        <p className="text-base text-slate-500 max-w-xl mx-auto">
          Sign up with LifePulse to report your donations, toggle your availability, and assist
          medical centers in critical emergencies.
        </p>
        <div className="pt-2">
          <a href="/register?role=DONOR">
            <Button variant="danger" size="lg" className="gap-2 shadow-md shadow-rose-200">
              <Heart className="w-5 h-5 fill-white" />
              Sign Up As A Donor Now
            </Button>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-rose-600" />
            Why Your Donation Matters
          </h2>
          <ul className="space-y-3">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 leading-snug">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-teal-600" />
            General Donation Readiness
          </h2>
          <ul className="space-y-3">
            {guidelines.map((g, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 leading-snug">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0 mt-2" />
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="bg-slate-100/80 rounded-2xl p-6 text-center text-xs text-slate-500 leading-relaxed max-w-2xl mx-auto">
        <strong>Notice on Medical Eligibility:</strong> LifePulse is a donation record and inventory
        tracking management platform. Medical screening, hemoglobin tests, and donation eligibility
        assessments are conducted in person by qualified healthcare professionals prior to physical
        blood collection.
      </div>
    </div>
  );
}
