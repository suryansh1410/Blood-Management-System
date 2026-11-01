import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STANDARD_APPOINTMENT_SLOTS } from "@/lib/constants";

// GET /api/appointments/slots?centerId=1&date=YYYY-MM-DD
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const centerIdStr = searchParams.get("centerId");
    const dateStr = searchParams.get("date");

    if (!centerIdStr || !dateStr) {
      return NextResponse.json(
        { error: "centerId and date query parameters are required" },
        { status: 400 }
      );
    }

    const centerId = parseInt(centerIdStr, 10);
    const targetDate = new Date(dateStr);

    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

    const center = await prisma.bloodCenter.findUnique({
      where: { id: centerId },
      include: {
        slotConfigs: {
          where: { dayOfWeek: targetDate.getDay(), isActive: true },
        },
      },
    });

    if (!center) {
      return NextResponse.json({ error: "Blood center not found" }, { status: 404 });
    }

    // Fetch existing bookings for this center on this date
    const existingBookings = await prisma.appointment.findMany({
      where: {
        centerId,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { in: ["BOOKED", "APPROVED"] },
      },
      select: { timeSlot: true },
    });

    const bookedCounts: Record<string, number> = {};
    for (const b of existingBookings) {
      bookedCounts[b.timeSlot] = (bookedCounts[b.timeSlot] || 0) + 1;
    }

    // Build slot list with capacities
    const slots = STANDARD_APPOINTMENT_SLOTS.map((slot) => {
      const config = center.slotConfigs.find((sc) => sc.timeSlot === slot);
      const maxCapacity = config?.maxCapacity || 6;
      const booked = bookedCounts[slot] || 0;
      const remaining = Math.max(0, maxCapacity - booked);
      const isAvailable = remaining > 0;

      return {
        timeSlot: slot,
        maxCapacity,
        booked,
        remaining,
        isAvailable,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        centerId,
        centerName: center.name,
        date: dateStr,
        slots,
      },
    });
  } catch (error: any) {
    console.error("Fetch appointment slots error:", error);
    return NextResponse.json({ error: "Failed to fetch appointment slots" }, { status: 500 });
  }
}
