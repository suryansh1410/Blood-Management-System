import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { hospitalResponseSchema } from "@/lib/validations";
import { recordHospitalEmergencyResponse } from "@/lib/business-logic";

// POST /api/emergency/requests/[id]/respond — Hospital staff / Admin response workflow
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Only authorized HOSPITAL staff or ADMIN can submit responses
  const auth = await requireAuth(["HOSPITAL", "ADMIN"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = hospitalResponseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    // Determine target center ID
    let centerId = body.centerId ? Number(body.centerId) : auth.user.centerId;

    if (!centerId) {
      // If admin without centerId, fallback to center assigned to request or main blood bank
      const request = await prisma.bloodRequest.findUnique({
        where: { id },
        select: { assignedCenterId: true },
      });
      if (request?.assignedCenterId) {
        centerId = request.assignedCenterId;
      } else {
        const mainCenter = await prisma.bloodCenter.findFirst({ where: { isMain: true } });
        centerId = mainCenter?.id;
      }
    }

    if (!centerId) {
      return NextResponse.json(
        { error: "No responding blood center identified. Please specify centerId." },
        { status: 400 }
      );
    }

    // Role verification: If HOSPITAL staff, ensure they belong to this center or have authority
    if (auth.user.role === "HOSPITAL" && auth.user.centerId && auth.user.centerId !== centerId) {
      return NextResponse.json(
        { error: "Forbidden: You may only respond on behalf of your assigned blood center." },
        { status: 403 }
      );
    }

    // Execute transaction-safe hospital response workflow
    const result = await recordHospitalEmergencyResponse({
      requestId: id,
      centerId,
      staffUserId: auth.user.id,
      responseType: parsed.data.responseType,
      confirmedUnits: parsed.data.confirmedUnits,
      notes: parsed.data.notes?.trim() || undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Hospital response '${parsed.data.responseType.replace(/_/g, " ")}' recorded successfully.`,
      data: {
        trackingStatus: result.updatedRequest.trackingStatus,
        status: result.updatedRequest.status,
        reservedUnits: result.updatedRequest.reservedUnits,
        response: result.responseRecord,
      },
    });
  } catch (error: any) {
    console.error("Hospital response error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record hospital response" },
      { status: 500 }
    );
  }
}
