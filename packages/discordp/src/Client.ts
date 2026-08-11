import { Logger } from "@pleahmacaka/logger"
import {
  type ApplicationCommandDataResolvable,
  ApplicationCommandType,
  type ApplicationIntegrationType,
  Client as ClientJS,
  type ClientOptions,
  type Interaction,
  type InteractionContextType,
  MessageFlags,
} from "discord.js"
import { type Command, commandsOf } from "./decorators/registry.js"

export interface PClientOptions extends ClientOptions {
  commands?: (new () => object)[]

  guild?: string

  integrationTypes?: readonly ApplicationIntegrationType[]

  contexts?: readonly InteractionContextType[]
}

function authorizeUrl(params: Record<string, string>): string {
  return `https://discord.com/oauth2/authorize?${new URLSearchParams(params)}`
}

export class Client extends ClientJS {
  private readonly commands = new Map<string, Command>()

  private readonly guild: string | undefined

  private readonly integrationTypes: readonly ApplicationIntegrationType[] | undefined

  private readonly contexts: readonly InteractionContextType[] | undefined

  constructor(options: PClientOptions) {
    super(options)

    this.guild = options.guild
    this.integrationTypes = options.integrationTypes
    this.contexts = options.contexts

    for (const CommandClass of options.commands ?? [])
      for (const command of commandsOf(new CommandClass()))
        this.commands.set(`${command.type}:${command.name}`, command)

    this.once("clientReady", () => void this.onReady())
    this.on("interactionCreate", interaction => void this.dispatch(interaction))
  }

  private async onReady(): Promise<void> {
    this.logInstallUrls()

    await this.deploy()
  }

  private logInstallUrls(): void {
    const clientId = this.application?.id

    if (!clientId) return

    Logger.info(
      "Guild install:",
      authorizeUrl({
        client_id: clientId,
        scope: "bot applications.commands",
        permissions: "0",
        integration_type: "0",
      }),
    )

    Logger.info(
      "User install:",
      authorizeUrl({
        client_id: clientId,
        scope: "applications.commands",
        integration_type: "1",
      }),
    )
  }

  private toCommandData(command: Command): ApplicationCommandDataResolvable {
    const base = {
      name: command.name,
      ...(this.integrationTypes && { integrationTypes: this.integrationTypes }),
      ...(this.contexts && { contexts: this.contexts }),
    }

    // context menu commands are rejected by the API when a description is sent
    return command.type === ApplicationCommandType.ChatInput
      ? { ...base, type: command.type, description: command.description, options: command.options }
      : { ...base, type: command.type }
  }

  private async deploy(): Promise<void> {
    const commands = this.application?.commands

    if (!commands) return

    const body = [...this.commands.values()].map(command => this.toCommandData(command))

    try {
      await (this.guild ? commands.set(body, this.guild) : commands.set(body))

      Logger.info(`Deployed ${body.length} command(s)${this.guild ? ` to guild ${this.guild}` : " globally"}`)
    } catch (error) {
      Logger.critical("Failed to deploy commands:", error)
    }
  }

  private async dispatch(interaction: Interaction): Promise<void> {
    if (!interaction.isChatInputCommand() && !interaction.isMessageContextMenuCommand()) return

    const command = this.commands.get(`${interaction.commandType}:${interaction.commandName}`)

    if (!command) return

    try {
      await command.execute(interaction)
    } catch (error) {
      Logger.error(`Command "${interaction.commandName}" failed:`, error)

      if (interaction.replied || interaction.deferred) return

      await interaction
        .reply({ content: "Something went wrong.", flags: MessageFlags.Ephemeral })
        .catch(() => undefined)
    }
  }
}
