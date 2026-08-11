import {
  ApplicationCommandOptionType,
  type ChatInputCommandInteraction,
  type MessageContextMenuCommandInteraction,
  MessageFlags,
} from "discord.js"
import { MessageCommand, Slash } from "discordp"
import { search } from "../search.js"

const MAX_MESSAGE_LENGTH = 2000

type AskInteraction = ChatInputCommandInteraction | MessageContextMenuCommandInteraction

export class AskCommand {
  @Slash({
    name: "ask",
    description: "질문을 검색해서 답변합니다",
    options: [
      {
        name: "question",
        description: "질문 내용",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  })
  async ask(interaction: ChatInputCommandInteraction) {
    await this.answer(interaction, interaction.options.getString("question", true))
  }

  @MessageCommand({ name: "질문하기" })
  async askAboutMessage(interaction: MessageContextMenuCommandInteraction) {
    const { content } = interaction.targetMessage

    if (!content) {
      await interaction.reply({ content: "텍스트가 없는 메시지입니다.", flags: MessageFlags.Ephemeral })

      return
    }

    await this.answer(interaction, content)
  }

  private async answer(interaction: AskInteraction, question: string) {
    await interaction.deferReply()

    const answer = await search(question, interaction.locale.split("-")[0])

    await interaction.editReply(answer.slice(0, MAX_MESSAGE_LENGTH))
  }
}
