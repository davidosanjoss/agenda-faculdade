import { afterEach, describe, expect, it, vi } from "vitest"
import {
  diaCurto,
  diasDaGrade,
  ehData,
  ehHora,
  ehMes,
  hoje,
  nomeMes,
  segundaDaSemana,
  somaDias,
  somaMeses,
} from "@/lib/datas"

describe("hoje()", () => {
  afterEach(() => vi.useRealTimers())

  it("usa o fuso de São Paulo, não o UTC do servidor", () => {
    vi.useFakeTimers()
    // 01:30 UTC do dia 13 ainda é 22:30 do dia 12 em São Paulo
    vi.setSystemTime(new Date("2026-11-13T01:30:00Z"))
    expect(hoje()).toBe("2026-11-12")
  })
})

describe("somaDias()", () => {
  it.each([
    ["2026-11-30", 1, "2026-12-01"],
    ["2026-12-31", 1, "2027-01-01"],
    ["2028-02-28", 1, "2028-02-29"], // ano bissexto
    ["2026-03-01", -1, "2026-02-28"],
    ["2026-11-12", 0, "2026-11-12"],
  ])("%s + %i = %s", (data, n, esperado) => {
    expect(somaDias(data, n)).toBe(esperado)
  })
})

describe("segundaDaSemana()", () => {
  it("volta para a segunda anterior quando é domingo", () => {
    expect(segundaDaSemana("2026-11-15")).toBe("2026-11-09")
  })
  it("mantém o dia quando já é segunda", () => {
    expect(segundaDaSemana("2026-11-09")).toBe("2026-11-09")
  })
  it("atravessa a virada do mês", () => {
    expect(segundaDaSemana("2026-11-01")).toBe("2026-10-26")
  })
})

describe("somaMeses()", () => {
  it("vira o ano para frente e para trás", () => {
    expect(somaMeses("2026-12", 1)).toBe("2027-01")
    expect(somaMeses("2026-01", -1)).toBe("2025-12")
    expect(somaMeses("2026-11", -5)).toBe("2026-06")
  })
})

describe("diasDaGrade()", () => {
  it("cobre o mês com semanas completas de segunda a domingo", () => {
    const dias = diasDaGrade("2026-11") // novembro/2026 começa num domingo
    expect(dias).toHaveLength(42)
    expect(dias[0]).toBe("2026-10-26")
    expect(dias.at(-1)).toBe("2026-12-06")
  })
  it("usa só 4 semanas quando o mês encaixa exatamente", () => {
    const dias = diasDaGrade("2027-02")
    expect(dias).toHaveLength(28)
    expect(dias[0]).toBe("2027-02-01")
  })
})

describe("validação de texto de data", () => {
  it("aceita só formatos válidos", () => {
    expect(ehData("2026-11-12")).toBe(true)
    expect(ehData("12/11/2026")).toBe(false)
    expect(ehData("2026-13-45")).toBe(false)
    expect(ehData("2026-02-30")).toBe(false) // não existe
    expect(ehData("2028-02-29")).toBe(true) // bissexto
    expect(ehData(undefined)).toBe(false)
    expect(ehMes("2026-11")).toBe(true)
    expect(ehMes("2026-13")).toBe(false)
    expect(ehHora("09:30")).toBe(true)
    expect(ehHora("24:00")).toBe(false)
    expect(ehHora("9:30")).toBe(false)
  })
})

describe("formatação", () => {
  it("formata em português", () => {
    expect(diaCurto("2026-11-05")).toBe("05/11")
    expect(nomeMes("2026-11")).toBe("novembro de 2026")
  })
})
