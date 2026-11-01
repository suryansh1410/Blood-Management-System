import "dotenv/config";
import { PrismaClient, BloodGroup, Role, AvailabilityStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateRequestCode } from "../lib/constants";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

// Accurate real-world coordinates for hospitals & blood banks
const COORDINATES_MAP: Record<string, { lat: number; lng: number }> = {
  // Gwalior (Priority 1)
  "J.A. Hospital — G.R. Medical College": { lat: 26.2045, lng: 78.1634 },
  "Main Blood Bank": { lat: 26.2045, lng: 78.1634 },
  "BIMR Hospitals": { lat: 26.2238, lng: 78.2096 },
  "Cancer Hospital & Research Institute": { lat: 26.195, lng: 78.158 },
  "Indian Red Cross Society Blood Bank": { lat: 26.212, lng: 78.175 },
  "District Hospital Morar": { lat: 26.226, lng: 78.225 },
  "Kamla Raja Hospital (KRH) Blood Bank": { lat: 26.204, lng: 78.1628 },

  // Indore
  "M.Y. Hospital — Mahatma Gandhi Memorial Medical College": { lat: 22.7164, lng: 75.8752 },
  "Sri Aurobindo Institute of Medical Sciences (SAIMS)": { lat: 22.7845, lng: 75.858 },
  "Choithram Hospital & Research Centre": { lat: 22.686, lng: 75.852 },
  "Bombay Hospital Indore": { lat: 22.7533, lng: 75.8937 },

  // Bhopal
  "All India Institute of Medical Sciences (AIIMS) Bhopal": { lat: 23.2066, lng: 77.4608 },
  "Hamidia Hospital — Gandhi Medical College": { lat: 23.2568, lng: 77.3912 },
  "Bansal Hospital Bhopal": { lat: 23.197, lng: 77.433 },
  "Indian Red Cross Society Blood Bank Bhopal": { lat: 23.2325, lng: 77.4045 },

  // Jabalpur
  "Netaji Subhash Chandra Bose Medical College (NSCB)": { lat: 23.1492, lng: 79.8821 },
  "Jabalpur Hospital & Research Centre": { lat: 23.165, lng: 79.932 },

  // Rewa
  "Sanjay Gandhi Memorial Hospital — Shyam Shah Medical College": { lat: 24.5362, lng: 81.3037 },

  // Sagar
  "Bundelkhand Medical College & Hospital": { lat: 23.8343, lng: 78.7426 },

  // Ujjain
  "Civil Hospital / RD Gardi Medical College Blood Centre": { lat: 23.1765, lng: 75.7885 },

  // Delhi NCR
  "All India Institute of Medical Sciences (AIIMS)": { lat: 28.5672, lng: 77.21 },
  "Safdarjung Hospital": { lat: 28.57, lng: 77.2075 },
  "Dr. Ram Manohar Lohia Hospital": { lat: 28.6253, lng: 77.2023 },
  "Guru Teg Bahadur (GTB) Hospital": { lat: 28.6837, lng: 77.3114 },

  // Rajasthan
  "Sawai Man Singh (SMS) Hospital": { lat: 26.9038, lng: 75.8165 },
  "Santokba Durlabhji Memorial Hospital (SDMH)": { lat: 26.892, lng: 75.808 },

  // Uttar Pradesh
  "King George's Medical University (KGMU)": { lat: 26.8687, lng: 80.9168 },
  "Sanjay Gandhi Postgraduate Institute of Medical Sciences (SGPGIMS)": { lat: 26.7454, lng: 80.9392 },

  // Maharashtra
  "Tata Memorial Hospital": { lat: 19.0048, lng: 72.8427 },
  "King Edward Memorial (KEM) Hospital": { lat: 19.0016, lng: 72.8422 },
  "Lilavati Hospital and Research Centre": { lat: 19.0514, lng: 72.829 },

  // Karnataka
  "Victoria Hospital — Bangalore Medical College": { lat: 12.9625, lng: 77.5746 },
  "Manipal Hospital Old Airport Road": { lat: 12.9592, lng: 77.649 },

  // Tamil Nadu
  "Rajiv Gandhi Government General Hospital (RGGGH)": { lat: 13.081, lng: 80.277 },
  "Apollo Hospitals Greams Road": { lat: 13.0583, lng: 80.252 },

  // West Bengal
  "IPGMER & SSKM Hospital": { lat: 22.5398, lng: 88.3426 },
  "Medical College and Hospital Kolkata": { lat: 22.5739, lng: 88.3629 },

  // Telangana
  "Nizam's Institute of Medical Sciences (NIMS)": { lat: 17.4222, lng: 78.4533 },
  "Osmania General Hospital": { lat: 17.3753, lng: 78.4719 },

  // Chandigarh / Punjab / Haryana
  "Postgraduate Institute of Medical Education and Research (PGIMER)": { lat: 30.7656, lng: 76.7758 },
  "Government Medical College & Hospital (GMCH Sector 32)": { lat: 30.7071, lng: 76.7803 },

  // Bihar
  "Patna Medical College and Hospital (PMCH)": { lat: 25.6207, lng: 85.1585 },
  "All India Institute of Medical Sciences (AIIMS) Patna": { lat: 25.5615, lng: 85.0456 },

  // Gujarat
  "Civil Hospital Ahmedabad — B.J. Medical College": { lat: 23.0525, lng: 72.5938 },

  // Kerala
  "Government Medical College Thiruvananthapuram": { lat: 8.5241, lng: 76.9295 },

  // Assam
  "Gauhati Medical College and Hospital (GMCH)": { lat: 26.1557, lng: 91.777 },
};

