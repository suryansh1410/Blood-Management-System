import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { userStatusSchema } from "@/lib/validations";
import { BLOOD_GROUP_DISPLAY } from "@/lib/constants";
import { getDonorStats } from "@/lib/business-logic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.errorResponse;

  const { id } = await params;

  try {
    const donor = await prisma.user.findUnique({
      where: { id, role: "DONOR" },
      include: {
        donorProfile: true,
        donations: {
          orderBy: { donationDate: "desc" },
        },
      },
    });

    if (!donor || !donor.donorProfile) {
      return NextResponse.json({ error: "Donor not found" }, { status: 404 });
    }

    const stats = await getDonorStats(donor.id);

    return NextResponse.json({
      data: {
        id: donor.id,
        name: donor.name,
        email: donor.email,
        phone: donor.phone,
        city: donor.city,
        address: donor.address,
        isActive: donor.isActive,
        bloodGroup: donor.donorProfile.bloodGroup,
        bloodGroupDisplay: BLOOD_GROUP_DISPLAY[donor.donorProfile.bloodGroup],
        availabilityStatus: donor.donorProfile.availabilityStatus,
        totalDonations: stats.totalDonations,
        lastDonationDate: stats.lastDonationDate,
        createdAt: donor.createdAt,
        donations: donor.donations.map((d) => ({
          id: d.id,
          units: d.units,
          bloodGroup: d.bloodGroup,
          bloodGroupDisplay: BLOOD_GROUP_DISPLAY[d.bloodGroup],
          donationDate: d.donationDate,
          status: d.status,
          verifiedAt: d.verifiedAt,
        })),
      },
    });
  } catch (error: any) {
    console.error("Admin fetch donor detail error:", error);
    return NextResponse.json({ error: "Failed to fetch donor details" }, { status: 500 });
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
          metadata: { role: "DONOR", email: user.email },
        },
      });

      return user;
    });

    return NextResponse.json({
      message: `Donor account ${updated.isActive ? "activated" : "deactivated"} successfully`,
      data: { id: updated.id, isActive: updated.isActive },
    });
  } catch (error: any) {
    console.error("Admin toggle donor status error:", error);
    return NextResponse.json({ error: "Failed to update donor status" }, { status: 500 });
  }
}
