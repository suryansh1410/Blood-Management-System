import { BloodGroup, PrismaClient, AuditAction } from "@prisma/client";
import { prisma as defaultPrisma } from "./prisma";
import { getStockStatus, STOCK_THRESHOLDS, BLOOD_GROUP_DISPLAY } from "./constants";

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
