import { NextResponse } from "next/server";
import { searchNearbyDonors } from "@/lib/business-logic";
import { BloodGroup } from "@prisma/client";

// Normalize user blood group input
function normalizeBloodGroup(input?: string | null): BloodGroup | null {
  if (!input || input.toUpperCase() === "ALL") return null;
  const upper = input.toUpperCase().trim();
  const map: Record<string, BloodGroup> = {
    "A+": BloodGroup.A_POS,
    "A-": BloodGroup.A_NEG,
    "B+": BloodGroup.B_POS,
    "B-": BloodGroup.B_NEG,
    "AB+": BloodGroup.AB_POS,
    "AB-": BloodGroup.AB_NEG,
    "O+": BloodGroup.O_POS,
    "O-": BloodGroup.O_NEG,
    A_POS: BloodGroup.A_POS,
    A_NEG: BloodGroup.A_NEG,
    B_POS: BloodGroup.B_POS,
    B_NEG: BloodGroup.B_NEG,
    AB_POS: BloodGroup.AB_POS,
    AB_NEG: BloodGroup.AB_NEG,
    O_POS: BloodGroup.O_POS,
    O_NEG: BloodGroup.O_NEG,
  };
  return map[upper] || null;
}

// GET /api/donors/search — Privacy-preserving nearby donor discovery (Feature 2)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bloodGroupParam = searchParams.get("bloodGroup");
    const stateParam = searchParams.get("state")?.trim();
    const cityParam = searchParams.get("city")?.trim();
    const radiusParam = searchParams.get("radiusKm");
    const onlyConsenting = searchParams.get("onlyConsenting") !== "false";
    const onlyAvailable = searchParams.get("onlyAvailable") === "true";
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");

    const bloodGroup = normalizeBloodGroup(bloodGroupParam);
    const radiusKm = radiusParam ? parseFloat(radiusParam) : undefined;
    const userLat = latParam ? parseFloat(latParam) : undefined;
    const userLng = lngParam ? parseFloat(lngParam) : undefined;

    const donors = await searchNearbyDonors({
      bloodGroup,
      state: stateParam && stateParam.toUpperCase() !== "ALL" ? stateParam : undefined,
      city: cityParam && cityParam.toUpperCase() !== "ALL" ? cityParam : undefined,
      radiusKm,
      onlyConsenting,
      onlyAvailable,
      userLat,
      userLng,
    });

    return NextResponse.json({
      success: true,
      meta: {
        total: donors.length,
        city: cityParam || "All Cities",
        state: stateParam || "Madhya Pradesh",
        bloodGroup: bloodGroupParam || "All",
        radiusKm: radiusKm || null,
        privacyProtected: true,
      },
      data: donors,
    });
  } catch (error: any) {
    console.error("Donor search error:", error);
    return NextResponse.json(
      { error: "Failed to search donors" },
      { status: 500 }
    );
  }
}
