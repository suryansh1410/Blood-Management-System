import * as fs from "fs";
import * as path from "path";

const target = process.argv[2]?.toLowerCase();

if (target !== "postgres" && target !== "postgresql" && target !== "sqlite") {
  console.error("Usage: tsx scripts/switch-db.ts <postgres|sqlite>");
  process.exit(1);
}

const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
let content = fs.readFileSync(schemaPath, "utf8");

if (target === "postgres" || target === "postgresql") {
  content = content.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  fs.writeFileSync(schemaPath, content, "utf8");
  console.log("✅ Successfully switched prisma/schema.prisma datasource provider to: postgresql");
} else {
  content = content.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
  fs.writeFileSync(schemaPath, content, "utf8");
  console.log("✅ Successfully switched prisma/schema.prisma datasource provider to: sqlite");
}
