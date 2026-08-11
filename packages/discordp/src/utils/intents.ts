import { GatewayIntentBits } from "discord.js"

// privileged intents included: enable them in the Developer Portal or login fails with "Disallowed intents"
export const ALL_INTENTS = Object.values(GatewayIntentBits)
  .filter(bit => typeof bit === "number")
  .reduce((all, bit) => all | bit, 0)
