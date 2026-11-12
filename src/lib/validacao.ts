// Regras de validação do domínio. Funções puras: usadas pelas Server Actions
// (controller) e cobertas por testes unitários.
import { ehData, ehHora } from "./datas"
import { STATUS, type DadosAgendamento, type Status } from "./tipos"

export type Validado<T> = { ok: true; dados: T } | { ok: false; erro: string }

export const VALOR_MAXIMO = 1_000_000

const limpa = (s?: string | null) => (s ?? "").trim().replace(/\s+/g, " ")
const opcional = (s?: string | null) => limpa(s) || null

/** Converte "35,50", "1.234,56" ou 35.5 para número. Texto vazio ou inválido vira NaN. */
export function lerValor(v: string | number): number {
  if (typeof v === "number") return v
  const s = v.trim()
  if (!s) return NaN
  const normalizado = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s
  return /^-?\d+(\.\d+)?$/.test(normalizado) ? Number(normalizado) : NaN
}

export const valorValido = (v: number) => Number.isFinite(v) && v >= 0 && v < VALOR_MAXIMO

/** Telefone opcional; se informado precisa ter DDD + número (10 a 13 dígitos). */
export function telefoneValido(t: string | null) {
  if (!t) return true
  const n = t.replace(/\D/g, "").length
  return n >= 10 && n <= 13
}

export function emailValido(e: string | null) {
  return !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

export const statusValido = (s: string): s is Status => (STATUS as readonly string[]).includes(s)

export type AgendamentoValidado = {
  id?: string
  data: string
  hora: string
  cliente: string
  telefone: string | null
  email: string | null
  servico: string
  valor: number
  status: Status
  obs: string | null
}

export function validarAgendamento(d: DadosAgendamento): Validado<AgendamentoValidado> {
  const cliente = limpa(d.cliente)
  const servico = limpa(d.servico)
  const telefone = opcional(d.telefone)
  const email = opcional(d.email)?.toLowerCase() ?? null
  const valor = lerValor(d.valor)
  if (!ehData(d.data) || !ehHora(d.hora)) return { ok: false, erro: "Data ou hora inválida." }
  if (!cliente) return { ok: false, erro: "Informe o nome do cliente." }
  if (!servico) return { ok: false, erro: "Informe o serviço." }
  if (!valorValido(valor)) return { ok: false, erro: "Valor inválido." }
  if (!statusValido(d.status)) return { ok: false, erro: "Situação inválida." }
  if (!telefoneValido(telefone)) return { ok: false, erro: "Telefone inválido: informe DDD e número." }
  if (!emailValido(email)) return { ok: false, erro: "E-mail inválido." }
  return {
    ok: true,
    dados: { id: d.id, data: d.data, hora: d.hora, cliente, telefone, email, servico, valor, status: d.status, obs: opcional(d.obs) },
  }
}

export function validarCliente(d: { nome: string; telefone?: string; email?: string }): Validado<{
  nome: string
  telefone: string | null
  email: string | null
}> {
  const nome = limpa(d.nome)
  const telefone = opcional(d.telefone)
  const email = opcional(d.email)?.toLowerCase() ?? null
  if (!nome) return { ok: false, erro: "Informe o nome." }
  if (!telefoneValido(telefone)) return { ok: false, erro: "Telefone inválido: informe DDD e número." }
  if (!emailValido(email)) return { ok: false, erro: "E-mail inválido." }
  return { ok: true, dados: { nome, telefone, email } }
}

export function validarServico(d: { nome: string; valor: string | number }): Validado<{ nome: string; valor: number }> {
  const nome = limpa(d.nome)
  const valor = lerValor(d.valor)
  if (!nome) return { ok: false, erro: "Informe o nome do serviço." }
  if (!valorValido(valor)) return { ok: false, erro: "Valor inválido." }
  return { ok: true, dados: { nome, valor } }
}

/** Escapa os curingas do ILIKE (% e _) para buscar um nome exato. */
export const escaparIlike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`)
