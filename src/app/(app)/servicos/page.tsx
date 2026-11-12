import { Suspense } from "react"
import { Carregando } from "@/components/carregando"
import { createClient } from "@/lib/supabase/server"
import { ListaServicos } from "./lista-servicos"

async function Conteudo() {
  const sb = await createClient()
  const { data, error } = await sb.from("servicos").select("id,nome,valor").order("nome")
  return <ListaServicos servicos={(data ?? []).map((s) => ({ ...s, valor: Number(s.valor) }))} erro={error?.message} />
}

export default function ServicosPage() {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo />
    </Suspense>
  )
}
