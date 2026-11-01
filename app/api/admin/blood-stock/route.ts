import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { BLOOD_GROUP_DISPLAY, getStockStatus, getStockStatusLabel } from "@/lib/constants";

export async function GET() {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    // Return only the Main Blood Bank's stock — the source of truth for the donation/request engine
    const stocks = await prisma.bloodStock.findMany({
      where: { center: { isMain: true } },
      orderBy: { bloodGroup: "asc" },
    });

    const formatted = stocks.map((item) => {
      const status = getStockStatus(item.units);
      return {
        id: item.id,
        bloodGroup: item.bloodGroup,
        displayGroup: BLOOD_GROUP_DISPLAY[item.bloodGroup],
        units: item.units,
        status,
        statusLabel: getStockStatusLabel(status),
        lastUpdated: item.lastUpdated,
      };
    });

    return NextResponse.json({ data: formatted });
  } catch (error: any) {
    console.error("Admin fetch blood stock error:", error);
    return NextResponse.json({ error: "Failed to fetch blood stock" }, { status: 500 });
  }
}

