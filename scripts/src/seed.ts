import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding default admin user...");

  const adminEmail = "admin@company.com";

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, adminEmail));

  if (existing) {
    console.log("Admin user already exists, skipping.");
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash("Admin@123", 12);

  const [admin] = await db
    .insert(usersTable)
    .values({
      name: "Admin",
      email: adminEmail,
      passwordHash,
      role: "admin",
      mustChangePassword: false,
    })
    .returning();

  console.log("✅ Admin user created successfully:");
  console.log(`   Email: ${admin.email}`);
  console.log(`   Role:  ${admin.role}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
