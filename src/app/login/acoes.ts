"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export type EstadoLogin = { erro?: string; aviso?: string }

function campos(form: FormData) {
  return {
    email: String(form.get("email") ?? "").trim(),
    senha: String(form.get("senha") ?? ""),
  }
}

export async function entrar(_: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  const { email, senha } = campos(form)
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
  if (error) {
    if (error.code === "email_not_confirmed") return { erro: "Confirme seu e-mail pelo link que enviamos antes de entrar." }
    return { erro: "E-mail ou senha incorretos." }
  }
  redirect("/agenda")
}

export async function cadastrar(_: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  const { email, senha } = campos(form)
  if (senha.length < 6) return { erro: "A senha precisa ter pelo menos 6 caracteres." }
  const origem = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? ""
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { emailRedirectTo: `${origem}/auth/callback` },
  })
  if (error) return { erro: error.message }
  if (data.session) redirect("/agenda")
  return { aviso: "Conta criada! Abra o link que enviamos para o seu e-mail para ativá-la." }
}

export async function sair() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
