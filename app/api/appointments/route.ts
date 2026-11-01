import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { appointmentBookingSchema } from "@/lib/validations";
import { bookDonationAppointment } from "@/lib/business-logic";
import { BLOOD_GROUP_DISPLAY } from "@/lib/constants";

// POST /api/appointments — Book a donation appointment (Feature 4)
export async function POST(req: Request) {
  const auth = await requireAuth(["DONOR", "ADMIN", "HOSPITAL"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const body = await req.json();
    const parsed = appointmentBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const donorId = auth.user.role === "DONOR" ? auth.user.id : body.donorId || auth.user.id;

    const appointment = await bookDonationAppointment({
      donorId,
      centerId: parsed.data.centerId,
      appointmentDate: new Date(parsed.data.appointmentDate),
      timeSlot: parsed.data.timeSlot,
      bloodGroup: parsed.data.bloodGroup,
      component: parsed.data.component,
      notes: parsed.data.notes?.trim() || undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Appointment confirmed at ${appointment.center.name} on ${new Date(appointment.appointmentDate).toLocaleDateString("en-IN")} (${appointment.timeSlot}).`,
      data: {
        id: appointment.id,
        centerId: appointment.centerId,
        centerName: appointment.center.name,
        appointmentDate: appointment.appointmentDate,
        timeSlot: appointment.timeSlot,
        bloodGroup: appointment.bloodGroup,
        bloodGroupDisplay: BLOOD_GROUP_DISPLAY[appointment.bloodGroup],
        status: appointment.status,
      },
    });
  } catch (error: any) {
    console.error("Book appointment error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to schedule appointment" },
      { status: error.name === "ConflictError" ? 409 : 500 }
    );
  }
}

// GET /api/appointments — List appointments
export async function GET(req: Request) {
  const auth = await requireAuth(["DONOR", "ADMIN", "HOSPITAL"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const centerIdParam = searchParams.get("centerId");
    const statusParam = searchParams.get("status");

    const whereClause: any = {};

    if (auth.user.role === "DONOR") {
      whereClause.donorId = auth.user.id;
    } else if (auth.user.role === "HOSPITAL" && auth.user.centerId) {
      whereClause.centerId = auth.user.centerId;
    } else if (centerIdParam) {
      whereClause.centerId = parseInt(centerIdParam, 10);
    }

    if (statusParam && statusParam.toUpperCase() !== "ALL") {
      whereClause.status = statusParam;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        center: { select: { id: true, name: true, city: true, address: true, phone: true } },
        donor: { select: { id: true, name: true, phone: true, email: true } },
      },
      orderBy: [
        { appointmentDate: "desc" },
        { timeSlot: "asc" },
      ],
      take: 50,
    });

    const formatted = appointments.map((a) => ({
      id: a.id,
      centerId: a.centerId,
      center: a.center,
      donor:
        auth.user.role === "DONOR"
          ? { id: a.donor.id, name: a.donor.name }
          : a.donor, // Hospital/admin sees donor contact for appointment verification
      appointmentDate: a.appointmentDate,
      timeSlot: a.timeSlot,
      bloodGroup: a.bloodGroup,
      bloodGroupDisplay: BLOOD_GROUP_DISPLAY[a.bloodGroup],
      component: a.component,
      status: a.status,
      notes: a.notes,
      attendanceMarked: a.attendanceMarked,
      completedAt: a.completedAt,
      createdAt: a.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error("Fetch appointments error:", error);
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}
