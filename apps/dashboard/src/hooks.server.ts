import type { Handle } from "@sveltejs/kit"
import { svelteKitHandler } from "better-auth/svelte-kit"
import { building } from "$app/environment"
import { auth, discordIdOf } from "$lib/server/auth"

export const handle: Handle = async ({ event, resolve }) => {
  const session = await auth.api.getSession({ headers: event.request.headers })

  event.locals.session = session?.session ?? null
  event.locals.user = session?.user ?? null
  event.locals.discordId = session ? discordIdOf(session.user.id) : null
  event.locals.isAdmin =
    !!event.locals.discordId &&
    event.locals.discordId === process.env.ADMIN_DISCORD_ID

  return svelteKitHandler({ event, resolve, auth, building })
}
