import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { bloodCenterSchema } from "@/lib/validations";
import { ALL_BLOOD_GROUPS, BLOOD_GROUP_DISPLAY, getStockStatus, getStockStatusLabel } from "@/lib/constants";

// GET /api/centers — Admin: list all centers with filters
export async function GET(req: Request) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.errorResponse;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const city = searchParams.get("city")?.trim() || "";
  const type = searchParams.get("type")?.trim() || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = 20;

  const where: any = {};
  if (search) where.name = { contains: search, mode: "insensitive" };
  if (city) where.city = { equals: city, mode: "insensitive" };
  if (type === "BLOOD_BANK" || type === "HOSPITAL") where.type = type;

  const [centers, total] = await Promise.all([
    prisma.bloodCenter.findMany({
      where,
      include: { stocks: true },
      orderBy: [{ isMain: "desc" }, { city: "asc" }, { name: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.bloodCenter.count({ where }),
  ]);

  const formatted = centers.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    city: c.city,
    address: c.address,
    phone: c.phone,
    isMain: c.isMain,
    isActive: c.isActive,
    createdAt: c.createdAt,
    stocks: c.stocks.map((s) => {
      const status = getStockStatus(s.units);
      return {
        bloodGroup: s.bloodGroup,
        displayGroup: BLOOD_GROUP_DISPLAY[s.bloodGroup],
        units: s.units,
        status,
        statusLabel: getStockStatusLabel(status),
      };
    }),
  }));

  return NextResponse.json({ data: formatted, total, page, pageSize });
}

// POST /api/centers — Admin: create a new partner center
export async function POST(req: Request) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const body = await req.json();
    const parsed = bloodCenterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const { name, type, city, address, phone } = parsed.data;

    const center = await prisma.$transaction(async (tx) => {
      const newCenter = await tx.bloodCenter.create({
        data: { name, type, city, address, phone, isMain: false, isActive: true },
      });
      // Auto-create 8 BloodStock rows at 0 units
      for (const bg of ALL_BLOOD_GROUPS) {
        await tx.bloodStock.create({
          data: { centerId: newCenter.id, bloodGroup: bg, units: 0 },
        });
      }
      return newCenter;
    });

    return NextResponse.json(
      { success: true, message: `Center "${center.name}" created successfully.`, data: { id: center.id } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create center error:", error);
    return NextResponse.json({ error: "Failed to create center" }, { status: 500 });
  }
}
