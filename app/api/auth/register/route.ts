import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Prevent direct injection of ADMIN role
    if (body.role === "ADMIN") {
      return NextResponse.json(
        { error: "Admin accounts cannot be self-registered" },
        { status: 403 }
      );
    }

    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      const issues = validationResult.error.issues.map((i) => i.message);
      return NextResponse.json(
        { error: issues.join(", "), details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const emailNormalized = data.email.toLowerCase().trim();

    // Check unique email
    const existing = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: emailNormalized,
          passwordHash,
          phone: data.phone,
          role: data.role,
          city: data.city,
          address: data.address || null,
          organizationName: data.role === "PATIENT" ? data.organizationName || null : null,
          isActive: true,
          ...(data.role === "DONOR" && data.bloodGroup
            ? {
                donorProfile: {
                  create: {
                    bloodGroup: data.bloodGroup,
                    availabilityStatus: "AVAILABLE",
                  },
                },
              }
            : {}),
        },
        include: {
          donorProfile: true,
        },
      });

      // Welcome notification
      await tx.notification.create({
        data: {
          userId: user.id,
          type: "WELCOME",
          message:
            data.role === "DONOR"
              ? "Welcome to the Blood Bank System! Thank you for registering as a life-saving blood donor."
              : "Welcome to the Blood Bank System! You can now request and track blood supplies for medical needs.",
        },
      });

      return user;
    });

    return NextResponse.json(
      {
        message: "Account registered successfully",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error while creating account" },
      { status: 500 }
    );
  }
}
