import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { donationRecordSchema } from "@/lib/validations";
import { BLOOD_GROUP_DISPLAY } from "@/lib/constants";

export async function GET() {
  const auth = await requireAuth(["DONOR"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const donations = await prisma.donation.findMany({
      where: { donorId: auth.user!.id },
      orderBy: { donationDate: "desc" },
    });

    const formatted = donations.map((d) => ({
      id: d.id,
      bloodGroup: d.bloodGroup,
      bloodGroupDisplay: BLOOD_GROUP_DISPLAY[d.bloodGroup],
      units: d.units,
      donationDate: d.donationDate,
      status: d.status,
      verifiedAt: d.verifiedAt,
      createdAt: d.createdAt,
    }));

    return NextResponse.json({ data: formatted });
  } catch (error: any) {
    console.error("Fetch donations error:", error);
    return NextResponse.json({ error: "Failed to fetch donation records" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(["DONOR"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const body = await req.json();
    const parsed = donationRecordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const donorUser = await prisma.user.findUnique({
      where: { id: auth.user!.id },
      include: { donorProfile: true },
    });

    if (!donorUser) {
      return NextResponse.json({ error: "Donor account not found" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const donation = await tx.donation.create({
        data: {
          donorId: auth.user!.id,
          bloodGroup: parsed.data.bloodGroup,
          units: parsed.data.units,
          donationDate: new Date(parsed.data.donationDate),
          status: "PENDING",
        },
      });

      // Broadcast notification to blood bank staff / admins
      await tx.notification.create({
        data: {
          userId: null,
          type: "DONATION_SUBMITTED",
          message: `New donation record submitted by ${donorUser.name}: ${donation.units} unit(s) of ${BLOOD_GROUP_DISPLAY[donation.bloodGroup]}. Awaiting verification.`,
        },
      });

      return donation;
    });

    return NextResponse.json(
      {
        message: "Donation record submitted successfully. It will be verified by blood bank staff.",
        data: result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Submit donation error:", error);
    return NextResponse.json({ error: "Failed to submit donation record" }, { status: 500 });
  }
}
