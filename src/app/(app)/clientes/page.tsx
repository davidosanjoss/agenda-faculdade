import { Suspense } from "react"
import { Carregando } from "@/components/carregando"
import { createClient } from "@/lib/supabase/server"
import type { Cliente } from "@/lib/tipos"
import { ListaClientes, type ClienteResumo } from "./lista-clientes"

async function Conteudo() {
  const sb = await createClient()
  const [clientesR, agsR] = await Promise.all([
    sb.from("clientes").select("id,nome,telefone,email").order("nome"),
    sb.from("agendamentos").select("cliente_id,valor,status,data"),
  ])

  const stats = new Map<string, { atendimentos: number; total: number; ultimo: string | null; faltas: number }>()
  for (const a of agsR.data ?? []) {
    const s = stats.get(a.cliente_id) ?? { atendimentos: 0, total: 0, ultimo: null, faltas: 0 }
    if (a.status === "realizado") {
      s.atendimentos++
      s.total += Number(a.valor)
      if (!s.ultimo || a.data > s.ultimo) s.ultimo = a.data
    }
    if (a.status === "faltou") s.faltas++
    stats.set(a.cliente_id, s)
  }

  const clientes: ClienteResumo[] = ((clientesR.data ?? []) as Cliente[]).map((c) => ({
    ...c,
    ...(stats.get(c.id) ?? { atendimentos: 0, total: 0, ultimo: null, faltas: 0 }),
  }))

  return <ListaClientes clientes={clientes} erro={clientesR.error?.message} />
}

export default function ClientesPage() {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo />
    </Suspense>
  )
}
