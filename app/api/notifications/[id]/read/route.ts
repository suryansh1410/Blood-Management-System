import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.errorResponse;

  const { id } = await params;

  try {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    // Must belong to user, or if broadcast (userId === null), user must be ADMIN
    const isOwner = notification.userId === auth.user.id;
    const isAdminBroadcast = notification.userId === null && auth.user.role === "ADMIN";

    if (!isOwner && !isAdminBroadcast) {
      return NextResponse.json(
        { error: "Unauthorized access to this notification" },
        { status: 403 }
      );
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({
      message: "Notification marked as read",
      data: updated,
    });
  } catch (error: any) {
    console.error("Mark notification read error:", error);
    return NextResponse.json({ error: "Failed to mark notification as read" }, { status: 500 });
  }
}
