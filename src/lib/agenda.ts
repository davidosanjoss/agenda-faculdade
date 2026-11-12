// Regras da agenda usadas pelas telas. Funções puras e testadas.
import { diaCurto } from "./datas"
import { entraNaPrevisao } from "./financeiro"
import type { Agendamento } from "./tipos"

export const mesmoNome = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

export function buscarPorNome<T extends { nome: string }>(lista: T[], nome: string) {
  return nome.trim() ? lista.find((x) => mesmoNome(x.nome, nome)) : undefined
}

/** Outro agendamento ativo no mesmo dia e horário (cancelados não contam). */
export function encontrarConflito(ags: Agendamento[], alvo: { id?: string; data: string; hora: string }) {
  return ags.find((a) => a.id !== alvo.id && a.data === alvo.data && a.hora === alvo.hora && a.status !== "cancelado")
}

export function totalPrevisto(ags: Agendamento[]) {
  return ags.filter((a) => entraNaPrevisao(a.status)).reduce((t, a) => t + a.valor, 0)
}

export function totalRealizado(ags: Agendamento[]) {
  return ags.filter((a) => a.status === "realizado").reduce((t, a) => t + a.valor, 0)
}

export function agruparPorDia(ags: Agendamento[]) {
  const mapa = new Map<string, Agendamento[]>()
  for (const a of ags) mapa.set(a.data, [...(mapa.get(a.data) ?? []), a])
  for (const lista of mapa.values()) lista.sort((x, y) => x.hora.localeCompare(y.hora))
  return mapa
}

/** Atendimento que já passou e continua "agendado": precisa de baixa. */
export const precisaDeBaixa = (a: Agendamento, hoje: string) => a.status === "agendado" && a.data < hoje

export function mensagemLembrete(a: Agendamento) {
  const primeiroNome = a.cliente_nome.trim().split(" ")[0]
  return `Olá, ${primeiroNome}! Passando para lembrar do seu horário de ${a.servico} no dia ${diaCurto(a.data)} às ${a.hora}.`
}
