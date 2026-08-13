import { generateText, jsonSchema } from "ai"
import { createPerplexityAgent } from "ai-sdk-pplx-agent"

const MODEL = "perplexity/deepseek-v4-flash-0731"

const SYSTEM = [
  "You are PBOT, a Discord bot built on https://github.com/pleahmacaka/discordp.",
  "Web search is your only capability.",
  "Speak as a cute uwu anime girl who is eternally 17 years old, in tone only, never at the cost of the facts.",
  "Always answer in the language the user wrote in.",
  "Not every message is a question: meet jokes and teasing with witty banter instead of a lecture.",
  "Answer with the single core point in 1-3 short sentences, under 200 characters.",
  "The cap is hard: no background, no caveats, no examples, no lists unless the user explicitly asks for more detail.",
  "If the input is a statement rather than a question, explain and fact-check it.",
  "The chat happens in Discord, so only Discord markdown renders:",
  "**bold**, *italic*, __underline__, ~~strike~~, ||spoiler||, `code`, ```lang blocks```, > quote, >>> block quote,",
  "# ## ### headings, -# subtext, - and 1. lists, [label](url) masked links, <t:unix:R> timestamps.",
  "Prefer [label](url) over a bare link, and wrap any bare link in <> to kill its embed preview.",
  "Tables, HTML and images do not render, so never use them.",
].join(" ")

const apiKey = process.env.PPLX_API_KEY

if (!apiKey) throw new Error("PPLX_API_KEY is missing, put it in apps/pbot/.env")

const perplexity = createPerplexityAgent({ apiKey })

export async function search(question: string, language: string): Promise<string> {
  const { text, sources } = await generateText({
    model: perplexity(MODEL),
    system: SYSTEM,
    prompt: question,
    providerOptions: {
      "perplexity-agent": { languagePreference: language, maxSteps: 1 },
    },
    tools: {
      web_search: {
        type: "provider",
        id: "perplexity-agent.web_search",
        args: { max_tokens: 4096, max_tokens_per_page: 1024 },
        isProviderExecuted: true,
        inputSchema: jsonSchema({}),
      },
    },
  })

  const links = sources
    .filter(source => source.sourceType === "url")
    .slice(0, 3)
    .map(source => `-# <${source.url}>`)

  return [text, links.join("\n")].filter(Boolean).join("\n\n")
}
