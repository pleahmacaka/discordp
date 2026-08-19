import { error, fail } from "@sveltejs/kit"
import { desc, sql } from "drizzle-orm"
import { db } from "$lib/server/db"
import { events } from "$lib/server/db/schema"
import {
  deletePersona,
  isPersonaAllowed,
  listPersonas,
  listPersonaUsers,
  MAX_PERSONAS,
  savePersona,
  setActivePersona,
} from "$lib/server/pbot"
import type { Actions, PageServerLoad } from "./$types"

function targetUserOf(locals: App.Locals, requested: string | null): string {
  if (!locals.discordId) {
    error(401, "no linked Discord account")
  }

  return locals.isAdmin && requested ? requested : locals.discordId
}

async function userNames(): Promise<Map<string, string>> {
  const rows = await db
    .select({
      discordUserId: events.discordUserId,
      userName: sql<string>`max(${events.userName})`.as("user_name"),
    })
    .from(events)
    .groupBy(events.discordUserId)
    .orderBy(desc(sql`count(*)`))

  return new Map(rows.map(row => [row.discordUserId, row.userName]))
}

export const load: PageServerLoad = async ({ locals, url }) => {
  const target = targetUserOf(locals, url.searchParams.get("user"))

  const users = locals.isAdmin
    ? await userNames().then(names =>
        [...new Set([...listPersonaUsers(), locals.discordId ?? ""])]
          .filter(Boolean)
          .map(id => ({ id, name: names.get(id) ?? id })),
      )
    : []

  return {
    personas: listPersonas(target),
    maxPersonas: MAX_PERSONAS,
    target,
    users,
  }
}

async function formOf(locals: App.Locals, request: Request) {
  const form = await request.formData()
  const target = targetUserOf(locals, String(form.get("user") ?? "") || null)

  return { form, target }
}

export const actions: Actions = {
  save: async ({ locals, request }) => {
    const { form, target } = await formOf(locals, request)
    const name = String(form.get("name") ?? "")
      .trim()
      .slice(0, 32)
    const content = String(form.get("content") ?? "")
      .trim()
      .slice(0, 2000)

    if (!name || !content) {
      return fail(400, { message: "Name and description are required." })
    }

    if (!(await isPersonaAllowed(content))) {
      return fail(400, {
        message: "That persona was rejected: keep it SFW and hate-free.",
      })
    }

    if (savePersona(target, name, content) === "limit") {
      return fail(400, {
        message: `Already at ${MAX_PERSONAS} personas. Delete one first.`,
      })
    }

    return { message: `Persona "${name}" saved.` }
  },

  activate: async ({ locals, request }) => {
    const { form, target } = await formOf(locals, request)

    setActivePersona(target, String(form.get("name") ?? ""))

    return { message: "Persona activated." }
  },

  reset: async ({ locals, request }) => {
    const { target } = await formOf(locals, request)

    setActivePersona(target, null)

    return { message: "Back to the default persona." }
  },

  delete: async ({ locals, request }) => {
    const { form, target } = await formOf(locals, request)

    deletePersona(target, String(form.get("name") ?? ""))

    return { message: "Persona deleted." }
  },
}
