import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { verifyDonation, ConflictError, NotFoundError } from "@/lib/business-logic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.errorResponse;

  const { id } = await params;

  try {
    const result = await verifyDonation(id, auth.user.id);
    return NextResponse.json({
      message: "Donation verified successfully. Blood stock inventory increased.",
      data: result,
    });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("Verify donation error:", error);
    return NextResponse.json({ error: "Failed to verify donation" }, { status: 500 });
  }
}
