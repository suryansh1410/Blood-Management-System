import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BLOOD_GROUP_DISPLAY, getStockStatus, getStockStatusLabel, ALL_BLOOD_GROUPS } from "@/lib/constants";
import { BloodGroup } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bloodGroupParam = searchParams.get("bloodGroup");

    let whereGroup: BloodGroup | undefined;
    if (bloodGroupParam && ALL_BLOOD_GROUPS.includes(bloodGroupParam as BloodGroup)) {
      whereGroup = bloodGroupParam as BloodGroup;
    }

    // Aggregate units across all active centers per blood group
    const stocks = await prisma.bloodStock.findMany({
      where: {
        center: { isActive: true },
        ...(whereGroup ? { bloodGroup: whereGroup } : {}),
      },
      select: { bloodGroup: true, units: true },
    });

    // Sum by blood group
    const sumByGroup: Record<string, number> = {};
    for (const s of stocks) {
      sumByGroup[s.bloodGroup] = (sumByGroup[s.bloodGroup] ?? 0) + s.units;
    }

    // Return all requested blood groups (or all 8 if none specified)
    const groups = whereGroup ? [whereGroup] : ALL_BLOOD_GROUPS;
    const formatted = groups.map((bg) => {
      const total = sumByGroup[bg] ?? 0;
      const status = getStockStatus(total);
      return {
        bloodGroup: bg,
        displayGroup: BLOOD_GROUP_DISPLAY[bg],
        units: total,
        status,
        statusLabel: getStockStatusLabel(status),
      };
    });

    return NextResponse.json({ data: formatted });
  } catch (error: any) {
    console.error("Fetch blood stock error:", error);
    return NextResponse.json({ error: "Failed to fetch blood stock" }, { status: 500 });
  }
}


