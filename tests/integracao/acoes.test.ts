// Testa o controller (Server Actions) de ponta a ponta contra o Postgres local.
import type { SupabaseClient } from "@supabase/supabase-js"
import { beforeAll, describe, expect, it, vi } from "vitest"
import { novoUsuario } from "./ambiente"

const sessao = vi.hoisted(() => ({ cliente: null as SupabaseClient | null }))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => sessao.cliente }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const acoes = await import("@/app/(app)/acoes")

let sb: SupabaseClient
beforeAll(async () => {
  sb = await novoUsuario("acoes")
  sessao.cliente = sb
})

const agendamento = {
  data: "2026-11-20",
  hora: "10:00",
  cliente: "Maria Teste",
  telefone: "(11) 91234-5678",
  email: "Maria@Teste.com",
  servico: "Escova",
  valor: "60,00",
  status: "agendado" as const,
}

describe("salvarAgendamento", () => {
  it("cria o agendamento, o cliente e o serviço novos", async () => {
    expect(await acoes.salvarAgendamento(agendamento)).toEqual({ ok: true })

    const { data: clientes } = await sb.from("clientes").select("nome,telefone,email")
    expect(clientes).toEqual([{ nome: "Maria Teste", telefone: "(11) 91234-5678", email: "maria@teste.com" }])
    const { data: servicos } = await sb.from("servicos").select("nome,valor")
    expect(servicos).toEqual([{ nome: "Escova", valor: 60 }])
    const { data: ags } = await sb.from("agendamentos").select("servico,valor,hora,status")
    expect(ags).toEqual([{ servico: "Escova", valor: 60, hora: "10:00:00", status: "agendado" }])
  })

  it("reaproveita cliente e serviço digitados com outra grafia", async () => {
    const r = await acoes.salvarAgendamento({ ...agendamento, hora: "11:00", cliente: "  maria TESTE ", telefone: "", servico: "escova" })
    expect(r).toEqual({ ok: true })
    expect((await sb.from("clientes").select("id")).data).toHaveLength(1)
    expect((await sb.from("servicos").select("id")).data).toHaveLength(1)
    const { data } = await sb.from("agendamentos").select("servico").eq("hora", "11:00")
    expect(data).toEqual([{ servico: "Escova" }]) // mantém a grafia do catálogo
  })

  it("trata nomes com curingas do SQL como texto comum", async () => {
    await acoes.salvarAgendamento({ ...agendamento, hora: "12:00", cliente: "Promo 50%" })
    await acoes.salvarAgendamento({ ...agendamento, hora: "13:00", cliente: "Promo 50X" })
    const { data } = await sb.from("clientes").select("nome").like("nome", "Promo%").order("nome")
    expect(data?.map((c) => c.nome)).toEqual(["Promo 50%", "Promo 50X"])
  })

  it("recusa dados inválidos sem gravar nada", async () => {
    const antes = (await sb.from("agendamentos").select("id")).data!.length
    expect(await acoes.salvarAgendamento({ ...agendamento, valor: "-5" })).toEqual({ ok: false, erro: "Valor inválido." })
    expect(await acoes.salvarAgendamento({ ...agendamento, data: "2026-02-30" })).toEqual({ ok: false, erro: "Data ou hora inválida." })
    expect((await sb.from("agendamentos").select("id")).data).toHaveLength(antes)
  })
})

describe("situação e exclusão", () => {
  it("muda a situação e exclui o agendamento", async () => {
    const { data: ag } = await sb.from("agendamentos").select("id").eq("hora", "10:00:00").single()
    expect(await acoes.mudarStatus(ag!.id, "realizado")).toEqual({ ok: true })
    expect((await sb.from("agendamentos").select("status").eq("id", ag!.id).single()).data?.status).toBe("realizado")
    expect(await acoes.mudarStatus(ag!.id, "pago" as never)).toEqual({ ok: false, erro: "Situação inválida." })
    expect(await acoes.excluirAgendamento(ag!.id)).toEqual({ ok: true })
    expect((await sb.from("agendamentos").select("id").eq("id", ag!.id)).data).toHaveLength(0)
  })

  it("não deixa excluir cliente que tem agendamentos", async () => {
    const { data: c } = await sb.from("clientes").select("id").eq("nome", "Maria Teste").single()
    expect(await acoes.excluirCliente(c!.id)).toEqual({
      ok: false,
      erro: "Este cliente tem agendamentos. Exclua os agendamentos antes.",
    })
  })
})

describe("clientes e serviços", () => {
  it("cadastra, edita e valida", async () => {
    expect(await acoes.salvarCliente({ nome: "Novo Cliente", telefone: "11 3333-4444" })).toEqual({ ok: true })
    const { data: c } = await sb.from("clientes").select("id").eq("nome", "Novo Cliente").single()
    expect(await acoes.salvarCliente({ id: c!.id, nome: "Cliente Editado" })).toEqual({ ok: true })
    expect((await sb.from("clientes").select("nome").eq("id", c!.id).single()).data?.nome).toBe("Cliente Editado")
    expect(await acoes.salvarCliente({ nome: "X", email: "invalido" })).toEqual({ ok: false, erro: "E-mail inválido." })
    expect(await acoes.excluirCliente(c!.id)).toEqual({ ok: true })

    expect(await acoes.salvarServico({ nome: "Hidratação", valor: "80" })).toEqual({ ok: true })
    const { data: s } = await sb.from("servicos").select("id,valor").eq("nome", "Hidratação").single()
    expect(s?.valor).toBe(80)
    expect(await acoes.excluirServico(s!.id)).toEqual({ ok: true })
  })
})
