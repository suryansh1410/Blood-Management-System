import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patientProfileSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(7, "Phone is required"),
  city: z.string().min(2, "City is required"),
  address: z.string().optional().nullable(),
  organizationName: z.string().optional().nullable(),
});

export async function GET() {
  const auth = await requireAuth(["PATIENT"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.user!.id },
    });

    if (!user) {
      return NextResponse.json({ error: "Patient account not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        address: user.address,
        organizationName: user.organizationName,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Fetch patient profile error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAuth(["PATIENT"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const body = await req.json();
    const parsed = patientProfileSchema.safeParse(body);

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
        organizationName: parsed.data.organizationName || null,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        city: updatedUser.city,
        address: updatedUser.address,
        organizationName: updatedUser.organizationName,
      },
    });
  } catch (error: any) {
    console.error("Update patient profile error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
