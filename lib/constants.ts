import { BloodGroup } from "@prisma/client";

export const STOCK_THRESHOLDS = {
  OUT_OF_STOCK: 0, // units === 0 -> Out of Stock
  CRITICAL_MAX: 5, // 1 <= units <= 5 -> Critical
  LOW_MAX: 15,     // 6 <= units <= 15 -> Low Stock
  // units > 15 -> Available
} as const;

export type StockStatus = "OUT_OF_STOCK" | "CRITICAL" | "LOW_STOCK" | "AVAILABLE";

export function getStockStatus(units: number): StockStatus {
  if (units <= STOCK_THRESHOLDS.OUT_OF_STOCK) return "OUT_OF_STOCK";
  if (units <= STOCK_THRESHOLDS.CRITICAL_MAX) return "CRITICAL";
  if (units <= STOCK_THRESHOLDS.LOW_MAX) return "LOW_STOCK";
  return "AVAILABLE";
}

export function getStockStatusLabel(status: StockStatus): string {
  switch (status) {
    case "OUT_OF_STOCK":
      return "Out of Stock";
    case "CRITICAL":
      return "Critical";
    case "LOW_STOCK":
      return "Low Stock";
    case "AVAILABLE":
      return "Available";
  }
}

export const BLOOD_GROUP_DISPLAY: Record<BloodGroup, string> = {
  A_POS: "A+",
  A_NEG: "A-",
  B_POS: "B+",
  B_NEG: "B-",
  AB_POS: "AB+",
  AB_NEG: "AB-",
  O_POS: "O+",
  O_NEG: "O-",
};

export const DISPLAY_TO_BLOOD_GROUP: Record<string, BloodGroup> = {
  "A+": "A_POS",
  "A-": "A_NEG",
  "B+": "B_POS",
  "B-": "B_NEG",
  "AB+": "AB_POS",
  "AB-": "AB_NEG",
  "O+": "O_POS",
  "O-": "O_NEG",
};

export const ALL_BLOOD_GROUPS: BloodGroup[] = [
  "A_POS",
  "A_NEG",
  "B_POS",
  "B_NEG",
  "AB_POS",
  "AB_NEG",
  "O_POS",
  "O_NEG",
];
