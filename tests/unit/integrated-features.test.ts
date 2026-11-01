import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { BloodGroup } from "@prisma/client";
import {
  createEmergencyRequest,
  recordHospitalEmergencyResponse,
  transitionTrackingStatus,
  searchNearbyDonors,
  bookDonationAppointment,
  completeAppointmentWithDonation,
  adjustCenterStockAudit,
  ConflictError,
  ValidationError,
} from "@/lib/business-logic";
import {
  canTransitionStatus,
  calculateDistanceKm,
  formatDonorPrivacyName,
  generateRequestCode,
} from "@/lib/constants";

describe("LifePulse Six-Feature Integration Test Suite", () => {
  // Test helper: fetch or create a test center in Gwalior
  let testCenterId: number;
  let testUserId: string;

  beforeEach(async () => {
    // Retry loop for Neon pooler cold-start: first connection sometimes drops
    let center = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        center = await prisma.bloodCenter.findFirst({
          where: { city: "Gwalior" },
        });
        break;
      } catch (err: any) {
        if (attempt < 3 && err?.message?.includes("Can't reach database server")) {
          await new Promise((r) => setTimeout(r, (attempt + 1) * 1500));
          continue;
        }
        throw err;
      }
    }

    if (!center) {
      center = await prisma.bloodCenter.create({
        data: {
          name: "Test Gwalior Medical Centre",
          type: "HOSPITAL",
          city: "Gwalior",
          state: "Madhya Pradesh",
          address: "Gwalior Fort Road",
          phone: "9826000000",
          latitude: 26.2183,
          longitude: 78.1828,
        },
      });
    }
    testCenterId = center.id;

    let user = await prisma.user.findFirst({
      where: { email: "admin@bloodbank.org" },
    });
    testUserId = user?.id || "test-user-id";
  });

  // ─── FEATURE 1: Emergency Blood Request System ──────────────────────────────
  describe("Feature 1: Emergency Blood Request & Matching", () => {
    it("creates an emergency request with formatted tracking code, initial timeline event, and matching centers", async () => {
      const result = await createEmergencyRequest(
        {
          patientName: "Emergency Test Patient",
          requesterName: "Attendant Test",
          contactNumber: "+91-98260-11111",
          bloodGroup: BloodGroup.B_POS,
          component: "Whole Blood",
          unitsRequired: 2,
          state: "Madhya Pradesh",
          city: "Gwalior",
          hospitalName: "J.A. Hospital — G.R. Medical College",
          hospitalAddress: "Jayarogya Complex, Lashkar",
          urgency: "EMERGENCY",
          requiredDate: new Date(Date.now() + 86400000),
          additionalInfo: "Test ICU procedure",
        },
        testUserId
      );

      expect(result.requestCode).toMatch(/^REQ-\d{6}-\d{4}$/);
      expect(result.request.trackingStatus).toBe("SUBMITTED");
      expect(result.request.bloodGroup).toBe(BloodGroup.B_POS);

      // Verify initial timeline event exists
      const timeline = await prisma.requestTimelineEvent.findMany({
        where: { requestId: result.request.id },
      });
      expect(timeline.length).toBeGreaterThanOrEqual(1);
      expect(timeline.some((t) => t.status === "SUBMITTED")).toBe(true);
    });

    it("allows hospital staff to confirm availability and reserve units on hold", async () => {
      const emergencyReq = await createEmergencyRequest(
        {
          patientName: "Reservation Patient",
          requesterName: "Attendant A",
          contactNumber: "+91-98260-22222",
          bloodGroup: BloodGroup.O_POS,
          unitsRequired: 1,
          state: "Madhya Pradesh",
          city: "Gwalior",
          hospitalName: "BIMR Hospitals",
          hospitalAddress: "Morar, Gwalior",
          urgency: "EMERGENCY",
          requiredDate: new Date(Date.now() + 86400000),
        },
        testUserId
      );

      // Hospital responds with RESERVED
      const responseResult = await recordHospitalEmergencyResponse({
        requestId: emergencyReq.request.id,
        centerId: testCenterId,
        staffUserId: testUserId,
        responseType: "RESERVED",
        confirmedUnits: 1,
        notes: "Units held in cold-chain quarantine for 24h",
      });

      expect(responseResult.updatedRequest.trackingStatus).toBe("RESERVED");
      expect(responseResult.updatedRequest.reservedUnits).toBe(1);

      // Verify timeline event logged
      const timeline = await prisma.requestTimelineEvent.findMany({
        where: { requestId: emergencyReq.request.id, status: "RESERVED" },
      });
      expect(timeline.length).toBe(1);
    });
  });

  // ─── FEATURE 2: Smart Nearby Donor Finder ──────────────────────────────────
  describe("Feature 2: Smart Nearby Donor Finder Privacy Guarantees", () => {
    it("never returns phone numbers, exact addresses, or precise GPS coordinates in donor search results", async () => {
      const donors = await searchNearbyDonors({
        city: "Gwalior",
        bloodGroup: BloodGroup.B_POS,
        onlyConsenting: true,
      });

      expect(donors.length).toBeGreaterThan(0);

      for (const donor of donors) {
        // Privacy checks:
        expect((donor as any).phone).toBeUndefined();
        expect((donor as any).address).toBeUndefined();
        expect((donor as any).email).toBeUndefined();
        expect((donor as any).latitude).toBeUndefined();
        expect((donor as any).longitude).toBeUndefined();

        // Must have privacy-preserving name
        expect(donor.displayName).toBeDefined();
        expect(donor.bloodGroupDisplay).toBe("B+");
        expect(donor.city).toBe("Gwalior");
      }
    });

    it("accurately calculates approximate distance using Haversine formula", () => {
      // Gwalior coordinates: (26.2183, 78.1828) to Lashkar: (26.2045, 78.1634)
      const distance = calculateDistanceKm(26.2183, 78.1828, 26.2045, 78.1634);
      expect(distance).toBeGreaterThan(1);
      expect(distance).toBeLessThan(5); // ~2.5 km
    });

    it("formats donor privacy names correctly", () => {
      expect(formatDonorPrivacyName("Aman Singhal", "usr12345")).toBe("Aman S.");
      expect(formatDonorPrivacyName(null, "usr12345")).toBe("Donor #2345");
    });
  });

  // ─── FEATURE 3: Live Blood Stock Monitoring & Audit ─────────────────────────
  describe("Feature 3: Live Blood Stock Monitoring & Audit Ledger", () => {
    it("adjusts stock transactionally and creates immutable StockHistory audit entry", async () => {
      const previousStock = await prisma.bloodStock.findUnique({
        where: {
          centerId_bloodGroup: { centerId: testCenterId, bloodGroup: BloodGroup.A_POS },
        },
      });
      const startUnits = previousStock?.units || 0;

      // Add 5 units
      const updated = await adjustCenterStockAudit({
        centerId: testCenterId,
        bloodGroup: BloodGroup.A_POS,
        action: "add",
        units: 5,
        reason: "Test batch donation receipt",
        performedById: testUserId,
      });

      expect(updated.units).toBe(startUnits + 5);

      // Verify audit history row exists
      const historyRow = await prisma.stockHistory.findFirst({
        where: {
          centerId: testCenterId,
          bloodGroup: BloodGroup.A_POS,
          reason: "Test batch donation receipt",
        },
        orderBy: { createdAt: "desc" },
      });

      expect(historyRow).toBeDefined();
      expect(historyRow?.unitsDelta).toBe(5);
      expect(historyRow?.previousUnits).toBe(startUnits);
      expect(historyRow?.newUnits).toBe(startUnits + 5);
    });

    it("strictly prevents reducing stock below zero and throws ValidationError", async () => {
      await expect(
        adjustCenterStockAudit({
          centerId: testCenterId,
          bloodGroup: BloodGroup.AB_NEG,
          action: "remove",
          units: 999999, // impossible deduction
          reason: "Testing negative stock guard",
          performedById: testUserId,
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  // ─── FEATURE 4: Blood Donation Appointment Booking ──────────────────────────
  describe("Feature 4: Blood Donation Appointment Booking", () => {
    it("books a donation appointment transactionally with capacity check", async () => {
      const testDonor = await prisma.user.findFirst({
        where: { role: "DONOR" },
      });
      expect(testDonor).toBeDefined();

      // Pick a unique future date to avoid collision with seeded appointments
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 60);

      // Clean any existing test booking on this test day
      const dayStart = new Date(futureDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(futureDate);
      dayEnd.setHours(23, 59, 59, 999);
      await prisma.appointment.deleteMany({
        where: {
          donorId: testDonor!.id,
          appointmentDate: { gte: dayStart, lte: dayEnd },
        },
      });

      const appointment = await bookDonationAppointment({
        donorId: testDonor!.id,
        centerId: testCenterId,
        appointmentDate: futureDate,
        timeSlot: "11:00 - 12:00",
        bloodGroup: BloodGroup.O_POS,
        notes: "Voluntary donor test booking",
      });

      expect(appointment.id).toBeDefined();
      expect(appointment.status).toBe("BOOKED");
      expect(appointment.centerId).toBe(testCenterId);
    });

    it("completes appointment, verifies donation, and safely increments center stock", async () => {
      const testDonor = await prisma.user.findFirst({
        where: { role: "DONOR" },
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 20);

      const appointment = await bookDonationAppointment({
        donorId: testDonor!.id,
        centerId: testCenterId,
        appointmentDate: futureDate,
        timeSlot: "14:00 - 15:00",
        bloodGroup: BloodGroup.A_POS,
      });

      const initialStock = await prisma.bloodStock.findUnique({
        where: {
          centerId_bloodGroup: { centerId: testCenterId, bloodGroup: BloodGroup.A_POS },
        },
      });
      const unitsBefore = initialStock?.units || 0;

      // Staff completes appointment with 1 unit collected
      const completionResult = await completeAppointmentWithDonation(
        appointment.id,
        testUserId,
        1
      );

      expect(completionResult.appointment.status).toBe("COMPLETED");
      expect(completionResult.donation.status).toBe("VERIFIED");
      expect(completionResult.stock.units).toBe(unitsBefore + 1);

      // Verify double-completion throws ConflictError
      await expect(
        completeAppointmentWithDonation(appointment.id, testUserId, 1)
      ).rejects.toThrow(ConflictError);
    });
  });

  // ─── FEATURE 5: Blood Request Tracking Status Matrix ────────────────────────
  describe("Feature 5: Blood Request Tracking Lifecycle Matrix", () => {
    it("allows valid status transitions according to the 11-step lifecycle graph", () => {
      expect(canTransitionStatus("SUBMITTED", "VERIFICATION_PENDING")).toBe(true);
      expect(canTransitionStatus("VERIFIED", "SEARCHING")).toBe(true);
      expect(canTransitionStatus("SEARCHING", "HOSPITAL_RESPONDED")).toBe(true);
      expect(canTransitionStatus("HOSPITAL_RESPONDED", "AVAILABILITY_CONFIRMED")).toBe(true);
      expect(canTransitionStatus("AVAILABILITY_CONFIRMED", "RESERVED")).toBe(true);
      expect(canTransitionStatus("RESERVED", "FULFILLED")).toBe(true);
    });

    it("strictly disallows invalid status jumps like SUBMITTED -> FULFILLED", () => {
      expect(canTransitionStatus("SUBMITTED", "FULFILLED")).toBe(false);
      expect(canTransitionStatus("FULFILLED", "SUBMITTED")).toBe(false);
      expect(canTransitionStatus("REJECTED", "VERIFIED")).toBe(false);
    });

    it("enforces state transition guard on live database requests", async () => {
      const emergencyReq = await createEmergencyRequest(
        {
          patientName: "Transition Guard Patient",
          requesterName: "Attendant B",
          contactNumber: "+91-98260-33333",
          bloodGroup: BloodGroup.B_POS,
          unitsRequired: 1,
          state: "Madhya Pradesh",
          city: "Gwalior",
          hospitalName: "J.A. Hospital",
          hospitalAddress: "Lashkar",
          urgency: "EMERGENCY",
          requiredDate: new Date(Date.now() + 86400000),
        },
        testUserId
      );

      // Try illegal direct transition from SEARCHING to FULFILLED
      await expect(
        transitionTrackingStatus(emergencyReq.request.id, "FULFILLED", "TEST_USER")
      ).rejects.toThrow(ConflictError);
    });
  });
});
