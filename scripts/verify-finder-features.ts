import { prisma } from "../lib/prisma";
import { BloodGroup } from "@prisma/client";

async function verifyFinderFeatures() {
  console.log("=================================================================");
  console.log("🔍 TESTING BLOOD AVAILABILITY & HOSPITAL FINDER FEATURES");
  console.log("=================================================================\n");

  // 1. Verify Blood Centers in DB
  console.log("Step 1: Inspecting Blood Centers in DB...");
  const centers = await prisma.bloodCenter.findMany({
    include: {
      stocks: true,
    },
    orderBy: { id: "asc" },
  });
  console.log(`  -> Found ${centers.length} centers in database.`);
  if (centers.length < 5) {
    throw new Error(`Expected at least 5 centers, found ${centers.length}`);
  }

  const mainCenter = centers.find((c) => c.isMain);
  if (!mainCenter) throw new Error("Main Blood Bank center not found!");
  console.log(`  -> Main center identified: "${mainCenter.name}" (${mainCenter.city})`);

  // Verify each center has 8 blood group stocks
  for (const c of centers) {
    if (c.stocks.length !== 8) {
      throw new Error(`Center "${c.name}" (ID ${c.id}) has ${c.stocks.length} stocks instead of 8!`);
    }
  }
  console.log("  ✅ All centers have complete 8-group stock inventories.");

  // 2. Test Cities Aggregation
  console.log("\nStep 2: Testing Unique Cities query...");
  const activeCities = await prisma.bloodCenter.findMany({
    where: { isActive: true },
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
  });
  const cityList = activeCities.map((c) => c.city);
  console.log(`  -> Active cities list (${cityList.length}): ${cityList.join(", ")}`);
  if (!cityList.includes("Metro City") || !cityList.includes("Riverdale")) {
    throw new Error("Expected cities not present in active centers!");
  }
  console.log("  ✅ Cities aggregation working as expected.");

  // 3. Test Multi-Center Aggregated Stock Query (for public /api/blood-stock)
  console.log("\nStep 3: Testing Multi-Center Stock Aggregation...");
  const aggregated = await prisma.bloodStock.groupBy({
    by: ["bloodGroup"],
    where: {
      center: { isActive: true },
    },
    _sum: { units: true },
  });
  console.log(`  -> Groups aggregated: ${aggregated.length}/8`);
  for (const agg of aggregated) {
    console.log(`     ${agg.bloodGroup}: ${agg._sum.units ?? 0} total units across active centers`);
  }
  if (aggregated.length !== 8) {
    throw new Error(`Expected 8 groups aggregated, got ${aggregated.length}`);
  }
  console.log("  ✅ Multi-center stock aggregation working accurately.");

  // 4. Test Search Query Filtering Simulation
  console.log("\nStep 4: Testing Search Filter Scenarios...");
  
  // Scenario A: City filter "Metro City"
  const metroCenters = await prisma.bloodCenter.findMany({
    where: {
      isActive: true,
      city: { contains: "Metro City", mode: "insensitive" },
    },
  });
  console.log(`  -> Centers in "Metro City": ${metroCenters.length}`);
  if (metroCenters.length === 0) throw new Error("No centers found for Metro City");

  // Scenario B: Blood group availability filter "O_POS"
  const oPosAvailableCenters = await prisma.bloodCenter.findMany({
    where: {
      isActive: true,
      stocks: {
        some: {
          bloodGroup: BloodGroup.O_POS,
          units: { gt: 0 },
        },
      },
    },
    include: {
      stocks: {
        where: { bloodGroup: BloodGroup.O_POS },
      },
    },
  });
  console.log(`  -> Centers with O+ stock > 0: ${oPosAvailableCenters.length}`);
  for (const c of oPosAvailableCenters) {
    console.log(`     - ${c.name} (${c.city}): ${c.stocks[0]?.units} units of O+`);
  }
  if (oPosAvailableCenters.length === 0) throw new Error("No centers found with O+ stock");

  // 5. Test Center Detail Lookup
  console.log("\nStep 5: Testing Center Detail Lookup for ID 1...");
  const center1 = await prisma.bloodCenter.findUnique({
    where: { id: 1 },
    include: {
      stocks: true,
    },
  });
  if (!center1) throw new Error("Center ID 1 not found");
  console.log(`  -> Center: ${center1.name}, Type: ${center1.type}, City: ${center1.city}, Phone: ${center1.phone}`);
  console.log(`  -> Stocks count: ${center1.stocks.length}`);
  console.log("  ✅ Center detail query returns full payload.");

  // 6. Test Privacy Guarantee
  console.log("\nStep 6: Privacy Guard Check...");
  // Confirm BloodCenter schema has NO user relations or sensitive personal info
  const centerKeys = Object.keys(center1);
  const forbiddenKeys = ["password", "passwordHash", "donor", "patient", "medicalHistory", "ssn"];
  for (const fk of forbiddenKeys) {
    if (centerKeys.includes(fk)) {
      throw new Error(`Privacy violation: BloodCenter exposes ${fk}`);
    }
  }
  console.log("  ✅ Privacy check passed: Center records contain ZERO donor or patient PII.");

  console.log("\n=================================================================");
  console.log("🎉 ALL BLOOD FINDER CAPABILITIES VERIFIED SUCCESSFULLY!");
  console.log("=================================================================\n");
}

verifyFinderFeatures()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
