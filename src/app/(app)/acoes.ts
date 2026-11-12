"use server"

import { revalidatePath } from "next/cache"
import { ehData, ehHora } from "@/lib/datas"
import { createClient } from "@/lib/supabase/server"
import { STATUS, type Resultado, type Status } from "@/lib/tipos"

const limpa = (s?: string | null) => (s ?? "").trim()
const opcional = (s?: string | null) => limpa(s) || null
/** Escapa curingas do ILIKE para buscar o nome exato sem diferenciar maiúsculas. */
const exato = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`)
const valorValido = (v: number) => Number.isFinite(v) && v >= 0 && v < 1_000_000

function concluir(): Resultado {
  revalidatePath("/", "layout")
  return { ok: true }
}

export type DadosAgendamento = {
  id?: string
  data: string
  hora: string
  cliente: string
  telefone?: string
  email?: string
  servico: string
  valor: number
  status: Status
  obs?: string
}

export async function salvarAgendamento(d: DadosAgendamento): Promise<Resultado> {
  const nome = limpa(d.cliente)
  const servico = limpa(d.servico)
  if (!ehData(d.data) || !ehHora(d.hora)) return { ok: false, erro: "Data ou hora inválida." }
  if (!nome) return { ok: false, erro: "Informe o nome do cliente." }
  if (!servico) return { ok: false, erro: "Informe o serviço." }
  if (!valorValido(d.valor)) return { ok: false, erro: "Valor inválido." }
  if (!STATUS.includes(d.status)) return { ok: false, erro: "Situação inválida." }

  const sb = await createClient()
  const telefone = opcional(d.telefone)
  const email = opcional(d.email)

  // Cliente: reaproveita pelo nome; cria se for novo.
  const { data: existente, error: e1 } = await sb
    .from("clientes")
    .select("id,telefone,email")
    .ilike("nome", exato(nome))
    .limit(1)
    .maybeSingle()
  if (e1) return { ok: false, erro: e1.message }

  let clienteId = existente?.id as string | undefined
  if (existente) {
    const mudou: Record<string, string> = {}
    if (telefone && telefone !== existente.telefone) mudou.telefone = telefone
    if (email && email !== existente.email) mudou.email = email
    if (Object.keys(mudou).length) await sb.from("clientes").update(mudou).eq("id", existente.id)
  } else {
    const { data: novo, error } = await sb.from("clientes").insert({ nome, telefone, email }).select("id").single()
    if (error) return { ok: false, erro: error.message }
    clienteId = novo.id
  }

  // Serviço novo entra no catálogo com o valor informado.
  const { data: srv } = await sb.from("servicos").select("nome").ilike("nome", exato(servico)).limit(1).maybeSingle()
  if (!srv) await sb.from("servicos").insert({ nome: servico, valor: d.valor })

  const linha = {
    cliente_id: clienteId,
    servico: srv?.nome ?? servico, // mantém a grafia do catálogo
    valor: d.valor,
    data: d.data,
    hora: d.hora,
    status: d.status,
    obs: opcional(d.obs),
  }
  const { error } = d.id
    ? await sb.from("agendamentos").update(linha).eq("id", d.id)
    : await sb.from("agendamentos").insert(linha)
  if (error) return { ok: false, erro: error.message }
  return concluir()
}

export async function mudarStatus(id: string, status: Status): Promise<Resultado> {
  if (!STATUS.includes(status)) return { ok: false, erro: "Situação inválida." }
  const sb = await createClient()
  const { error } = await sb.from("agendamentos").update({ status }).eq("id", id)
  if (error) return { ok: false, erro: error.message }
  return concluir()
}

export async function excluirAgendamento(id: string): Promise<Resultado> {
  const sb = await createClient()
  const { error } = await sb.from("agendamentos").delete().eq("id", id)
  if (error) return { ok: false, erro: error.message }
  return concluir()
}

export async function salvarCliente(d: { id?: string; nome: string; telefone?: string; email?: string }): Promise<Resultado> {
  const nome = limpa(d.nome)
  if (!nome) return { ok: false, erro: "Informe o nome." }
  const linha = { nome, telefone: opcional(d.telefone), email: opcional(d.email) }
  const sb = await createClient()
  const { error } = d.id
    ? await sb.from("clientes").update(linha).eq("id", d.id)
    : await sb.from("clientes").insert(linha)
  if (error) return { ok: false, erro: error.message }
  return concluir()
}

export async function excluirCliente(id: string): Promise<Resultado> {
  const sb = await createClient()
  const { error } = await sb.from("clientes").delete().eq("id", id)
  if (error?.code === "23503")
    return { ok: false, erro: "Este cliente tem agendamentos. Exclua os agendamentos antes." }
  if (error) return { ok: false, erro: error.message }
  return concluir()
}

export async function salvarServico(d: { id?: string; nome: string; valor: number }): Promise<Resultado> {
  const nome = limpa(d.nome)
  if (!nome) return { ok: false, erro: "Informe o nome do serviço." }
  if (!valorValido(d.valor)) return { ok: false, erro: "Valor inválido." }
  const sb = await createClient()
  const { error } = d.id
    ? await sb.from("servicos").update({ nome, valor: d.valor }).eq("id", d.id)
    : await sb.from("servicos").insert({ nome, valor: d.valor })
  if (error) return { ok: false, erro: error.message }
  return concluir()
}

export async function excluirServico(id: string): Promise<Resultado> {
  const sb = await createClient()
  const { error } = await sb.from("servicos").delete().eq("id", id)
  if (error) return { ok: false, erro: error.message }
  return concluir()
}
