import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { emergencyRequestSchema } from "@/lib/validations";
import { createEmergencyRequest } from "@/lib/business-logic";
import { BLOOD_GROUP_DISPLAY, getStockStatus, getStockStatusLabel } from "@/lib/constants";

// POST /api/emergency/requests — Submit emergency blood request (Feature 1)
export async function POST(req: Request) {
  const auth = await requireAuth(["PATIENT", "ADMIN", "HOSPITAL"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const body = await req.json();
    const parsed = emergencyRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const result = await createEmergencyRequest(
      {
        patientName: parsed.data.patientName.trim(),
        requesterName: parsed.data.requesterName.trim(),
        contactNumber: parsed.data.contactNumber.trim(),
        bloodGroup: parsed.data.bloodGroup,
        component: parsed.data.component,
        unitsRequired: parsed.data.unitsRequired,
        state: parsed.data.state.trim(),
        city: parsed.data.city.trim(),
        hospitalName: parsed.data.hospitalName.trim(),
        hospitalAddress: parsed.data.hospitalAddress.trim(),
        urgency: parsed.data.urgency,
        requiredDate: new Date(parsed.data.requiredDate),
        additionalInfo: parsed.data.additionalInfo?.trim() || undefined,
      },
      auth.user.id
    );

    // Fetch verified matching centres in this city with accurate stock status
    const verifiedCentres = await prisma.bloodCenter.findMany({
      where: {
        isActive: true,
        city: { equals: parsed.data.city.trim(), mode: "insensitive" },
      },
      include: {
        stocks: {
          where: { bloodGroup: parsed.data.bloodGroup },
        },
      },
      orderBy: { popularRank: "asc" },
      take: 8,
    });

    const matchingCentresWithStock = verifiedCentres.map((c) => {
      const stockRow = c.stocks[0];
      const hasStockRow = !!stockRow;
      const units = hasStockRow ? stockRow.units : null;
      const status = hasStockRow ? getStockStatus(stockRow.units) : "AVAILABILITY_NOT_UPDATED";
      const statusLabel = getStockStatusLabel(status as any);

      return {
        id: c.id,
        name: c.name,
        type: c.type,
        city: c.city,
        state: c.state,
        address: c.address,
        phone: c.phone,
        verificationStatus: c.verificationStatus,
        unitsAvailable: units,
        status,
        statusLabel,
        hasLiveStock: hasStockRow,
        lastStockUpdate: c.lastStockUpdate,
        latitude: c.latitude,
        longitude: c.longitude,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Emergency request #${result.requestCode} created successfully.`,
      data: {
        id: result.request.id,
        requestCode: result.requestCode,
        trackingStatus: result.request.trackingStatus,
        status: result.request.status,
        patientName: result.request.patientName,
        bloodGroup: result.request.bloodGroup,
        bloodGroupDisplay: BLOOD_GROUP_DISPLAY[result.request.bloodGroup],
        unitsRequired: result.request.unitsRequired,
        city: result.request.city,
        hospitalName: result.request.hospitalName,
        createdAt: result.request.requestDate,
        matchingCentres: matchingCentresWithStock,
        alertedDonorsCount: result.alertedDonorsCount,
      },
    });
  } catch (error: any) {
    console.error("Emergency request submission error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit emergency request" },
      { status: 500 }
    );
  }
}

// GET /api/emergency/requests — List emergency requests with role filtering
export async function GET(req: Request) {
  const auth = await requireAuth(["PATIENT", "ADMIN", "HOSPITAL"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city")?.trim();
    const bloodGroup = searchParams.get("bloodGroup")?.trim();
    const trackingStatus = searchParams.get("status")?.trim();
    const urgency = searchParams.get("urgency")?.trim();

    const whereClause: any = {};

    // Patient sees only their own requests
    if (auth.user.role === "PATIENT") {
      whereClause.requesterId = auth.user.id;
    } else if (auth.user.role === "HOSPITAL" && auth.user.centerId) {
      // Hospital staff sees requests assigned to their center or in their city
      const center = await prisma.bloodCenter.findUnique({
        where: { id: auth.user.centerId },
      });
      if (center) {
        whereClause.OR = [
          { assignedCenterId: center.id },
          { city: { equals: center.city, mode: "insensitive" } },
        ];
      }
    }

    if (city && city.toUpperCase() !== "ALL") {
      whereClause.city = { equals: city, mode: "insensitive" };
    }

    if (bloodGroup && bloodGroup.toUpperCase() !== "ALL") {
      whereClause.bloodGroup = bloodGroup as any;
    }

    if (trackingStatus && trackingStatus.toUpperCase() !== "ALL") {
      whereClause.trackingStatus = trackingStatus;
    }

    if (urgency && urgency.toUpperCase() !== "ALL") {
      whereClause.urgency = urgency;
    }

    const requests = await prisma.bloodRequest.findMany({
      where: whereClause,
      include: {
        assignedCenter: {
          select: { id: true, name: true, city: true, phone: true },
        },
        timeline: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        hospitalResponses: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: [
        { urgency: "desc" },
        { requestDate: "desc" },
      ],
      take: 50,
    });

    const formatted = requests.map((r) => ({
      id: r.id,
      requestCode: r.requestCode || `REQ-${r.id.slice(-6)}`,
      patientName: r.patientName,
      requesterName: r.requesterName,
      bloodGroup: r.bloodGroup,
      bloodGroupDisplay: BLOOD_GROUP_DISPLAY[r.bloodGroup],
      component: r.component,
      unitsRequired: r.unitsRequired,
      reservedUnits: r.reservedUnits,
      hospitalName: r.hospitalName,
      hospitalAddress: r.hospitalAddress,
      city: r.city,
      state: r.state,
      contactNumber: auth.user.role === "PATIENT" && auth.user.id !== r.requesterId ? "Protected" : r.contactNumber,
      requiredDate: r.requiredDate,
      urgency: r.urgency,
      status: r.status,
      trackingStatus: r.trackingStatus,
      assignedCenter: r.assignedCenter,
      requestDate: r.requestDate,
      latestEvent: r.timeline[0] || null,
      latestResponse: r.hospitalResponses[0] || null,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error("Fetch emergency requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch emergency requests" },
      { status: 500 }
    );
  }
}
