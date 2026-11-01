import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// POST /api/donors/alert — Send privacy-preserving contact request to consenting donor (Feature 2)
export async function POST(req: Request) {
  const auth = await requireAuth(["PATIENT", "ADMIN", "HOSPITAL"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const body = await req.json();
    const { donorId, requestId, hospitalName, city, message } = body;

    if (!donorId) {
      return NextResponse.json({ error: "Donor ID is required" }, { status: 400 });
    }

    const donor = await prisma.user.findUnique({
      where: { id: donorId },
      include: { donorProfile: true },
    });

    if (!donor || !donor.donorProfile) {
      return NextResponse.json({ error: "Donor profile not found" }, { status: 404 });
    }

    if (!donor.donorProfile.notificationConsent) {
      return NextResponse.json(
        { error: "This donor has opted out of direct emergency notifications." },
        { status: 403 }
      );
    }

    // Create donor alert record if requestId is present
    if (requestId) {
      await prisma.donorEmergencyAlert.create({
        data: {
          requestId,
          donorProfileId: donor.donorProfile.id,
          status: "SENT",
          notes: message || "Direct alert sent from Smart Nearby Donor Finder",
        },
      });
    }

    // Send notification to donor
    await prisma.notification.create({
      data: {
        userId: donor.id,
        type: "EMERGENCY_DONOR_ALERT",
        message: message || `Urgent blood request in ${city || donor.city} at ${hospitalName || "a local verified medical centre"}. Your blood group is needed. Please check and respond.`,
        metadata: {
          requestId: requestId || null,
          hospitalName: hospitalName || null,
          city: city || donor.city,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Emergency alert sent securely to donor. Your personal details remain protected.",
    });
  } catch (error: any) {
    console.error("Donor alert error:", error);
    return NextResponse.json(
      { error: "Failed to send alert to donor" },
      { status: 500 }
    );
  }
}
