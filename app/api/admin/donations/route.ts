import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { BLOOD_GROUP_DISPLAY } from "@/lib/constants";
import { DonationStatus, BloodGroup } from "@prisma/client";

export async function GET(req: Request) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const bloodGroupParam = searchParams.get("bloodGroup");
    const searchParam = searchParams.get("search")?.toLowerCase().trim();

    const donations = await prisma.donation.findMany({
      where: {
        ...(statusParam && Object.values(DonationStatus).includes(statusParam as DonationStatus)
          ? { status: statusParam as DonationStatus }
          : {}),
        ...(bloodGroupParam && Object.values(BloodGroup).includes(bloodGroupParam as BloodGroup)
          ? { bloodGroup: bloodGroupParam as BloodGroup }
          : {}),
        ...(searchParam
          ? {
              donor: {
                OR: [
                  { name: { contains: searchParam } },
                  { email: { contains: searchParam } },
                  { city: { contains: searchParam } },
                ],
              },
            }
          : {}),
      },
      include: {
        donor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
          },
        },
      },
      orderBy: { donationDate: "desc" },
    });

    const formatted = donations.map((d) => ({
      id: d.id,
      donorId: d.donorId,
      donorName: d.donor.name,
      donorEmail: d.donor.email,
      donorPhone: d.donor.phone,
      donorCity: d.donor.city,
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
    console.error("Admin fetch donations error:", error);
    return NextResponse.json({ error: "Failed to fetch donation records" }, { status: 500 });
  }
}
