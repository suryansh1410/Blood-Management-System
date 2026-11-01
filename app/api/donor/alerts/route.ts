import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { BLOOD_GROUP_DISPLAY } from "@/lib/constants";

// GET /api/donor/alerts — Donor views incoming emergency alerts
export async function GET() {
  const auth = await requireAuth(["DONOR"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const profile = await prisma.donorProfile.findUnique({
      where: { userId: auth.user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Donor profile not found" }, { status: 404 });
    }

    const alerts = await prisma.donorEmergencyAlert.findMany({
      where: { donorProfileId: profile.id },
      include: {
        request: {
          select: {
            id: true,
            requestCode: true,
            patientName: true,
            bloodGroup: true,
            component: true,
            unitsRequired: true,
            hospitalName: true,
            hospitalAddress: true,
            city: true,
            urgency: true,
            requiredDate: true,
            trackingStatus: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = alerts.map((a) => ({
      id: a.id,
      status: a.status,
      distanceKm: a.distanceKm,
      respondedAt: a.respondedAt,
      createdAt: a.createdAt,
      request: a.request
        ? {
            ...a.request,
            bloodGroupDisplay: BLOOD_GROUP_DISPLAY[a.request.bloodGroup],
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error("Fetch donor alerts error:", error);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}
