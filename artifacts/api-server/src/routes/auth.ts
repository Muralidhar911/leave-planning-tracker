import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;

  console.log("[login] Attempt — email:", email);

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  console.log("[login] Normalized email:", normalizedEmail);

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail));

  if (!user) {
    console.log("[login] FAIL — no user found for email:", normalizedEmail);
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  console.log("[login] User found:", { id: user.id, email: user.email, role: user.role });
  console.log("[login] passwordHash present:", !!user.passwordHash, "length:", user.passwordHash?.length);

  const valid = await bcrypt.compare(password, user.passwordHash);
  console.log("[login] bcrypt.compare result:", valid);

  if (!valid) {
    console.log("[login] FAIL — password mismatch for:", normalizedEmail);
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  req.session.userId = user.id;
  req.session.role = user.role;

  console.log("[login] SUCCESS — session created for:", normalizedEmail);

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt.toISOString(),
    },
    message: "Logged in successfully",
  });
});

// One-time admin setup endpoint — creates or resets the admin user
// Protected by SETUP_SECRET env variable
router.post("/auth/setup-admin", async (req, res): Promise<void> => {
  const { secret, email, password, name } = req.body;
  const expectedSecret = process.env.SETUP_SECRET;

  if (!expectedSecret) {
    res.status(503).json({ error: "Setup not enabled (SETUP_SECRET not configured)" });
    return;
  }
  if (secret !== expectedSecret) {
    res.status(403).json({ error: "Invalid setup secret" });
    return;
  }
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const adminEmail = email.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(password, 12);
  const adminName = name?.trim() || "Admin";

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, adminEmail));

  let admin;
  if (existing) {
    [admin] = await db
      .update(usersTable)
      .set({ passwordHash, role: "admin", mustChangePassword: false })
      .where(eq(usersTable.email, adminEmail))
      .returning();
    console.log("[setup-admin] Updated existing user:", adminEmail);
  } else {
    [admin] = await db
      .insert(usersTable)
      .values({ name: adminName, email: adminEmail, passwordHash, role: "admin", mustChangePassword: false })
      .returning();
    console.log("[setup-admin] Created new admin:", adminEmail);
  }

  res.json({ success: true, user: { id: admin.id, email: admin.email, role: admin.role } });
});


router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId!));

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt.toISOString(),
  });
});

router.post("/auth/change-password", requireAuth, async (req, res): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Current and new password are required" });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId!));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    res.status(400).json({ error: "Current password is incorrect" });
    return;
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await db
    .update(usersTable)
    .set({ passwordHash: newHash, mustChangePassword: false })
    .where(eq(usersTable.id, req.session.userId!));

  res.json({ message: "Password changed successfully" });
});

router.patch("/auth/update-profile", requireAuth, async (req, res): Promise<void> => {
  const { name } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ name: name.trim() })
    .where(eq(usersTable.id, req.session.userId!))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    mustChangePassword: updated.mustChangePassword,
    createdAt: updated.createdAt.toISOString(),
  });
});

export default router;
