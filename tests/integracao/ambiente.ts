// Utilitários dos testes de integração: usam o Supabase local (supabase start).
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

export const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:55321"
export const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"

/** Cria um usuário novo (o Supabase local não exige confirmação de e-mail) já logado. */
export async function novoUsuario(prefixo = "teste"): Promise<SupabaseClient> {
  const sb = createClient(url, chave, { auth: { persistSession: false } })
  const email = `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@teste.local`
  const { error } = await sb.auth.signUp({ email, password: "senha-de-teste" })
  if (error) throw error
  return sb
}

export const anonimo = () => createClient(url, chave, { auth: { persistSession: false } })
