import { desc, eq, sql } from "drizzle-orm"
import { db } from "$lib/server/db"
import { events } from "$lib/server/db/schema"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ locals }) => {
  const totals = db
    .select({
      discordUserId: events.discordUserId,
      userName: sql<string>`max(${events.userName})`.as("user_name"),
      count: sql<number>`count(*)`.as("count"),
      failed: sql<number>`sum(case when ${events.ok} then 0 else 1 end)`.as(
        "failed",
      ),
      avgLatency: sql<number>`round(avg(${events.latencyMs}))`.as(
        "avg_latency",
      ),
      lastSeen: sql<number>`max(${events.createdAt})`.as("last_seen"),
    })
    .from(events)
    .groupBy(events.discordUserId)
    .orderBy(desc(sql`count(*)`))

  const rows = await (locals.isAdmin
    ? totals
    : totals.where(eq(events.discordUserId, locals.discordId ?? "-")))

  const daily = await db
    .select({
      day: sql<string>`date(${events.createdAt} / 1000, 'unixepoch', '+9 hours')`.as(
        "day",
      ),
      count: sql<number>`count(*)`.as("count"),
      failed: sql<number>`sum(case when ${events.ok} then 0 else 1 end)`.as(
        "failed",
      ),
      avgLatency: sql<number>`round(avg(${events.latencyMs}))`.as(
        "avg_latency",
      ),
    })
    .from(events)
    .where(
      locals.isAdmin
        ? undefined
        : eq(events.discordUserId, locals.discordId ?? "-"),
    )
    .groupBy(sql`day`)
    .orderBy(desc(sql`day`))
    .limit(14)

  return { rows, daily, isAdmin: locals.isAdmin }
}
