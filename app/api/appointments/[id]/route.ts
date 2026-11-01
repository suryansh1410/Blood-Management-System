import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/appointments/[id] — Cancel, approve, or reschedule appointment
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["DONOR", "ADMIN", "HOSPITAL"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, notes, cancellationReason, timeSlot, appointmentDate } = body;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { center: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Role check: Donors can only cancel/reschedule their own appointment
    if (auth.user.role === "DONOR" && appointment.donorId !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Hospital staff check: Can only manage appointments at their center
    if (auth.user.role === "HOSPITAL" && auth.user.centerId && auth.user.centerId !== appointment.centerId) {
      return NextResponse.json({ error: "Forbidden: Not your center's appointment" }, { status: 403 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes) updateData.notes = notes;
    if (cancellationReason) updateData.cancellationReason = cancellationReason;
    if (timeSlot) updateData.timeSlot = timeSlot;
    if (appointmentDate) updateData.appointmentDate = new Date(appointmentDate);

    const updated = await prisma.appointment.update({
      where: { id },
      data: updateData,
    });

    // Notify donor if hospital changed status
    if (auth.user.id !== appointment.donorId) {
      await prisma.notification.create({
        data: {
          userId: appointment.donorId,
          type: "APPOINTMENT_UPDATE",
          message: `Your appointment at ${appointment.center.name} has been updated to ${status || "Modified"}.`,
          metadata: {
            appointmentId: appointment.id,
            status: status || appointment.status,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Appointment updated successfully",
      data: updated,
    });
  } catch (error: any) {
    console.error("Update appointment error:", error);
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 });
  }
}
