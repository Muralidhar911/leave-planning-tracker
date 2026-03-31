import { Router, type IRouter } from "express";
import { db, leavesTable, usersTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/leaves", requireAuth, async (req, res): Promise<void> => {
  // Always filter by logged-in user — even admins should only see their own leaves here.
  // Use GET /leaves/all for the full team view (team calendar, insights).
  const leaves = await db
    .select({
      id: leavesTable.id,
      userId: leavesTable.userId,
      startDate: leavesTable.startDate,
      endDate: leavesTable.endDate,
      reason: leavesTable.reason,
      createdAt: leavesTable.createdAt,
      userName: usersTable.name,
      userEmail: usersTable.email,
    })
    .from(leavesTable)
    .innerJoin(usersTable, eq(leavesTable.userId, usersTable.id))
    .where(eq(leavesTable.userId, req.session.userId!))
    .orderBy(leavesTable.startDate);

  res.json(
    leaves.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
    }))
  );
});


router.get("/leaves/all", requireAuth, async (_req, res): Promise<void> => {
  const leaves = await db
    .select({
      id: leavesTable.id,
      userId: leavesTable.userId,
      startDate: leavesTable.startDate,
      endDate: leavesTable.endDate,
      reason: leavesTable.reason,
      createdAt: leavesTable.createdAt,
      userName: usersTable.name,
      userEmail: usersTable.email,
    })
    .from(leavesTable)
    .innerJoin(usersTable, eq(leavesTable.userId, usersTable.id))
    .orderBy(leavesTable.startDate);

  res.json(
    leaves.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
    }))
  );
});

router.post("/leaves", requireAuth, async (req, res): Promise<void> => {
  const { startDate, endDate, reason } = req.body;

  if (!startDate || !endDate || !reason) {
    res.status(400).json({ error: "Start date, end date, and reason are required" });
    return;
  }

  if (new Date(startDate) > new Date(endDate)) {
    res.status(400).json({ error: "Start date must be before or equal to end date" });
    return;
  }

  const [leave] = await db
    .insert(leavesTable)
    .values({
      userId: req.session.userId!,
      startDate,
      endDate,
      reason: reason.trim(),
    })
    .returning();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId!));

  res.status(201).json({
    id: leave.id,
    userId: leave.userId,
    startDate: leave.startDate,
    endDate: leave.endDate,
    reason: leave.reason,
    createdAt: leave.createdAt.toISOString(),
    userName: user.name,
    userEmail: user.email,
  });
});

router.patch("/leaves/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { startDate, endDate, reason } = req.body;

  const [existing] = await db
    .select()
    .from(leavesTable)
    .where(eq(leavesTable.id, rawId));

  if (!existing) {
    res.status(404).json({ error: "Leave not found" });
    return;
  }

  const isAdmin = req.session.role === "admin";
  if (!isAdmin && existing.userId !== req.session.userId) {
    res.status(403).json({ error: "You can only edit your own leaves" });
    return;
  }

  const updates: Partial<typeof existing> = {};
  if (startDate) updates.startDate = startDate;
  if (endDate) updates.endDate = endDate;
  if (reason) updates.reason = reason.trim();

  const finalStart = updates.startDate ?? existing.startDate;
  const finalEnd = updates.endDate ?? existing.endDate;

  if (new Date(finalStart) > new Date(finalEnd)) {
    res.status(400).json({ error: "Start date must be before or equal to end date" });
    return;
  }

  const [updated] = await db
    .update(leavesTable)
    .set(updates)
    .where(eq(leavesTable.id, rawId))
    .returning();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, updated.userId));

  res.json({
    id: updated.id,
    userId: updated.userId,
    startDate: updated.startDate,
    endDate: updated.endDate,
    reason: updated.reason,
    createdAt: updated.createdAt.toISOString(),
    userName: user.name,
    userEmail: user.email,
  });
});

router.delete("/leaves/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [existing] = await db
    .select()
    .from(leavesTable)
    .where(eq(leavesTable.id, rawId));

  if (!existing) {
    res.status(404).json({ error: "Leave not found" });
    return;
  }

  const isAdmin = req.session.role === "admin";
  if (!isAdmin && existing.userId !== req.session.userId) {
    res.status(403).json({ error: "You can only delete your own leaves" });
    return;
  }

  await db.delete(leavesTable).where(eq(leavesTable.id, rawId));
  res.sendStatus(204);
});

router.get("/stats", requireAuth, async (req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const monthStart = today.substring(0, 7) + "-01";
  const monthEnd = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  )
    .toISOString()
    .split("T")[0];

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const [memberCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable);

  const [todayCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(leavesTable)
    .where(
      and(
        lte(leavesTable.startDate, today),
        gte(leavesTable.endDate, today)
      )
    );

  const [upcomingCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(leavesTable)
    .where(gte(leavesTable.startDate, tomorrowStr));

  const [monthlyCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(leavesTable)
    .where(
      and(
        gte(leavesTable.startDate, monthStart),
        lte(leavesTable.startDate, monthEnd)
      )
    );

  res.json({
    totalMembers: memberCount.count,
    leavesToday: todayCount.count,
    upcomingLeaves: upcomingCount.count,
    monthlyLeaves: monthlyCount.count,
  });
});

export default router;
