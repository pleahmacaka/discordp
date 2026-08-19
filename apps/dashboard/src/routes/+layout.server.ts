import { redirect } from "@sveltejs/kit"
import type { LayoutServerLoad } from "./$types"

export const load: LayoutServerLoad = ({ locals, url }) => {
  if (!locals.user && url.pathname !== "/login") {
    redirect(302, "/login")
  }

  return {
    user: locals.user && { name: locals.user.name, image: locals.user.image },
    isAdmin: locals.isAdmin,
  }
}
