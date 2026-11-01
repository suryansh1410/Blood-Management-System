import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { bloodRequestSchema } from "@/lib/validations";
import { BLOOD_GROUP_DISPLAY } from "@/lib/constants";
import { RequestStatus } from "@prisma/client";

export async function GET(req: Request) {
  const auth = await requireAuth(["PATIENT"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");

    const whereClause: any = {
      requesterId: auth.user!.id,
    };

    if (statusParam && Object.values(RequestStatus).includes(statusParam as RequestStatus)) {
      whereClause.status = statusParam as RequestStatus;
    }

    const requests = await prisma.bloodRequest.findMany({
      where: whereClause,
      orderBy: { requestDate: "desc" },
    });

    const formatted = requests.map((r) => ({
      id: r.id,
      patientName: r.patientName,
      bloodGroup: r.bloodGroup,
      bloodGroupDisplay: BLOOD_GROUP_DISPLAY[r.bloodGroup],
      unitsRequired: r.unitsRequired,
      hospitalName: r.hospitalName,
      city: r.city,
      contactNumber: r.contactNumber,
      requiredDate: r.requiredDate,
      urgency: r.urgency,
      additionalInfo: r.additionalInfo,
      status: r.status,
      requestDate: r.requestDate,
      approvedAt: r.approvedAt,
      fulfilledAt: r.fulfilledAt,
    }));

    return NextResponse.json({ data: formatted });
  } catch (error: any) {
    console.error("Fetch patient requests error:", error);
    return NextResponse.json({ error: "Failed to fetch blood requests" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(["PATIENT"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const body = await req.json();
    const parsed = bloodRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const requester = await prisma.user.findUnique({
      where: { id: auth.user!.id },
    });

    const newRequest = await prisma.$transaction(async (tx) => {
      const request = await tx.bloodRequest.create({
        data: {
          requesterId: auth.user!.id,
          patientName: parsed.data.patientName,
          bloodGroup: parsed.data.bloodGroup,
          unitsRequired: parsed.data.unitsRequired,
          hospitalName: parsed.data.hospitalName,
          city: parsed.data.city,
          contactNumber: parsed.data.contactNumber,
          requiredDate: new Date(parsed.data.requiredDate),
          urgency: parsed.data.urgency,
          additionalInfo: parsed.data.additionalInfo || null,
          status: "PENDING",
        },
      });

      // Broadcast notification to all admins/staff
      await tx.notification.create({
        data: {
          userId: null,
          type: "REQUEST_SUBMITTED",
          message: `New ${request.urgency} blood request submitted for ${request.patientName} (${request.unitsRequired} units of ${BLOOD_GROUP_DISPLAY[request.bloodGroup]} at ${request.hospitalName}).`,
        },
      });

      return request;
    });

    return NextResponse.json(
      {
        message: "Blood request submitted successfully. Awaiting blood bank review.",
        data: newRequest,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Submit request error:", error);
    return NextResponse.json({ error: "Failed to submit blood request" }, { status: 500 });
  }
}
