import {
  type ApplicationCommandOptionData,
  ApplicationCommandType,
  type ChatInputCommandInteraction,
} from "discord.js"
import { collect } from "./registry.js"

export interface SlashInfo {
  name: string
  description?: string
  options?: readonly ApplicationCommandOptionData[]
}

export function Slash(info: SlashInfo) {
  return <This extends object>(
    handler: (this: This, interaction: ChatInputCommandInteraction) => unknown,
    context: ClassMethodDecoratorContext<This>,
  ) => {
    context.addInitializer(function (this: This) {
      collect(this, {
        name: info.name,
        type: ApplicationCommandType.ChatInput,
        description: info.description || info.name,
        options: info.options ?? [],
        execute: handler.bind(this),
      })
    })
  }
}
