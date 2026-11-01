import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { userStatusSchema } from "@/lib/validations";
import { BLOOD_GROUP_DISPLAY } from "@/lib/constants";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.errorResponse;

  const { id } = await params;

  try {
    const patient = await prisma.user.findUnique({
      where: { id, role: "PATIENT" },
      include: {
        bloodRequests: {
          orderBy: { requestDate: "desc" },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient account not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        city: patient.city,
        address: patient.address,
        organizationName: patient.organizationName,
        isActive: patient.isActive,
        createdAt: patient.createdAt,
        requests: patient.bloodRequests.map((r) => ({
          id: r.id,
          patientName: r.patientName,
          bloodGroup: r.bloodGroup,
          bloodGroupDisplay: BLOOD_GROUP_DISPLAY[r.bloodGroup],
          unitsRequired: r.unitsRequired,
          hospitalName: r.hospitalName,
          city: r.city,
          urgency: r.urgency,
          status: r.status,
          requestDate: r.requestDate,
          approvedAt: r.approvedAt,
          fulfilledAt: r.fulfilledAt,
        })),
      },
    });
  } catch (error: any) {
    console.error("Admin fetch patient detail error:", error);
    return NextResponse.json({ error: "Failed to fetch patient details" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.errorResponse;

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = userStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: { isActive: parsed.data.isActive },
      });

      await tx.auditLog.create({
        data: {
          adminId: auth.user.id,
          action: parsed.data.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
          targetId: id,
          targetType: "User",
          metadata: { role: "PATIENT", email: user.email },
        },
      });

      return user;
    });

    return NextResponse.json({
      message: `Patient account ${updated.isActive ? "activated" : "deactivated"} successfully`,
      data: { id: updated.id, isActive: updated.isActive },
    });
  } catch (error: any) {
    console.error("Admin toggle patient status error:", error);
    return NextResponse.json({ error: "Failed to update patient status" }, { status: 500 });
  }
}
