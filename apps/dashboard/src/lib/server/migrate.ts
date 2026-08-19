import { getMigrations } from "better-auth/db/migration"
import { migrate } from "drizzle-orm/bun-sqlite/migrator"
import { auth } from "./auth"
import { db } from "./db"

migrate(db, { migrationsFolder: "./drizzle" })

const { runMigrations } = await getMigrations(auth.options)

await runMigrations()

console.log("tables ready")
