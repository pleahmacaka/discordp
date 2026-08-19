import { ApplicationIntegrationType, InteractionContextType } from "discord.js"
import { Client, Logger } from "discordp"
import { AskCommand } from "./commands/AskCommand.js"
import { PersonaCommand } from "./commands/PersonaCommand.js"

const { DISCORD_BOT_TOKEN } = process.env

if (!DISCORD_BOT_TOKEN) {
  throw new Error("DISCORD_BOT_TOKEN is missing, put it in apps/pbot/.env")
}

const client = new Client({
  intents: [],
  commands: [AskCommand, PersonaCommand],
  integrationTypes: [ApplicationIntegrationType.UserInstall],
  contexts: [
    InteractionContextType.Guild,
    InteractionContextType.BotDM,
    InteractionContextType.PrivateChannel,
  ],
})

await client.login(DISCORD_BOT_TOKEN)

Logger.info(`Logged in as ${client.user?.tag}`)
