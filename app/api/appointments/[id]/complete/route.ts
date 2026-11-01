import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { completeAppointmentWithDonation } from "@/lib/business-logic";

// POST /api/appointments/[id]/complete — Hospital staff marks donation completed & updates stock (Feature 4)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["HOSPITAL", "ADMIN"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const units = body.units ? Math.max(1, parseInt(body.units, 10)) : 1;

    const result = await completeAppointmentWithDonation(id, auth.user.id, units);

    return NextResponse.json({
      success: true,
      message: `Donation verified and processed! ${units} unit(s) credited to centre inventory.`,
      data: {
        appointmentId: result.appointment.id,
        donationId: result.donation.id,
        unitsCollected: result.donation.units,
        updatedStockUnits: result.stock.units,
      },
    });
  } catch (error: any) {
    console.error("Complete appointment error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to complete donation appointment" },
      { status: error.name === "ConflictError" ? 409 : 500 }
    );
  }
}
