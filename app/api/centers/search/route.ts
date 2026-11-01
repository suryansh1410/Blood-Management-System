import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ALL_BLOOD_GROUPS, BLOOD_GROUP_DISPLAY, getStockStatus, getStockStatusLabel } from "@/lib/constants";
import { BloodGroup } from "@prisma/client";

// Status priority for emergency sorting: available first (not 0)
function statusPriority(units: number): number {
  if (units <= 0) return 3;   // UNAVAILABLE — last in emergency sort
  return 0;                   // has any stock — first in emergency sort
}

// GET /api/centers/search — Public
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bloodGroupParam = searchParams.get("bloodGroup");
    const cityParam = searchParams.get("city")?.trim() || "";
    const emergencyParam = searchParams.get("emergency");
    const isEmergency = emergencyParam === "true" || emergencyParam === "1";

    // bloodGroup is required
    if (!bloodGroupParam || !ALL_BLOOD_GROUPS.includes(bloodGroupParam as BloodGroup)) {
      return NextResponse.json(
        { error: `bloodGroup is required and must be one of: ${ALL_BLOOD_GROUPS.join(", ")}` },
        { status: 400 }
      );
    }
    const bloodGroup = bloodGroupParam as BloodGroup;

    // Get optional patient city from session (for city-priority sorting)
    let patientCity: string | null = null;
    try {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        const sessionUser = session.user as any;
        if (sessionUser.role === "PATIENT") {
          const userRecord = await prisma.user.findUnique({
            where: { id: sessionUser.id },
            select: { city: true },
          });
          patientCity = userRecord?.city || null;
        }
      }
    } catch {
      // Session is optional for this public endpoint
    }

    // Query: only active centers and their stock for the requested blood group
    // Privacy: only query BloodCenter and BloodStock — no user data included
    const centersWithStock = await prisma.bloodCenter.findMany({
      where: {
        isActive: true,
        ...(cityParam ? { city: { equals: cityParam, mode: "insensitive" } } : {}),
      },
      include: {
        stocks: {
          where: { bloodGroup },
        },
      },
    });

    // Build result array
    const results = centersWithStock.map((c) => {
      const stock = c.stocks[0]; // at most one row due to @@unique([centerId, bloodGroup])
      const units = stock?.units ?? 0;
      const status = getStockStatus(units);
      return {
        id: c.id,
        name: c.name,
        type: c.type,
        city: c.city,
        address: c.address,
        phone: c.phone,
        unitsAvailable: units,
        status,
        statusLabel: getStockStatusLabel(status),
      };
    });

    // ─── Sorting (Section 8) ──────────────────────────────────────────────────
    function sortByUnitsAndName(a: typeof results[0], b: typeof results[0]) {
      if (b.unitsAvailable !== a.unitsAvailable) return b.unitsAvailable - a.unitsAvailable;
      return a.name.localeCompare(b.name);
    }

    let sorted: typeof results;

    if (cityParam) {
      // City filter given: sort by units desc, name asc
      sorted = results.sort(sortByUnitsAndName);
    } else if (!cityParam && patientCity) {
      // Authenticated patient, no city filter: patient's city first
      const inCity = results.filter((r) => r.city.toLowerCase() === patientCity!.toLowerCase());
      const others = results.filter((r) => r.city.toLowerCase() !== patientCity!.toLowerCase());
      inCity.sort(sortByUnitsAndName);
      others.sort((a, b) => {
        if (b.unitsAvailable !== a.unitsAvailable) return b.unitsAvailable - a.unitsAvailable;
        const cityComp = a.city.localeCompare(b.city);
        if (cityComp !== 0) return cityComp;
        return a.name.localeCompare(b.name);
      });
      sorted = [...inCity, ...others];
    } else {
      // No city filter, not patient: sort by units desc, city asc, name asc
      sorted = results.sort((a, b) => {
        if (b.unitsAvailable !== a.unitsAvailable) return b.unitsAvailable - a.unitsAvailable;
        const cityComp = a.city.localeCompare(b.city);
        if (cityComp !== 0) return cityComp;
        return a.name.localeCompare(b.name);
      });
    }

    // Emergency override: bucket by status priority first, then apply above ordering within buckets
    if (isEmergency) {
      const withStock = sorted.filter((r) => r.unitsAvailable > 0);
      const noStock = sorted.filter((r) => r.unitsAvailable <= 0);
      sorted = [...withStock, ...noStock];
    }

    return NextResponse.json({
      data: sorted,
      bloodGroup,
      displayGroup: BLOOD_GROUP_DISPLAY[bloodGroup],
      city: cityParam || null,
      emergency: isEmergency,
    });
  } catch (error: any) {
    console.error("Center search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
