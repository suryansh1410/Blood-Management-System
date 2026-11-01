import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  BLOOD_GROUP_DISPLAY,
  TRACKING_STATUSES,
  TRACKING_STATUS_INFO,
  TrackingStatus,
} from "@/lib/constants";

// GET /api/track/[code] — Dedicated public & patient request tracking interface (Feature 5)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const cleanCode = decodeURIComponent(code).trim();

    const request = await prisma.bloodRequest.findFirst({
      where: {
        OR: [
          { requestCode: { equals: cleanCode, mode: "insensitive" } },
          { id: { equals: cleanCode, mode: "insensitive" } },
        ],
      },
      include: {
        assignedCenter: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            address: true,
            phone: true,
            facilityType: true,
            verificationStatus: true,
          },
        },
        timeline: {
          orderBy: { createdAt: "asc" },
        },
        hospitalResponses: {
          select: {
            id: true,
            responseType: true,
            confirmedUnits: true,
            notes: true,
            createdAt: true,
            center: { select: { name: true, city: true, phone: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!request) {
      return NextResponse.json(
        { error: `Blood request with identifier '${cleanCode}' was not found.` },
        { status: 404 }
      );
    }

    const currentTrackingStatus = (request.trackingStatus as TrackingStatus) || "SUBMITTED";
    const statusMeta = TRACKING_STATUS_INFO[currentTrackingStatus] || TRACKING_STATUS_INFO.SUBMITTED;

    // Build timeline progress stages (1 to 8 for normal flow, or terminal flags)
    const activeStepNumber = statusMeta.stepNumber;

    const timelineWithDetails = request.timeline.map((event) => {
      const eStatus = event.status as TrackingStatus;
      const meta = TRACKING_STATUS_INFO[eStatus] || TRACKING_STATUS_INFO.SUBMITTED;
      return {
        id: event.id,
        status: event.status,
        label: meta.label,
        title: event.title,
        description: event.description,
        performedBy: event.performedBy,
        timestamp: event.createdAt,
        variant: meta.variant,
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
        urgency: request.urgency,
        status: request.status,
        trackingStatus: request.trackingStatus,
        statusLabel: statusMeta.label,
        statusDescription: statusMeta.description,
        statusVariant: statusMeta.variant,
        activeStepNumber,
        isTerminal: !!statusMeta.isTerminal,
        requestDate: request.requestDate,
        requiredDate: request.requiredDate,
        approvedAt: request.approvedAt,
        fulfilledAt: request.fulfilledAt,
        rejectionReason: request.rejectionReason,
        assignedCenter: request.assignedCenter,
        timeline: timelineWithDetails,
        hospitalResponses: request.hospitalResponses,
      },
    });
  } catch (error: any) {
    console.error("Track request error:", error);
    return NextResponse.json(
      { error: "Failed to load tracking data" },
      { status: 500 }
    );
  }
}
