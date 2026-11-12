import { describe, expect, it } from "vitest"
import {
  agruparPorDia,
  buscarPorNome,
  encontrarConflito,
  mensagemLembrete,
  precisaDeBaixa,
  totalPrevisto,
  totalRealizado,
} from "@/lib/agenda"
import { brl, linkWhatsApp } from "@/lib/formato"
import type { Agendamento } from "@/lib/tipos"

const ag = (p: Partial<Agendamento>): Agendamento => ({
  id: "1",
  cliente_id: "c1",
  cliente_nome: "Ana Souza",
  cliente_telefone: "(11) 98888-7777",
  servico: "Manicure",
  valor: 35,
  data: "2026-11-12",
  hora: "10:00",
  status: "agendado",
  obs: null,
  ...p,
})

describe("regras da agenda", () => {
  it("detecta conflito de horário, ignorando o próprio agendamento e os cancelados", () => {
    const lista = [ag({ id: "1" }), ag({ id: "2", hora: "11:00", status: "cancelado" })]
    expect(encontrarConflito(lista, { data: "2026-11-12", hora: "10:00" })?.id).toBe("1")
    expect(encontrarConflito(lista, { id: "1", data: "2026-11-12", hora: "10:00" })).toBeUndefined()
    expect(encontrarConflito(lista, { data: "2026-11-12", hora: "11:00" })).toBeUndefined()
  })

  it("busca pelo nome sem diferenciar maiúsculas e espaços", () => {
    const clientes = [{ nome: "Ana Souza" }, { nome: "Bia" }]
    expect(buscarPorNome(clientes, "  ana souza ")).toEqual({ nome: "Ana Souza" })
    expect(buscarPorNome(clientes, "")).toBeUndefined()
  })

  it("soma previsto e realizado", () => {
    const lista = [ag({ valor: 10 }), ag({ valor: 20, status: "realizado" }), ag({ valor: 99, status: "faltou" })]
    expect(totalPrevisto(lista)).toBe(30)
    expect(totalRealizado(lista)).toBe(20)
  })

  it("agrupa por dia em ordem de horário", () => {
    const mapa = agruparPorDia([ag({ id: "b", hora: "15:00" }), ag({ id: "a", hora: "09:00" }), ag({ id: "c", data: "2026-11-13" })])
    expect(mapa.get("2026-11-12")?.map((a) => a.id)).toEqual(["a", "b"])
    expect(mapa.get("2026-11-13")).toHaveLength(1)
  })

  it("marca atendimento passado sem baixa", () => {
    expect(precisaDeBaixa(ag({ data: "2026-11-11" }), "2026-11-12")).toBe(true)
    expect(precisaDeBaixa(ag({ data: "2026-11-12" }), "2026-11-12")).toBe(false)
    expect(precisaDeBaixa(ag({ data: "2026-11-11", status: "realizado" }), "2026-11-12")).toBe(false)
  })

  it("monta a mensagem de lembrete com o primeiro nome", () => {
    expect(mensagemLembrete(ag({}))).toBe("Olá, Ana! Passando para lembrar do seu horário de Manicure no dia 12/11 às 10:00.")
  })
})

describe("formatação", () => {
  it("formata reais", () => {
    expect(brl(1234.5).replace(/\s/g, " ")).toBe("R$ 1.234,50")
  })
  it("gera link do WhatsApp com DDI do Brasil", () => {
    expect(linkWhatsApp("(11) 98888-7777")).toBe("https://wa.me/5511988887777")
    expect(linkWhatsApp("+55 11 98888-7777", "oi")).toBe("https://wa.me/5511988887777?text=oi")
    expect(linkWhatsApp("1234")).toBeNull()
    expect(linkWhatsApp(null)).toBeNull()
  })
})
