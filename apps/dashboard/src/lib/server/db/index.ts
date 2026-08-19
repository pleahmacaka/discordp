import { Database } from "bun:sqlite"
import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { drizzle } from "drizzle-orm/bun-sqlite"
import * as schema from "./schema"

const file = process.env.DATABASE_PATH ?? "./data/telemetry.db"

mkdirSync(dirname(file), { recursive: true })

export const sqlite = new Database(file, { create: true })

sqlite.exec("PRAGMA journal_mode = WAL")

export const db = drizzle(sqlite, { schema })
