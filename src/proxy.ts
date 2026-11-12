import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { supabaseKey, supabaseUrl } from "@/lib/supabase/config"

const PUBLICAS = ["/login", "/auth"]

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(lista) {
        lista.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        lista.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const { data } = await supabase.auth.getClaims()
  const logado = Boolean(data?.claims)
  const caminho = request.nextUrl.pathname
  const publica = PUBLICAS.some((p) => caminho.startsWith(p))

  const redirecionar = (destino: string) => {
    const url = request.nextUrl.clone()
    url.pathname = destino
    url.search = ""
    const r = NextResponse.redirect(url)
    response.cookies.getAll().forEach((c) => r.cookies.set(c))
    return r
  }

  if (!logado && !publica) return redirecionar("/login")
  if (logado && caminho.startsWith("/login")) return redirecionar("/agenda")
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}
