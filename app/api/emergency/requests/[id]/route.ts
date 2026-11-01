import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { BLOOD_GROUP_DISPLAY, getStockStatus, getStockStatusLabel } from "@/lib/constants";

// GET /api/emergency/requests/[id] — Full request details, timeline, matching centres
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["PATIENT", "ADMIN", "HOSPITAL", "DONOR"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const { id } = await params;

    const request = await prisma.bloodRequest.findFirst({
      where: {
        OR: [{ id }, { requestCode: id }],
      },
      include: {
        assignedCenter: {
          include: {
            stocks: true,
          },
        },
        timeline: {
          orderBy: { createdAt: "desc" },
        },
        hospitalResponses: {
          include: {
            center: { select: { name: true, city: true, phone: true } },
            staffUser: { select: { name: true, role: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        donorAlerts: true,
      },
    });

    if (!request) {
      return NextResponse.json({ error: "Emergency request not found" }, { status: 404 });
    }

    // Patient authorization guard: patients can only access their own request
    if (auth.user.role === "PATIENT" && request.requesterId !== auth.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to view this request." },
        { status: 403 }
      );
    }

    // Find all matching verified blood centres in the district/city
    const matchingCentres = await prisma.bloodCenter.findMany({
      where: {
        isActive: true,
        city: { equals: request.city, mode: "insensitive" },
      },
      include: {
        stocks: {
          where: { bloodGroup: request.bloodGroup },
        },
      },
      orderBy: { popularRank: "asc" },
      take: 10,
    });

    const matchingCentresFormatted = matchingCentres.map((c) => {
      const stockRow = c.stocks[0];
      const hasStock = !!stockRow;
      const units = hasStock ? stockRow.units : null;
      const status = hasStock ? getStockStatus(stockRow.units) : "AVAILABILITY_NOT_UPDATED";

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
        unitsAvailable: units,
        status,
        statusLabel: getStockStatusLabel(status as any),
        hasLiveStock: hasStock,
        lastStockUpdate: c.lastStockUpdate,
        latitude: c.latitude,
        longitude: c.longitude,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        id: request.id,
        requestCode: request.requestCode || `REQ-${request.id.slice(-6)}`,
        patientName: request.patientName,
        requesterName: request.requesterName,
        bloodGroup: request.bloodGroup,
        bloodGroupDisplay: BLOOD_GROUP_DISPLAY[request.bloodGroup],
        component: request.component,
        unitsRequired: request.unitsRequired,
        reservedUnits: request.reservedUnits,
        hospitalName: request.hospitalName,
        hospitalAddress: request.hospitalAddress,
        city: request.city,
        state: request.state,
        contactNumber:
          auth.user.role === "DONOR"
            ? "Protected for Medical Privacy"
            : request.contactNumber,
        requiredDate: request.requiredDate,
        urgency: request.urgency,
        status: request.status,
        trackingStatus: request.trackingStatus,
        additionalInfo: request.additionalInfo,
        rejectionReason: request.rejectionReason,
        requestDate: request.requestDate,
        approvedAt: request.approvedAt,
        fulfilledAt: request.fulfilledAt,
        assignedCenter: request.assignedCenter,
        timeline: request.timeline,
        hospitalResponses: request.hospitalResponses,
        alertedDonorsCount: request.donorAlerts.length,
        matchingCentres: matchingCentresFormatted,
      },
    });
  } catch (error: any) {
    console.error("Fetch request detail error:", error);
    return NextResponse.json(
      { error: "Failed to load request details" },
      { status: 500 }
    );
  }
}
