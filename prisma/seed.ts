import { PrismaClient, BloodGroup, CenterType, Role, AvailabilityStatus, DonationStatus, RequestStatus, Urgency } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Blood Management System Database Seeding...");

  // Clean existing tables in proper order (FK constraints)
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.bloodRequest.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.donorProfile.deleteMany();
  await prisma.bloodStock.deleteMany();
  await prisma.bloodCenter.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleaned existing database records.");

  // Common hashed passwords
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const donorPassword = await bcrypt.hash("Donor@123", 10);
  const patientPassword = await bcrypt.hash("Patient@123", 10);

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      name: "Dr. Alistair Vance (Admin)",
      email: "admin@bloodbank.org",
      passwordHash: adminPassword,
      phone: "+1-555-0199",
      role: Role.ADMIN,
      city: "Central City",
      address: "Suite 400, Regional Medical Center",
      isActive: true,
    },
  });
  console.log("✅ Admin user created: admin@bloodbank.org / Admin@123");

  // 2. Create BloodCenters and their BloodStock rows
  // ─── Main Blood Bank (Central City) — isMain=true, drives donation/request engine ───
  const mainCenter = await prisma.bloodCenter.create({
    data: {
      name: "Main Blood Bank",
      type: CenterType.BLOOD_BANK,
      city: "Central City",
      address: "Suite 400, Regional Medical Center, Central City",
      phone: "5550001000",
      isMain: true,
      isActive: true,
    },
  });

  // Original 8 BloodStock rows, now parented to Main Blood Bank
  const mainStockData: { bloodGroup: BloodGroup; units: number }[] = [
    { bloodGroup: BloodGroup.A_POS, units: 40 },
    { bloodGroup: BloodGroup.A_NEG, units: 8 },   // Low Stock
    { bloodGroup: BloodGroup.B_POS, units: 22 },  // Available
    { bloodGroup: BloodGroup.B_NEG, units: 3 },   // Critical
    { bloodGroup: BloodGroup.AB_POS, units: 0 },  // Out of Stock
    { bloodGroup: BloodGroup.AB_NEG, units: 0 },  // Out of Stock (0 everywhere → "unavailable at any location" demo)
    { bloodGroup: BloodGroup.O_POS, units: 55 },  // Available
    { bloodGroup: BloodGroup.O_NEG, units: 4 },   // Critical
  ];
  for (const item of mainStockData) {
    await prisma.bloodStock.create({ data: { centerId: mainCenter.id, ...item } });
  }
  console.log("✅ Main Blood Bank created with 8 BloodStock rows.");

  // ─── Metro City General Hospital ───
  const metroCityHospital = await prisma.bloodCenter.create({
    data: {
      name: "Metro City General Hospital",
      type: CenterType.HOSPITAL,
      city: "Metro City",
      address: "100 Healthcare Boulevard, Metro City",
      phone: "5550002001",
      isMain: false,
      isActive: true,
    },
  });
  const metroCityStockData: { bloodGroup: BloodGroup; units: number }[] = [
    { bloodGroup: BloodGroup.A_POS, units: 20 },
    { bloodGroup: BloodGroup.A_NEG, units: 0 },
    { bloodGroup: BloodGroup.B_POS, units: 10 },
    { bloodGroup: BloodGroup.B_NEG, units: 2 },
    { bloodGroup: BloodGroup.AB_POS, units: 0 },
    { bloodGroup: BloodGroup.AB_NEG, units: 0 },  // 0 here too → total AB- remains 0 everywhere
    { bloodGroup: BloodGroup.O_POS, units: 30 },
    { bloodGroup: BloodGroup.O_NEG, units: 0 },
  ];
  for (const item of metroCityStockData) {
    await prisma.bloodStock.create({ data: { centerId: metroCityHospital.id, ...item } });
  }
  console.log("✅ Metro City General Hospital created with 8 BloodStock rows.");

  // ─── Riverdale Blood Depot ───
  const riverdaleDepot = await prisma.bloodCenter.create({
    data: {
      name: "Riverdale Blood Depot",
      type: CenterType.BLOOD_BANK,
      city: "Riverdale",
      address: "22 Depot Lane, Riverdale",
      phone: "5550003001",
      isMain: false,
      isActive: true,
    },
  });
  const riverdaleDepotStockData: { bloodGroup: BloodGroup; units: number }[] = [
    { bloodGroup: BloodGroup.A_POS, units: 25 },
    { bloodGroup: BloodGroup.A_NEG, units: 3 },
    { bloodGroup: BloodGroup.B_POS, units: 15 },
    { bloodGroup: BloodGroup.B_NEG, units: 0 },  // B- unavailable in Riverdale
    { bloodGroup: BloodGroup.AB_POS, units: 5 },
    { bloodGroup: BloodGroup.AB_NEG, units: 0 },
    { bloodGroup: BloodGroup.O_POS, units: 0 },
    { bloodGroup: BloodGroup.O_NEG, units: 0 },
  ];
  for (const item of riverdaleDepotStockData) {
    await prisma.bloodStock.create({ data: { centerId: riverdaleDepot.id, ...item } });
  }
  console.log("✅ Riverdale Blood Depot created with 8 BloodStock rows.");

  // ─── Highland Medical Centre ───
  const highlandCentre = await prisma.bloodCenter.create({
    data: {
      name: "Highland Medical Centre",
      type: CenterType.HOSPITAL,
      city: "Highland",
      address: "512 Ridge Road, Highland",
      phone: "5550004001",
      isMain: false,
      isActive: true,
    },
  });
  const highlandStockData: { bloodGroup: BloodGroup; units: number }[] = [
    { bloodGroup: BloodGroup.A_POS, units: 0 },
    { bloodGroup: BloodGroup.A_NEG, units: 0 },
    { bloodGroup: BloodGroup.B_POS, units: 8 },
    { bloodGroup: BloodGroup.B_NEG, units: 0 },
    { bloodGroup: BloodGroup.AB_POS, units: 0 },
    { bloodGroup: BloodGroup.AB_NEG, units: 0 },
    { bloodGroup: BloodGroup.O_POS, units: 12 },
    { bloodGroup: BloodGroup.O_NEG, units: 0 },
  ];
  for (const item of highlandStockData) {
    await prisma.bloodStock.create({ data: { centerId: highlandCentre.id, ...item } });
  }
  console.log("✅ Highland Medical Centre created with 8 BloodStock rows.");

  // ─── Riverdale Community Clinic — all zero, tests "unavailable in city" vs "unavailable everywhere" ───
  const riverdaleCommunity = await prisma.bloodCenter.create({
    data: {
      name: "Riverdale Community Clinic",
      type: CenterType.BLOOD_BANK,
      city: "Riverdale",
      address: "88 Willow Avenue, Riverdale",
      phone: "5550003002",
      isMain: false,
      isActive: true,
    },
  });
  const allBloodGroups = Object.values(BloodGroup);
  for (const bg of allBloodGroups) {
    await prisma.bloodStock.create({ data: { centerId: riverdaleCommunity.id, bloodGroup: bg, units: 0 } });
  }
  console.log("✅ Riverdale Community Clinic created with 8 BloodStock rows (all 0 — for empty-state testing).");

  console.log(`✅ Seeded 5 BloodCenters and their BloodStock rows.`);

  // 3. Create 7 Donors with DonorProfiles
  const donorsData = [
    {
      name: "Rahul Verma",
      email: "rahul.donor@example.com",
      phone: "+1-555-0101",
      city: "Metro City",
      address: "14 Elm Street, Apt 3B",
      bloodGroup: BloodGroup.O_POS,
      availability: AvailabilityStatus.AVAILABLE,
    },
    {
      name: "Ayesha Khan",
      email: "ayesha.donor@example.com",
      phone: "+1-555-0102",
      city: "Riverdale",
      address: "88 Willow Avenue",
      bloodGroup: BloodGroup.A_POS,
      availability: AvailabilityStatus.AVAILABLE,
    },
    {
      name: "Liam O'Connor",
      email: "liam.donor@example.com",
      phone: "+1-555-0103",
      city: "Metro City",
      address: "240 Pine Boulevard",
      bloodGroup: BloodGroup.B_POS,
      availability: AvailabilityStatus.AVAILABLE,
    },
    {
      name: "Elena Rostova",
      email: "elena.donor@example.com",
      phone: "+1-555-0104",
      city: "Highland",
      address: "512 Ridge Road",
      bloodGroup: BloodGroup.O_NEG, // Universal donor!
      availability: AvailabilityStatus.AVAILABLE,
    },
    {
      name: "Carlos Mendez",
      email: "carlos.donor@example.com",
      phone: "+1-555-0105",
      city: "Riverdale",
      address: "17 Magnolia Court",
      bloodGroup: BloodGroup.AB_POS,
      availability: AvailabilityStatus.UNAVAILABLE,
    },
    {
      name: "Priya Sharma",
      email: "priya.donor@example.com",
      phone: "+1-555-0106",
      city: "Metro City",
      address: "94 Birch Lane",
      bloodGroup: BloodGroup.A_NEG,
      availability: AvailabilityStatus.AVAILABLE,
    },
    {
      name: "Marcus Johnson",
      email: "marcus.donor@example.com",
      phone: "+1-555-0107",
      city: "Highland",
      address: "305 Cedar Way",
      bloodGroup: BloodGroup.B_NEG,
      availability: AvailabilityStatus.AVAILABLE,
    },
  ];

  const createdDonors: any[] = [];
  for (const d of donorsData) {
    const user = await prisma.user.create({
      data: {
        name: d.name,
        email: d.email,
        passwordHash: donorPassword,
        phone: d.phone,
        role: Role.DONOR,
        city: d.city,
        address: d.address,
        isActive: true,
        donorProfile: {
          create: {
            bloodGroup: d.bloodGroup,
            availabilityStatus: d.availability,
          },
        },
      },
      include: {
        donorProfile: true,
      },
    });
    createdDonors.push(user);
  }
  console.log(`✅ Created ${createdDonors.length} donors with active profiles.`);

  // 4. Create 10 Donations (Verified, Pending, Rejected)
  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const donationsToCreate = [
    // Rahul (O+)
    {
      donorId: createdDonors[0].id,
      bloodGroup: BloodGroup.O_POS,
      units: 1,
      donationDate: daysAgo(45),
      status: DonationStatus.VERIFIED,
      verifiedAt: daysAgo(44),
    },
    {
      donorId: createdDonors[0].id,
      bloodGroup: BloodGroup.O_POS,
      units: 1,
      donationDate: daysAgo(10),
      status: DonationStatus.VERIFIED,
      verifiedAt: daysAgo(9),
    },
    {
      donorId: createdDonors[0].id,
      bloodGroup: BloodGroup.O_POS,
      units: 1,
      donationDate: daysAgo(1),
      status: DonationStatus.PENDING,
      verifiedAt: null,
    },
    // Ayesha (A+)
    {
      donorId: createdDonors[1].id,
      bloodGroup: BloodGroup.A_POS,
      units: 1,
      donationDate: daysAgo(60),
      status: DonationStatus.VERIFIED,
      verifiedAt: daysAgo(59),
    },
    {
      donorId: createdDonors[1].id,
      bloodGroup: BloodGroup.A_POS,
      units: 2,
      donationDate: daysAgo(2),
      status: DonationStatus.PENDING,
      verifiedAt: null,
    },
    // Liam (B+)
    {
      donorId: createdDonors[2].id,
      bloodGroup: BloodGroup.B_POS,
      units: 1,
      donationDate: daysAgo(30),
      status: DonationStatus.VERIFIED,
      verifiedAt: daysAgo(29),
    },
    // Elena (O-)
    {
      donorId: createdDonors[3].id,
      bloodGroup: BloodGroup.O_NEG,
      units: 1,
      donationDate: daysAgo(20),
      status: DonationStatus.VERIFIED,
      verifiedAt: daysAgo(19),
    },
    // Carlos (AB+)
    {
      donorId: createdDonors[4].id,
      bloodGroup: BloodGroup.AB_POS,
      units: 1,
      donationDate: daysAgo(15),
      status: DonationStatus.REJECTED,
      verifiedAt: null,
    },
    // Priya (A-)
    {
      donorId: createdDonors[5].id,
      bloodGroup: BloodGroup.A_NEG,
      units: 1,
      donationDate: daysAgo(12),
      status: DonationStatus.VERIFIED,
      verifiedAt: daysAgo(11),
    },
    // Marcus (B-)
    {
      donorId: createdDonors[6].id,
      bloodGroup: BloodGroup.B_NEG,
      units: 1,
      donationDate: daysAgo(5),
      status: DonationStatus.PENDING,
      verifiedAt: null,
    },
  ];

  for (const don of donationsToCreate) {
    await prisma.donation.create({ data: don });
  }
  console.log(`✅ Seeded ${donationsToCreate.length} donation records.`);

  // 5. Create 4 Patients / Hospital Accounts
  const patientsData = [
    {
      name: "Dr. Sarah Jenkins",
      email: "sarah.patient@example.com",
      phone: "+1-555-0201",
      city: "Metro City",
      organizationName: "St. Jude Memorial Hospital",
      address: "Emergency Wing, 100 Health Ave",
    },
    {
      name: "Michael Chang",
      email: "michael.patient@example.com",
      phone: "+1-555-0202",
      city: "Riverdale",
      organizationName: null,
      address: "42 Maple Street",
    },
    {
      name: "Dr. Anita Desai",
      email: "anita.patient@example.com",
      phone: "+1-555-0203",
      city: "Highland",
      organizationName: "Highland Community Clinic",
      address: "Suite 12, Clinic Complex",
    },
    {
      name: "David Miller",
      email: "david.patient@example.com",
      phone: "+1-555-0204",
      city: "Metro City",
      organizationName: "General Heart & Trauma Center",
      address: "Trauma Ward 4B",
    },
  ];

  const createdPatients: any[] = [];
  for (const p of patientsData) {
    const user = await prisma.user.create({
      data: {
        name: p.name,
        email: p.email,
        passwordHash: patientPassword,
        phone: p.phone,
        role: Role.PATIENT,
        city: p.city,
        address: p.address,
        organizationName: p.organizationName,
        isActive: true,
      },
    });
    createdPatients.push(user);
  }
  console.log(`✅ Created ${createdPatients.length} patient/hospital accounts.`);

  // 6. Create 10 BloodRequests spanning statuses & urgencies
  const requestsData = [
    {
      requesterId: createdPatients[0].id,
      patientName: "Robert Anderson",
      bloodGroup: BloodGroup.A_POS,
      unitsRequired: 2,
      hospitalName: "St. Jude Memorial Hospital",
      city: "Metro City",
      contactNumber: "+1-555-0201",
      requiredDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      urgency: Urgency.EMERGENCY,
      additionalInfo: "Emergency cardiac bypass surgery scheduled.",
      status: RequestStatus.PENDING,
      requestDate: daysAgo(1),
      approvedAt: null,
      fulfilledAt: null,
    },
    {
      requesterId: createdPatients[0].id,
      patientName: "Alice Walker",
      bloodGroup: BloodGroup.O_POS,
      unitsRequired: 3,
      hospitalName: "St. Jude Memorial Hospital",
      city: "Metro City",
      contactNumber: "+1-555-0201",
      requiredDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      urgency: Urgency.URGENT,
      additionalInfo: "Severe post-partum hemorrhage.",
      status: RequestStatus.APPROVED,
      requestDate: daysAgo(2),
      approvedAt: daysAgo(1),
      fulfilledAt: null,
    },
    {
      requesterId: createdPatients[1].id,
      patientName: "Emily Chang",
      bloodGroup: BloodGroup.B_POS,
      unitsRequired: 1,
      hospitalName: "Riverdale General",
      city: "Riverdale",
      contactNumber: "+1-555-0202",
      requiredDate: daysAgo(3),
      urgency: Urgency.NORMAL,
      additionalInfo: "Routine orthopedic operation.",
      status: RequestStatus.FULFILLED,
      requestDate: daysAgo(5),
      approvedAt: daysAgo(4),
      fulfilledAt: daysAgo(3),
    },
    {
      requesterId: createdPatients[1].id,
      patientName: "Harold Chang",
      bloodGroup: BloodGroup.O_NEG,
      unitsRequired: 2,
      hospitalName: "Riverdale General",
      city: "Riverdale",
      contactNumber: "+1-555-0202",
      requiredDate: daysAgo(6),
      urgency: Urgency.URGENT,
      additionalInfo: "Emergency blood replacement.",
      status: RequestStatus.REJECTED,
      requestDate: daysAgo(7),
      approvedAt: null,
      fulfilledAt: null,
    },
    {
      requesterId: createdPatients[2].id,
      patientName: "Tanya Smith",
      bloodGroup: BloodGroup.A_NEG,
      unitsRequired: 1,
      hospitalName: "Highland Community Clinic",
      city: "Highland",
      contactNumber: "+1-555-0203",
      requiredDate: daysAgo(2),
      urgency: Urgency.NORMAL,
      additionalInfo: "Patient condition stabilized; request withdrawn.",
      status: RequestStatus.CANCELLED,
      requestDate: daysAgo(4),
      approvedAt: daysAgo(3),
      fulfilledAt: null,
    },
    {
      requesterId: createdPatients[2].id,
      patientName: "George Miller",
      bloodGroup: BloodGroup.B_NEG,
      unitsRequired: 1,
      hospitalName: "Highland Community Clinic",
      city: "Highland",
      contactNumber: "+1-555-0203",
      requiredDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      urgency: Urgency.NORMAL,
      additionalInfo: "Scheduled surgical procedure.",
      status: RequestStatus.PENDING,
      requestDate: daysAgo(1),
      approvedAt: null,
      fulfilledAt: null,
    },
    {
      requesterId: createdPatients[3].id,
      patientName: "Katherine Hughes",
      bloodGroup: BloodGroup.O_POS,
      unitsRequired: 4,
      hospitalName: "General Heart & Trauma Center",
      city: "Metro City",
      contactNumber: "+1-555-0204",
      requiredDate: daysAgo(10),
      urgency: Urgency.EMERGENCY,
      additionalInfo: "Multi-vehicle trauma intake.",
      status: RequestStatus.FULFILLED,
      requestDate: daysAgo(12),
      approvedAt: daysAgo(11),
      fulfilledAt: daysAgo(10),
    },
    {
      requesterId: createdPatients[3].id,
      patientName: "Samuel Green",
      bloodGroup: BloodGroup.AB_NEG,
      unitsRequired: 2,
      hospitalName: "General Heart & Trauma Center",
      city: "Metro City",
      contactNumber: "+1-555-0204",
      requiredDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      urgency: Urgency.URGENT,
      additionalInfo: "Awaiting urgent surgical prep.",
      status: RequestStatus.APPROVED,
      requestDate: daysAgo(2),
      approvedAt: daysAgo(1),
      fulfilledAt: null,
    },
    {
      requesterId: createdPatients[0].id,
      patientName: "Victor Vance",
      bloodGroup: BloodGroup.A_POS,
      unitsRequired: 1,
      hospitalName: "St. Jude Memorial Hospital",
      city: "Metro City",
      contactNumber: "+1-555-0201",
      requiredDate: daysAgo(15),
      urgency: Urgency.NORMAL,
      additionalInfo: "Completed transfusion.",
      status: RequestStatus.FULFILLED,
      requestDate: daysAgo(18),
      approvedAt: daysAgo(16),
      fulfilledAt: daysAgo(15),
    },
    {
      requesterId: createdPatients[1].id,
      patientName: "Arthur Doyle",
      bloodGroup: BloodGroup.B_POS,
      unitsRequired: 2,
      hospitalName: "Riverdale General",
      city: "Riverdale",
      contactNumber: "+1-555-0202",
      requiredDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      urgency: Urgency.NORMAL,
      additionalInfo: "Elective orthopedic repair.",
      status: RequestStatus.PENDING,
      requestDate: daysAgo(0),
      approvedAt: null,
      fulfilledAt: null,
    },
  ];

  for (const req of requestsData) {
    await prisma.bloodRequest.create({ data: req });
  }
  console.log(`✅ Seeded ${requestsData.length} blood request records across all statuses.`);

  // 7. Seed Notifications
  const notificationsData = [
    {
      userId: null, // Admin broadcast
      type: "LOW_STOCK_WARNING",
      message: "Blood stock for AB+ is currently Out of Stock (0 units remaining).",
      isRead: false,
    },
    {
      userId: null, // Admin broadcast
      type: "LOW_STOCK_WARNING",
      message: "Blood stock for B- is currently Critical (3 units remaining).",
      isRead: false,
    },
    {
      userId: createdDonors[0].id,
      type: "DONATION_VERIFIED",
      message: "Your donation of 1 unit(s) of O+ has been verified. Thank you!",
      isRead: true,
    },
    {
      userId: createdDonors[1].id,
      type: "DONATION_VERIFIED",
      message: "Your donation of 1 unit(s) of A+ has been verified. Thank you!",
      isRead: false,
    },
    {
      userId: createdPatients[0].id,
      type: "REQUEST_APPROVED",
      message: "Your request for 3 unit(s) of O+ has been approved. Awaiting fulfillment.",
      isRead: false,
    },
    {
      userId: createdPatients[1].id,
      type: "REQUEST_FULFILLED",
      message: "Your request for 1 unit(s) of B+ has been fulfilled.",
      isRead: true,
    },
  ];

  for (const notif of notificationsData) {
    await prisma.notification.create({ data: notif });
  }
  console.log(`✅ Seeded ${notificationsData.length} notifications.`);

  console.log("\n=======================================================");
  console.log("🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!");
  console.log("=======================================================");
  console.log("🔑 DEMO CREDENTIALS:");
  console.log("  1. Admin Account:");
  console.log("     Email:    admin@bloodbank.org");
  console.log("     Password: Admin@123");
  console.log("  2. Donor Account:");
  console.log("     Email:    rahul.donor@example.com");
  console.log("     Password: Donor@123");
  console.log("  3. Patient/Hospital Account:");
  console.log("     Email:    sarah.patient@example.com");
  console.log("     Password: Patient@123");
  console.log("=======================================================");
  console.log("\n🏥 SEEDED BLOOD CENTERS:");
  console.log("  1. Main Blood Bank          — Central City (MAIN, drives donation/request engine)");
  console.log("  2. Metro City General Hospital — Metro City (HOSPITAL partner)");
  console.log("  3. Riverdale Blood Depot    — Riverdale (BLOOD_BANK partner)");
  console.log("  4. Highland Medical Centre  — Highland (HOSPITAL partner)");
  console.log("  5. Riverdale Community Clinic — Riverdale (BLOOD_BANK, all 0 units — empty-state demo)");
  console.log("\n📌 DEMO TIPS:");
  console.log("  - Search AB- → shows 'unavailable at any location' (0 units at all 5 centers)");
  console.log("  - Search O+ → shows results across Main, Metro City, Highland centers");
  console.log("  - Search B- in Riverdale → centers exist but 0 of B- → 'unavailable in this city'");
  console.log("  - Search any group in 'Sunnyvale' → no centers → 'no centers in this city'");
  console.log("=======================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
