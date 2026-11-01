import { BloodGroup, PrismaClient, AuditAction } from "@prisma/client";
import { prisma as defaultPrisma } from "./prisma";
import {
  getStockStatus,
  STOCK_THRESHOLDS,
  BLOOD_GROUP_DISPLAY,
  generateRequestCode,
  canTransitionStatus,
  calculateDistanceKm,
  formatDonorPrivacyName,
  TrackingStatus,
  TRACKING_STATUS_INFO,
} from "./constants";

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

async function recordAudit(
  tx: any,
  adminId: string | undefined,
  action: AuditAction,
  targetId: string,
  targetType: "Donation" | "BloodRequest" | "BloodStock" | "User",
  metadata?: any
) {
  if (!adminId) return;
  try {
    await tx.auditLog.create({
      data: {
        adminId,
        action,
        targetId,
        targetType,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

export async function getDonorStats(donorId: string, client = defaultPrisma) {
  const verifiedDonations = await client.donation.findMany({
    where: {
      donorId,
      status: "VERIFIED",
    },
    orderBy: {
      donationDate: "desc",
    },
  });

  const totalDonations = verifiedDonations.reduce((sum, d) => sum + d.units, 0);
  const lastDonationDate = verifiedDonations.length > 0 ? verifiedDonations[0].donationDate : null;

  return {
    totalDonations,
    lastDonationDate,
  };
}

const TX_OPTIONS = { maxWait: 15000, timeout: 30000 };

export async function verifyDonation(
  donationId: string,
  adminId?: string,
  client = defaultPrisma
) {
  return await client.$transaction(async (tx) => {
    const donation = await tx.donation.findUnique({
      where: { id: donationId },
    });

    if (!donation) {
      throw new NotFoundError("Donation record not found");
    }

    if (donation.status !== "PENDING") {
      throw new ConflictError("Only pending donations can be verified");
    }

    const updatedDonation = await tx.donation.update({
      where: { id: donationId },
      data: {
        status: "VERIFIED",
        verifiedAt: new Date(),
      },
    });

    const mainCenter = await tx.bloodCenter.findFirst({ where: { isMain: true } });
    if (!mainCenter) {
      throw new NotFoundError("Main Blood Bank center not found");
    }

    const stock = await tx.bloodStock.findUnique({
      where: { centerId_bloodGroup: { centerId: mainCenter.id, bloodGroup: donation.bloodGroup } },
    });

    if (!stock) {
      throw new NotFoundError(`Blood stock row for group ${donation.bloodGroup} not found at Main Blood Bank`);
    }

    const updatedStock = await tx.bloodStock.update({
      where: { centerId_bloodGroup: { centerId: mainCenter.id, bloodGroup: donation.bloodGroup } },
      data: {
        units: {
          increment: donation.units,
        },
      },
    });

    await tx.notification.create({
      data: {
        userId: donation.donorId,
        type: "DONATION_VERIFIED",
        message: `Your donation of ${donation.units} unit(s) of ${BLOOD_GROUP_DISPLAY[donation.bloodGroup]} has been verified. Thank you!`,
      },
    });

    const newStatus = getStockStatus(updatedStock.units);
    if (newStatus !== "AVAILABLE") {
      await tx.notification.create({
        data: {
          userId: null,
          type: "LOW_STOCK_WARNING",
          message: `Blood stock for ${BLOOD_GROUP_DISPLAY[donation.bloodGroup]} is currently ${newStatus.replace("_", " ")} (${updatedStock.units} units remaining).`,
        },
      });
    }

    await recordAudit(tx, adminId, "DONATION_VERIFIED", donationId, "Donation", {
      units: donation.units,
      bloodGroup: donation.bloodGroup,
      donorId: donation.donorId,
      newStockUnits: updatedStock.units,
    });

    return { donation: updatedDonation, stock: updatedStock };
  }, TX_OPTIONS);
}

export async function rejectDonation(
  donationId: string,
  reason?: string,
  adminId?: string,
  client = defaultPrisma
) {
  return await client.$transaction(async (tx) => {
    const donation = await tx.donation.findUnique({
      where: { id: donationId },
    });

    if (!donation) {
      throw new NotFoundError("Donation record not found");
    }

    if (donation.status !== "PENDING") {
      throw new ConflictError("Only pending donations can be rejected");
    }

    const updatedDonation = await tx.donation.update({
      where: { id: donationId },
      data: {
        status: "REJECTED",
        rejectionReason: reason || null,
      },
    });

    await tx.notification.create({
      data: {
        userId: donation.donorId,
        type: "DONATION_REJECTED",
        message: reason
          ? `Your donation record was rejected: ${reason}`
          : "Your donation record could not be verified by blood bank staff.",
      },
    });

    await recordAudit(tx, adminId, "DONATION_REJECTED", donationId, "Donation", {
      reason,
      donorId: donation.donorId,
    });

    return updatedDonation;
  }, TX_OPTIONS);
}

export async function approveRequest(
  requestId: string,
  adminId?: string,
  client = defaultPrisma
) {
  return await client.$transaction(async (tx) => {
    const request = await tx.bloodRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundError("Blood request not found");
    }

    if (request.status !== "PENDING") {
      throw new ConflictError("Only pending requests can be approved");
    }

    const updatedRequest = await tx.bloodRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
      },
    });

    await tx.notification.create({
      data: {
        userId: request.requesterId,
        type: "REQUEST_APPROVED",
        message: `Your request #${request.id.slice(-6)} for ${request.unitsRequired} unit(s) of ${BLOOD_GROUP_DISPLAY[request.bloodGroup]} has been approved. Awaiting fulfillment.`,
      },
    });

    await recordAudit(tx, adminId, "REQUEST_APPROVED", requestId, "BloodRequest", {
      units: request.unitsRequired,
      bloodGroup: request.bloodGroup,
      requesterId: request.requesterId,
    });

    return updatedRequest;
  }, TX_OPTIONS);
}

export async function fulfillRequest(
  requestId: string,
  adminId?: string,
  client = defaultPrisma
) {
  return await client.$transaction(async (tx) => {
    const request = await tx.bloodRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundError("Blood request not found");
    }

    if (request.status !== "APPROVED") {
      throw new ConflictError("Only approved requests can be fulfilled");
    }

    const mainCenter = await tx.bloodCenter.findFirst({ where: { isMain: true } });
    if (!mainCenter) {
      throw new NotFoundError("Main Blood Bank center not found");
    }

    const stock = await tx.bloodStock.findUnique({
      where: { centerId_bloodGroup: { centerId: mainCenter.id, bloodGroup: request.bloodGroup } },
    });

    if (!stock) {
      throw new NotFoundError(`Blood stock row for group ${request.bloodGroup} not found at Main Blood Bank`);
    }

    if (stock.units < request.unitsRequired) {
      throw new ConflictError(
        `Insufficient stock to fulfill this request. Available: ${stock.units}, Required: ${request.unitsRequired}`
      );
    }

    const updatedStock = await tx.bloodStock.update({
      where: { centerId_bloodGroup: { centerId: mainCenter.id, bloodGroup: request.bloodGroup } },
      data: {
        units: {
          decrement: request.unitsRequired,
        },
      },
    });

    const updatedRequest = await tx.bloodRequest.update({
      where: { id: requestId },
      data: {
        status: "FULFILLED",
        fulfilledAt: new Date(),
      },
    });

    await tx.notification.create({
      data: {
        userId: request.requesterId,
        type: "REQUEST_FULFILLED",
        message: `Your request #${request.id.slice(-6)} for ${request.unitsRequired} unit(s) of ${BLOOD_GROUP_DISPLAY[request.bloodGroup]} has been fulfilled.`,
      },
    });

    const newStatus = getStockStatus(updatedStock.units);
    if (newStatus !== "AVAILABLE") {
      await tx.notification.create({
        data: {
          userId: null,
          type: "LOW_STOCK_WARNING",
          message: `Blood stock for ${BLOOD_GROUP_DISPLAY[request.bloodGroup]} has dropped to ${newStatus.replace("_", " ")} (${updatedStock.units} units remaining).`,
        },
      });
    }

    await recordAudit(tx, adminId, "REQUEST_FULFILLED", requestId, "BloodRequest", {
      units: request.unitsRequired,
      bloodGroup: request.bloodGroup,
      requesterId: request.requesterId,
      remainingStock: updatedStock.units,
    });

    return { request: updatedRequest, stock: updatedStock };
  }, TX_OPTIONS);
}

