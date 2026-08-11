import { expect, test } from "bun:test"
import { ApplicationCommandType, type ChatInputCommandInteraction } from "discord.js"
import { MessageCommand } from "../src/decorators/MessageCommand.js"
import { commandsOf } from "../src/decorators/registry.js"
import { Slash } from "../src/decorators/Slash.js"

class ExampleCommand {
  private greeting = "Hello"

  @Slash({ name: "example", description: "example command" })
  async run() {
    return `${this.greeting} World!`
  }

  @MessageCommand({ name: "질문하기" })
  async fromMessage() {
    return this.greeting
  }
}

test("decorated methods are collected and stay bound to their instance", async () => {
  const [slash] = commandsOf(new ExampleCommand())

  expect(slash?.name).toBe("example")
  expect(await slash?.execute({} as ChatInputCommandInteraction)).toBe("Hello World!")
})

test("context menu commands carry no description", () => {
  const [, messageCommand] = commandsOf(new ExampleCommand())

  expect(messageCommand?.type).toBe(ApplicationCommandType.Message)
  expect(messageCommand?.description).toBe("")
})

test("each instance collects its own commands", () => {
  expect(commandsOf(new ExampleCommand())).toHaveLength(2)
  expect(commandsOf({})).toEqual([])
})
