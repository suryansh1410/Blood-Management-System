import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.errorResponse;

  try {
    const isAdmin = auth.user!.role === "ADMIN";

    const notifications = await prisma.notification.findMany({
      where: isAdmin
        ? {
            OR: [{ userId: null }, { userId: auth.user!.id }],
          }
        : {
            userId: auth.user!.id,
          },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ data: notifications });
  } catch (error: any) {
    console.error("Fetch notifications error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
