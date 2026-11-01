import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { approveRequest, ConflictError, NotFoundError } from "@/lib/business-logic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.errorResponse;

  const { id } = await params;

  try {
    const updated = await approveRequest(id, auth.user.id);
    return NextResponse.json({
      message: "Blood request approved. Requester has been notified.",
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("Approve request error:", error);
    return NextResponse.json({ error: "Failed to approve blood request" }, { status: 500 });
  }
}
