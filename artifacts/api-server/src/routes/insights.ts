import { Router, type IRouter } from "express";
import { db, leavesTable, usersTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function getDateRange(period?: string, startDate?: string, endDate?: string): { from: string; to: string } | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (period === "week") {
    const from = new Date(today);
    const day = from.getDay();
    const diff = from.getDate() - day + (day === 0 ? -6 : 1);
    from.setDate(diff);
    const to = new Date(from);
    to.setDate(from.getDate() + 6);
    return {
      from: from.toISOString().split("T")[0],
      to: to.toISOString().split("T")[0],
    };
  }

  if (period === "month") {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      from: from.toISOString().split("T")[0],
      to: to.toISOString().split("T")[0],
    };
  }

  if (period === "custom" && startDate && endDate) {
    return { from: startDate, to: endDate };
  }

  return null;
}

function calculateDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diff);
}

router.get("/insights", requireAuth, async (req, res): Promise<void> => {
  const { userId, period, startDate, endDate } = req.query as Record<string, string | undefined>;

  const dateRange = getDateRange(period, startDate, endDate);
  const today = new Date().toISOString().split("T")[0];

  const conditions = [];

  if (userId && userId !== "all") {
    conditions.push(eq(leavesTable.userId, userId));
  }

  if (dateRange) {
    conditions.push(gte(leavesTable.startDate, dateRange.from));
    conditions.push(lte(leavesTable.startDate, dateRange.to));
  }

  const query = db
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
    .innerJoin(usersTable, eq(leavesTable.userId, usersTable.id));

  const leaves = conditions.length > 0
    ? await query.where(and(...conditions)).orderBy(leavesTable.startDate)
    : await query.orderBy(leavesTable.startDate);

  const enriched = leaves.map((l) => {
    const isPast = l.endDate < today;
    const isUpcoming = l.startDate > today;
    return {
      id: l.id,
      userId: l.userId,
      userName: l.userName,
      userEmail: l.userEmail,
      startDate: l.startDate,
      endDate: l.endDate,
      reason: l.reason,
      createdAt: l.createdAt.toISOString(),
      numberOfDays: calculateDays(l.startDate, l.endDate),
      isPast,
      isUpcoming,
    };
  });

  res.json({
    totalLeaves: enriched.length,
    upcomingLeaves: enriched.filter((l) => l.isUpcoming).length,
    pastLeaves: enriched.filter((l) => l.isPast).length,
    leaves: enriched,
  });
});

export default router;
