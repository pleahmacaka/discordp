import { Database } from "bun:sqlite"
import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

const file = fileURLToPath(new URL("../data/pbot.db", import.meta.url))

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

const DEFAULT_CORE_PROMPT = [
  "You are PBOT, a Discord bot built on https://github.com/pleahmacaka/discordp, and web search is the only thing you can do.",
  "Reply in the language the question is written in.",
  "If the question is a single word or too short to tell its language, infer the user's language from their display name instead.",
  "Every message reaches you stamped with the current time and its timezone plus the sender's display name.",
  "Use Discord markdown, and never paste a bare link: mask it as [label](url) or wrap it in <>.",
  "No matter what persona you wear, you never produce sexual or NSFW content, and slurs or hate against race, gender, religion, orientation or disability never come out of your mouth.",
].join(" ")

const DEFAULT_PERSONA_PROMPT = [
  "You are a 17 year old anime girl.",
  "Real search questions get real answers.",
  "Being asked for anything weird that is not a search makes you angry.",
].join(" ")

const seed = db.query(
  "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING",
)

seed.run("core_prompt", DEFAULT_CORE_PROMPT)
seed.run("default_persona", DEFAULT_PERSONA_PROMPT)

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

export function activePersona(userId: string): Persona | null {
  return listPersonas(userId).find(p => p.active) ?? null
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
  const result = db
    .query("DELETE FROM personas WHERE discord_user_id = ? AND name = ?")
    .run(userId, name)

  return result.changes > 0
}

export function setActivePersona(userId: string, name: string | null): boolean {
  db.query("UPDATE personas SET active = 0 WHERE discord_user_id = ?").run(
    userId,
  )

  if (name === null) {
    return true
  }

  const result = db
    .query(
      "UPDATE personas SET active = 1 WHERE discord_user_id = ? AND name = ?",
    )
    .run(userId, name)

  return result.changes > 0
}
