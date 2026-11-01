import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase().trim();
    const city = searchParams.get("city")?.trim();

    const patients = await prisma.user.findMany({
      where: {
        role: "PATIENT",
        ...(city ? { city: { contains: city } } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { email: { contains: search } },
                { phone: { contains: search } },
                { city: { contains: search } },
                { organizationName: { contains: search } },
              ],
            }
          : {}),
      },
      include: {
        bloodRequests: {
          select: { id: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = patients.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      city: p.city,
      address: p.address,
      organizationName: p.organizationName,
      isActive: p.isActive,
      totalRequests: p.bloodRequests.length,
      pendingRequests: p.bloodRequests.filter((r) => r.status === "PENDING").length,
      fulfilledRequests: p.bloodRequests.filter((r) => r.status === "FULFILLED").length,
      createdAt: p.createdAt,
    }));

    return NextResponse.json({ data: formatted });
  } catch (error: any) {
    console.error("Admin fetch patients error:", error);
    return NextResponse.json({ error: "Failed to fetch patients list" }, { status: 500 });
  }
}
