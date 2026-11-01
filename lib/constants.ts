import { BloodGroup } from "@prisma/client";

export const STOCK_THRESHOLDS = {
  OUT_OF_STOCK: 0, // units === 0 -> Out of Stock
  CRITICAL_MAX: 5, // 1 <= units <= 5 -> Critical
  LOW_MAX: 15,     // 6 <= units <= 15 -> Low Stock
  // units > 15 -> Available
} as const;

export type StockStatus = "OUT_OF_STOCK" | "CRITICAL" | "LOW_STOCK" | "AVAILABLE" | "AVAILABILITY_NOT_UPDATED";

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
    case "AVAILABILITY_NOT_UPDATED":
      return "Availability Not Updated";
    default:
      return "Unknown";
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

// Blood Components supported by standard Indian Blood Transfusion guidelines
export const SUPPORTED_BLOOD_COMPONENTS = [
  "Whole Blood",
  "Packed Red Blood Cells (PRBC)",
  "Platelets (Single Donor - SDP)",
  "Platelets (Random Donor - RDP)",
  "Fresh Frozen Plasma (FFP)",
  "Cryoprecipitate",
] as const;

export type BloodComponent = typeof SUPPORTED_BLOOD_COMPONENTS[number];

// Standard 11-step tracking lifecycle as required in Feature 5
export const TRACKING_STATUSES = [
  "SUBMITTED",
  "VERIFICATION_PENDING",
  "VERIFIED",
  "SEARCHING",
  "HOSPITAL_RESPONDED",
  "AVAILABILITY_CONFIRMED",
  "RESERVED",
  "FULFILLED",
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
] as const;

export type TrackingStatus = typeof TRACKING_STATUSES[number];

export const TRACKING_STATUS_INFO: Record<
  TrackingStatus,
  { label: string; description: string; stepNumber: number; isTerminal?: boolean; variant: "blue" | "emerald" | "amber" | "rose" | "slate" | "purple" }
> = {
  SUBMITTED: {
    label: "Submitted",
    description: "Emergency request registered in system. Generating security token and matching matrix.",
    stepNumber: 1,
    variant: "blue",
  },
  VERIFICATION_PENDING: {
    label: "Verification Pending",
    description: "Awaiting patient identity and medical authorization verification.",
    stepNumber: 2,
    variant: "amber",
  },
  VERIFIED: {
    label: "Verified",
    description: "Request authenticated. Transfusion urgency and hospital admittance verified.",
    stepNumber: 3,
    variant: "blue",
  },
  SEARCHING: {
    label: "Searching",
    description: "Broadcasting to verified blood banks and consenting donors in proximity.",
    stepNumber: 4,
    variant: "purple",
  },
  HOSPITAL_RESPONDED: {
    label: "Hospital Responded",
    description: "A registered blood centre has received the alert and initiated inventory check.",
    stepNumber: 5,
    variant: "cyan" as any,
  },
  AVAILABILITY_CONFIRMED: {
    label: "Availability Confirmed",
    description: "Hospital staff confirmed physical availability of requested blood units.",
    stepNumber: 6,
    variant: "emerald",
  },
  RESERVED: {
    label: "Reserved",
    description: "Units officially tagged and held in quarantine cold-chain for the patient.",
    stepNumber: 7,
    variant: "emerald",
  },
  FULFILLED: {
    label: "Fulfilled",
    description: "Units collected, cross-matched, and delivered for clinical transfusion.",
    stepNumber: 8,
    isTerminal: true,
    variant: "emerald",
  },
  REJECTED: {
    label: "Rejected",
    description: "Request could not be processed by the center or failed medical criteria.",
    stepNumber: -1,
    isTerminal: true,
    variant: "rose",
  },
  CANCELLED: {
    label: "Cancelled",
    description: "Request was cancelled by the requester or attending hospital staff.",
    stepNumber: -1,
    isTerminal: true,
    variant: "slate",
  },
  EXPIRED: {
    label: "Expired",
    description: "Request reached expiration timestamp without fulfillment.",
    stepNumber: -1,
    isTerminal: true,
    variant: "slate",
  },
};

// Strict state transition graph to prevent invalid status jumps
export const ALLOWED_STATUS_TRANSITIONS: Record<TrackingStatus, TrackingStatus[]> = {
  SUBMITTED: ["VERIFICATION_PENDING", "VERIFIED", "CANCELLED", "REJECTED"],
  VERIFICATION_PENDING: ["VERIFIED", "REJECTED", "CANCELLED"],
  VERIFIED: ["SEARCHING", "HOSPITAL_RESPONDED", "CANCELLED", "REJECTED"],
  SEARCHING: ["HOSPITAL_RESPONDED", "AVAILABILITY_CONFIRMED", "CANCELLED", "EXPIRED", "REJECTED"],
  HOSPITAL_RESPONDED: ["AVAILABILITY_CONFIRMED", "RESERVED", "REJECTED", "CANCELLED"],
  AVAILABILITY_CONFIRMED: ["RESERVED", "FULFILLED", "CANCELLED", "REJECTED"],
  RESERVED: ["FULFILLED", "CANCELLED", "EXPIRED"],
  FULFILLED: [], // terminal
  REJECTED: [],  // terminal
  CANCELLED: [], // terminal
  EXPIRED: [],   // terminal
};

export function canTransitionStatus(current: TrackingStatus, next: TrackingStatus): boolean {
  if (current === next) return true;
  const allowed = ALLOWED_STATUS_TRANSITIONS[current] || [];
  return allowed.includes(next);
}

// Haversine formula to compute distance in km between two lat/lng coordinates
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // 1 decimal place
}

// Generate unique human-readable tracking identifier e.g. "REQ-202611-8291"
export function generateRequestCode(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random4 = Math.floor(1000 + Math.random() * 9000);
  return `REQ-${year}${month}-${random4}`;
}

// Privacy-preserving donor name generator: "Rahul S." or "Donor #4920"
export function formatDonorPrivacyName(name?: string | null, userId?: string): string {
  if (!name || name.trim().length === 0) {
    const fallbackId = userId ? userId.slice(-4).toUpperCase() : "XXXX";
    return `Donor #${fallbackId}`;
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return `${parts[0].slice(0, 4)}***`;
  }
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase() || "";
  return `${first} ${lastInitial}.`;
}

// Standard appointment booking time slots
export const STANDARD_APPOINTMENT_SLOTS = [
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "12:00 - 13:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
  "16:00 - 17:00",
] as const;
