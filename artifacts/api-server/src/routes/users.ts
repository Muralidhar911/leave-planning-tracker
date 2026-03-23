import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq, ne } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";

const router: IRouter = Router();

router.get("/users", requireAdmin, async (_req, res): Promise<void> => {
  const users = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      mustChangePassword: usersTable.mustChangePassword,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(usersTable.createdAt);

  res.json(
    users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    }))
  );
});

router.post("/users", requireAdmin, async (req, res): Promise<void> => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400).json({ error: "Name, email, password, and role are required" });
    return;
  }

  if (!["admin", "user"].includes(role)) {
    res.status(400).json({ error: "Role must be admin or user" });
    return;
  }

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()));

  if (existing.length > 0) {
    res.status(400).json({ error: "A user with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(usersTable)
    .values({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      mustChangePassword: true,
    })
    .returning();

  res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt.toISOString(),
  });
});

router.delete("/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, rawId));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (user.role === "admin") {
    const admins = await db
      .select()
      .from(usersTable)
      .where(ne(usersTable.id, rawId));
    const otherAdmins = admins.filter((u) => u.role === "admin");
    if (otherAdmins.length === 0) {
      res.status(400).json({ error: "Cannot delete the only admin" });
      return;
    }
  }

  await db.delete(usersTable).where(eq(usersTable.id, rawId));
  res.sendStatus(204);
});

export default router;
