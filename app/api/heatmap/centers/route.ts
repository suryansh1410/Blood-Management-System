import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ALL_BLOOD_GROUPS,
  BLOOD_GROUP_DISPLAY,
  getStockStatus,
  getStockStatusLabel,
  STOCK_THRESHOLDS,
} from "@/lib/constants";
import { BloodGroup } from "@prisma/client";

// Normalize user-friendly blood group input
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

// GET /api/heatmap/centers — Interactive geographic overview of blood network (Feature 6)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const stateParam = searchParams.get("state")?.trim();
    const cityParam = searchParams.get("city")?.trim();
    const bloodGroupParam = searchParams.get("bloodGroup");
    const componentParam = searchParams.get("component")?.trim();
    const availabilityParam = searchParams.get("status")?.trim();

    const targetBloodGroup = normalizeBloodGroup(bloodGroupParam);

    const whereClause: any = {
      isActive: true,
      latitude: { not: null },
      longitude: { not: null },
    };

    if (stateParam && !["ALL", "ALL STATES"].includes(stateParam.toUpperCase())) {
      whereClause.state = { equals: stateParam, mode: "insensitive" };
    }

    if (cityParam && !["ALL", "ALL CITIES"].includes(cityParam.toUpperCase())) {
      whereClause.city = { equals: cityParam, mode: "insensitive" };
    }

    if (componentParam && !["ALL", "ALL COMPONENTS"].includes(componentParam.toUpperCase())) {
      whereClause.components = { contains: componentParam, mode: "insensitive" };
    }

    const centers = await prisma.bloodCenter.findMany({
      where: whereClause,
      include: {
        stocks: true,
      },
      orderBy: { popularRank: "asc" },
    });

    let mapped = centers.map((c) => {
      const hasLiveStock = c.stocks && c.stocks.length > 0;

      let units = 0;
      let visualStatus: "green" | "yellow" | "red" | "grey" = "grey";
      let statusLabel = "Availability Not Updated";

      if (targetBloodGroup) {
        const found = c.stocks.find((s) => s.bloodGroup === targetBloodGroup);
        if (found !== undefined) {
          units = found.units;
          if (found.units > STOCK_THRESHOLDS.LOW_MAX) {
            visualStatus = "green"; // Available
            statusLabel = "Available";
          } else if (found.units > STOCK_THRESHOLDS.CRITICAL_MAX) {
            visualStatus = "yellow"; // Low Stock
            statusLabel = "Low Stock";
          } else if (found.units > STOCK_THRESHOLDS.OUT_OF_STOCK) {
            visualStatus = "red"; // Critical
            statusLabel = "Critical Stock";
          } else {
            visualStatus = "grey"; // Out of stock
            statusLabel = "Out of Stock";
          }
        } else if (hasLiveStock) {
          visualStatus = "grey";
          statusLabel = "Out of Stock";
        }
      } else if (hasLiveStock) {
        const total = c.stocks.reduce((sum, s) => sum + s.units, 0);
        units = total;
        if (total > 30) {
          visualStatus = "green";
          statusLabel = "Available";
        } else if (total > 10) {
          visualStatus = "yellow";
          statusLabel = "Low Stock";
        } else if (total > 0) {
          visualStatus = "red";
          statusLabel = "Critical Stock";
        } else {
          visualStatus = "grey";
          statusLabel = "Out of Stock";
        }
      }

      // Format stocks map
      const groupStocks: Record<string, number> = {};
      for (const s of c.stocks) {
        groupStocks[s.bloodGroup] = s.units;
      }

      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}`;

      return {
        id: c.id,
        name: c.name,
        type: c.type,
        city: c.city,
        state: c.state,
        address: c.address,
        phone: c.phone,
        facilityType: c.facilityType,
        verificationStatus: c.verificationStatus,
        components: c.components,
        latitude: c.latitude!,
        longitude: c.longitude!,
        hasLiveStock,
        unitsAvailable: units,
        visualStatus, // green | yellow | red | grey
        statusLabel,
        lastStockUpdate: c.lastStockUpdate,
        groupStocks,
        directionsUrl,
      };
    });

    // Filter by visualStatus if requested
    if (availabilityParam && availabilityParam.toUpperCase() !== "ALL") {
      const pUpper = availabilityParam.toUpperCase();
      if (pUpper === "AVAILABLE" || pUpper === "GREEN") {
        mapped = mapped.filter((m) => m.visualStatus === "green");
      } else if (pUpper === "LOW_STOCK" || pUpper === "YELLOW") {
        mapped = mapped.filter((m) => m.visualStatus === "yellow");
      } else if (pUpper === "CRITICAL" || pUpper === "RED") {
        mapped = mapped.filter((m) => m.visualStatus === "red");
      } else if (pUpper === "UNAVAILABLE" || pUpper === "NOT_UPDATED" || pUpper === "GREY") {
        mapped = mapped.filter((m) => m.visualStatus === "grey");
      }
    }

    return NextResponse.json({
      success: true,
      meta: {
        total: mapped.length,
        state: stateParam || "All States",
        city: cityParam || "All Cities",
        bloodGroup: targetBloodGroup ? BLOOD_GROUP_DISPLAY[targetBloodGroup] : "All Groups",
        component: componentParam || "All Components",
        centerCoordinates: {
          Gwalior: { lat: 26.2183, lng: 78.1828 },
          MadhyaPradesh: { lat: 23.5, lng: 77.5 },
          India: { lat: 22.9734, lng: 78.6569 },
        },
      },
      data: mapped,
    });
  } catch (error: any) {
    console.error("Heatmap centers error:", error);
    return NextResponse.json(
      { error: "Failed to load blood network heatmap data" },
      { status: 500 }
    );
  }
}
