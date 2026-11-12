"use client"

import Link from "next/link"
import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { nomeDia, nomeMes, somaMeses } from "@/lib/datas"
import { brl } from "@/lib/formato"
import { agruparPorDia, precisaDeBaixa, totalPrevisto, totalRealizado } from "@/lib/agenda"
import { entraNaPrevisao } from "@/lib/financeiro"
import type { Agendamento, Cliente, Servico, Status } from "@/lib/tipos"
import { cn } from "@/lib/utils"
import { AlternarVisao } from "./alternar-visao"
import { DialogoAgendamento, rascunhoDe, rascunhoVazio, type Rascunho } from "./dialogo-agendamento"
import { CartaoPendentes, LinhaAgendamento } from "./visao-agenda"

type Props = {
  hoje: string
  mes: string // YYYY-MM
  dias: string[] // semanas completas (seg a dom) que cobrem o mês
  agendamentos: Agendamento[]
  pendentes: Agendamento[]
  clientes: Cliente[]
  servicos: Servico[]
  erro?: string
}
const SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
const COR: Record<Status, string> = {
  agendado: "bg-primary",
  realizado: "bg-emerald-500",
  faltou: "bg-amber-500",
  cancelado: "bg-muted-foreground/40",
}
const conta = (a: Agendamento) => entraNaPrevisao(a.status)
const MAX_NA_CELULA = 3

export function VisaoMes({ hoje, mes, dias, agendamentos, pendentes, clientes, servicos, erro }: Props) {
  const [rascunho, setRascunho] = useState<Rascunho | null>(null)
  const [selecionado, setSelecionado] = useState(hoje.startsWith(mes) ? hoje : `${mes}-01`)

  const porDia = agruparPorDia(agendamentos)

  const doMes = agendamentos.filter((a) => a.data.startsWith(mes))
  const previsto = totalPrevisto(doMes)
  const realizado = totalRealizado(doMes)
  const doSelecionado = porDia.get(selecionado) ?? []
  const abrir = (a: Agendamento) => setRascunho(rascunhoDe(a, clientes))

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/agenda?visao=mes&mes=${somaMeses(mes, -1)}`} className={buttonVariants({ variant: "outline", size: "icon" })} aria-label="Mês anterior">
          <ChevronLeft />
        </Link>
        <Link href="/agenda?visao=mes" className={buttonVariants({ variant: "outline" })}>
          Hoje
        </Link>
        <Link href={`/agenda?visao=mes&mes=${somaMeses(mes, 1)}`} className={buttonVariants({ variant: "outline", size: "icon" })} aria-label="Próximo mês">
          <ChevronRight />
        </Link>
        <h1 className="ml-1 font-semibold capitalize">{nomeMes(mes)}</h1>
        <AlternarVisao atual="mes" semana={selecionado} mes={mes} />
        <Button onClick={() => setRascunho(rascunhoVazio(selecionado))}>
          <Plus /> Agendar
        </Button>
      </div>

      {erro && <p className="text-sm text-destructive">Erro ao carregar: {erro}</p>}

      <p className="text-sm text-muted-foreground">
        Mês: <strong className="text-foreground">{doMes.filter(conta).length}</strong> atendimentos · previsto{" "}
        <strong className="text-foreground">{brl(previsto)}</strong> · já realizado{" "}
        <strong className="text-foreground">{brl(realizado)}</strong>
      </p>

      <CartaoPendentes pendentes={pendentes} aoAbrir={abrir} />

      <Card className="gap-0 py-0">
        <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-medium text-muted-foreground">
          {SEMANA.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {dias.map((dia, i) => {
            const lista = porDia.get(dia) ?? []
            const ativos = lista.filter(conta)
            const total = totalPrevisto(lista)
            const foraDoMes = !dia.startsWith(mes)
            const ehHoje = dia === hoje
            const ehSel = dia === selecionado
            return (
              <button
                key={dia}
                type="button"
                onClick={() => setSelecionado(dia)}
                onDoubleClick={() => setRascunho(rascunhoVazio(dia))}
                aria-pressed={ehSel}
                aria-label={`${nomeDia(dia)}: ${ativos.length} atendimento(s)`}
                className={cn(
                  "flex min-h-16 flex-col gap-1 border-b p-1 text-left transition-colors outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring sm:min-h-28 sm:p-1.5",
                  (i + 1) % 7 !== 0 && "border-r",
                  i >= dias.length - 7 && "border-b-0",
                  foraDoMes && "bg-muted/30 text-muted-foreground",
                  ehSel && "bg-primary/10 ring-2 ring-primary ring-inset hover:bg-primary/10",
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                      ehHoje && "bg-primary font-semibold text-primary-foreground",
                    )}
                  >
                    {Number(dia.slice(8))}
                  </span>
                  {total > 0 && (
                    <span className="hidden text-[0.7rem] text-muted-foreground tabular-nums sm:inline">{brl(total)}</span>
                  )}
                </div>

                {/* Celular: pontinhos por atendimento */}
                {lista.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 px-0.5 sm:hidden">
                    {lista.slice(0, 6).map((a) => (
                      <span key={a.id} className={cn("size-1.5 rounded-full", COR[a.status])} />
                    ))}
                    {lista.length > 6 && <span className="text-[0.6rem] leading-none">+</span>}
                  </div>
                )}

                {/* Telas maiores: horário e cliente */}
                <div className="hidden min-w-0 flex-col gap-0.5 sm:flex">
                  {lista.slice(0, MAX_NA_CELULA).map((a) => (
                    <span
                      key={a.id}
                      className={cn(
                        "flex min-w-0 items-center gap-1 text-[0.7rem] leading-tight",
                        !conta(a) && "line-through opacity-60",
                      )}
                    >
                      <span className={cn("size-1.5 shrink-0 rounded-full", COR[a.status])} />
                      <span className="tabular-nums">{a.hora}</span>
                      <span className="truncate">{a.cliente_nome.split(" ")[0]}</span>
                    </span>
                  ))}
                  {lista.length > MAX_NA_CELULA && (
                    <span className="text-[0.7rem] text-muted-foreground">+{lista.length - MAX_NA_CELULA} mais</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {(["agendado", "realizado", "faltou", "cancelado"] as Status[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5 capitalize">
            <span className={cn("size-2 rounded-full", COR[s])} />
            {s}
          </span>
        ))}
        <span className="ml-auto hidden sm:inline">Clique duas vezes num dia para agendar.</span>
      </div>

      <Card size="sm">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className={cn("text-sm capitalize", selecionado === hoje && "text-primary")}>{nomeDia(selecionado)}</CardTitle>
          <div className="flex items-center gap-1">
            <span className="mr-2 text-sm text-muted-foreground">
              {doSelecionado.length ? brl(totalPrevisto(doSelecionado)) : ""}
            </span>
            <Button size="sm" variant="outline" onClick={() => setRascunho(rascunhoVazio(selecionado))}>
              <Plus /> Agendar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {doSelecionado.length === 0 ? (
            <p className="px-4 text-sm text-muted-foreground">Sem agendamentos neste dia.</p>
          ) : (
            doSelecionado.map((a) => (
              <LinhaAgendamento key={a.id} a={a} aoAbrir={() => abrir(a)} pendente={precisaDeBaixa(a, hoje)} />
            ))
          )}
        </CardContent>
      </Card>

      <DialogoAgendamento
        rascunho={rascunho}
        aoFechar={() => setRascunho(null)}
        clientes={clientes}
        servicos={servicos}
        agendamentos={agendamentos}
      />
    </div>
  )
}

