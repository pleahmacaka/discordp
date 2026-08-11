import type {
  ApplicationCommandOptionData,
  ApplicationCommandType,
  ChatInputCommandInteraction,
  MessageContextMenuCommandInteraction,
} from "discord.js"

export type CommandInteraction = ChatInputCommandInteraction | MessageContextMenuCommandInteraction

export interface Command {
  name: string
  type: ApplicationCommandType.ChatInput | ApplicationCommandType.Message
  description: string
  options: readonly ApplicationCommandOptionData[]

  // method syntax on purpose: bivariance lets each decorator store its own interaction type
  execute(interaction: CommandInteraction): unknown
}

const registry = new WeakMap<object, Command[]>()

export function collect(instance: object, command: Command): void {
  const commands = registry.get(instance) ?? []

  commands.push(command)
  registry.set(instance, commands)
}

export function commandsOf(instance: object): Command[] {
  return registry.get(instance) ?? []
}
