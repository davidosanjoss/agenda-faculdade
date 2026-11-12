// Confere que um profissional não enxerga nem altera os dados de outro.
// Uso: node --env-file=.env.local scripts/testar-rls.mjs
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const novo = async (email) => {
  const sb = createClient(url, key, { auth: { persistSession: false } })
  const { error } = await sb.auth.signUp({ email, password: "senha123" })
  if (error) throw error
  return sb
}
const sufixo = Date.now()
const a = await novo(`a${sufixo}@teste.local`)
const b = await novo(`b${sufixo}@teste.local`)
const anonimo = createClient(url, key, { auth: { persistSession: false } })

const { data: cli } = await a.from("clientes").insert({ nome: "Cliente de A" }).select("id").single()
const { data: ag, error: e1 } = await a
  .from("agendamentos")
  .insert({ cliente_id: cli.id, servico: "Corte", valor: 50, data: "2026-11-20", hora: "10:00" })
  .select("id")
  .single()
if (e1) throw e1

const falhas = []
const confere = (cond, msg) => (cond ? console.log("ok  ", msg) : (falhas.push(msg), console.log("FALHA", msg)))

confere(((await b.from("clientes").select("id")).data ?? []).length === 0, "B não vê clientes de A")
confere(((await b.from("agendamentos").select("id")).data ?? []).length === 0, "B não vê agendamentos de A")
confere(((await anonimo.from("agendamentos").select("id")).data ?? []).length === 0, "anônimo não vê nada")
await b.from("agendamentos").update({ valor: 0 }).eq("id", ag.id)
confere(Number((await a.from("agendamentos").select("valor").eq("id", ag.id).single()).data.valor) === 50, "B não altera agendamento de A")
await b.from("agendamentos").delete().eq("id", ag.id)
confere(!!(await a.from("agendamentos").select("id").eq("id", ag.id).maybeSingle()).data, "B não exclui agendamento de A")
const { error: e2 } = await b
  .from("agendamentos")
  .insert({ cliente_id: cli.id, servico: "x", valor: 1, data: "2026-11-20", hora: "11:00" })
confere(!!e2, "B não agenda usando cliente de A")
const { error: e3 } = await a.from("clientes").delete().eq("id", cli.id)
confere(e3?.code === "23503", "cliente com agendamento não pode ser excluído")

process.exit(falhas.length ? 1 : 0)
