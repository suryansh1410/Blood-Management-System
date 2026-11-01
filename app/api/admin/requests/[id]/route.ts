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
    const request = await prisma.bloodRequest.findUnique({
      where: { id },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            organizationName: true,
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ error: "Blood request not found" }, { status: 404 });
    }

    const mainCenter = await prisma.bloodCenter.findFirst({ where: { isMain: true } });
    const currentStock = mainCenter
      ? await prisma.bloodStock.findUnique({
          where: {
            centerId_bloodGroup: {
              centerId: mainCenter.id,
              bloodGroup: request.bloodGroup,
            },
          },
        })
      : null;

    return NextResponse.json({
      data: {
        ...request,
        bloodGroupDisplay: BLOOD_GROUP_DISPLAY[request.bloodGroup],
        currentStockUnits: currentStock ? currentStock.units : 0,
      },
    });
  } catch (error: any) {
    console.error("Admin fetch request detail error:", error);
    return NextResponse.json({ error: "Failed to fetch request detail" }, { status: 500 });
  }
}
