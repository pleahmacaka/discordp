import { error, fail } from "@sveltejs/kit"
import { deleteSetting, getSetting, setSetting } from "$lib/server/pbot"
import type { Actions, PageServerLoad } from "./$types"

const EDITABLE_KEYS = ["core_prompt", "default_persona"] as const

function requireAdmin(locals: App.Locals): void {
  if (!locals.isAdmin) {
    error(403, "developer only")
  }
}

function keyOf(form: FormData): (typeof EDITABLE_KEYS)[number] {
  const key = String(form.get("key") ?? "")
  const found = EDITABLE_KEYS.find(k => k === key)

  if (!found) {
    error(400, "unknown setting")
  }

  return found
}

export const load: PageServerLoad = async ({ locals }) => {
  requireAdmin(locals)

  return {
    corePrompt: getSetting("core_prompt") ?? "",
    defaultPersona: getSetting("default_persona") ?? "",
  }
}

export const actions: Actions = {
  save: async ({ locals, request }) => {
    requireAdmin(locals)

    const form = await request.formData()
    const key = keyOf(form)
    const value = String(form.get("value") ?? "").trim()

    if (!value) {
      return fail(400, {
        message: "Prompt cannot be empty. Use Reset instead.",
      })
    }

    setSetting(key, value)

    return { message: "Saved. The bot picks it up on its next question." }
  },

  reset: async ({ locals, request }) => {
    requireAdmin(locals)

    deleteSetting(keyOf(await request.formData()))

    return {
      message:
        "Cleared. The built-in default is reseeded on the next bot restart.",
    }
  },
}