export async function rejectRequest(
  requestId: string,
  reason?: string,
  adminId?: string,
  client = defaultPrisma
) {
  return await client.$transaction(async (tx) => {
    const request = await tx.bloodRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundError("Blood request not found");
    }

    if (request.status !== "PENDING" && request.status !== "APPROVED") {
      throw new ConflictError("Request cannot be rejected from its current status");
    }

    const updatedRequest = await tx.bloodRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        rejectionReason: reason || null,
      },
    });

    await tx.notification.create({
      data: {
        userId: request.requesterId,
        type: "REQUEST_REJECTED",
        message: reason
          ? `Your blood request was rejected: ${reason}`
          : "Your blood request was rejected by blood bank administration.",
      },
    });

    await recordAudit(tx, adminId, "REQUEST_REJECTED", requestId, "BloodRequest", {
      reason,
      requesterId: request.requesterId,
    });

    return updatedRequest;
  }, TX_OPTIONS);
}

export async function cancelRequest(requestId: string, actingUserId: string, client = defaultPrisma) {
  return await client.$transaction(async (tx) => {
    const request = await tx.bloodRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundError("Blood request not found");
    }

    if (request.requesterId !== actingUserId) {
      throw new ForbiddenError("You are not authorized to cancel this request");
    }

    if (request.status !== "PENDING" && request.status !== "APPROVED") {
      throw new ConflictError("Request cannot be cancelled from its current status");
    }

    const updatedRequest = await tx.bloodRequest.update({
      where: { id: requestId },
      data: {
        status: "CANCELLED",
      },
    });

    return updatedRequest;
  }, TX_OPTIONS);
}

