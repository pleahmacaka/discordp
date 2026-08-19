import { generateText, jsonSchema } from "ai"
import { createPerplexityAgent } from "ai-sdk-pplx-agent"
import { activePersona, getSetting } from "./db.js"

const MODEL = "perplexity/deepseek-v4-flash-0731"

const apiKey = process.env.PPLX_API_KEY

if (!apiKey) {
  throw new Error("PPLX_API_KEY is missing, put it in apps/pbot/.env")
}

const perplexity = createPerplexityAgent({ apiKey })

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

function now(): string {
  return new Date().toLocaleString("en-US", {
    timeZone,
    dateStyle: "full",
    timeStyle: "short",
  })
}

export type SearchResult = {
  answer: string
  personaName: string
  system: string
}

function systemPrompt(userId: string): { system: string; personaName: string } {
  const persona = activePersona(userId)
  const core = getSetting("core_prompt") ?? ""
  const base = getSetting("default_persona") ?? ""

  return {
    system: `${core} ${persona?.content ?? base}`.trim(),
    personaName: persona?.name ?? "default",
  }
}

export async function search(
  question: string,
  asker: string,
  userId: string,
): Promise<SearchResult> {
  const lazy = question.trim().length < 30
  const { system, personaName } = systemPrompt(userId)

  const { text, sources } = await generateText({
    model: perplexity(MODEL),
    system,
    prompt: `[${timeZone} ${now()}] ${asker}: ${question}`,
    providerOptions: {
      "perplexity-agent": { maxSteps: 1 },
    },
    tools: {
      web_search: {
        type: "provider",
        id: "perplexity-agent.web_search",
        args: lazy
          ? { max_tokens: 1024, max_tokens_per_page: 512 }
          : { max_tokens: 4096, max_tokens_per_page: 1024 },
        isProviderExecuted: true,
        inputSchema: jsonSchema({}),
      },
    },
  })

  const links = sources
    .filter(source => source.sourceType === "url")
    .slice(0, 3)
    .map(source => `-# <${source.url}>`)

  return {
    answer: [text, links.join("\n")].filter(Boolean).join("\n\n"),
    personaName,
    system,
  }
}

const REVIEW = [
  "You review persona descriptions for a Discord bot.",
  "SFW personas are allowed no matter the style: rude, edgy, cutesy, robotic, anything goes as long as it stays safe for work.",
  "Reject only personas that are sexual or NSFW, or that push the bot toward slurs or hate against race, gender, religion, orientation or disability.",
  "Answer with exactly one word: ALLOW or DENY.",
].join(" ")

export async function isPersonaAllowed(content: string): Promise<boolean> {
  const { text } = await generateText({
    model: perplexity(MODEL),
    system: REVIEW,
    prompt: content,
    providerOptions: {
      "perplexity-agent": { maxSteps: 1 },
    },
  })

  return text.trim().toUpperCase().startsWith("ALLOW")
}
