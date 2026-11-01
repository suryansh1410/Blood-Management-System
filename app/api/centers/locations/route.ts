import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Priority order for Indian states as requested in requirements
const PRIORITY_STATES = [
  "Madhya Pradesh",
  "Maharashtra",
  "Delhi",
  "Uttar Pradesh",
  "Rajasthan",
  "Karnataka",
  "Tamil Nadu",
  "Gujarat",
  "West Bengal",
  "Telangana",
  "Kerala",
  "Punjab",
  "Haryana",
  "Bihar",
  "Odisha",
  "Assam",
  "Chandigarh",
  "Uttarakhand",
];

// GET /api/centers/locations — Dynamic location hierarchy backed by database
export async function GET() {
  try {
    const centers = await prisma.bloodCenter.findMany({
      where: { isActive: true },
      select: {
        country: true,
        state: true,
        city: true,
      },
    });

    const countries = [...new Set(centers.map((c) => c.country || "India"))].sort();
    
    // Group cities by state
    const citiesByState: Record<string, string[]> = {};
    const stateSet = new Set<string>();
    const citySet = new Set<string>();

    for (const c of centers) {
      const stateName = c.state?.trim() || "Madhya Pradesh";
      const cityName = c.city?.trim();
      
      stateSet.add(stateName);
      if (cityName) {
        citySet.add(cityName);
        if (!citiesByState[stateName]) {
          citiesByState[stateName] = [];
        }
        if (!citiesByState[stateName].includes(cityName)) {
          citiesByState[stateName].push(cityName);
        }
      }
    }

    // Sort cities alphabetically in each state
    for (const st in citiesByState) {
      citiesByState[st].sort((a, b) => a.localeCompare(b));
    }

    // Sort states with priority states first, then alphabetical
    const sortedStates = [...stateSet].sort((a, b) => {
      const idxA = PRIORITY_STATES.indexOf(a);
      const idxB = PRIORITY_STATES.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    const allCities = [...citySet].sort((a, b) => a.localeCompare(b));

    return NextResponse.json({
      success: true,
      data: {
        countries: countries.length > 0 ? countries : ["India"],
        states: sortedStates,
        citiesByState,
        allCities,
      },
    });
  } catch (error: any) {
    console.error("Fetch locations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch location hierarchy" },
      { status: 500 }
    );
  }
}
