// Cálculos financeiros a partir dos agendamentos. Funções puras e testadas.
import type { Status } from "./tipos"

export type LinhaFinanceira = { data: string; valor: number | string; status: Status | string; servico: string }

/** Agendado e realizado entram na previsão; falta e cancelamento não. */
export const entraNaPrevisao = (status: string) => status === "agendado" || status === "realizado"

export type Resumo = {
  previsto: number
  realizado: number
  aReceber: number
  perdido: number
  atendimentos: number
  faltas: number
  ticket: number
}

export function resumir(linhas: LinhaFinanceira[]): Resumo {
  const soma = (...st: string[]) => linhas.filter((l) => st.includes(l.status)).reduce((t, l) => t + Number(l.valor), 0)
  const realizados = linhas.filter((l) => l.status === "realizado").length
  const realizado = soma("realizado")
  return {
    realizado,
    aReceber: soma("agendado"),
    previsto: soma("realizado", "agendado"),
    perdido: soma("faltou", "cancelado"),
    atendimentos: linhas.filter((l) => entraNaPrevisao(l.status)).length,
    faltas: linhas.filter((l) => l.status === "faltou").length,
    ticket: realizados ? realizado / realizados : 0,
  }
}

/** Resumo de cada mês (YYYY-MM) da lista, na mesma ordem. */
export function resumirPorMes(linhas: LinhaFinanceira[], meses: string[]) {
  return meses.map((mes) => ({ mes, ...resumir(linhas.filter((l) => l.data.startsWith(mes))) }))
}

/** Serviços que entram na previsão, agrupados sem diferenciar maiúsculas, do maior total ao menor. */
export function rankingServicos(linhas: LinhaFinanceira[]) {
  const grupos = new Map<string, { nome: string; qtd: number; total: number }>()
  for (const l of linhas) {
    if (!entraNaPrevisao(l.status)) continue
    const k = l.servico.trim().toLowerCase()
    const g = grupos.get(k) ?? { nome: l.servico.trim(), qtd: 0, total: 0 }
    g.qtd++
    g.total += Number(l.valor)
    grupos.set(k, g)
  }
  return [...grupos.values()].sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome))
}

/** Variação percentual; null quando não há base de comparação (mês anterior zerado). */
export function variacao(atual: number, anterior: number) {
  if (anterior === 0) return atual === 0 ? 0 : null
  return ((atual - anterior) / anterior) * 100
}