// Fallback coordinates by city if specific hospital name isn't in map
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Gwalior: { lat: 26.2183, lng: 78.1828 },
  Indore: { lat: 22.7196, lng: 75.8577 },
  Bhopal: { lat: 23.2599, lng: 77.4126 },
  Jabalpur: { lat: 23.1815, lng: 79.9864 },
  Rewa: { lat: 24.5362, lng: 81.3037 },
  Sagar: { lat: 23.8388, lng: 78.7378 },
  Ujjain: { lat: 23.1765, lng: 75.7885 },
  Delhi: { lat: 28.6139, lng: 77.209 },
  Jaipur: { lat: 26.9124, lng: 75.7873 },
  Lucknow: { lat: 26.8467, lng: 80.9462 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Chandigarh: { lat: 30.7333, lng: 76.7794 },
  Patna: { lat: 25.5941, lng: 85.1376 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Guwahati: { lat: 26.1445, lng: 91.7362 },
};

async function main() {
  console.log("🚀 Starting Blood Management System Feature Seeding & Verification...");

  // 1. Update BloodCenter coordinates
  const centers = await prisma.bloodCenter.findMany();
  let updatedCoords = 0;

  for (const c of centers) {
    let coords = COORDINATES_MAP[c.name];
    if (!coords) {
      coords = CITY_COORDS[c.city];
    }
    if (!coords) {
      coords = { lat: 26.2183, lng: 78.1828 }; // Default to Gwalior
    }

    // Add small jitter if multiple centers share same city fallback
    const jitter = ((c.id % 7) - 3) * 0.003;
    const finalLat = coords.lat + jitter;
    const finalLng = coords.lng + jitter;

    await prisma.bloodCenter.update({
      where: { id: c.id },
      data: {
        latitude: finalLat,
        longitude: finalLng,
        operatingHours: "24x7 Emergency Services & Blood Transfusion",
        dailyCapacity: 40,
        lastStockUpdate: c.lastStockUpdate || new Date(),
      },
    });
    updatedCoords++;
  }
  console.log(`✅ Updated coordinates and capacity for ${updatedCoords} blood centers.`);

  // 2. Create Hospital Staff accounts for Gwalior, Indore, and Bhopal
  const hospitalPassword = await bcrypt.hash("Hospital@123", 10);

  const gwaliorCenter = await prisma.bloodCenter.findFirst({
    where: { city: "Gwalior", name: { contains: "J.A. Hospital" } },
  });

  if (gwaliorCenter) {
    const staffUser = await prisma.user.upsert({
      where: { email: "hospital.ja@gwalior.org" },
      update: {
        role: Role.HOSPITAL,
        centerId: gwaliorCenter.id,
      },
      create: {
        name: "Dr. Sandeep Sharma (JA Hospital Blood Bank)",
        email: "hospital.ja@gwalior.org",
        passwordHash: hospitalPassword,
        phone: "+91-751-2403200",
        role: Role.HOSPITAL,
        city: "Gwalior",
        organizationName: gwaliorCenter.name,
        centerId: gwaliorCenter.id,
      },
    });
    console.log(`✅ Hospital staff user created: ${staffUser.email} / Hospital@123 (linked to ${gwaliorCenter.name})`);
  }

  const bimrCenter = await prisma.bloodCenter.findFirst({
    where: { city: "Gwalior", name: { contains: "BIMR" } },
  });

  if (bimrCenter) {
    await prisma.user.upsert({
      where: { email: "staff@bimrhospitals.com" },
      update: {
        role: Role.HOSPITAL,
        centerId: bimrCenter.id,
      },
      create: {
        name: "Nurse Pratibha S. (BIMR Transfusion Staff)",
        email: "staff@bimrhospitals.com",
        passwordHash: hospitalPassword,
        phone: "+91-751-2445555",
        role: Role.HOSPITAL,
        city: "Gwalior",
        organizationName: bimrCenter.name,
        centerId: bimrCenter.id,
      },
    });
    console.log(`✅ Hospital staff user created: staff@bimrhospitals.com / Hospital@123`);
  }

  // 3. Configure Center Slot Configs for Appointment Booking (Feature 4)
  const gwaliorCenters = await prisma.bloodCenter.findMany({
    where: { city: "Gwalior" },
    take: 3,
  });

  const slots = [
    "09:00 - 10:00",
    "10:00 - 11:00",
    "11:00 - 12:00",
    "12:00 - 13:00",
    "14:00 - 15:00",
    "15:00 - 16:00",
    "16:00 - 17:00",
  ];

  for (const gc of gwaliorCenters) {
    for (let day = 0; day <= 6; day++) {
      for (const slot of slots) {
        await prisma.centerSlotConfig.upsert({
          where: {
            centerId_dayOfWeek_timeSlot: {
              centerId: gc.id,
              dayOfWeek: day,
              timeSlot: slot,
            },
          },
          update: { maxCapacity: 6 },
          create: {
            centerId: gc.id,
            dayOfWeek: day,
            timeSlot: slot,
            maxCapacity: 6,
            isActive: true,
          },
        });
      }
    }
  }
  console.log(`✅ Appointment slot configurations seeded for Gwalior centers.`);

  // 4. Seed Consenting Donors in Gwalior and Madhya Pradesh (Feature 2)
  const donorPassword = await bcrypt.hash("Donor@123", 10);
  const sampleDonors = [
    {
      name: "Aman Singhal",
      email: "aman.gwalior@gmail.com",
      phone: "+91-98261-12345",
      city: "Gwalior",
      bloodGroup: BloodGroup.B_POS,
      lat: 26.215,
      lng: 78.179,
    },
    {
      name: "Pooja Verma",
      email: "pooja.v@outlook.com",
      phone: "+91-98262-23456",
      city: "Gwalior",
      bloodGroup: BloodGroup.O_POS,
      lat: 26.208,
      lng: 78.169,
    },
    {
      name: "Rohit Tomar",
      email: "rohit.tomar@gmail.com",
      phone: "+91-98263-34567",
      city: "Gwalior",
      bloodGroup: BloodGroup.A_POS,
      lat: 26.222,
      lng: 78.205,
    },
    {
      name: "Deepak Kushwah",
      email: "deepak.k@gmail.com",
      phone: "+91-98264-45678",
      city: "Gwalior",
      bloodGroup: BloodGroup.B_POS,
      lat: 26.229,
      lng: 78.221,
    },
    {
      name: "Sneha Gupta",
      email: "sneha.g@gmail.com",
      phone: "+91-98265-56789",
      city: "Gwalior",
      bloodGroup: BloodGroup.AB_POS,
      lat: 26.198,
      lng: 78.156,
    },
    {
      name: "Vikram Chauhan",
      email: "vikram.indore@gmail.com",
      phone: "+91-98271-67890",
      city: "Indore",
      bloodGroup: BloodGroup.B_POS,
      lat: 22.721,
      lng: 75.862,
    },
    {
      name: "Anjali Mishra",
      email: "anjali.bhopal@gmail.com",
      phone: "+91-98281-78901",
      city: "Bhopal",
      bloodGroup: BloodGroup.O_NEG,
      lat: 23.235,
      lng: 77.412,
    },
  ];

  for (const d of sampleDonors) {
    const u = await prisma.user.upsert({
      where: { email: d.email },
      update: {
        city: d.city,
        phone: d.phone,
      },
      create: {
        name: d.name,
        email: d.email,
        passwordHash: donorPassword,
        phone: d.phone,
        role: Role.DONOR,
        city: d.city,
      },
    });

    await prisma.donorProfile.upsert({
      where: { userId: u.id },
      update: {
        bloodGroup: d.bloodGroup,
        notificationConsent: true,
        allowNearbyAlerts: true,
        preferredRadiusKm: 25,
        latitude: d.lat,
        longitude: d.lng,
      },
      create: {
        userId: u.id,
        bloodGroup: d.bloodGroup,
        availabilityStatus: AvailabilityStatus.AVAILABLE,
        notificationConsent: true,
        allowNearbyAlerts: true,
        preferredRadiusKm: 25,
        latitude: d.lat,
        longitude: d.lng,
        lastDonationDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 4 months ago (eligible)
        donationCount: 3,
      },
    });
  }
  console.log(`✅ Seeded ${sampleDonors.length} consenting donors with privacy profiles in Gwalior & MP.`);

  // 5. Seed Demonstration Emergency Blood Request in Gwalior (B+) with complete timeline (Features 1 & 5)
  const patientUser = await prisma.user.findFirst({
    where: { role: Role.PATIENT },
  });

  if (patientUser && gwaliorCenter) {
    const existingDemoReq = await prisma.bloodRequest.findFirst({
      where: {
        requestCode: { startsWith: "REQ-GWL" },
      },
    });

    if (!existingDemoReq) {
      const demoReq = await prisma.bloodRequest.create({
        data: {
          requestCode: "REQ-GWL-2026-9041",
          requesterId: patientUser.id,
          requesterName: "Rajesh Sharma (Attendant)",
          patientName: "Meena Sharma",
          bloodGroup: BloodGroup.B_POS,
          component: "Whole Blood",
          unitsRequired: 2,
          reservedUnits: 2,
          state: "Madhya Pradesh",
          city: "Gwalior",
          hospitalName: "J.A. Hospital — G.R. Medical College",
          hospitalAddress: "Jayarogya Hospital Complex, Lashkar, Gwalior",
          contactNumber: "+91-94251-88990",
          requiredDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          urgency: "EMERGENCY",
          additionalInfo: "Emergency ICU surgery scheduled at 8:00 AM tomorrow. Cross-matched B+ required urgently.",
          status: "APPROVED",
          trackingStatus: "RESERVED",
          assignedCenterId: gwaliorCenter.id,
        },
      });

      // Seed timeline events matching the 11-step lifecycle
      const timelineEvents = [
        {
          status: "SUBMITTED",
          title: "Emergency Request Submitted",
          description: "Emergency B+ request submitted for Meena Sharma (2 units of Whole Blood at J.A. Hospital, Gwalior).",
          performedBy: "PATIENT",
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        },
        {
          status: "VERIFIED",
          title: "Medical Verification Complete",
          description: "Attending surgeon prescription and hospital admission #GWL-4091 verified.",
          performedBy: "ADMIN",
          createdAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
        },
        {
          status: "SEARCHING",
          title: "Network Search & Donor Broadcast",
          description: "Broadcasted alert to 4 consenting B+ donors in Gwalior district and 3 verified blood banks.",
          performedBy: "SYSTEM",
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        },
        {
          status: "HOSPITAL_RESPONDED",
          title: "J.A. Hospital Responded",
          description: "Transfusion medicine department acknowledged incoming request and verified inventory.",
          performedBy: "HOSPITAL_STAFF",
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          status: "AVAILABILITY_CONFIRMED",
          title: "Stock Availability Confirmed",
          description: "Dr. Sandeep Sharma verified 35 physical units of B+ Whole Blood available in inventory.",
          performedBy: "HOSPITAL_STAFF",
          createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        },
        {
          status: "RESERVED",
          title: "Units Officially Reserved",
          description: "2 units of B+ tagged and placed in cold-chain quarantine hold for patient Meena Sharma. Awaiting dispatch.",
          performedBy: "HOSPITAL_STAFF",
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
        },
      ];

      for (const te of timelineEvents) {
        await prisma.requestTimelineEvent.create({
          data: {
            requestId: demoReq.id,
            status: te.status,
            title: te.title,
            description: te.description,
            performedBy: te.performedBy,
            createdAt: te.createdAt,
          },
        });
      }
      console.log(`✅ Seeded demonstration Emergency Request: ${demoReq.requestCode} with 6-stage timeline.`);
    }
  }

  // 6. Seed Sample Appointment Booking for a Donor (Feature 4)
  const donorUser = await prisma.user.findFirst({
    where: { email: "aman.gwalior@gmail.com" },
  });

  if (donorUser && gwaliorCenter) {
    const existingAppt = await prisma.appointment.findFirst({
      where: { donorId: donorUser.id },
    });

    if (!existingAppt) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      await prisma.appointment.create({
        data: {
          donorId: donorUser.id,
          centerId: gwaliorCenter.id,
          appointmentDate: tomorrow,
          timeSlot: "10:00 - 11:00",
          bloodGroup: BloodGroup.B_POS,
          component: "Whole Blood",
          status: "APPROVED",
          notes: "Regular voluntary donor. Attending morning donation camp.",
        },
      });
      console.log(`✅ Seeded sample appointment booking for ${donorUser.name} at ${gwaliorCenter.name}.`);
    }
  }

  console.log("\n🎉 Feature Seeding and Geolocation Update Successfully Finished!");
}

main()
  .catch((e) => {
    console.error("Feature seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
