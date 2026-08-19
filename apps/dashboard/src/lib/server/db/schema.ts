import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const events = sqliteTable(
  "events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    createdAt: integer("created_at").notNull(),
    discordUserId: text("discord_user_id").notNull(),
    userName: text("user_name").notNull(),
    guildId: text("guild_id"),
    channelId: text("channel_id"),
    source: text("source").notNull(),
    question: text("question").notNull(),
    answer: text("answer"),
    persona: text("persona"),
    systemPrompt: text("system_prompt"),
    latencyMs: integer("latency_ms").notNull(),
    ok: integer("ok", { mode: "boolean" }).notNull(),
    error: text("error"),
  },
  t => [
    index("events_created_at_idx").on(t.createdAt),
    index("events_user_idx").on(t.discordUserId),
  ],
)

export type Event = typeof events.$inferSelect
