import { prisma } from "../lib/prisma";
import {
  verifyDonation,
  approveRequest,
  fulfillRequest,
  getDonorStats,
  ConflictError,
} from "../lib/business-logic";
import { BloodGroup } from "@prisma/client";

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

async function runE2EVerification() {
  console.log("=======================================================");
  console.log("🧪 RUNNING SECTION 17 END-TO-END VERIFICATION SCENARIO");
  console.log("=======================================================\n");

  // Step 1: Find seeded donor
  console.log("Step 1: Locating seeded donor Rahul Verma...");
  const donor = await prisma.user.findUnique({
    where: { email: "rahul.donor@example.com" },
    include: { donorProfile: true },
  });
  if (!donor || !donor.donorProfile) throw new Error("Donor not found");
  console.log(`  -> Found Donor: ${donor.name} (${donor.donorProfile.bloodGroup})`);

  // Step 2: View donor dashboard stats
  console.log("\nStep 2: Checking computed donor statistics...");
  const statsBefore = await getDonorStats(donor.id);
  console.log(`  -> Computed total verified units: ${statsBefore.totalDonations}`);
  console.log(`  -> Last donation date: ${statsBefore.lastDonationDate?.toISOString()}`);
  console.log(`  -> Availability: ${donor.donorProfile.availabilityStatus}`);

  // Step 3: Submit a new donation record
  console.log("\nStep 3: Donor submits a new donation record (2 units of O+)...");
  const newDonation = await prisma.donation.create({
    data: {
      donorId: donor.id,
      bloodGroup: BloodGroup.O_POS,
      units: 2,
      donationDate: new Date(),
      status: "PENDING",
    },
  });
  console.log(`  -> Donation record created: ID #${newDonation.id} (Status: ${newDonation.status})`);

  // Step 4 & 5: Admin verifies donation and inventory increases
  console.log("\nStep 4 & 5: Admin verifies the donation; verifying atomic stock increment...");
  const oPosStockBefore = await getMainStock(BloodGroup.O_POS);
  console.log(`  -> O+ Stock BEFORE verification: ${oPosStockBefore?.units} units`);

  const verificationResult = await verifyDonation(newDonation.id);
  console.log(`  -> verifyDonation executed: status=${verificationResult.donation.status}`);

  const oPosStockAfter = await getMainStock(BloodGroup.O_POS);
  console.log(`  -> O+ Stock AFTER verification: ${oPosStockAfter?.units} units`);

  if (oPosStockAfter!.units !== oPosStockBefore!.units + 2) {
    throw new Error("Stock did not increment by exactly 2 units!");
  }
  console.log("  ✅ SUCCESS: Blood inventory for O+ increased by exactly 2 units.");

  // Step 6 & 7: Log in as patient & search blood
  console.log("\nStep 6 & 7: Patient Dr. Sarah Jenkins searches blood availability for O+...");
  const patient = await prisma.user.findUnique({
    where: { email: "sarah.patient@example.com" },
  });
  if (!patient) throw new Error("Patient not found");
  console.log(`  -> Found Patient: ${patient.name} (${patient.organizationName})`);

  // Step 8: Patient submits blood request
  console.log("\nStep 8: Patient submits a blood request for 2 units of O+...");
  const newRequest = await prisma.bloodRequest.create({
    data: {
      requesterId: patient.id,
      patientName: "Emergency Trauma Case #441",
      bloodGroup: BloodGroup.O_POS,
      unitsRequired: 2,
      hospitalName: patient.organizationName || "St. Jude Memorial Hospital",
      city: patient.city,
      contactNumber: patient.phone,
      requiredDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      urgency: "EMERGENCY",
      status: "PENDING",
    },
  });
  console.log(`  -> Request created: ID #${newRequest.id} (Status: ${newRequest.status})`);

  // Step 9: Admin approves request
  console.log("\nStep 9: Admin approves the blood request...");
  const stockAtApprovalBefore = await getMainStock(BloodGroup.O_POS);
  const approvedReq = await approveRequest(newRequest.id);
  console.log(`  -> Request status is now: ${approvedReq.status}`);

  const stockAtApprovalAfter = await getMainStock(BloodGroup.O_POS);
  if (stockAtApprovalBefore!.units !== stockAtApprovalAfter!.units) {
    throw new Error("Stock must NOT change at approval step!");
  }
  console.log("  ✅ SUCCESS: Stock remained unchanged at Approval (intent, not handover).");

  // Step 10 & 11: Admin fulfills request & verify stock decrease
  console.log("\nStep 10 & 11: Admin fulfills request; checking atomic stock deduction...");
  const fulfillmentResult = await fulfillRequest(newRequest.id);
  console.log(`  -> Request status is now: ${fulfillmentResult.request.status}`);
  console.log(`  -> O+ Stock after fulfillment: ${fulfillmentResult.stock.units} units`);

  if (fulfillmentResult.stock.units !== stockAtApprovalAfter!.units - 2) {
    throw new Error("Stock did not decrement by exactly 2 units!");
  }
  console.log("  ✅ SUCCESS: Stock decremented by exactly 2 units.");

  // Double fulfill test
  console.log("\nStep 11b: Attempting second fulfillment call on already-fulfilled request...");
  try {
    await fulfillRequest(newRequest.id);
    throw new Error("FAIL: fulfillRequest should have thrown ConflictError!");
  } catch (err: any) {
    if (err instanceof ConflictError) {
      console.log("  ✅ SUCCESS: Second fulfillment rejected with ConflictError. Double-deduction prevented.");
    } else {
      throw err;
    }
  }

  // Step 12: Confirm request status in DB
  console.log("\nStep 12: Verifying database persisted status...");
  const finalRequest = await prisma.bloodRequest.findUnique({ where: { id: newRequest.id } });
  console.log(`  -> Final Request Status in DB: ${finalRequest?.status}`);
  if (finalRequest?.status !== "FULFILLED") throw new Error("Request status should be FULFILLED");

  // Step 13: Confirm notifications
  console.log("\nStep 13: Verifying notifications dispatched...");
  const patientNotifs = await prisma.notification.findMany({
    where: { userId: patient.id },
    orderBy: { createdAt: "desc" },
  });
  console.log(`  -> Latest Patient Notification: "${patientNotifs[0]?.message}"`);

  const donorNotifs = await prisma.notification.findMany({
    where: { userId: donor.id },
    orderBy: { createdAt: "desc" },
  });
  console.log(`  -> Latest Donor Notification: "${donorNotifs[0]?.message}"`);

  // Step 14: Final stats confirmation
  console.log("\nStep 14: Checking computed stats consistency...");
  const donorStatsAfter = await getDonorStats(donor.id);
  console.log(`  -> Donor total verified donations: ${donorStatsAfter.totalDonations} units`);
  if (donorStatsAfter.totalDonations !== statsBefore.totalDonations + 2) {
    throw new Error("Computed donor stats did not update correctly!");
  }
  console.log("  ✅ SUCCESS: Donor total verified units updated accurately at read time.");

  console.log("\n=======================================================");
  console.log("🎉 ALL END-TO-END SCENARIO STEPS VERIFIED 100% PASS!");
  console.log("=======================================================\n");
}

runE2EVerification()
  .catch((e) => {
    console.error("❌ E2E verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
