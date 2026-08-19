import {
  ApplicationCommandType,
  type MessageContextMenuCommandInteraction,
} from "discord.js"
import { collect } from "./registry.js"

export interface MessageCommandInfo {
  name: string
}

export function MessageCommand(info: MessageCommandInfo) {
  return <This extends object>(
    handler: (
      this: This,
      interaction: MessageContextMenuCommandInteraction,
    ) => unknown,
    context: ClassMethodDecoratorContext<This>,
  ) => {
    context.addInitializer(function (this: This) {
      collect(this, {
        name: info.name,
        type: ApplicationCommandType.Message,
        description: "",
        options: [],
        execute: handler.bind(this),
      })
    })
  }
}
