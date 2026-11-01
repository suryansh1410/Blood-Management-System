import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { cancelRequest, ConflictError, ForbiddenError, NotFoundError } from "@/lib/business-logic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["PATIENT"]);
  if (!auth.authorized) return auth.errorResponse;

  const { id } = await params;

  try {
    const updated = await cancelRequest(id, auth.user!.id);
    return NextResponse.json({
      message: "Request cancelled successfully",
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("Cancel request error:", error);
    return NextResponse.json({ error: "Failed to cancel blood request" }, { status: 500 });
  }
}
