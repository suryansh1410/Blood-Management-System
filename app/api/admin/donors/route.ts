import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { BLOOD_GROUP_DISPLAY } from "@/lib/constants";
import { BloodGroup, AvailabilityStatus } from "@prisma/client";

export async function GET(req: Request) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase().trim();
    const bloodGroup = searchParams.get("bloodGroup");
    const availability = searchParams.get("availability");
    const city = searchParams.get("city")?.trim();

    const donors = await prisma.user.findMany({
      where: {
        role: "DONOR",
        ...(bloodGroup ? { donorProfile: { bloodGroup: bloodGroup as BloodGroup } } : {}),
        ...(availability ? { donorProfile: { availabilityStatus: availability as AvailabilityStatus } } : {}),
        ...(city ? { city: { contains: city } } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { email: { contains: search } },
                { phone: { contains: search } },
                { city: { contains: search } },
              ],
            }
          : {}),
      },
      include: {
        donorProfile: true,
        donations: {
          where: { status: "VERIFIED" },
          orderBy: { donationDate: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = donors.map((d) => {
      const totalDonations = d.donations.reduce((sum, don) => sum + don.units, 0);
      const lastDonationDate = d.donations.length > 0 ? d.donations[0].donationDate : null;

      return {
        id: d.id,
        name: d.name,
        email: d.email,
        phone: d.phone,
        city: d.city,
        address: d.address,
        isActive: d.isActive,
        bloodGroup: d.donorProfile?.bloodGroup || null,
        bloodGroupDisplay: d.donorProfile?.bloodGroup ? BLOOD_GROUP_DISPLAY[d.donorProfile.bloodGroup] : "N/A",
        availabilityStatus: d.donorProfile?.availabilityStatus || "UNAVAILABLE",
        totalDonations,
        lastDonationDate,
        createdAt: d.createdAt,
      };
    });

    return NextResponse.json({ data: formatted });
  } catch (error: any) {
    console.error("Admin fetch donors error:", error);
    return NextResponse.json({ error: "Failed to fetch donors list" }, { status: 500 });
  }
}
