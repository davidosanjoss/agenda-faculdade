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

// ---------------------------------------------------------------- Avaliações (PIT II, Situação 3)

export const MAX_PRINTS = 5
export const TAMANHO_MAXIMO_PRINT = 5 * 1024 * 1024
export const TIPOS_PRINT = ["image/png", "image/jpeg", "image/webp"]
export const SITUACOES_FEEDBACK = ["pendente", "corrigido", "nao_procede"] as const
export type SituacaoFeedback = (typeof SITUACOES_FEEDBACK)[number]

export type DadosFeedback = {
  testador: string
  dataTeste: string
  funcionou?: string
  naoFuncionou?: string
  naoTestado?: string
  sugestoes?: string
  prints?: string[]
  navegador?: string
}

export function validarFeedback(d: DadosFeedback, userId: string): Validado<{
  testador: string
  data_teste: string
  funcionou: string | null
  nao_funcionou: string | null
  nao_testado: string | null
  sugestoes: string | null
  prints: string[]
  navegador: string | null
}> {
  const testador = limpa(d.testador)
  const textos = {
    funcionou: opcional(d.funcionou),
    nao_funcionou: opcional(d.naoFuncionou),
    nao_testado: opcional(d.naoTestado),
    sugestoes: opcional(d.sugestoes),
  }
  const prints = d.prints ?? []
  if (!testador) return { ok: false, erro: "Informe seu nome." }
  if (!ehData(d.dataTeste)) return { ok: false, erro: "Data do teste inválida." }
  if (!Object.values(textos).some(Boolean)) return { ok: false, erro: "Descreva pelo menos um item do teste." }
  if (prints.length > MAX_PRINTS) return { ok: false, erro: `Envie no máximo ${MAX_PRINTS} prints.` }
  if (prints.some((p) => !p.startsWith(`${userId}/`) || p.includes(".."))) return { ok: false, erro: "Print inválido." }
  return {
    ok: true,
    dados: { testador, data_teste: d.dataTeste, ...textos, prints, navegador: opcional(d.navegador)?.slice(0, 300) ?? null },
  }
}

/** Confere tipo e tamanho de um print antes do envio. Devolve a mensagem de erro, ou null. */
export function problemaNoPrint(arquivo: { name: string; type: string; size: number }) {
  if (!TIPOS_PRINT.includes(arquivo.type)) return `${arquivo.name}: envie imagens PNG, JPG ou WEBP.`
  if (arquivo.size > TAMANHO_MAXIMO_PRINT) return `${arquivo.name}: a imagem passa de 5 MB.`
  return null
}

export const situacaoFeedbackValida = (s: string): s is SituacaoFeedback =>
  (SITUACOES_FEEDBACK as readonly string[]).includes(s)
