// Garante que um profissional não enxerga nem altera os dados de outro (RLS no Postgres).
import type { SupabaseClient } from "@supabase/supabase-js"
import { beforeAll, describe, expect, it } from "vitest"
import { anonimo, novoUsuario } from "./ambiente"

let a: SupabaseClient
let b: SupabaseClient
let clienteDeA: string
let agendamentoDeA: string

beforeAll(async () => {
  a = await novoUsuario("dono")
  b = await novoUsuario("intruso")
  const { data: cli } = await a.from("clientes").insert({ nome: "Cliente de A" }).select("id").single()
  clienteDeA = cli!.id
  const { data: ag, error } = await a
    .from("agendamentos")
    .insert({ cliente_id: clienteDeA, servico: "Corte", valor: 50, data: "2026-11-20", hora: "10:00" })
    .select("id")
    .single()
  if (error) throw error
  agendamentoDeA = ag!.id
})

describe("isolamento entre usuários (RLS)", () => {
  it("outro usuário não vê os dados", async () => {
    expect((await b.from("clientes").select("id")).data).toEqual([])
    expect((await b.from("agendamentos").select("id")).data).toEqual([])
  })

  it("visitante sem login não acessa as tabelas", async () => {
    const { data, error } = await anonimo().from("agendamentos").select("id")
    expect(data ?? []).toEqual([])
    expect(error?.code).toBe("42501")
  })

  it("outro usuário não altera nem exclui", async () => {
    await b.from("agendamentos").update({ valor: 0 }).eq("id", agendamentoDeA)
    await b.from("agendamentos").delete().eq("id", agendamentoDeA)
    const { data } = await a.from("agendamentos").select("valor").eq("id", agendamentoDeA).single()
    expect(data?.valor).toBe(50)
  })

  it("outro usuário não agenda usando o cliente de A", async () => {
    const { error } = await b
      .from("agendamentos")
      .insert({ cliente_id: clienteDeA, servico: "x", valor: 1, data: "2026-11-20", hora: "11:00" })
    expect(error).not.toBeNull()
  })

  it("o banco recusa valores fora das regras (CHECK)", async () => {
    const { error } = await a
      .from("agendamentos")
      .insert({ cliente_id: clienteDeA, servico: "x", valor: -1, data: "2026-11-20", hora: "12:00" })
    expect(error?.code).toBe("23514")
  })
})
