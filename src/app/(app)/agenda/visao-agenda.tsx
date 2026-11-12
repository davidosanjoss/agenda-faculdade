"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { ChevronLeft, ChevronRight, MessageCircle, Plus } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SelectStatus } from "@/components/select-status"
import { diaCurto, nomeDia, somaDias } from "@/lib/datas"
import { brl, linkWhatsApp } from "@/lib/formato"
import { mensagemLembrete, precisaDeBaixa, totalPrevisto, totalRealizado } from "@/lib/agenda"
import { entraNaPrevisao } from "@/lib/financeiro"
import type { Agendamento, Cliente, Servico, Status } from "@/lib/tipos"
import { cn } from "@/lib/utils"
import { mudarStatus } from "../acoes"
import { AlternarVisao } from "./alternar-visao"
import { DialogoAgendamento, rascunhoDe, rascunhoVazio, type Rascunho } from "./dialogo-agendamento"

type Props = {
  hoje: string
  inicio: string
  agendamentos: Agendamento[]
  pendentes: Agendamento[]
  clientes: Cliente[]
  servicos: Servico[]
  erro?: string
}

const conta = (a: Agendamento) => entraNaPrevisao(a.status)

export function VisaoAgenda({ hoje, inicio, agendamentos, pendentes, clientes, servicos, erro }: Props) {
  const [rascunho, setRascunho] = useState<Rascunho | null>(null)
  const dias = Array.from({ length: 7 }, (_, i) => somaDias(inicio, i))
  const ativos = agendamentos.filter(conta)
  const previsto = totalPrevisto(agendamentos)
  const realizado = totalRealizado(agendamentos)
  const diaNovo = hoje >= inicio && hoje <= dias[6] ? hoje : inicio

  const abrir = (a: Agendamento) => setRascunho(rascunhoDe(a, clientes))

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/agenda?semana=${somaDias(inicio, -7)}`} className={buttonVariants({ variant: "outline", size: "icon" })} aria-label="Semana anterior">
          <ChevronLeft />
        </Link>
        <Link href="/agenda" className={buttonVariants({ variant: "outline" })}>
          Hoje
        </Link>
        <Link href={`/agenda?semana=${somaDias(inicio, 7)}`} className={buttonVariants({ variant: "outline", size: "icon" })} aria-label="Próxima semana">
          <ChevronRight />
        </Link>
        <h1 className="ml-1 font-semibold">
          {diaCurto(inicio)} a {diaCurto(dias[6])}
        </h1>
        <AlternarVisao atual="semana" semana={diaNovo} mes={diaNovo.slice(0, 7)} />
        <Button onClick={() => setRascunho(rascunhoVazio(diaNovo))}>
          <Plus /> Agendar
        </Button>
      </div>

      {erro && <p className="text-sm text-destructive">Erro ao carregar: {erro}</p>}

      <p className="text-sm text-muted-foreground">
        Semana: <strong className="text-foreground">{ativos.length}</strong> atendimentos · previsto{" "}
        <strong className="text-foreground">{brl(previsto)}</strong> · já realizado{" "}
        <strong className="text-foreground">{brl(realizado)}</strong>
      </p>

      <CartaoPendentes pendentes={pendentes} aoAbrir={abrir} />

      {dias.map((dia) => {
        const doDia = agendamentos.filter((a) => a.data === dia)
        const soma = totalPrevisto(doDia)
        return (
          <Card key={dia} size="sm" className={cn(dia === hoje && "ring-2 ring-primary/60")}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className={cn("text-sm", dia === hoje && "text-primary")}>
                {nomeDia(dia)} {dia === hoje && <Badge className="ml-1">hoje</Badge>}
              </CardTitle>
              <span className="text-sm text-muted-foreground">{doDia.length ? brl(soma) : ""}</span>
            </CardHeader>
            <CardContent className="px-0">
              {doDia.length === 0 ? (
                <button
                  type="button"
                  className="w-full px-4 text-left text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setRascunho(rascunhoVazio(dia))}
                >
                  Sem agendamentos. Clique para agendar.
                </button>
              ) : (
                doDia.map((a) => <LinhaAgendamento key={a.id} a={a} aoAbrir={() => abrir(a)} pendente={precisaDeBaixa(a, hoje)} />)
              )}
            </CardContent>
          </Card>
        )
      })}

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

export function CartaoPendentes({ pendentes, aoAbrir }: { pendentes: Agendamento[]; aoAbrir: (a: Agendamento) => void }) {
  if (pendentes.length === 0) return null
  return (
    <Card className="ring-amber-500/40">
      <CardHeader>
        <CardTitle className="text-sm">
          {pendentes.length === 30 ? "30+" : pendentes.length} atendimento(s) passado(s) sem baixa
        </CardTitle>
        <p className="text-sm text-muted-foreground">Marque como realizado ou faltou para o financeiro ficar certo.</p>
      </CardHeader>
      <CardContent className="px-0">
        {pendentes.map((a) => (
          <LinhaAgendamento key={a.id} a={a} mostrarData aoAbrir={() => aoAbrir(a)} />
        ))}
      </CardContent>
    </Card>
  )
}

export function LinhaAgendamento({
  a,
  aoAbrir,
  mostrarData,
  pendente,
}: {
  a: Agendamento
  aoAbrir: () => void
  mostrarData?: boolean
  pendente?: boolean
}) {
  const [salvando, iniciar] = useTransition()
  const riscado = a.status === "cancelado" || a.status === "faltou"
  const whats = linkWhatsApp(a.cliente_telefone, mensagemLembrete(a))

  function trocar(s: Status) {
    iniciar(async () => {
      const r = await mudarStatus(a.id, s)
      if (!r.ok) toast.error(r.erro)
    })
  }

  return (
    <div
      className={cn(
        "grid grid-cols-[3.5rem_1fr] items-center gap-x-3 gap-y-1.5 border-t px-4 py-2.5 first:border-t-0 sm:grid-cols-[3.5rem_1fr_auto]",
        pendente && "shadow-[inset_3px_0_0_var(--color-amber-500)]",
        salvando && "opacity-60",
      )}
    >
      <button type="button" onClick={aoAbrir} className="text-left font-semibold tabular-nums">
        {mostrarData ? <span className="block text-xs font-normal text-muted-foreground">{diaCurto(a.data)}</span> : null}
        {a.hora}
      </button>
      <button type="button" onClick={aoAbrir} className={cn("min-w-0 text-left", riscado && "line-through opacity-60")}>
        <span className="block truncate font-medium">{a.cliente_nome}</span>
        <span className="flex min-w-0 gap-1 text-sm text-muted-foreground">
          <span className="truncate">{a.servico}</span>
          <span className="shrink-0">· {brl(a.valor)}</span>
        </span>
      </button>
      <div className="col-start-2 flex items-center gap-1 sm:col-start-auto">
        {whats && (
          <a
            href={whats}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
            title="Lembrar pelo WhatsApp"
          >
            <MessageCircle />
          </a>
        )}
        <SelectStatus tamanho="sm" valor={a.status} aoMudar={trocar} />
      </div>
    </div>
  )
}
