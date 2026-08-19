import {
  ApplicationCommandOptionType,
  type ChatInputCommandInteraction,
  type MessageContextMenuCommandInteraction,
  MessageFlags,
} from "discord.js"
import { MessageCommand, Slash } from "discordp"
import { search } from "../search.js"
import { record } from "../telemetry.js"

const MAX_MESSAGE_LENGTH = 2000

type AskInteraction =
  | ChatInputCommandInteraction
  | MessageContextMenuCommandInteraction

export class AskCommand {
  @Slash({
    name: "ask",
    description: "Searches the web and answers your question",
    options: [
      {
        name: "question",
        description: "What to ask",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  })
  async ask(interaction: ChatInputCommandInteraction) {
    await this.answer(
      interaction,
      interaction.options.getString("question", true),
    )
  }

  @MessageCommand({ name: "Ask about this" })
  async askAboutMessage(interaction: MessageContextMenuCommandInteraction) {
    const { content } = interaction.targetMessage

    if (!content) {
      await interaction.reply({
        content: "That message has no text.",
        flags: MessageFlags.Ephemeral,
      })

      return
    }

    await this.answer(
      interaction,
      `(about a message from ${interaction.targetMessage.author.displayName}) ${content}`,
    )
  }

  private async answer(interaction: AskInteraction, question: string) {
    await interaction.deferReply()

    const started = Date.now()

    try {
      const { answer, personaName, system } = await search(
        question,
        interaction.user.displayName,
        interaction.user.id,
      )

      await interaction.editReply(answer.slice(0, MAX_MESSAGE_LENGTH))

      record(interaction, question, {
        answer,
        persona: personaName,
        systemPrompt: system,
        latencyMs: Date.now() - started,
        ok: true,
      })
    } catch (error) {
      record(interaction, question, {
        latencyMs: Date.now() - started,
        ok: false,
        error: String(error),
      })

      throw error
    }
  }
}
