import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { bloodCenterUpdateSchema } from "@/lib/validations";
import { ALL_BLOOD_GROUPS, BLOOD_GROUP_DISPLAY, getStockStatus, getStockStatusLabel } from "@/lib/constants";

// GET /api/centers/:id — Public: full detail for one active center
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const centerId = parseInt(id);
  if (isNaN(centerId)) {
    return NextResponse.json({ error: "Invalid center ID" }, { status: 400 });
  }

  try {
    // Privacy: only query BloodCenter and BloodStock — no user/donor/patient data
    const center = await prisma.bloodCenter.findFirst({
      where: { id: centerId, isActive: true },
      include: { stocks: true },
    });

    if (!center) {
      return NextResponse.json({ error: "Center not found or inactive" }, { status: 404 });
    }

    const stockMap = new Map(center.stocks.map((s) => [s.bloodGroup, s.units]));
    const allStocks = ALL_BLOOD_GROUPS.map((bg) => {
      const units = stockMap.get(bg) ?? 0;
      const status = getStockStatus(units);
      return {
        bloodGroup: bg,
        displayGroup: BLOOD_GROUP_DISPLAY[bg],
        units,
        status,
        statusLabel: getStockStatusLabel(status),
      };
    });

    return NextResponse.json({
      data: {
        id: center.id,
        name: center.name,
        type: center.type,
        city: center.city,
        address: center.address,
        phone: center.phone,
        isMain: center.isMain,
        stocks: allStocks,
      },
    });
  } catch (error: any) {
    console.error("Get center error:", error);
    return NextResponse.json({ error: "Failed to fetch center" }, { status: 500 });
  }
}

// PATCH /api/centers/:id — Admin: edit center fields
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
    const existing = await prisma.bloodCenter.findUnique({ where: { id: centerId } });
    if (!existing) {
      return NextResponse.json({ error: "Center not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = bloodCenterUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Enforce isMain invariants (Section 2)
    if (existing.isMain && data.isActive === false) {
      return NextResponse.json(
        { error: "The Main Blood Bank cannot be deactivated. Its isActive flag is locked." },
        { status: 400 }
      );
    }
    if (existing.isMain && data.type && data.type !== existing.type) {
      return NextResponse.json(
        { error: "The Main Blood Bank type cannot be changed." },
        { status: 400 }
      );
    }

    const updated = await prisma.bloodCenter.update({
      where: { id: centerId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.city !== undefined ? { city: data.city } : {}),
        ...(data.address !== undefined ? { address: data.address } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.isActive !== undefined && !existing.isMain ? { isActive: data.isActive } : {}),
        ...(!existing.isMain && data.type !== undefined ? { type: data.type } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Center "${updated.name}" updated successfully.`,
    });
  } catch (error: any) {
    console.error("Update center error:", error);
    return NextResponse.json({ error: "Failed to update center" }, { status: 500 });
  }
}