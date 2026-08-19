import { Database } from "bun:sqlite"
import { mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { generateText } from "ai"
import { createPerplexityAgent } from "ai-sdk-pplx-agent"

const file = resolve(process.env.PBOT_DB_PATH ?? "../pbot/data/pbot.db")

mkdirSync(dirname(file), { recursive: true })

const db = new Database(file, { create: true })

db.exec("PRAGMA journal_mode = WAL")

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS personas (
    discord_user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (discord_user_id, name)
  );
`)

export const MAX_PERSONAS = 5

export type Persona = {
  name: string
  content: string
  active: boolean
}

type PersonaRow = {
  name: string
  content: string
  active: number
}

export function getSetting(key: string): string | null {
  const row = db
    .query<{ value: string }, [string]>(
      "SELECT value FROM settings WHERE key = ?",
    )
    .get(key)

  return row?.value ?? null
}

export function setSetting(key: string, value: string): void {
  db.query(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  ).run(key, value)
}

export function deleteSetting(key: string): void {
  db.query("DELETE FROM settings WHERE key = ?").run(key)
}

export function listPersonaUsers(): string[] {
  return db
    .query<{ discord_user_id: string }, []>(
      "SELECT DISTINCT discord_user_id FROM personas ORDER BY discord_user_id",
    )
    .all()
    .map(row => row.discord_user_id)
}

export function listPersonas(userId: string): Persona[] {
  const rows = db
    .query<PersonaRow, [string]>(
      "SELECT name, content, active FROM personas WHERE discord_user_id = ? ORDER BY created_at",
    )
    .all(userId)

  return rows.map(row => ({
    name: row.name,
    content: row.content,
    active: row.active === 1,
  }))
}

export function savePersona(
  userId: string,
  name: string,
  content: string,
): "saved" | "limit" {
  const existing = listPersonas(userId)

  if (existing.length >= MAX_PERSONAS && !existing.some(p => p.name === name)) {
    return "limit"
  }

  db.query(
    `INSERT INTO personas (discord_user_id, name, content, created_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(discord_user_id, name) DO UPDATE SET content = excluded.content`,
  ).run(userId, name, content, Date.now())

  return "saved"
}

export function deletePersona(userId: string, name: string): boolean {
  return (
    db
      .query("DELETE FROM personas WHERE discord_user_id = ? AND name = ?")
      .run(userId, name).changes > 0
  )
}

export function setActivePersona(userId: string, name: string | null): boolean {
  db.query("UPDATE personas SET active = 0 WHERE discord_user_id = ?").run(
    userId,
  )

  if (name === null) {
    return true
  }

  return (
    db
      .query(
        "UPDATE personas SET active = 1 WHERE discord_user_id = ? AND name = ?",
      )
      .run(userId, name).changes > 0
  )
}

const MODEL = "perplexity/deepseek-v4-flash-0731"

const REVIEW = [
  "You review persona descriptions for a Discord bot.",
  "SFW personas are allowed no matter the style: rude, edgy, cutesy, robotic, anything goes as long as it stays safe for work.",
  "Reject only personas that are sexual or NSFW, or that push the bot toward slurs or hate against race, gender, religion, orientation or disability.",
  "Answer with exactly one word: ALLOW or DENY.",
].join(" ")

export async function isPersonaAllowed(content: string): Promise<boolean> {
  const apiKey = process.env.PPLX_API_KEY

  if (!apiKey) {
    return false
  }

  const perplexity = createPerplexityAgent({ apiKey })

  const { text } = await generateText({
    model: perplexity(MODEL),
    system: REVIEW,
    prompt: content,
    providerOptions: {
      "perplexity-agent": { maxSteps: 1 },
    },
  })

  return text.trim().toUpperCase().startsWith("ALLOW")
}
