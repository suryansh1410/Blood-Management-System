import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { centerStockAdjustSchema } from "@/lib/validations";
import { getStockStatus, getStockStatusLabel, BLOOD_GROUP_DISPLAY } from "@/lib/constants";
import { BloodGroup } from "@prisma/client";

// PATCH /api/centers/:id/stock — Admin: adjust stock for a specific center + blood group
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.errorResponse;

  const { id } = await params;
  const centerId = parseInt(id);
  if (isNaN(centerId)) {
    return NextResponse.json({ error: "Invalid center ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = centerStockAdjustSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const { bloodGroup, action, units } = parsed.data;

    const center = await prisma.bloodCenter.findUnique({ where: { id: centerId } });
    if (!center || !center.isActive) {
      return NextResponse.json({ error: "Center not found or inactive" }, { status: 404 });
    }

    const stock = await prisma.bloodStock.findUnique({
      where: { centerId_bloodGroup: { centerId, bloodGroup: bloodGroup as BloodGroup } },
    });

    if (!stock) {
      return NextResponse.json(
        { error: `Stock row for ${bloodGroup} not found at this center` },
        { status: 404 }
      );
    }

    let newUnits: number;
    if (action === "set") {
      newUnits = units;
    } else if (action === "add") {
      newUnits = stock.units + units;
    } else {
      // remove
      newUnits = stock.units - units;
    }

    if (newUnits < 0) {
      return NextResponse.json(
        { error: `Cannot reduce stock below zero. Current: ${stock.units}, Requested removal: ${units}` },
        { status: 400 }
      );
    }

    const updated = await prisma.bloodStock.update({
      where: { centerId_bloodGroup: { centerId, bloodGroup: bloodGroup as BloodGroup } },
      data: { units: newUnits },
    });

    const status = getStockStatus(updated.units);
    return NextResponse.json({
      success: true,
      message: `${BLOOD_GROUP_DISPLAY[bloodGroup as BloodGroup]} stock at "${center.name}" updated to ${updated.units} units (${getStockStatusLabel(status)}).`,
      data: { units: updated.units, status },
    });
  } catch (error: any) {
    console.error("Center stock adjust error:", error);
    return NextResponse.json({ error: "Failed to adjust center stock" }, { status: 500 });
  }
}