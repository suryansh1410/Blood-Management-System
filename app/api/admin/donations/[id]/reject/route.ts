import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { rejectDonation, ConflictError, NotFoundError } from "@/lib/business-logic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.errorResponse;

  const { id } = await params;

  try {
    let reason: string | undefined;
    try {
      const body = await req.json();
      reason = body.reason;
    } catch {
      // Reason is optional
    }

    const result = await rejectDonation(id, reason, auth.user.id);
    return NextResponse.json({
      message: "Donation record rejected.",
      data: result,
    });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("Reject donation error:", error);
    return NextResponse.json({ error: "Failed to reject donation" }, { status: 500 });
  }
}
