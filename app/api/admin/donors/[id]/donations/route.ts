import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { BLOOD_GROUP_DISPLAY } from "@/lib/constants";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.errorResponse;

  const { id } = await params;

  try {
    const donations = await prisma.donation.findMany({
      where: { donorId: id },
      orderBy: { donationDate: "desc" },
    });

    const formatted = donations.map((d) => ({
      id: d.id,
      units: d.units,
      bloodGroup: d.bloodGroup,
      bloodGroupDisplay: BLOOD_GROUP_DISPLAY[d.bloodGroup],
      donationDate: d.donationDate,
      status: d.status,
      verifiedAt: d.verifiedAt,
      createdAt: d.createdAt,
    }));

    return NextResponse.json({ data: formatted });
  } catch (error: any) {
    console.error("Admin fetch donor donations error:", error);
    return NextResponse.json({ error: "Failed to fetch donor donations" }, { status: 500 });
  }
}
