import axios from "axios"
import type { CommandInteraction } from "discord.js"

const url = process.env.TELEMETRY_URL
const token = process.env.TELEMETRY_TOKEN

type Result = {
  answer?: string
  persona?: string
  systemPrompt?: string
  latencyMs: number
  ok: boolean
  error?: string
}

export function record(
  interaction: CommandInteraction,
  question: string,
  result: Result,
): void {
  if (!url || !token) {
    return
  }

  axios
    .post(
      url,
      {
        discordUserId: interaction.user.id,
        userName: interaction.user.displayName,
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        source: interaction.isChatInputCommand() ? "slash" : "context",
        question,
        ...result,
      },
      { headers: { authorization: `Bearer ${token}` } },
    )
    .catch(() => undefined)
}
