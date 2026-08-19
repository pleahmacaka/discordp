import { error, json, type RequestHandler } from "@sveltejs/kit"
import { db } from "$lib/server/db"
import { events } from "$lib/server/db/schema"

const token = process.env.TELEMETRY_TOKEN

function str(value: unknown, max: number): string | null {
  return typeof value === "string" && value.length > 0
    ? value.slice(0, max)
    : null
}

export const POST: RequestHandler = async ({ request }) => {
  if (!token) {
    error(503, "TELEMETRY_TOKEN is not configured")
  }

  if (request.headers.get("authorization") !== `Bearer ${token}`) {
    error(401, "bad token")
  }

  const body = await request.json().catch(() => null)

  if (!body || typeof body !== "object") {
    error(400, "body must be an object")
  }

  const payload = body as Record<string, unknown>
  const discordUserId = str(payload.discordUserId, 32)
  const question = str(payload.question, 4000)

  if (!discordUserId || !question) {
    error(400, "discordUserId and question are required")
  }

  await db.insert(events).values({
    createdAt: Date.now(),
    discordUserId,
    userName: str(payload.userName, 100) ?? "unknown",
    guildId: str(payload.guildId, 32),
    channelId: str(payload.channelId, 32),
    source: str(payload.source, 20) ?? "slash",
    question,
    answer: str(payload.answer, 8000),
    persona: str(payload.persona, 32),
    systemPrompt: str(payload.systemPrompt, 16000),
    latencyMs: Number(payload.latencyMs) || 0,
    ok: payload.ok !== false,
    error: str(payload.error, 2000),
  })

  return json({ ok: true }, { status: 201 })
}
