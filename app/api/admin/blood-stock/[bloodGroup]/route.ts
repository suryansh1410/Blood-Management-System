import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { adjustStock, ValidationError, NotFoundError } from "@/lib/business-logic";
import { stockAdjustmentSchema } from "@/lib/validations";
import { BloodGroup } from "@prisma/client";
import { ALL_BLOOD_GROUPS, BLOOD_GROUP_DISPLAY } from "@/lib/constants";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ bloodGroup: string }> }
) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.errorResponse;

  const { bloodGroup } = await params;

  if (!ALL_BLOOD_GROUPS.includes(bloodGroup as BloodGroup)) {
    return NextResponse.json({ error: "Invalid blood group identifier" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = stockAdjustmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const updated = await adjustStock(
      bloodGroup as BloodGroup,
      parsed.data.units,
      parsed.data.mode,
      auth.user.id
    );

    return NextResponse.json({
      message: `Stock for ${BLOOD_GROUP_DISPLAY[bloodGroup as BloodGroup]} updated to ${updated.units} units.`,
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Admin adjust stock error:", error);
    return NextResponse.json({ error: "Failed to update blood stock" }, { status: 500 });
  }
}
