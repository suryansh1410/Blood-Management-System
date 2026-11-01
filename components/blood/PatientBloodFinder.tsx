"use client";

import BloodFinder from "@/components/blood/BloodFinder";

interface PatientBloodFinderProps {
  patientCity: string | null;
}

export default function PatientBloodFinder({ patientCity }: PatientBloodFinderProps) {
  return <BloodFinder isAuthenticated={true} patientCity={patientCity} />;
}
