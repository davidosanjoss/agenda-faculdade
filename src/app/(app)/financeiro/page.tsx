import { Suspense } from "react"
import { Carregando } from "@/components/carregando"
import Link from "next/link"
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ehMes, hoje, nomeMes, somaMeses } from "@/lib/datas"
import { brl, variacao } from "@/lib/formato"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"
import { GraficoMeses, type PontoMes } from "./grafico-meses"

type Linha = { data: string; valor: number | string; status: string; servico: string }

function resumo(linhas: Linha[]) {
  const soma = (...st: string[]) => linhas.filter((l) => st.includes(l.status)).reduce((t, l) => t + Number(l.valor), 0)
  const realizados = linhas.filter((l) => l.status === "realizado").length
  const realizado = soma("realizado")
  return {
    realizado,
    aReceber: soma("agendado"),
    previsto: soma("realizado", "agendado"),
    perdido: soma("faltou", "cancelado"),
    atendimentos: linhas.filter((l) => l.status === "realizado" || l.status === "agendado").length,
    faltas: linhas.filter((l) => l.status === "faltou").length,
    ticket: realizados ? realizado / realizados : 0,
  }
}

async function Conteudo({ searchParams }: { searchParams: PageProps<"/financeiro">["searchParams"] }) {
  const sb = await createClient() // antes de hoje(): garante render por requisição
  const { mes: mesParam } = await searchParams
  const hj = hoje()
  const mesAtual = hj.slice(0, 7)
  const mes = typeof mesParam === "string" && ehMes(mesParam) ? mesParam : mesAtual
  const meses = Array.from({ length: 6 }, (_, i) => somaMeses(mes, i - 5))

  const { data, error } = await sb
    .from("agendamentos")
    .select("data,valor,status,servico")
    .gte("data", `${meses[0]}-01`)
    .lt("data", `${somaMeses(mes, 1)}-01`)
  const linhas = (data ?? []) as Linha[]

  const porMes = meses.map((m) => ({ mes: m, ...resumo(linhas.filter((l) => l.data.startsWith(m))) }))
  const atual = porMes[5]
  const anterior = porMes[4]
  const doMes = linhas.filter((l) => l.data.startsWith(mes))
  const pendentes = doMes.filter((l) => l.status === "agendado" && l.data < hj).length

  const servicos = Object.values(
    doMes
      .filter((l) => l.status === "realizado" || l.status === "agendado")
      .reduce<Record<string, { nome: string; qtd: number; total: number }>>((acc, l) => {
        const k = l.servico.toLowerCase()
        acc[k] ??= { nome: l.servico, qtd: 0, total: 0 }
        acc[k].qtd++
        acc[k].total += Number(l.valor)
        return acc
      }, {}),
  ).sort((a, b) => b.total - a.total)

  const pontos: PontoMes[] = porMes.map((p) => ({
    mes: nomeMes(p.mes, true),
    realizado: p.realizado,
    agendado: p.aReceber,
  }))

  const titulo = mes === mesAtual ? "este mês" : nomeMes(mes)

  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-2">
        <Link href={`/financeiro?mes=${somaMeses(mes, -1)}`} className={buttonVariants({ variant: "outline", size: "icon" })} aria-label="Mês anterior">
          <ChevronLeft />
        </Link>
        <h1 className="min-w-40 text-center font-semibold capitalize">{nomeMes(mes)}</h1>
        <Link href={`/financeiro?mes=${somaMeses(mes, 1)}`} className={buttonVariants({ variant: "outline", size: "icon" })} aria-label="Próximo mês">
          <ChevronRight />
        </Link>
        {mes !== mesAtual && (
          <Link href="/financeiro" className={buttonVariants({ variant: "ghost" })}>
            Mês atual
          </Link>
        )}
      </div>

      {error && <p className="text-sm text-destructive">Erro ao carregar: {error.message}</p>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador titulo={`Previsão de ${titulo}`} valor={brl(atual.previsto)} atual={atual.previsto} anterior={anterior.previsto} dica="realizado + agendado" />
        <Indicador titulo="Já realizado" valor={brl(atual.realizado)} atual={atual.realizado} anterior={anterior.realizado} />
        <Indicador titulo="Ainda a receber" valor={brl(atual.aReceber)} dica="agendados ainda não realizados" />
        <Indicador titulo="Perdido (faltas/cancel.)" valor={brl(atual.perdido)} dica={`${atual.faltas} falta(s)`} />
        <Indicador titulo="Atendimentos" valor={String(atual.atendimentos)} atual={atual.atendimentos} anterior={anterior.atendimentos} />
        <Indicador titulo="Ticket médio" valor={brl(atual.ticket)} atual={atual.ticket} anterior={anterior.ticket} dica="por atendimento realizado" />
      </div>

      {pendentes > 0 && (
        <p className="rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
          {pendentes} atendimento(s) deste mês já passaram e continuam como “Agendado”. Dê baixa na{" "}
          <Link href="/agenda" className="underline">
            Agenda
          </Link>{" "}
          para separar o que foi realizado do que foi falta.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Últimos 6 meses</CardTitle>
          <CardDescription>Realizado e agendado (a receber) em cada mês</CardDescription>
        </CardHeader>
        <CardContent>
          <GraficoMeses dados={pontos} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comparação mês a mês</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Mês</TableHead>
                <TableHead className="text-right">Previsto</TableHead>
                <TableHead className="text-right">Realizado</TableHead>
                <TableHead className="text-right">Perdido</TableHead>
                <TableHead className="pr-4 text-right">vs. anterior</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...porMes].reverse().map((p, i, lista) => {
                const ant = lista[i + 1]
                return (
                  <TableRow key={p.mes}>
                    <TableCell className="pl-4 capitalize">{nomeMes(p.mes)}</TableCell>
                    <TableCell className="text-right tabular-nums">{brl(p.previsto)}</TableCell>
                    <TableCell className="text-right tabular-nums">{brl(p.realizado)}</TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">{brl(p.perdido)}</TableCell>
                    <TableCell className="pr-4 text-right">
                      {ant ? <Variacao pct={variacao(p.previsto, ant.previsto)} /> : "—"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Serviços de {titulo}</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {servicos.length === 0 ? (
            <p className="px-4 text-sm text-muted-foreground">Nenhum atendimento neste mês.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Serviço</TableHead>
                  <TableHead className="text-right">Qtd.</TableHead>
                  <TableHead className="pr-4 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servicos.map((s) => (
                  <TableRow key={s.nome}>
                    <TableCell className="pl-4">{s.nome}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.qtd}</TableCell>
                    <TableCell className="pr-4 text-right tabular-nums">{brl(s.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Indicador({
  titulo,
  valor,
  atual,
  anterior,
  dica,
}: {
  titulo: string
  valor: string
  atual?: number
  anterior?: number
  dica?: string
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{titulo}</CardDescription>
        <CardTitle className="text-xl tabular-nums">{valor}</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">
        {atual !== undefined && anterior !== undefined ? (
          <>
            <Variacao pct={variacao(atual, anterior)} /> vs. mês anterior
          </>
        ) : (
          dica
        )}
      </CardContent>
    </Card>
  )
}

function Variacao({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-muted-foreground">novo</span>
  if (Math.abs(pct) < 0.5) return <span className="text-muted-foreground">=</span>
  const sobe = pct > 0
  const Icone = sobe ? TrendingUp : TrendingDown
  return (
    <span className={cn("inline-flex items-center gap-0.5 font-medium", sobe ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
      <Icone className="size-3.5" />
      {sobe ? "+" : ""}
      {pct.toFixed(0)}%
    </span>
  )
}

export default function FinanceiroPage({ searchParams }: PageProps<"/financeiro">) {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo searchParams={searchParams} />
    </Suspense>
  )
}
