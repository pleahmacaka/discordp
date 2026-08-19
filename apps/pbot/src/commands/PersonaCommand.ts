import {
  ApplicationCommandOptionType,
  type ChatInputCommandInteraction,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  type ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js"
import { Slash } from "discordp"
import {
  deletePersona,
  listPersonas,
  MAX_PERSONAS,
  savePersona,
  setActivePersona,
} from "../db.js"
import { isPersonaAllowed } from "../search.js"

const MODAL_TIMEOUT_MS = 10 * 60 * 1000

export class PersonaCommand {
  @Slash({
    name: "persona",
    description: "Manage your personal PBOT personas",
    options: [
      {
        name: "create",
        description: `Create or update a persona (up to ${MAX_PERSONAS})`,
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "list",
        description: "List your personas",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "use",
        description: "Switch to one of your personas",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "name",
            description: "Persona name",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "reset",
        description: "Go back to the default persona",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "delete",
        description: "Delete one of your personas",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "name",
            description: "Persona name",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
    ],
  })
  async persona(interaction: ChatInputCommandInteraction) {
    switch (interaction.options.getSubcommand()) {
      case "create":
        return this.create(interaction)
      case "list":
        return this.list(interaction)
      case "use":
        return this.use(interaction)
      case "reset":
        return this.reset(interaction)
      case "delete":
        return this.delete(interaction)
    }
  }

  private async create(interaction: ChatInputCommandInteraction) {
    const modalId = `persona:${interaction.id}`

    const modal = new ModalBuilder()
      .setCustomId(modalId)
      .setTitle("New persona")
      .addLabelComponents(
        new LabelBuilder()
          .setLabel("Name")
          .setTextInputComponent(
            new TextInputBuilder()
              .setCustomId("name")
              .setStyle(TextInputStyle.Short)
              .setMaxLength(32)
              .setRequired(true),
          ),
        new LabelBuilder()
          .setLabel("Persona description (SFW only)")
          .setTextInputComponent(
            new TextInputBuilder()
              .setCustomId("content")
              .setStyle(TextInputStyle.Paragraph)
              .setMaxLength(2000)
              .setRequired(true),
          ),
      )

    await interaction.showModal(modal)

    const submit = await interaction
      .awaitModalSubmit({
        time: MODAL_TIMEOUT_MS,
        filter: i => i.customId === modalId,
      })
      .catch(() => null)

    if (!submit) {
      return
    }

    await this.saveFromModal(submit)
  }

  private async saveFromModal(submit: ModalSubmitInteraction) {
    await submit.deferReply({ flags: MessageFlags.Ephemeral })

    const name = submit.fields.getTextInputValue("name").trim()
    const content = submit.fields.getTextInputValue("content").trim()

    if (!(await isPersonaAllowed(content))) {
      await submit.editReply(
        "That persona was rejected: keep it SFW and hate-free.",
      )

      return
    }

    if (savePersona(submit.user.id, name, content) === "limit") {
      await submit.editReply(
        `You already have ${MAX_PERSONAS} personas. Delete one first with \`/persona delete\`.`,
      )

      return
    }

    setActivePersona(submit.user.id, name)

    await submit.editReply(`Persona **${name}** saved and activated.`)
  }

  private async list(interaction: ChatInputCommandInteraction) {
    const personas = listPersonas(interaction.user.id)

    if (personas.length === 0) {
      await interaction.reply({
        content: "You have no personas yet. Create one with `/persona create`.",
        flags: MessageFlags.Ephemeral,
      })

      return
    }

    const lines = personas.map(
      p => `- **${p.name}**${p.active ? " (active)" : ""}`,
    )

    await interaction.reply({
      content: [
        `Your personas (${personas.length}/${MAX_PERSONAS}):`,
        ...lines,
      ].join("\n"),
      flags: MessageFlags.Ephemeral,
    })
  }

  private async use(interaction: ChatInputCommandInteraction) {
    const name = interaction.options.getString("name", true)
    const found = setActivePersona(interaction.user.id, name)

    await interaction.reply({
      content: found
        ? `Persona **${name}** is now active.`
        : `No persona named **${name}**.`,
      flags: MessageFlags.Ephemeral,
    })
  }

  private async reset(interaction: ChatInputCommandInteraction) {
    setActivePersona(interaction.user.id, null)

    await interaction.reply({
      content: "Back to the default persona.",
      flags: MessageFlags.Ephemeral,
    })
  }

  private async delete(interaction: ChatInputCommandInteraction) {
    const name = interaction.options.getString("name", true)
    const removed = deletePersona(interaction.user.id, name)

    await interaction.reply({
      content: removed
        ? `Persona **${name}** deleted.`
        : `No persona named **${name}**.`,
      flags: MessageFlags.Ephemeral,
    })
  }
}
