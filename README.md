# 📖 Introduction

This module is an extension of [discord.js](https://github.com/discordjs/discord.js).

Can use discord.js client and all function as is, DiscordP is just simple framework implement of discord.js.

# 🗂 Packages

- [discordp](packages/discordp) - The main code for creating a Discord bot.
- [pbot](apps/pbot) - Example bot for discordp development, answers questions with Perplexity web search.

# 🚀 Usage

```ts
import { ApplicationCommandOptionType, ApplicationIntegrationType, InteractionContextType } from "discord.js"
import { Client, MessageCommand, Slash } from "discordp"

class PingCommand {
  @Slash({
    name: "ping",
    description: "Pong!",
    options: [{ name: "text", description: "echo", type: ApplicationCommandOptionType.String, required: true }]
  })
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply(interaction.options.getString("text", true))
  }

  @MessageCommand({ name: "Quote" })
  async quote(interaction: MessageContextMenuCommandInteraction) {
    await interaction.reply(interaction.targetMessage.content)
  }
}

const client = new Client({
  intents: [],
  commands: [PingCommand],
  integrationTypes: [ApplicationIntegrationType.UserInstall],
  contexts: [InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel]
})

await client.login(process.env.DISCORD_BOT_TOKEN)
```

Commands are deployed on `clientReady` and dispatched on `interactionCreate`, so a class listed in `commands` is all
it takes. Guild and user install links are printed on startup. Pass `guild` to deploy instantly to a single guild,
which only works for guild-installed commands.

Building a bot with `tsc` instead of Bun needs `"target": "es2023"` or lower, since `esnext` emits decorators no
runtime can parse yet.

# 🌊 Repo-Explain

The [main](https://github.com/PleahMaCaka/discordp/tree/main) for deployment
and [dev](https://github.com/PleahMaCaKa/discordp/tree/dev) for development.  
Bun workspaces manage all the packages simultaneously, and GitHub Actions run on Bun's cached installs.

```sh
bun install
bun run build      # compile discordp to build/
bun run lint       # biome check
bun run format     # biome check --write
bun run typecheck
bun test
bun dev            # run pbot with reload, needs apps/pbot/.env
bun start          # run pbot
```
