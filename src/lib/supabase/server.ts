import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { connection } from "next/server"
import { supabaseKey, supabaseUrl } from "./config"

export async function createClient() {
  // Dados do usuário são sempre por requisição (nunca entram no HTML pré-renderizado).
  await connection()
  const cookieStore = await cookies()
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(lista) {
        try {
          lista.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Chamado de um Server Component: o proxy já renova a sessão.
        }
      },
    },
  })
}
