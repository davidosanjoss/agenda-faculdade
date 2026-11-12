import { describe, expect, it } from "vitest"
import { entraNaPrevisao, rankingServicos, resumir, resumirPorMes, variacao, type LinhaFinanceira } from "@/lib/financeiro"

const linhas: LinhaFinanceira[] = [
  { data: "2026-10-05", valor: "50.00", status: "realizado", servico: "Corte" },
  { data: "2026-11-02", valor: 40, status: "realizado", servico: "Corte" },
  { data: "2026-11-03", valor: 60, status: "realizado", servico: "Escova" },
  { data: "2026-11-20", valor: 100, status: "agendado", servico: "corte " },
  { data: "2026-11-21", valor: 30, status: "faltou", servico: "Corte" },
  { data: "2026-11-22", valor: 70, status: "cancelado", servico: "Escova" },
]
const novembro = linhas.filter((l) => l.data.startsWith("2026-11"))

describe("resumir()", () => {
  it("separa previsto, realizado, a receber e perdido", () => {
    expect(resumir(novembro)).toEqual({
      previsto: 200, // 40 + 60 + 100
      realizado: 100,
      aReceber: 100,
      perdido: 100, // falta 30 + cancelado 70
      atendimentos: 3,
      faltas: 1,
      ticket: 50, // 100 realizado / 2 atendimentos realizados
    })
  })

  it("devolve zeros para um mês vazio (sem dividir por zero)", () => {
    expect(resumir([])).toEqual({ previsto: 0, realizado: 0, aReceber: 0, perdido: 0, atendimentos: 0, faltas: 0, ticket: 0 })
  })
})

describe("resumirPorMes()", () => {
  it("resume cada mês pedido, inclusive os vazios", () => {
    const r = resumirPorMes(linhas, ["2026-09", "2026-10", "2026-11"])
    expect(r.map((m) => [m.mes, m.previsto])).toEqual([
      ["2026-09", 0],
      ["2026-10", 50],
      ["2026-11", 200],
    ])
  })
})

describe("rankingServicos()", () => {
  it("agrupa sem diferenciar maiúsculas e ignora faltas e cancelamentos", () => {
    expect(rankingServicos(novembro)).toEqual([
      { nome: "Corte", qtd: 2, total: 140 },
      { nome: "Escova", qtd: 1, total: 60 },
    ])
  })
})

describe("variacao()", () => {
  it("calcula a variação percentual", () => {
    expect(variacao(150, 100)).toBe(50)
    expect(variacao(50, 100)).toBe(-50)
    expect(variacao(0, 0)).toBe(0)
    expect(variacao(10, 0)).toBeNull() // sem base de comparação
  })
  it("só agendado e realizado entram na previsão", () => {
    expect(["agendado", "realizado", "faltou", "cancelado"].map(entraNaPrevisao)).toEqual([true, true, false, false])
  })
})
