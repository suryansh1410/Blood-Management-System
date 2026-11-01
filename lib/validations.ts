import { z } from "zod";

const bloodGroupEnum = z.enum([
  "A_POS",
  "A_NEG",
  "B_POS",
  "B_NEG",
  "AB_POS",
  "AB_NEG",
  "O_POS",
  "O_NEG",
]);

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/\d/, "Password must contain at least one number"),
    phone: z
      .string()
      .min(7, "Phone number must be at least 7 digits")
      .max(15, "Phone number must be at most 15 digits")
      .regex(/^[0-9+\-\s()]+$/, "Phone number contains invalid characters"),
    role: z.enum(["DONOR", "PATIENT"]),
    city: z.string().min(2, "City is required"),
    address: z.string().optional().nullable(),
    organizationName: z.string().optional().nullable(),
    bloodGroup: bloodGroupEnum.optional(),
  })
  .refine(
    (data) => {
      if (data.role === "DONOR" && !data.bloodGroup) {
        return false;
      }
      return true;
    },
    {
      message: "Blood group is required for donors",
      path: ["bloodGroup"],
    }
  );

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const donorProfileUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .min(7, "Phone number must be at least 7 digits")
    .max(15, "Phone number must be at most 15 digits"),
  city: z.string().min(2, "City is required"),
  address: z.string().optional().nullable(),
});

export const availabilityUpdateSchema = z.object({
  availabilityStatus: z.enum(["AVAILABLE", "UNAVAILABLE"]),
  reason: z.string().optional(),
});

export const donationRecordSchema = z.object({
  bloodGroup: bloodGroupEnum,
  units: z.coerce.number().int().min(1, "Must be at least 1 unit").default(1),
  donationDate: z.coerce.date(),
});

export const bloodRequestSchema = z.object({
  patientName: z.string().min(2, "Patient name is required"),
  bloodGroup: bloodGroupEnum,
  unitsRequired: z.coerce
    .number()
    .int("Units must be an integer")
    .min(1, "Must request at least 1 unit")
    .max(50, "Requests cannot exceed 50 units per submission"),
  hospitalName: z.string().min(2, "Hospital name is required"),
  city: z.string().min(2, "City is required"),
  contactNumber: z
    .string()
    .min(7, "Contact number must be at least 7 digits")
    .max(15, "Contact number must be at most 15 digits"),
  requiredDate: z.coerce.date().refine(
    (date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    },
    {
      message: "Required date cannot be in the past",
    }
  ),
  urgency: z.enum(["NORMAL", "URGENT", "EMERGENCY"]).default("NORMAL"),
  additionalInfo: z.string().optional().nullable(),
});

export const stockAdjustmentSchema = z.object({
  units: z.coerce.number().int("Units must be an integer"),
  mode: z.enum(["DELTA", "SET"]).default("DELTA"),
});

export const userStatusSchema = z.object({
  isActive: z.boolean(),
});

// ─── Blood Center schemas (new for Blood Finder feature) ───────────────────

export const bloodCenterSchema = z.object({
  name: z.string().min(1, "Center name is required"),
  type: z.enum(["BLOOD_BANK", "HOSPITAL"]),
  city: z.string().min(1, "City is required"),
  address: z.string().min(1, "Address is required"),
  // 10-digit numeric phone — same simplification as project convention
  phone: z.string().regex(/^\d{10}$/, "Phone must be exactly 10 digits (numbers only)"),
});

export const bloodCenterUpdateSchema = bloodCenterSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const centerStockAdjustSchema = z.object({
  bloodGroup: z.enum([
    "A_POS", "A_NEG", "B_POS", "B_NEG",
    "AB_POS", "AB_NEG", "O_POS", "O_NEG",
  ]),
  action: z.enum(["add", "remove", "set"]),
  units: z.coerce.number().int("Units must be an integer").min(0, "Units must be non-negative"),
});

