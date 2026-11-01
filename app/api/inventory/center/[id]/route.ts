import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  ALL_BLOOD_GROUPS,
  BLOOD_GROUP_DISPLAY,
  getStockStatus,
  getStockStatusLabel,
  STOCK_THRESHOLDS,
} from "@/lib/constants";
import { adjustCenterStockAudit } from "@/lib/business-logic";
import { centerStockAdjustSchema } from "@/lib/validations";

// GET /api/inventory/center/[id] — View center live inventory, stock history, and status warnings
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["ADMIN", "HOSPITAL", "PATIENT", "DONOR"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const { id } = await params;
    const centerId = parseInt(id, 10);

    const center = await prisma.bloodCenter.findUnique({
      where: { id: centerId },
      include: {
        stocks: true,
        stockHistory: {
          include: {
            performedBy: { select: { name: true, role: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!center) {
      return NextResponse.json({ error: "Blood center not found" }, { status: 404 });
    }

    // Format all 8 blood groups with accurate status & thresholds
    let totalAvailableUnits = 0;
    let criticalCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const inventoryRows = ALL_BLOOD_GROUPS.map((bg) => {
      const stockItem = center.stocks.find((s) => s.bloodGroup === bg);
      const units = stockItem ? stockItem.units : 0;
      const reservedUnits = stockItem?.reservedUnits || 0;
      const status = stockItem ? getStockStatus(units) : "AVAILABILITY_NOT_UPDATED";
      const statusLabel = getStockStatusLabel(status as any);

      totalAvailableUnits += units;
      if (status === "CRITICAL") criticalCount++;
      if (status === "LOW_STOCK") lowStockCount++;
      if (status === "OUT_OF_STOCK") outOfStockCount++;

      return {
        bloodGroup: bg,
        displayGroup: BLOOD_GROUP_DISPLAY[bg],
        component: stockItem?.component || "Whole Blood",
        units,
        reservedUnits,
        netAvailable: Math.max(0, units - reservedUnits),
        status,
        statusLabel,
        lastUpdated: stockItem?.lastUpdated || center.lastStockUpdate,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        center: {
          id: center.id,
          name: center.name,
          type: center.type,
          city: center.city,
          state: center.state,
          address: center.address,
          phone: center.phone,
          facilityType: center.facilityType,
          verificationStatus: center.verificationStatus,
          lastStockUpdate: center.lastStockUpdate,
          operatingHours: center.operatingHours,
          dailyCapacity: center.dailyCapacity,
        },
        summary: {
          totalUnits: totalAvailableUnits,
          criticalCount,
          lowStockCount,
          outOfStockCount,
          thresholds: STOCK_THRESHOLDS,
        },
        inventory: inventoryRows,
        history: center.stockHistory.map((h) => ({
          id: h.id,
          bloodGroup: h.bloodGroup,
          displayGroup: BLOOD_GROUP_DISPLAY[h.bloodGroup],
          component: h.component,
          changeType: h.changeType,
          unitsDelta: h.unitsDelta,
          previousUnits: h.previousUnits,
          newUnits: h.newUnits,
          reason: h.reason,
          performedBy: h.performedBy?.name || "System",
          createdAt: h.createdAt,
        })),
      },
    });
  } catch (error: any) {
    console.error("Fetch center inventory error:", error);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

// POST /api/inventory/center/[id] — Authorized manual stock adjustment (Feature 3)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["HOSPITAL", "ADMIN"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const { id } = await params;
    const centerId = parseInt(id, 10);

    // Hospital staff can only update their own center
    if (auth.user.role === "HOSPITAL" && auth.user.centerId && auth.user.centerId !== centerId) {
      return NextResponse.json(
        { error: "Forbidden: You may only adjust stock for your assigned hospital." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = centerStockAdjustSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const updatedStock = await adjustCenterStockAudit({
      centerId,
      bloodGroup: parsed.data.bloodGroup,
      component: parsed.data.component,
      action: parsed.data.action,
      units: parsed.data.units,
      reason: parsed.data.reason?.trim() || `Manual inventory update by ${auth.user.name || auth.user.role}`,
      performedById: auth.user.id,
    });

    return NextResponse.json({
      success: true,
      message: `Inventory for ${BLOOD_GROUP_DISPLAY[parsed.data.bloodGroup]} updated to ${updatedStock.units} units.`,
      data: {
        bloodGroup: updatedStock.bloodGroup,
        units: updatedStock.units,
        lastUpdated: updatedStock.lastUpdated,
      },
    });
  } catch (error: any) {
    console.error("Center stock update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update inventory" },
      { status: 500 }
    );
  }
}
