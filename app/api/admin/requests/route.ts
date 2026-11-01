import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { BLOOD_GROUP_DISPLAY } from "@/lib/constants";
import { RequestStatus, BloodGroup, Urgency } from "@prisma/client";

export async function GET(req: Request) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const bloodGroupParam = searchParams.get("bloodGroup");
    const urgencyParam = searchParams.get("urgency");
    const searchParam = searchParams.get("search")?.toLowerCase().trim();

    const requests = await prisma.bloodRequest.findMany({
      where: {
        ...(statusParam && Object.values(RequestStatus).includes(statusParam as RequestStatus)
          ? { status: statusParam as RequestStatus }
          : {}),
        ...(bloodGroupParam && Object.values(BloodGroup).includes(bloodGroupParam as BloodGroup)
          ? { bloodGroup: bloodGroupParam as BloodGroup }
          : {}),
        ...(urgencyParam && Object.values(Urgency).includes(urgencyParam as Urgency)
          ? { urgency: urgencyParam as Urgency }
          : {}),
        ...(searchParam
          ? {
              OR: [
                { id: { contains: searchParam } },
                { patientName: { contains: searchParam } },
                { hospitalName: { contains: searchParam } },
                { city: { contains: searchParam } },
              ],
            }
          : {}),
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            organizationName: true,
          },
        },
      },
      orderBy: [{ urgency: "desc" }, { requestDate: "desc" }],
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
      requester: r.requester,
    }));

    return NextResponse.json({ data: formatted });
  } catch (error: any) {
    console.error("Admin fetch requests error:", error);
    return NextResponse.json({ error: "Failed to fetch blood requests" }, { status: 500 });
  }
}
