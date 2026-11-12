// Cria (ou reaproveita) um usuário de demonstração e preenche ~5 meses de agenda.
// Uso: node --env-file=.env.local scripts/dados-exemplo.mjs [email] [senha]
// Pensado para o Supabase local (sem confirmação de e-mail).
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const email = process.argv[2] ?? "demo@agenda.local"
const senha = process.argv[3] ?? "demo123"
const sb = createClient(url, key, { auth: { persistSession: false } })

let { error } = await sb.auth.signInWithPassword({ email, password: senha })
if (error) {
  ;({ error } = await sb.auth.signUp({ email, password: senha }))
  if (error) throw error
  ;({ error } = await sb.auth.signInWithPassword({ email, password: senha }))
  if (error) throw error
}

const { count } = await sb.from("agendamentos").select("id", { count: "exact", head: true })
if (count) {
  console.log(`${email} já tem ${count} agendamentos; nada a fazer.`)
  process.exit(0)
}

const servicos = [
  { nome: "Manicure", valor: 35 },
  { nome: "Pedicure", valor: 40 },
  { nome: "Manicure + pedicure", valor: 70 },
  { nome: "Alongamento em gel", valor: 150 },
  { nome: "Esmaltação em gel", valor: 80 },
]
await sb.from("servicos").insert(servicos)

const nomes = ["Ana Souza", "Beatriz Lima", "Carla Mendes", "Daniela Rocha", "Elaine Castro", "Fernanda Alves",
  "Gabriela Nunes", "Helena Prado", "Isabela Moraes", "Juliana Teixeira", "Larissa Pires", "Marina Duarte"]
const { data: clientes, error: ec } = await sb
  .from("clientes")
  .insert(nomes.map((nome, i) => ({ nome, telefone: `(11) 9${String(8100_0000 + i * 137_911).slice(0, 4)}-${String(1000 + i * 731).slice(0, 4)}`, email: i % 3 ? null : `${nome.split(" ")[0].toLowerCase()}@exemplo.com` })))
  .select("id")
if (ec) throw ec

// Aleatório determinístico para os dados serem sempre iguais.
let semente = 42
const rnd = () => ((semente = (semente * 1103515245 + 12345) % 2 ** 31) / 2 ** 31)
const escolhe = (l) => l[Math.floor(rnd() * l.length)]

const fmt = (d) => d.toISOString().slice(0, 10)
const hojeIso = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date())
const hoje = new Date(`${hojeIso}T00:00:00Z`)
const inicio = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - 4, 1))
const fim = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + 1, 0))
const horas = ["09:00", "10:00", "11:00", "13:30", "14:30", "15:30", "16:30", "17:30"]

const linhas = []
for (let d = new Date(inicio); d <= fim; d.setUTCDate(d.getUTCDate() + 1)) {
  const dow = d.getUTCDay()
  if (dow === 0 || dow === 1) continue // fecha domingo e segunda
  const mesesAtras = (hoje.getUTCFullYear() - d.getUTCFullYear()) * 12 + hoje.getUTCMonth() - d.getUTCMonth()
  const futuro = fmt(d) >= hojeIso
  // movimento cresce mês a mês; o futuro tem menos horários já marcados
  const qtd = Math.round((futuro ? 2 : 3) + (4 - mesesAtras) * 0.4 + rnd() * 2)
  const usadas = new Set()
  for (let i = 0; i < qtd; i++) {
    const hora = escolhe(horas)
    if (usadas.has(hora)) continue
    usadas.add(hora)
    const s = escolhe(servicos)
    const r = rnd()
    const status = futuro ? (r < 0.04 ? "cancelado" : "agendado") : r < 0.07 ? "faltou" : r < 0.1 ? "cancelado" : "realizado"
    linhas.push({ cliente_id: escolhe(clientes).id, servico: s.nome, valor: s.valor, data: fmt(d), hora, status })
  }
}
// dois atendimentos de ontem esquecidos como "agendado", para mostrar o aviso de pendência
const ontem = new Date(hoje)
ontem.setUTCDate(ontem.getUTCDate() - 1)
linhas.push({ cliente_id: clientes[0].id, servico: "Manicure", valor: 35, data: fmt(ontem), hora: "18:30", status: "agendado" })

const { error: ea } = await sb.from("agendamentos").insert(linhas)
if (ea) throw ea
console.log(`Pronto: ${email} / ${senha} com ${clientes.length} clientes e ${linhas.length} agendamentos.`)
