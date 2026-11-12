import { describe, expect, it } from "vitest"
import type { DadosAgendamento } from "@/lib/tipos"
import {
  emailValido,
  escaparIlike,
  lerValor,
  telefoneValido,
  validarAgendamento,
  validarCliente,
  validarServico,
} from "@/lib/validacao"

const base: DadosAgendamento = {
  data: "2026-11-20",
  hora: "14:30",
  cliente: "  Maria   da Silva ",
  telefone: "(11) 98888-7777",
  email: " Maria@Email.com ",
  servico: " Manicure ",
  valor: "35,50",
  status: "agendado",
  obs: "  ",
}

describe("lerValor()", () => {
  it.each([
    ["35", 35],
    ["35,5", 35.5],
    ["1.234,56", 1234.56],
    ["35.50", 35.5],
    [42, 42],
  ])("%s → %s", (entrada, esperado) => expect(lerValor(entrada)).toBe(esperado))

  it.each(["", "abc", "12,3,4", "R$ 10"])("rejeita %j", (entrada) => expect(lerValor(entrada)).toBeNaN())
})

describe("validarAgendamento()", () => {
  it("normaliza os campos de texto e converte o valor", () => {
    const r = validarAgendamento(base)
    expect(r).toEqual({
      ok: true,
      dados: {
        id: undefined,
        data: "2026-11-20",
        hora: "14:30",
        cliente: "Maria da Silva",
        telefone: "(11) 98888-7777",
        email: "maria@email.com",
        servico: "Manicure",
        valor: 35.5,
        status: "agendado",
        obs: null,
      },
    })
  })

  it.each<[string, Partial<DadosAgendamento>, string]>([
    ["data inválida", { data: "20/11/2026" }, "Data ou hora inválida."],
    ["hora inválida", { hora: "25:00" }, "Data ou hora inválida."],
    ["cliente vazio", { cliente: "   " }, "Informe o nome do cliente."],
    ["serviço vazio", { servico: "" }, "Informe o serviço."],
    ["valor negativo", { valor: -1 }, "Valor inválido."],
    ["valor em texto", { valor: "dez" }, "Valor inválido."],
    ["valor exagerado", { valor: 1_000_000 }, "Valor inválido."],
    ["situação desconhecida", { status: "pago" as never }, "Situação inválida."],
    ["telefone sem DDD", { telefone: "98888-7777" }, "Telefone inválido: informe DDD e número."],
    ["e-mail sem domínio", { email: "maria@" }, "E-mail inválido."],
  ])("recusa %s", (_, mudanca, erro) => {
    expect(validarAgendamento({ ...base, ...mudanca })).toEqual({ ok: false, erro })
  })

  it("aceita telefone e e-mail vazios", () => {
    const r = validarAgendamento({ ...base, telefone: "", email: "" })
    expect(r.ok && r.dados.telefone).toBeNull()
    expect(r.ok && r.dados.email).toBeNull()
  })
})

describe("validarCliente() e validarServico()", () => {
  it("valida cliente", () => {
    expect(validarCliente({ nome: " Ana " })).toEqual({ ok: true, dados: { nome: "Ana", telefone: null, email: null } })
    expect(validarCliente({ nome: "" })).toEqual({ ok: false, erro: "Informe o nome." })
  })
  it("valida serviço", () => {
    expect(validarServico({ nome: "Corte", valor: "50,00" })).toEqual({ ok: true, dados: { nome: "Corte", valor: 50 } })
    expect(validarServico({ nome: "Corte", valor: "" })).toEqual({ ok: false, erro: "Valor inválido." })
    expect(validarServico({ nome: " ", valor: 10 })).toEqual({ ok: false, erro: "Informe o nome do serviço." })
  })
})

describe("auxiliares", () => {
  it("telefone e e-mail", () => {
    expect(telefoneValido("+55 11 98888-7777")).toBe(true)
    expect(telefoneValido("1234")).toBe(false)
    expect(telefoneValido(null)).toBe(true)
    expect(emailValido("a@b.co")).toBe(true)
    expect(emailValido("a b@c.com")).toBe(false)
  })
  it("escapa curingas do ILIKE", () => {
    expect(escaparIlike("50% off_x")).toBe("50\\% off\\_x")
  })
})
