import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/centers/cities — Public: distinct list of cities among active centers
export async function GET() {
  try {
    const centers = await prisma.bloodCenter.findMany({
      where: { isActive: true },
      select: { city: true },
      orderBy: { city: "asc" },
    });

    // Deduplicate (Prisma does not support SELECT DISTINCT on a field directly via findMany groupBy in all adapters)
    const cities = [...new Set(centers.map((c) => c.city))].sort();

    return NextResponse.json({ data: cities });
  } catch (error: any) {
    console.error("Fetch cities error:", error);
    return NextResponse.json({ error: "Failed to fetch cities" }, { status: 500 });
  }
}
