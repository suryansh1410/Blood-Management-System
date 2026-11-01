import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { availabilityUpdateSchema } from "@/lib/validations";

export async function PATCH(req: Request) {
  const auth = await requireAuth(["DONOR"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const body = await req.json();
    const parsed = availabilityUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const updatedProfile = await prisma.donorProfile.update({
      where: { userId: auth.user!.id },
      data: {
        availabilityStatus: parsed.data.availabilityStatus,
      },
    });

    return NextResponse.json({
      message: `Availability status updated to ${parsed.data.availabilityStatus}`,
      data: updatedProfile,
    });
  } catch (error: any) {
    console.error("Update availability error:", error);
    return NextResponse.json({ error: "Failed to update availability" }, { status: 500 });
  }
}
