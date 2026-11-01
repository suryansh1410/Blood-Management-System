import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { donorProfileUpdateSchema } from "@/lib/validations";
import { getDonorStats } from "@/lib/business-logic";
import { BLOOD_GROUP_DISPLAY } from "@/lib/constants";

export async function GET() {
  const auth = await requireAuth(["DONOR"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.user!.id },
      include: {
        donorProfile: true,
      },
    });

    if (!user || !user.donorProfile) {
      return NextResponse.json({ error: "Donor profile not found" }, { status: 404 });
    }

    const stats = await getDonorStats(user.id);

    return NextResponse.json({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        address: user.address,
        bloodGroup: user.donorProfile.bloodGroup,
        bloodGroupDisplay: BLOOD_GROUP_DISPLAY[user.donorProfile.bloodGroup],
        availabilityStatus: user.donorProfile.availabilityStatus,
        notificationConsent: user.donorProfile.notificationConsent,
        allowNearbyAlerts: user.donorProfile.allowNearbyAlerts,
        preferredRadiusKm: user.donorProfile.preferredRadiusKm,
        totalDonations: stats.totalDonations,
        lastDonationDate: stats.lastDonationDate,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Fetch donor profile error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAuth(["DONOR"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const body = await req.json();
    const parsed = donorProfileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: auth.user!.id },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        city: parsed.data.city,
        address: parsed.data.address || null,
        donorProfile: {
          update: {
            ...(parsed.data.notificationConsent !== undefined
              ? { notificationConsent: parsed.data.notificationConsent }
              : {}),
            ...(parsed.data.allowNearbyAlerts !== undefined
              ? { allowNearbyAlerts: parsed.data.allowNearbyAlerts }
              : {}),
            ...(parsed.data.preferredRadiusKm !== undefined
              ? { preferredRadiusKm: parsed.data.preferredRadiusKm }
              : {}),
          },
        },
      },
      include: {
        donorProfile: true,
      },
    });

    return NextResponse.json({
      message: "Profile and preferences updated successfully",
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        city: updatedUser.city,
        address: updatedUser.address,
        notificationConsent: updatedUser.donorProfile?.notificationConsent,
        allowNearbyAlerts: updatedUser.donorProfile?.allowNearbyAlerts,
        preferredRadiusKm: updatedUser.donorProfile?.preferredRadiusKm,
      },
    });
  } catch (error: any) {
    console.error("Update donor profile error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
