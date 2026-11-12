// Utilitários dos testes de integração: usam o Supabase local (supabase start).
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// As chaves vêm do .env.local (carregado pelo vitest.config.mts) ou do ambiente do CI.
function exigir(nome: string) {
  const valor = process.env[nome]
  if (!valor) throw new Error(`Defina ${nome} no .env.local (veja .env.example e \`supabase status\`).`)
  return valor
}

export const url = exigir("NEXT_PUBLIC_SUPABASE_URL")
export const chave = exigir("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")

/** Cria um usuário novo (o Supabase local não exige confirmação de e-mail) já logado. */
export async function novoUsuario(prefixo = "teste"): Promise<SupabaseClient> {
  const sb = createClient(url, chave, { auth: { persistSession: false } })
  const email = `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@teste.local`
  const { error } = await sb.auth.signUp({ email, password: "senha-de-teste" })
  if (error) throw error
  return sb
}

export const anonimo = () => createClient(url, chave, { auth: { persistSession: false } })

/** Chave secreta do Supabase LOCAL, usada só para preparar dados de teste. */
const chaveSecreta = () => exigir("SUPABASE_SECRET_KEY")

/** Torna o usuário logado administrador (somente no banco local de testes). */
export async function tornarAdmin(sb: SupabaseClient) {
  const { data } = await sb.auth.getUser()
  const servico = createClient(url, chaveSecreta(), { auth: { persistSession: false } })
  const { error } = await servico.from("administradores").insert({ user_id: data.user!.id })
  if (error) throw error
}

export async function idDe(sb: SupabaseClient) {
  return (await sb.auth.getUser()).data.user!.id
}
