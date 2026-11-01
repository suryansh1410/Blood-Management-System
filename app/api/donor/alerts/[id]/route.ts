import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/donor/alerts/[id] — Donor accepts or declines emergency alert
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["DONOR"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, notes } = body;

    if (!["ACCEPTED", "DECLINED"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be either 'ACCEPTED' or 'DECLINED'" },
        { status: 400 }
      );
    }

    const profile = await prisma.donorProfile.findUnique({
      where: { userId: auth.user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Donor profile not found" }, { status: 404 });
    }

    const alert = await prisma.donorEmergencyAlert.findFirst({
      where: {
        id,
        donorProfileId: profile.id,
      },
      include: { request: true },
    });

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    const updated = await prisma.donorEmergencyAlert.update({
      where: { id },
      data: {
        status,
        notes: notes || null,
        respondedAt: new Date(),
      },
    });

    // If accepted, add timeline event to request and notify hospital
    if (status === "ACCEPTED" && alert.request) {
      await prisma.requestTimelineEvent.create({
        data: {
          requestId: alert.requestId,
          status: "SEARCHING",
          title: "Donor Accepted Emergency Call",
          description: `A registered, consenting donor in ${alert.request.city} has accepted the call to donate. Proceeding to centre screening.`,
          performedBy: "DONOR",
        },
      });

      // Notify hospital/admins
      await prisma.notification.create({
        data: {
          userId: null,
          type: "DONOR_ACCEPTED_ALERT",
          message: `A matching donor accepted emergency alert for Request #${alert.request.requestCode || alert.request.id.slice(-6)} (${alert.request.patientName} at ${alert.request.hospitalName}).`,
          metadata: {
            requestId: alert.requestId,
            donorAlertId: alert.id,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message:
        status === "ACCEPTED"
          ? "Thank you! Your readiness to donate has been reported to the hospital. Please visit the blood centre for rapid screening."
          : "Response noted. Thank you for your consideration.",
      data: updated,
    });
  } catch (error: any) {
    console.error("Update donor alert error:", error);
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 });
  }
}