export async function adjustStock(
  bloodGroup: BloodGroup,
  delta: number,
  mode: "DELTA" | "SET" = "DELTA",
  adminId?: string,
  client = defaultPrisma
) {
  return await client.$transaction(async (tx) => {
    // Always adjust Main Blood Bank's stock (the single source of truth for donation/request engine)
    const mainCenter = await tx.bloodCenter.findFirst({ where: { isMain: true } });
    if (!mainCenter) {
      throw new NotFoundError("Main Blood Bank center not found");
    }

    const stock = await tx.bloodStock.findUnique({
      where: { centerId_bloodGroup: { centerId: mainCenter.id, bloodGroup } },
    });

    if (!stock) {
      throw new NotFoundError(`Blood stock row for group ${bloodGroup} not found at Main Blood Bank`);
    }

    let newUnits: number;
    if (mode === "SET") {
      newUnits = delta;
    } else {
      newUnits = stock.units + delta;
    }

    if (newUnits < 0) {
      throw new ValidationError("Cannot reduce stock below zero");
    }

    const updatedStock = await tx.bloodStock.update({
      where: { centerId_bloodGroup: { centerId: mainCenter.id, bloodGroup } },
      data: {
        units: newUnits,
      },
    });

    const newStatus = getStockStatus(updatedStock.units);
    if (newStatus !== "AVAILABLE") {
      await tx.notification.create({
        data: {
          userId: null,
          type: "LOW_STOCK_WARNING",
          message: `Blood stock for ${BLOOD_GROUP_DISPLAY[bloodGroup]} updated to ${newStatus.replace("_", " ")} (${updatedStock.units} units).`,
        },
      });
    }

    await recordAudit(tx, adminId, "STOCK_ADJUSTED", bloodGroup, "BloodStock", {
      previousUnits: stock.units,
      newUnits: updatedStock.units,
      delta,
      mode,
    });

    return updatedStock;
  }, TX_OPTIONS);
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 1 & 5: EMERGENCY BLOOD REQUEST SYSTEM & TIMELINE TRACKING
// ─────────────────────────────────────────────────────────────────────────────

export interface EmergencyRequestInput {
  patientName: string;
  requesterName: string;
  contactNumber: string;
  bloodGroup: BloodGroup;
  component?: string;
  unitsRequired: number;
  state: string;
  city: string;
  hospitalName: string;
  hospitalAddress: string;
  urgency?: "NORMAL" | "URGENT" | "EMERGENCY";
  requiredDate: Date;
  additionalInfo?: string;
}

export async function createEmergencyRequest(
  data: EmergencyRequestInput,
  requesterId: string,
  client = defaultPrisma
) {
  return await client.$transaction(async (tx) => {
    const requestCode = generateRequestCode();
    const component = data.component || "Whole Blood";
    const urgency = data.urgency || "EMERGENCY";

    // 1. Create BloodRequest record
    const request = await tx.bloodRequest.create({
      data: {
        requestCode,
        requesterId,
        requesterName: data.requesterName,
        patientName: data.patientName,
        bloodGroup: data.bloodGroup,
        component,
        unitsRequired: data.unitsRequired,
        state: data.state,
        city: data.city,
        hospitalName: data.hospitalName,
        hospitalAddress: data.hospitalAddress,
        contactNumber: data.contactNumber,
        requiredDate: data.requiredDate,
        urgency,
        additionalInfo: data.additionalInfo || null,
        status: "PENDING",
        trackingStatus: "SUBMITTED",
      },
    });

    // 2. Create initial timeline event
    await tx.requestTimelineEvent.create({
      data: {
        requestId: request.id,
        status: "SUBMITTED",
        title: "Emergency Request Submitted",
        description: `Emergency request #${requestCode} logged for ${data.unitsRequired} unit(s) of ${BLOOD_GROUP_DISPLAY[data.bloodGroup]} (${component}) at ${data.hospitalName}, ${data.city}.`,
        performedBy: "REQUESTER",
      },
    });

    // 3. Find matching verified blood centres in the requested city or state
    const matchingCenters = await tx.bloodCenter.findMany({
      where: {
        isActive: true,
        city: { equals: data.city, mode: "insensitive" },
      },
      include: {
        stocks: {
          where: { bloodGroup: data.bloodGroup },
        },
      },
      orderBy: { popularRank: "asc" },
      take: 10,
    });

    // If city has matching centers, automatically transition to SEARCHING and link top center if available
    if (matchingCenters.length > 0) {
      await tx.bloodRequest.update({
        where: { id: request.id },
        data: {
          assignedCenterId: matchingCenters[0].id,
          trackingStatus: "SEARCHING",
        },
      });

      await tx.requestTimelineEvent.create({
        data: {
          requestId: request.id,
          status: "SEARCHING",
          title: "Network Search Initiated",
          description: `Identified ${matchingCenters.length} verified blood bank(s) in ${data.city}. Dispatching priority inventory check.`,
          performedBy: "SYSTEM",
        },
      });
    }

    // 4. Broadcast notification to system staff / admins
    await tx.notification.create({
      data: {
        userId: null,
        type: "REQUEST_SUBMITTED",
        message: `🚨 EMERGENCY REQUEST #${requestCode}: ${data.unitsRequired} unit(s) of ${BLOOD_GROUP_DISPLAY[data.bloodGroup]} (${component}) needed at ${data.hospitalName}, ${data.city}.`,
        metadata: {
          requestId: request.id,
          requestCode,
          urgency,
          city: data.city,
          bloodGroup: data.bloodGroup,
        },
      },
    });

    // 5. Identify consenting donors in proximity for alert coordination (Feature 2)
    const consentingDonors = await tx.user.findMany({
      where: {
        role: "DONOR",
        isActive: true,
        city: { equals: data.city, mode: "insensitive" },
        donorProfile: {
          bloodGroup: data.bloodGroup,
          notificationConsent: true,
          availabilityStatus: "AVAILABLE",
        },
      },
      include: { donorProfile: true },
      take: 15,
    });

    for (const donor of consentingDonors) {
      if (donor.donorProfile) {
        await tx.donorEmergencyAlert.create({
          data: {
            requestId: request.id,
            donorProfileId: donor.donorProfile.id,
            status: "SENT",
          },
        });

        await tx.notification.create({
          data: {
            userId: donor.id,
            type: "EMERGENCY_DONOR_ALERT",
            message: `Emergency Alert: Blood group ${BLOOD_GROUP_DISPLAY[data.bloodGroup]} urgently required near you in ${data.city} at ${data.hospitalName}. Can you donate?`,
            metadata: {
              requestId: request.id,
              requestCode,
              hospitalName: data.hospitalName,
              city: data.city,
              bloodGroup: data.bloodGroup,
            },
          },
        });
      }
    }

    return {
      request,
      requestCode,
      matchingCentersCount: matchingCenters.length,
      alertedDonorsCount: consentingDonors.length,
    };
  }, TX_OPTIONS);
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 1: HOSPITAL RESPONSE WORKFLOW
// ─────────────────────────────────────────────────────────────────────────────

export interface HospitalResponseInput {
  requestId: string;
  centerId: number;
  staffUserId: string;
  responseType:
    | "ACCEPTED_FOR_REVIEW"
    | "STOCK_CONFIRMED"
    | "RESERVED"
    | "REJECTED"
    | "CLARIFICATION_REQUESTED"
    | "FULFILLED";
  confirmedUnits?: number;
  notes?: string;
}

export async function recordHospitalEmergencyResponse(
  input: HospitalResponseInput,
  client = defaultPrisma
) {
  return await client.$transaction(async (tx) => {
    const request = await tx.bloodRequest.findUnique({
      where: { id: input.requestId },
      include: { requester: true },
    });

    if (!request) {
      throw new NotFoundError("Emergency blood request not found");
    }

    const center = await tx.bloodCenter.findUnique({
      where: { id: input.centerId },
    });

    if (!center) {
      throw new NotFoundError("Responding blood center not found");
    }

    // Record the hospital response record
    const responseRecord = await tx.hospitalResponse.create({
      data: {
        requestId: input.requestId,
        centerId: input.centerId,
        staffUserId: input.staffUserId,
        responseType: input.responseType,
        confirmedUnits: input.confirmedUnits,
        notes: input.notes,
      },
    });

    let nextTrackingStatus: TrackingStatus = request.trackingStatus as TrackingStatus;
    let nextRequestStatus = request.status;
    let timelineTitle = "";
    let timelineDesc = "";

    switch (input.responseType) {
      case "ACCEPTED_FOR_REVIEW":
        nextTrackingStatus = "HOSPITAL_RESPONDED";
        timelineTitle = "Request Accepted for Review";
        timelineDesc = `${center.name} has accepted request #${request.requestCode || request.id.slice(-6)} for clinical review.`;
        break;

      case "STOCK_CONFIRMED":
        nextTrackingStatus = "AVAILABILITY_CONFIRMED";
        timelineTitle = "Blood Availability Confirmed";
        timelineDesc = `${center.name} verified stock availability of ${input.confirmedUnits || request.unitsRequired} unit(s) of ${BLOOD_GROUP_DISPLAY[request.bloodGroup]}.`;
        break;

      case "RESERVED":
        nextTrackingStatus = "RESERVED";
        timelineTitle = "Units Placed on Hold / Reserved";
        const reservedQty = input.confirmedUnits || request.unitsRequired;
        timelineDesc = `${center.name} officially reserved ${reservedQty} unit(s) for ${request.patientName}. Cold-chain tag allocated.`;

        // Update reserved units on request & center stock
        await tx.bloodRequest.update({
          where: { id: request.id },
          data: { reservedUnits: reservedQty },
        });

        const centerStock = await tx.bloodStock.findUnique({
          where: { centerId_bloodGroup: { centerId: center.id, bloodGroup: request.bloodGroup } },
        });
        if (centerStock) {
          await tx.bloodStock.update({
            where: { id: centerStock.id },
            data: { reservedUnits: { increment: reservedQty } },
          });
        }
        break;

      case "FULFILLED":
        nextTrackingStatus = "FULFILLED";
        nextRequestStatus = "FULFILLED";
        timelineTitle = "Blood Units Dispatched & Fulfilled";
        const fulfillQty = input.confirmedUnits || request.unitsRequired;
        timelineDesc = `${fulfillQty} unit(s) of ${BLOOD_GROUP_DISPLAY[request.bloodGroup]} successfully issued and fulfilled by ${center.name}.`;

        // Safely decrement stock transactionally
        const stockRow = await tx.bloodStock.findUnique({
          where: { centerId_bloodGroup: { centerId: center.id, bloodGroup: request.bloodGroup } },
        });

        if (!stockRow || stockRow.units < fulfillQty) {
          throw new ConflictError(
            `Insufficient physical inventory at ${center.name} to fulfill this request. Available: ${stockRow?.units || 0}, Required: ${fulfillQty}`
          );
        }

        const prevUnits = stockRow.units;
        const newUnits = Math.max(0, stockRow.units - fulfillQty);
        const newReserved = Math.max(0, stockRow.reservedUnits - fulfillQty);

        await tx.bloodStock.update({
          where: { id: stockRow.id },
          data: {
            units: newUnits,
            reservedUnits: newReserved,
          },
        });

        // Record stock history audit log
        await tx.stockHistory.create({
          data: {
            centerId: center.id,
            bloodGroup: request.bloodGroup,
            component: request.component || "Whole Blood",
            changeType: "ISSUED",
            unitsDelta: -fulfillQty,
            previousUnits: prevUnits,
            newUnits,
            performedById: input.staffUserId,
            reason: `Fulfilled emergency request #${request.requestCode || request.id.slice(-6)} for ${request.patientName}`,
            referenceId: request.id,
          },
        });
        break;

      case "REJECTED":
        nextTrackingStatus = "REJECTED";
        nextRequestStatus = "REJECTED";
        timelineTitle = "Request Declined";
        timelineDesc = `${center.name} declined request: ${input.notes || "Units unavailable or non-matching component"}.`;
        break;

      case "CLARIFICATION_REQUESTED":
        timelineTitle = "Clarification Requested by Hospital";
        timelineDesc = `${center.name} requested additional medical information: ${input.notes || "Please check details"}.`;
        break;
    }

    // Update BloodRequest state
    const updatedRequest = await tx.bloodRequest.update({
      where: { id: request.id },
      data: {
        trackingStatus: nextTrackingStatus,
        status: nextRequestStatus,
        assignedCenterId: input.centerId,
        rejectionReason: input.responseType === "REJECTED" ? input.notes : request.rejectionReason,
        fulfilledAt: input.responseType === "FULFILLED" ? new Date() : request.fulfilledAt,
      },
    });

    // Create timeline event
    await tx.requestTimelineEvent.create({
      data: {
        requestId: request.id,
        status: nextTrackingStatus,
        title: timelineTitle,
        description: timelineDesc,
        performedBy: "HOSPITAL_STAFF",
      },
    });

    // Notify requester
    await tx.notification.create({
      data: {
        userId: request.requesterId,
        type: `REQUEST_${input.responseType}`,
        message: `Update on Request #${request.requestCode || request.id.slice(-6)}: ${timelineDesc}`,
        metadata: {
          requestId: request.id,
          responseType: input.responseType,
          centerName: center.name,
        },
      },
    });

    return { responseRecord, updatedRequest };
  }, TX_OPTIONS);
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 5: REQUEST TRACKING STATUS TRANSITION GUARD
// ─────────────────────────────────────────────────────────────────────────────

export async function transitionTrackingStatus(
  requestId: string,
  nextStatus: TrackingStatus,
  performedBy: string,
  notes?: string,
  client = defaultPrisma
) {
  return await client.$transaction(async (tx) => {
    const request = await tx.bloodRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundError("Request not found");
    }

    const currentStatus = (request.trackingStatus as TrackingStatus) || "SUBMITTED";

    if (!canTransitionStatus(currentStatus, nextStatus)) {
      throw new ConflictError(
        `Disallowed state transition: Cannot transition blood request from '${currentStatus}' to '${nextStatus}'.`
      );
    }

    const statusInfo = TRACKING_STATUS_INFO[nextStatus];

    const updated = await tx.bloodRequest.update({
      where: { id: requestId },
      data: {
        trackingStatus: nextStatus,
        ...(nextStatus === "FULFILLED" ? { status: "FULFILLED", fulfilledAt: new Date() } : {}),
        ...(nextStatus === "REJECTED" ? { status: "REJECTED", rejectionReason: notes } : {}),
        ...(nextStatus === "CANCELLED" ? { status: "CANCELLED" } : {}),
      },
    });

    await tx.requestTimelineEvent.create({
      data: {
        requestId,
        status: nextStatus,
        title: statusInfo.label,
        description: notes || statusInfo.description,
        performedBy,
      },
    });

    // Notify requester
    await tx.notification.create({
      data: {
        userId: request.requesterId,
        type: "TRACKING_UPDATE",
        message: `Request #${request.requestCode || request.id.slice(-6)} status is now ${statusInfo.label}.`,
        metadata: {
          requestId,
          trackingStatus: nextStatus,
        },
      },
    });

    return updated;
  }, TX_OPTIONS);
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 2: SMART NEARBY DONOR FINDER (PRIVACY PRESERVING)
// ─────────────────────────────────────────────────────────────────────────────

export interface DonorSearchParams {
  bloodGroup?: BloodGroup | null;
  state?: string;
  city?: string;
  radiusKm?: number;
  onlyConsenting?: boolean;
  onlyAvailable?: boolean;
  userLat?: number;
  userLng?: number;
}

export async function searchNearbyDonors(params: DonorSearchParams, client = defaultPrisma) {
  const whereClause: any = {
    role: "DONOR",
    isActive: true,
  };

  if (params.city && !["ALL", "ALL CITIES"].includes(params.city.toUpperCase())) {
    whereClause.city = { equals: params.city.trim(), mode: "insensitive" };
  }

  const profileWhere: any = {};

  if (params.bloodGroup) {
    profileWhere.bloodGroup = params.bloodGroup;
  }

  if (params.onlyAvailable) {
    profileWhere.availabilityStatus = "AVAILABLE";
  }

  if (params.onlyConsenting !== false) {
    profileWhere.notificationConsent = true;
  }

  whereClause.donorProfile = profileWhere;

  const users = await client.user.findMany({
    where: whereClause,
    include: {
      donorProfile: true,
      donations: {
        where: { status: "VERIFIED" },
        orderBy: { donationDate: "desc" },
        take: 1,
      },
    },
    take: 50,
  });

  // Map to privacy-preserving cards
  const results = users.map((u) => {
    const profile = u.donorProfile;
    const lastDonation = u.donations[0];

    // Compute approximate distance if coords exist
    let approxDistanceKm: number | null = null;
    if (
      params.userLat !== undefined &&
      params.userLng !== undefined &&
      profile?.latitude &&
      profile?.longitude
    ) {
      approxDistanceKm = calculateDistanceKm(
        params.userLat,
        params.userLng,
        profile.latitude,
        profile.longitude
      );
    }

    // Format last donation information without medical sensitivity
    let lastDonationLabel = "First-time registered donor";
    let isEligible = true;
    if (lastDonation) {
      const daysSince = Math.floor(
        (Date.now() - new Date(lastDonation.donationDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince < 90) {
        lastDonationLabel = `Donated ${daysSince} days ago (In 90-day rest interval)`;
        isEligible = false;
      } else {
        lastDonationLabel = `Last donated ${Math.floor(daysSince / 30)} months ago (Eligible)`;
      }
    }

    return {
      id: u.id,
      displayName: formatDonorPrivacyName(u.name, u.id),
      bloodGroup: profile?.bloodGroup || null,
      bloodGroupDisplay: profile?.bloodGroup ? BLOOD_GROUP_DISPLAY[profile.bloodGroup] : "Unknown",
      city: u.city,
      approxDistanceKm,
      availabilityStatus: profile?.availabilityStatus || "AVAILABLE",
      notificationConsent: profile?.notificationConsent ?? true,
      donationCount: profile?.donationCount || u.donations.length,
      lastDonationInfo: lastDonationLabel,
      isEligible,
      // Strictly OMITTING: u.phone, u.address, u.email, profile.latitude, profile.longitude
    };
  });

  // Filter by radius if requested and distances were calculated
  if (params.radiusKm && params.radiusKm > 0) {
    return results.filter((r) => r.approxDistanceKm === null || r.approxDistanceKm <= params.radiusKm!);
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 4: BLOOD DONATION APPOINTMENT BOOKING
// ─────────────────────────────────────────────────────────────────────────────

export interface BookAppointmentInput {
  donorId: string;
  centerId: number;
  appointmentDate: Date;
  timeSlot: string;
  bloodGroup: BloodGroup;
  component?: string;
  notes?: string;
}

export async function bookDonationAppointment(
  input: BookAppointmentInput,
  client = defaultPrisma
) {
  return await client.$transaction(async (tx) => {
    const center = await tx.bloodCenter.findUnique({
      where: { id: input.centerId },
    });

    if (!center || !center.isActive) {
      throw new NotFoundError("Selected blood center is not registered or currently inactive.");
    }

    // Standardize appointment date to start of day for comparison
    const targetDate = new Date(input.appointmentDate);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

    // 1. Concurrency & Overbooking Guard: Count existing appointments for this slot
    const existingForSlot = await tx.appointment.count({
      where: {
        centerId: input.centerId,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        timeSlot: input.timeSlot,
        status: { in: ["BOOKED", "APPROVED"] },
      },
    });

    // Check center slot capacity
    const slotConfig = await tx.centerSlotConfig.findFirst({
      where: {
        centerId: input.centerId,
        dayOfWeek: targetDate.getDay(),
        timeSlot: input.timeSlot,
        isActive: true,
      },
    });
    const maxCapacity = slotConfig?.maxCapacity || 5;

    if (existingForSlot >= maxCapacity) {
      throw new ConflictError(
        `Appointment slot (${input.timeSlot}) at ${center.name} is fully booked (${existingForSlot}/${maxCapacity}). Please select another time slot.`
      );
    }

    // 2. Prevent duplicate active booking on same date by same donor
    const duplicate = await tx.appointment.findFirst({
      where: {
        donorId: input.donorId,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { in: ["BOOKED", "APPROVED"] },
      },
    });

    if (duplicate) {
      throw new ConflictError("You already have an appointment scheduled for this date.");
    }

    // 3. Create appointment
    const appointment = await tx.appointment.create({
      data: {
        donorId: input.donorId,
        centerId: input.centerId,
        appointmentDate: startOfDay,
        timeSlot: input.timeSlot,
        bloodGroup: input.bloodGroup,
        component: input.component || "Whole Blood",
        notes: input.notes || null,
        status: "BOOKED",
      },
      include: {
        center: true,
      },
    });

    // 4. Send notification to donor
    await tx.notification.create({
      data: {
        userId: input.donorId,
        type: "APPOINTMENT_CONFIRMED",
        message: `Appointment scheduled at ${center.name} on ${targetDate.toLocaleDateString("en-IN")} at ${input.timeSlot}.`,
        metadata: {
          appointmentId: appointment.id,
          centerName: center.name,
          timeSlot: input.timeSlot,
        },
      },
    });

    return appointment;
  }, TX_OPTIONS);
}

export async function completeAppointmentWithDonation(
  appointmentId: string,
  authorizedStaffId: string,
  unitsCollected = 1,
  client = defaultPrisma
) {
  return await client.$transaction(async (tx) => {
    const appointment = await tx.appointment.findUnique({
      where: { id: appointmentId },
      include: { center: true, donor: true },
    });

    if (!appointment) {
      throw new NotFoundError("Appointment not found");
    }

    if (appointment.status === "COMPLETED") {
      throw new ConflictError("Appointment has already been marked completed.");
    }

    // 1. Create a verified donation record
    const donation = await tx.donation.create({
      data: {
        donorId: appointment.donorId,
        bloodGroup: appointment.bloodGroup,
        component: appointment.component || "Whole Blood",
        units: unitsCollected,
        donationDate: new Date(),
        location: appointment.center.name,
        status: "VERIFIED",
        verifiedAt: new Date(),
      },
    });

    // 2. Mark appointment completed
    const updatedAppointment = await tx.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "COMPLETED",
        attendanceMarked: true,
        completedAt: new Date(),
        donationId: donation.id,
      },
    });

    // 3. Transaction-safe stock increment at the center
    const stockRow = await tx.bloodStock.upsert({
      where: {
        centerId_bloodGroup: {
          centerId: appointment.centerId,
          bloodGroup: appointment.bloodGroup,
        },
      },
      update: {
        units: { increment: unitsCollected },
      },
      create: {
        centerId: appointment.centerId,
        bloodGroup: appointment.bloodGroup,
        component: appointment.component || "Whole Blood",
        units: unitsCollected,
      },
    });

    // 4. Record stock history audit entry
    await tx.stockHistory.create({
      data: {
        centerId: appointment.centerId,
        bloodGroup: appointment.bloodGroup,
        component: appointment.component || "Whole Blood",
        changeType: "DONATION",
        unitsDelta: unitsCollected,
        previousUnits: stockRow.units - unitsCollected,
        newUnits: stockRow.units,
        performedById: authorizedStaffId,
        reason: `Donation completed from appointment #${appointment.id.slice(-6)}`,
        referenceId: appointment.id,
      },
    });

    // 5. Update donor stats
    await tx.donorProfile.updateMany({
      where: { userId: appointment.donorId },
      data: {
        lastDonationDate: new Date(),
        donationCount: { increment: 1 },
      },
    });

    // 6. Notify donor
    await tx.notification.create({
      data: {
        userId: appointment.donorId,
        type: "DONATION_RECORDED",
        message: `Thank you for saving lives! Your donation of ${unitsCollected} unit(s) at ${appointment.center.name} has been processed and verified.`,
        metadata: {
          appointmentId: appointment.id,
          donationId: donation.id,
          units: unitsCollected,
        },
      },
    });

    return { appointment: updatedAppointment, donation, stock: stockRow };
  }, TX_OPTIONS);
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 3: LIVE BLOOD STOCK AUDIT & ADJUSTMENT
// ─────────────────────────────────────────────────────────────────────────────

export interface CenterStockAdjustInput {
  centerId: number;
  bloodGroup: BloodGroup;
  component?: string;
  action: "add" | "remove" | "set";
  units: number;
  reason?: string;
  performedById?: string;
}

export async function adjustCenterStockAudit(
  input: CenterStockAdjustInput,
  client = defaultPrisma
) {
  return await client.$transaction(async (tx) => {
    const center = await tx.bloodCenter.findUnique({
      where: { id: input.centerId },
    });

    if (!center) {
      throw new NotFoundError("Blood center not found");
    }

    const currentStock = await tx.bloodStock.findUnique({
      where: {
        centerId_bloodGroup: {
          centerId: input.centerId,
          bloodGroup: input.bloodGroup,
        },
      },
    });

    const previousUnits = currentStock?.units || 0;
    let newUnits = previousUnits;
    let delta = 0;

    if (input.action === "add") {
      delta = input.units;
      newUnits = previousUnits + input.units;
    } else if (input.action === "remove") {
      delta = -input.units;
      newUnits = previousUnits - input.units;
    } else if (input.action === "set") {
      delta = input.units - previousUnits;
      newUnits = input.units;
    }

    if (newUnits < 0) {
      throw new ValidationError(
        `Cannot reduce stock below zero. Current units: ${previousUnits}, Requested deduction: ${input.units}`
      );
    }

    const updatedStock = await tx.bloodStock.upsert({
      where: {
        centerId_bloodGroup: {
          centerId: input.centerId,
          bloodGroup: input.bloodGroup,
        },
      },
      update: {
        units: newUnits,
      },
      create: {
        centerId: input.centerId,
        bloodGroup: input.bloodGroup,
        component: input.component || "Whole Blood",
        units: newUnits,
      },
    });

    // Update center's last stock update timestamp
    await tx.bloodCenter.update({
      where: { id: input.centerId },
      data: { lastStockUpdate: new Date() },
    });

    // Audit log
    await tx.stockHistory.create({
      data: {
        centerId: input.centerId,
        bloodGroup: input.bloodGroup,
        component: input.component || "Whole Blood",
        changeType: input.action === "remove" ? "ISSUED" : "ADJUSTMENT",
        unitsDelta: delta,
        previousUnits,
        newUnits,
        performedById: input.performedById || null,
        reason: input.reason || `Manual inventory adjustment (${input.action} ${input.units})`,
      },
    });

    return updatedStock;
  }, TX_OPTIONS);
}

