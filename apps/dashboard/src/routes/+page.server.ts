import { and, desc, eq, like, or, sql } from "drizzle-orm"
import { db } from "$lib/server/db"
import { events } from "$lib/server/db/schema"
import type { PageServerLoad } from "./$types"

const PAGE_SIZE = 100

export const load: PageServerLoad = async ({ locals, url }) => {
  const query = url.searchParams.get("q")?.trim() ?? ""
  const requested = url.searchParams.get("user")?.trim() ?? ""
  const onlyUser = locals.isAdmin ? requested : (locals.discordId ?? "-")

  const filters = [
    onlyUser ? eq(events.discordUserId, onlyUser) : undefined,
    query
      ? or(
          like(events.question, `%${query}%`),
          like(events.answer, `%${query}%`),
          like(events.userName, `%${query}%`),
        )
      : undefined,
  ].filter(Boolean)

  const where = filters.length ? and(...filters) : undefined

  const rows = await db
    .select()
    .from(events)
    .where(where)
    .orderBy(desc(events.createdAt))
    .limit(PAGE_SIZE)

  const people = locals.isAdmin
    ? await db
        .select({
          discordUserId: events.discordUserId,
          userName: sql<string>`max(${events.userName})`.as("user_name"),
        })
        .from(events)
        .groupBy(events.discordUserId)
        .orderBy(desc(sql`count(*)`))
    : []

  return {
    rows,
    people,
    query,
    onlyUser,
    isAdmin: locals.isAdmin,
    pageSize: PAGE_SIZE,
  }
}
