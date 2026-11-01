import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ALL_BLOOD_GROUPS, BLOOD_GROUP_DISPLAY, getStockStatus, getStockStatusLabel, STOCK_THRESHOLDS } from "@/lib/constants";
import { BloodGroup } from "@prisma/client";

// Normalize user-friendly blood group input ("B+", "B_POS", etc.)
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
    "A_POS": BloodGroup.A_POS,
    "A_NEG": BloodGroup.A_NEG,
    "B_POS": BloodGroup.B_POS,
    "B_NEG": BloodGroup.B_NEG,
    "AB_POS": BloodGroup.AB_POS,
    "AB_NEG": BloodGroup.AB_NEG,
    "O_POS": BloodGroup.O_POS,
    "O_NEG": BloodGroup.O_NEG,
  };
  return map[upper] || null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const countryParam = searchParams.get("country")?.trim() || "";
    const stateParam = searchParams.get("state")?.trim() || "";
    const cityParam = searchParams.get("city")?.trim() || "";
    const bloodGroupParam = searchParams.get("bloodGroup")?.trim() || "";
    const componentParam = searchParams.get("component")?.trim() || "";
    const availabilityParam = searchParams.get("availability")?.trim() || "";
    const queryParam = searchParams.get("q")?.trim() || "";
    const sortBy = searchParams.get("sortBy")?.trim() || "popular";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));

    const targetBloodGroup = normalizeBloodGroup(bloodGroupParam);

    // Build Prisma where filter
    const whereClause: any = {
      isActive: true,
    };

    // Country filter (if specified and not "All" / "All India")
    if (countryParam && !["ALL", "ALL INDIA"].includes(countryParam.toUpperCase())) {
      whereClause.country = { equals: countryParam, mode: "insensitive" };
    }

    // State filter (if specified and not "All" / "All States")
    if (stateParam && !["ALL", "ALL STATES"].includes(stateParam.toUpperCase())) {
      whereClause.state = { equals: stateParam, mode: "insensitive" };
    }

    // City filter (if specified and not "All" / "All Cities")
    if (cityParam && !["ALL", "ALL CITIES"].includes(cityParam.toUpperCase())) {
      whereClause.city = { equals: cityParam, mode: "insensitive" };
    }

    // Text search filter (hospital name, address, city)
    if (queryParam) {
      whereClause.OR = [
        { name: { contains: queryParam, mode: "insensitive" } },
        { address: { contains: queryParam, mode: "insensitive" } },
        { city: { contains: queryParam, mode: "insensitive" } },
        { state: { contains: queryParam, mode: "insensitive" } },
      ];
    }

    // Component filter (if specified and not "All")
    if (componentParam && !["ALL", "ALL COMPONENTS"].includes(componentParam.toUpperCase())) {
      whereClause.components = {
        contains: componentParam,
        mode: "insensitive",
      };
    }

    // Fetch matching centers with their stock records
    const centers = await prisma.bloodCenter.findMany({
      where: whereClause,
      include: {
        stocks: true,
      },
      orderBy: {
        popularRank: "asc",
      },
    });

    // Transform centers into rich response cards
    let mapped = centers.map((c) => {
      const hasLiveStock = c.stocks && c.stocks.length > 0;

      // Calculate stock for selected blood group or overall
      let unitsAvailable: number | null = null;
      let status = "AVAILABILITY_NOT_UPDATED";
      let statusLabel = "Availability Not Updated";

      if (targetBloodGroup) {
        const matchingStock = c.stocks.find((s) => s.bloodGroup === targetBloodGroup);
        if (matchingStock !== undefined) {
          unitsAvailable = matchingStock.units;
          status = getStockStatus(matchingStock.units);
          statusLabel = getStockStatusLabel(status as any);
        } else if (hasLiveStock) {
          // Center has inventory for other blood groups, but 0 for this one
          unitsAvailable = 0;
          status = "OUT_OF_STOCK";
          statusLabel = "Out of Stock";
        }
      } else if (hasLiveStock) {
        // Overall units across all groups
        const totalUnits = c.stocks.reduce((acc, s) => acc + s.units, 0);
        unitsAvailable = totalUnits;
        if (totalUnits > 40) {
          status = "AVAILABLE";
          statusLabel = "Available";
        } else if (totalUnits > 15) {
          status = "LOW_STOCK";
          statusLabel = "Low Stock";
        } else if (totalUnits > 0) {
          status = "CRITICAL";
          statusLabel = "Critical";
        } else {
          status = "OUT_OF_STOCK";
          statusLabel = "Out of Stock";
        }
      }

      // Format all individual blood group stocks for quick display
      const groupStocks: Record<string, { units: number; status: string; statusLabel: string } | null> = {};
      for (const bg of ALL_BLOOD_GROUPS) {
        const found = c.stocks.find((s) => s.bloodGroup === bg);
        if (found) {
          const sStatus = getStockStatus(found.units);
          groupStocks[bg] = {
            units: found.units,
            status: sStatus,
            statusLabel: getStockStatusLabel(sStatus),
          };
        } else {
          groupStocks[bg] = null;
        }
      }

      return {
        id: c.id,
        name: c.name,
        type: c.type,
        city: c.city,
        state: c.state || "Madhya Pradesh",
        country: c.country || "India",
        address: c.address,
        phone: c.phone,
        facilityType: c.facilityType || "HOSPITAL_WITH_BLOOD_BANK",
        verificationStatus: c.verificationStatus || "VERIFIED",
        components: c.components || "Whole Blood, PRBC, Platelets, FFP",
        dataSource: c.dataSource || "National Blood Registry",
        popularRank: c.popularRank,
        hasLiveStock,
        unitsAvailable,
        status,
        statusLabel,
        groupStocks,
        lastStockUpdate: c.lastStockUpdate || c.updatedAt,
      };
    });

    // Availability Filter
    if (availabilityParam && availabilityParam.toUpperCase() !== "ALL") {
      const availUpper = availabilityParam.toUpperCase();
      if (availUpper === "NOT_UPDATED" || availUpper === "AVAILABILITY_NOT_UPDATED") {
        mapped = mapped.filter((c) => !c.hasLiveStock);
      } else {
        mapped = mapped.filter((c) => c.status === availUpper);
      }
    }

    // Sorting options:
    // - "popular": by popularRank asc, then name asc (default)
    // - "stock": by unitsAvailable desc (only centers with stock first), then popularRank asc
    // - "name": by name A-Z
    // - "city": by city A-Z, then name A-Z
    if (sortBy === "stock") {
      mapped.sort((a, b) => {
        const stockA = a.unitsAvailable ?? -1;
        const stockB = b.unitsAvailable ?? -1;
        if (stockB !== stockA) return stockB - stockA;
        return a.popularRank - b.popularRank;
      });
    } else if (sortBy === "name") {
      mapped.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "city") {
      mapped.sort((a, b) => {
        const cityComp = a.city.localeCompare(b.city);
        if (cityComp !== 0) return cityComp;
        return a.name.localeCompare(b.name);
      });
    } else {
      // Default: "popular"
      mapped.sort((a, b) => {
        if (a.popularRank !== b.popularRank) return a.popularRank - b.popularRank;
        return a.name.localeCompare(b.name);
      });
    }

    // Nearby cities suggestions if searched city yielded 0 results
    let suggestedCities: string[] = [];
    if (cityParam && mapped.length === 0) {
      // Find other cities in the same state or overall top cities
      const otherCenters = await prisma.bloodCenter.findMany({
        where: {
          isActive: true,
          ...(stateParam && !["ALL", "ALL STATES"].includes(stateParam.toUpperCase())
            ? { state: { equals: stateParam, mode: "insensitive" } }
            : {}),
        },
        select: { city: true },
        distinct: ["city"],
        take: 6,
      });
      suggestedCities = otherCenters.map((o) => o.city).filter((c) => c.toLowerCase() !== cityParam.toLowerCase());
    }

    // Pagination
    const totalCount = mapped.length;
    const startIndex = (page - 1) * limit;
    const paginatedResults = mapped.slice(startIndex, startIndex + limit);
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: paginatedResults,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
        country: countryParam || "India",
        state: stateParam || "All States",
        city: cityParam || "All Cities",
        bloodGroup: targetBloodGroup,
        displayGroup: targetBloodGroup ? BLOOD_GROUP_DISPLAY[targetBloodGroup] : "All Blood Groups",
        component: componentParam || "All Components",
        availability: availabilityParam || "All",
        sortBy,
        suggestedCities,
      },
    });
  } catch (error: any) {
    console.error("National Center search error:", error);
    return NextResponse.json({ error: "Failed to search blood centres" }, { status: 500 });
  }
}
