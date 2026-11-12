import { Suspense } from "react"
import { Carregando } from "@/components/carregando"
import { diasDaGrade, ehData, ehMes, hoje, segundaDaSemana, somaDias } from "@/lib/datas"
import { createClient } from "@/lib/supabase/server"
import { paraAgendamento, SELECT_AGENDAMENTO, type Cliente, type Servico } from "@/lib/tipos"
import { VisaoAgenda } from "./visao-agenda"
import { VisaoMes } from "./visao-mes"

async function Conteudo({ searchParams }: { searchParams: PageProps<"/agenda">["searchParams"] }) {
  const sb = await createClient() // antes de hoje(): garante render por requisição
  const { semana, visao, mes: mesParam } = await searchParams
  const hj = hoje()
  const porMes = visao === "mes"
  const mes = typeof mesParam === "string" && ehMes(mesParam) ? mesParam : hj.slice(0, 7)
  const dias = porMes ? diasDaGrade(mes) : []
  const inicio = porMes ? dias[0] : segundaDaSemana(typeof semana === "string" && ehData(semana) ? semana : hj)
  const fim = porMes ? dias[dias.length - 1] : somaDias(inicio, 6)

  const [semanaR, pendentesR, clientesR, servicosR] = await Promise.all([
    sb.from("agendamentos").select(SELECT_AGENDAMENTO).gte("data", inicio).lte("data", fim).order("data").order("hora"),
    // Atendimentos que já passaram e ainda não receberam baixa (realizado/faltou).
    sb.from("agendamentos").select(SELECT_AGENDAMENTO).eq("status", "agendado").lt("data", hj).order("data").order("hora").limit(30),
    sb.from("clientes").select("id,nome,telefone,email").order("nome"),
    sb.from("servicos").select("id,nome,valor").order("nome"),
  ])

  const comum = {
    hoje: hj,
    agendamentos: (semanaR.data ?? []).map(paraAgendamento),
    pendentes: (pendentesR.data ?? []).map(paraAgendamento),
    clientes: (clientesR.data ?? []) as Cliente[],
    servicos: (servicosR.data ?? []).map((s) => ({ ...s, valor: Number(s.valor) })) as Servico[],
    erro: semanaR.error?.message ?? clientesR.error?.message,
  }
  return porMes ? <VisaoMes {...comum} mes={mes} dias={dias} /> : <VisaoAgenda {...comum} inicio={inicio} />
}

export default function AgendaPage({ searchParams }: PageProps<"/agenda">) {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo searchParams={searchParams} />
    </Suspense>
  )
}
