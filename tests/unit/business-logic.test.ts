import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  verifyDonation,
  rejectDonation,
  approveRequest,
  fulfillRequest,
  rejectRequest,
  cancelRequest,
  adjustStock,
  ConflictError,
  ValidationError,
  ForbiddenError,
} from "@/lib/business-logic";
import { BloodGroup, Role } from "@prisma/client";

describe("Blood Management System — State Machine & Inventory Unit Tests", () => {
  let testDonorUser: any;
  let testPatientUser: any;
  let testOtherUser: any;

  beforeAll(async () => {
    // Clean and initialize test users
    testDonorUser = await prisma.user.create({
      data: {
        name: "Test Donor Unit",
        email: `unit.donor.${Date.now()}@test.com`,
        passwordHash: "dummyhash",
        phone: "+1-555-9999",
        role: Role.DONOR,
        city: "Test City",
        donorProfile: {
          create: {
            bloodGroup: BloodGroup.O_POS,
            availabilityStatus: "AVAILABLE",
          },
        },
      },
    });

    testPatientUser = await prisma.user.create({
      data: {
        name: "Test Patient Unit",
        email: `unit.patient.${Date.now()}@test.com`,
        passwordHash: "dummyhash",
        phone: "+1-555-8888",
        role: Role.PATIENT,
        city: "Test City",
        organizationName: "Unit Test Hospital",
      },
    });

    testOtherUser = await prisma.user.create({
      data: {
        name: "Test Intruder Unit",
        email: `unit.other.${Date.now()}@test.com`,
        passwordHash: "dummyhash",
        phone: "+1-555-7777",
        role: Role.PATIENT,
        city: "Test City",
      },
    });

    let mainCenter = await prisma.bloodCenter.findFirst({ where: { isMain: true } });
    if (!mainCenter) {
      mainCenter = await prisma.bloodCenter.create({
        data: {
          name: "Main Blood Bank (Central)",
          type: "BLOOD_BANK",
          city: "Test City",
          address: "100 Central Ave",
          phone: "5551234567",
          isMain: true,
          isActive: true,
        },
      });
      for (const bg of Object.values(BloodGroup)) {
        await prisma.bloodStock.create({
          data: { centerId: mainCenter.id, bloodGroup: bg, units: 10 },
        });
      }
    }
  }, 60000);

  async function getMainStock(bloodGroup: BloodGroup) {
    const mainCenter = await prisma.bloodCenter.findFirst({ where: { isMain: true } });
    if (!mainCenter) throw new Error("Main center not found");
    return prisma.bloodStock.findUnique({
      where: {
        centerId_bloodGroup: {
          centerId: mainCenter.id,
          bloodGroup,
        },
      },
    });
  }

  afterAll(async () => {
    // Cleanup created test records
    await prisma.bloodRequest.deleteMany({
      where: {
        requesterId: { in: [testPatientUser.id, testOtherUser.id] },
      },
    });
    await prisma.donation.deleteMany({
      where: {
        donorId: testDonorUser.id,
      },
    });
    await prisma.donorProfile.deleteMany({
      where: { userId: testDonorUser.id },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [testDonorUser.id, testPatientUser.id, testOtherUser.id] } },
    });
  }, 30000);

  describe("Donation State Machine & Stock Invariant", () => {
    it("1. verifyDonation increases BloodStock.units by the correct amount", async () => {
      // Create pending donation
      const donation = await prisma.donation.create({
        data: {
          donorId: testDonorUser.id,
          bloodGroup: BloodGroup.A_POS,
          units: 2,
          donationDate: new Date(),
          status: "PENDING",
        },
      });

      const initialStock = await getMainStock(BloodGroup.A_POS);
      const initialUnits = initialStock?.units ?? 0;

      const result = await verifyDonation(donation.id);

      expect(result.donation.status).toBe("VERIFIED");
      expect(result.donation.verifiedAt).not.toBeNull();
      expect(result.stock.units).toBe(initialUnits + 2);

      const verifyInDb = await getMainStock(BloodGroup.A_POS);
      expect(verifyInDb?.units).toBe(initialUnits + 2);
    });

    it("2. verifyDonation called twice on same donation throws ConflictError and does NOT double-increment", async () => {
      const donation = await prisma.donation.create({
        data: {
          donorId: testDonorUser.id,
          bloodGroup: BloodGroup.B_POS,
          units: 1,
          donationDate: new Date(),
          status: "PENDING",
        },
      });

      const initialStock = await getMainStock(BloodGroup.B_POS);
      const startUnits = initialStock?.units ?? 0;

      // First verification succeeds
      await verifyDonation(donation.id);

      const afterFirst = await getMainStock(BloodGroup.B_POS);
      expect(afterFirst?.units).toBe(startUnits + 1);

      // Second verification MUST throw ConflictError
      await expect(verifyDonation(donation.id)).rejects.toThrow(ConflictError);

      // Stock must NOT have incremented a second time
      const afterSecond = await getMainStock(BloodGroup.B_POS);
      expect(afterSecond?.units).toBe(startUnits + 1);
    });

    it("3. rejectDonation does not change stock and only runs on PENDING", async () => {
      const donation = await prisma.donation.create({
        data: {
          donorId: testDonorUser.id,
          bloodGroup: BloodGroup.AB_POS,
          units: 3,
          donationDate: new Date(),
          status: "PENDING",
        },
      });

      const stockBefore = await getMainStock(BloodGroup.AB_POS);

      const rejected = await rejectDonation(donation.id, "Medical deferral");
      expect(rejected.status).toBe("REJECTED");

      const stockAfter = await getMainStock(BloodGroup.AB_POS);
      expect(stockAfter?.units).toBe(stockBefore?.units);

      // Rejecting again throws ConflictError
      await expect(rejectDonation(donation.id)).rejects.toThrow(ConflictError);
    });
  });

  describe("Blood Request State Machine & Inventory Decrement", () => {
    it("4. approveRequest does not change stock and only works from PENDING", async () => {
      const request = await prisma.bloodRequest.create({
        data: {
          requesterId: testPatientUser.id,
          patientName: "Approval Test Patient",
          bloodGroup: BloodGroup.O_POS,
          unitsRequired: 2,
          hospitalName: "General Clinic",
          city: "Test City",
          contactNumber: "+1-555-1234",
          requiredDate: new Date(Date.now() + 86400000),
          status: "PENDING",
        },
      });

      const stockBefore = await getMainStock(BloodGroup.O_POS);

      const approved = await approveRequest(request.id);
      expect(approved.status).toBe("APPROVED");
      expect(approved.approvedAt).not.toBeNull();

      const stockAfter = await getMainStock(BloodGroup.O_POS);
      expect(stockAfter?.units).toBe(stockBefore?.units);

      // Approving again throws ConflictError
      await expect(approveRequest(request.id)).rejects.toThrow(ConflictError);
    });

    it("5. fulfillRequest decreases stock by correct amount and only from APPROVED", async () => {
      // Ensure we have at least 10 units of A_NEG
      await adjustStock(BloodGroup.A_NEG, 10, "SET");

      const request = await prisma.bloodRequest.create({
        data: {
          requesterId: testPatientUser.id,
          patientName: "Fulfill Patient",
          bloodGroup: BloodGroup.A_NEG,
          unitsRequired: 3,
          hospitalName: "Trauma Ward",
          city: "Test City",
          contactNumber: "+1-555-1234",
          requiredDate: new Date(Date.now() + 86400000),
          status: "APPROVED",
        },
      });

      const result = await fulfillRequest(request.id);
      expect(result.request.status).toBe("FULFILLED");
      expect(result.stock.units).toBe(7);

      const dbStock = await getMainStock(BloodGroup.A_NEG);
      expect(dbStock?.units).toBe(7);
    });

    it("6. fulfillRequest called twice on same request throws ConflictError and does NOT double-decrement", async () => {
      await adjustStock(BloodGroup.B_NEG, 10, "SET");

      const request = await prisma.bloodRequest.create({
        data: {
          requesterId: testPatientUser.id,
          patientName: "Double Fulfill Patient",
          bloodGroup: BloodGroup.B_NEG,
          unitsRequired: 2,
          hospitalName: "Surgery Center",
          city: "Test City",
          contactNumber: "+1-555-1234",
          requiredDate: new Date(Date.now() + 86400000),
          status: "APPROVED",
        },
      });

      // First fulfillment
      await fulfillRequest(request.id);

      const stockAfterFirst = await getMainStock(BloodGroup.B_NEG);
      expect(stockAfterFirst?.units).toBe(8);

      // Second fulfillment MUST fail with ConflictError
      await expect(fulfillRequest(request.id)).rejects.toThrow(ConflictError);

      // Inventory must remain 8
      const stockAfterSecond = await getMainStock(BloodGroup.B_NEG);
      expect(stockAfterSecond?.units).toBe(8);
    });

    it("7. fulfillRequest throws ConflictError when unitsRequired > current stock and makes no change", async () => {
      // Set AB_POS stock to 2 units
      await adjustStock(BloodGroup.AB_POS, 2, "SET");

      const request = await prisma.bloodRequest.create({
        data: {
          requesterId: testPatientUser.id,
          patientName: "High Demand Patient",
          bloodGroup: BloodGroup.AB_POS,
          unitsRequired: 10, // Demands 10, only 2 available
          hospitalName: "Emergency Wing",
          city: "Test City",
          contactNumber: "+1-555-1234",
          requiredDate: new Date(Date.now() + 86400000),
          status: "APPROVED",
        },
      });

      await expect(fulfillRequest(request.id)).rejects.toThrow(ConflictError);

      // Stock must remain unchanged at 2
      const stock = await getMainStock(BloodGroup.AB_POS);
      expect(stock?.units).toBe(2);

      // Request status must still be APPROVED, not FULFILLED
      const reqInDb = await prisma.bloodRequest.findUnique({
        where: { id: request.id },
      });
      expect(reqInDb?.status).toBe("APPROVED");
    });
  });

  describe("Manual Stock Adjustment Guard", () => {
    it("8. adjustStock refuses to take stock below zero and throws ValidationError", async () => {
      await adjustStock(BloodGroup.O_NEG, 5, "SET");

      // Attempting to deduct 10 from 5
      await expect(adjustStock(BloodGroup.O_NEG, -10, "DELTA")).rejects.toThrow(ValidationError);

      // Attempting to set -1 directly
      await expect(adjustStock(BloodGroup.O_NEG, -1, "SET")).rejects.toThrow(ValidationError);

      const stock = await getMainStock(BloodGroup.O_NEG);
      expect(stock?.units).toBe(5);
    });
  });

  describe("Disallowed State Transitions Matrix", () => {
    it("9. Fulfilling a PENDING request directly throws ConflictError", async () => {
      const request = await prisma.bloodRequest.create({
        data: {
          requesterId: testPatientUser.id,
          patientName: "Skip Step Patient",
          bloodGroup: BloodGroup.A_POS,
          unitsRequired: 1,
          hospitalName: "City Hospital",
          city: "Test City",
          contactNumber: "+1-555-1234",
          requiredDate: new Date(Date.now() + 86400000),
          status: "PENDING",
        },
      });

      await expect(fulfillRequest(request.id)).rejects.toThrow(ConflictError);
    });

    it("9b. Approving an already REJECTED request throws ConflictError", async () => {
      const request = await prisma.bloodRequest.create({
        data: {
          requesterId: testPatientUser.id,
          patientName: "Rejected Patient",
          bloodGroup: BloodGroup.A_POS,
          unitsRequired: 1,
          hospitalName: "City Hospital",
          city: "Test City",
          contactNumber: "+1-555-1234",
          requiredDate: new Date(Date.now() + 86400000),
          status: "REJECTED",
        },
      });

      await expect(approveRequest(request.id)).rejects.toThrow(ConflictError);
    });

    it("9c. Rejecting or Cancelling an already FULFILLED request throws ConflictError", async () => {
      const request = await prisma.bloodRequest.create({
        data: {
          requesterId: testPatientUser.id,
          patientName: "Fulfilled Terminal Patient",
          bloodGroup: BloodGroup.A_POS,
          unitsRequired: 1,
          hospitalName: "City Hospital",
          city: "Test City",
          contactNumber: "+1-555-1234",
          requiredDate: new Date(Date.now() + 86400000),
          status: "FULFILLED",
        },
      });

      await expect(rejectRequest(request.id)).rejects.toThrow(ConflictError);
      await expect(cancelRequest(request.id, testPatientUser.id)).rejects.toThrow(ConflictError);
    });
  });

  describe("Request Cancellation Security & Status Checks", () => {
    it("10. cancelRequest only allows the actual requester and only from PENDING or APPROVED", async () => {
      const request = await prisma.bloodRequest.create({
        data: {
          requesterId: testPatientUser.id,
          patientName: "Cancel Check Patient",
          bloodGroup: BloodGroup.B_POS,
          unitsRequired: 1,
          hospitalName: "City Hospital",
          city: "Test City",
          contactNumber: "+1-555-1234",
          requiredDate: new Date(Date.now() + 86400000),
          status: "PENDING",
        },
      });

      // Different user cannot cancel
      await expect(cancelRequest(request.id, testOtherUser.id)).rejects.toThrow(ForbiddenError);

      // Actual requester can cancel
      const cancelled = await cancelRequest(request.id, testPatientUser.id);
      expect(cancelled.status).toBe("CANCELLED");

      // Cannot cancel an already cancelled request
      await expect(cancelRequest(request.id, testPatientUser.id)).rejects.toThrow(ConflictError);
    });
  });
});
