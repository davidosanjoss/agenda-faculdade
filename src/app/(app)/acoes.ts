"use server"

// Controller (MVC): recebe as ações da tela, valida com as regras do domínio
// (src/lib/validacao.ts) e grava no banco (Supabase/Postgres com RLS).

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { DadosAgendamento, Resultado, Status } from "@/lib/tipos"
import { escaparIlike, statusValido, validarAgendamento, validarCliente, validarServico } from "@/lib/validacao"

function concluir(): Resultado {
  revalidatePath("/", "layout")
  return { ok: true }
}

/** Traduz erros do banco para mensagens que o usuário entende. */
function falha(error: { code?: string; message: string }): Resultado {
  if (error.code === "23503") return { ok: false, erro: "Este cliente tem agendamentos. Exclua os agendamentos antes." }
  if (error.code === "23514") return { ok: false, erro: "Algum campo tem um valor inválido." }
  if (error.code === "42501" || error.code === "PGRST301") return { ok: false, erro: "Sua sessão expirou. Entre novamente." }
  console.error("[acoes]", error)
  return { ok: false, erro: "Não foi possível salvar agora. Tente de novo em instantes." }
}

export async function salvarAgendamento(entrada: DadosAgendamento): Promise<Resultado> {
  const v = validarAgendamento(entrada)
  if (!v.ok) return v
  const d = v.dados
  const sb = await createClient()

  // Cliente: reaproveita pelo nome (sem diferenciar maiúsculas); cria se for novo.
  const { data: existente, error: e1 } = await sb
    .from("clientes")
    .select("id,telefone,email")
    .ilike("nome", escaparIlike(d.cliente))
    .limit(1)
    .maybeSingle()
  if (e1) return falha(e1)

  let clienteId = existente?.id as string | undefined
  if (existente) {
    const mudou: Record<string, string> = {}
    if (d.telefone && d.telefone !== existente.telefone) mudou.telefone = d.telefone
    if (d.email && d.email !== existente.email) mudou.email = d.email
    if (Object.keys(mudou).length) {
      const { error } = await sb.from("clientes").update(mudou).eq("id", existente.id)
      if (error) return falha(error)
    }
  } else {
    const { data: novo, error } = await sb
      .from("clientes")
      .insert({ nome: d.cliente, telefone: d.telefone, email: d.email })
      .select("id")
      .single()
    if (error) return falha(error)
    clienteId = novo.id
  }

  // Serviço novo entra no catálogo; serviço existente mantém a grafia do catálogo.
  const { data: srv, error: e2 } = await sb.from("servicos").select("nome").ilike("nome", escaparIlike(d.servico)).limit(1).maybeSingle()
  if (e2) return falha(e2)
  if (!srv) {
    const { error } = await sb.from("servicos").insert({ nome: d.servico, valor: d.valor })
    if (error) return falha(error)
  }

  const linha = {
    cliente_id: clienteId,
    servico: srv?.nome ?? d.servico,
    valor: d.valor,
    data: d.data,
    hora: d.hora,
    status: d.status,
    obs: d.obs,
  }
  const { error } = d.id
    ? await sb.from("agendamentos").update(linha).eq("id", d.id)
    : await sb.from("agendamentos").insert(linha)
  if (error) return falha(error)
  return concluir()
}

export async function mudarStatus(id: string, status: Status): Promise<Resultado> {
  if (!statusValido(status)) return { ok: false, erro: "Situação inválida." }
  const sb = await createClient()
  const { error } = await sb.from("agendamentos").update({ status }).eq("id", id)
  if (error) return falha(error)
  return concluir()
}

export async function excluirAgendamento(id: string): Promise<Resultado> {
  const sb = await createClient()
  const { error } = await sb.from("agendamentos").delete().eq("id", id)
  if (error) return falha(error)
  return concluir()
}

export async function salvarCliente(entrada: { id?: string; nome: string; telefone?: string; email?: string }): Promise<Resultado> {
  const v = validarCliente(entrada)
  if (!v.ok) return v
  const sb = await createClient()
  const { error } = entrada.id
    ? await sb.from("clientes").update(v.dados).eq("id", entrada.id)
    : await sb.from("clientes").insert(v.dados)
  if (error) return falha(error)
  return concluir()
}

export async function excluirCliente(id: string): Promise<Resultado> {
  const sb = await createClient()
  const { error } = await sb.from("clientes").delete().eq("id", id)
  if (error) return falha(error)
  return concluir()
}

export async function salvarServico(entrada: { id?: string; nome: string; valor: string | number }): Promise<Resultado> {
  const v = validarServico(entrada)
  if (!v.ok) return v
  const sb = await createClient()
  const { error } = entrada.id
    ? await sb.from("servicos").update(v.dados).eq("id", entrada.id)
    : await sb.from("servicos").insert(v.dados)
  if (error) return falha(error)
  return concluir()
}

export async function excluirServico(id: string): Promise<Resultado> {
  const sb = await createClient()
  const { error } = await sb.from("servicos").delete().eq("id", id)
  if (error) return falha(error)
  return concluir()
}
