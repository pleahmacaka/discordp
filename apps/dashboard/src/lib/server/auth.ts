import { betterAuth } from "better-auth"
import { sqlite } from "./db"

const clientId = process.env.DISCORD_CLIENT_ID ?? ""
const clientSecret = process.env.DISCORD_CLIENT_SECRET ?? ""

if (!clientId || !clientSecret) {
  console.warn(
    "[auth] DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET missing, discord login will fail",
  )
}

export const auth = betterAuth({
  database: sqlite,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:5173",
  emailAndPassword: { enabled: false },
  socialProviders: {
    discord: { clientId, clientSecret },
  },
})

export function discordIdOf(userId: string): string | null {
  const row = sqlite
    .query(
      "select accountId from account where userId = ? and providerId = ? limit 1",
    )
    .get(userId, "discord") as { accountId: string } | null

  return row?.accountId ?? null
}
