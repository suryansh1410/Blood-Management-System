import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { BLOOD_GROUP_DISPLAY } from "@/lib/constants";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["PATIENT"]);
  if (!auth.authorized) return auth.errorResponse;

  const { id } = await params;

  try {
    const request = await prisma.bloodRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return NextResponse.json({ error: "Blood request not found" }, { status: 404 });
    }

    if (request.requesterId !== auth.user!.id) {
      return NextResponse.json(
        { error: "You are not authorized to view this request" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      data: {
        ...request,
        bloodGroupDisplay: BLOOD_GROUP_DISPLAY[request.bloodGroup],
      },
    });
  } catch (error: any) {
    console.error("Fetch request detail error:", error);
    return NextResponse.json({ error: "Failed to fetch request details" }, { status: 500 });
  }
}
