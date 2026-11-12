"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SelectStatus } from "@/components/select-status"
import { buscarPorNome, encontrarConflito } from "@/lib/agenda"
import type { Agendamento, Cliente, Servico, Status } from "@/lib/tipos"
import { excluirAgendamento, salvarAgendamento } from "../acoes"

export type Rascunho = {
  id?: string
  data: string
  hora: string
  cliente: string
  telefone: string
  email: string
  servico: string
  valor: string
  status: Status
  obs: string
}

export function rascunhoVazio(data: string): Rascunho {
  return { data, hora: "09:00", cliente: "", telefone: "", email: "", servico: "", valor: "", status: "agendado", obs: "" }
}

export function rascunhoDe(a: Agendamento, clientes: Cliente[]): Rascunho {
  const c = clientes.find((x) => x.id === a.cliente_id)
  return {
    id: a.id,
    data: a.data,
    hora: a.hora,
    cliente: a.cliente_nome,
    telefone: c?.telefone ?? "",
    email: c?.email ?? "",
    servico: a.servico,
    valor: a.valor.toFixed(2).replace(".", ","),
    status: a.status,
    obs: a.obs ?? "",
  }
}

export function DialogoAgendamento({
  rascunho,
  aoFechar,
  clientes,
  servicos,
  agendamentos,
}: {
  rascunho: Rascunho | null
  aoFechar: () => void
  clientes: Cliente[]
  servicos: Servico[]
  agendamentos: Agendamento[]
}) {
  return (
    <Dialog open={rascunho !== null} onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent className="sm:max-w-lg">
        {rascunho && (
          <Formulario
            key={rascunho.id ?? "novo"}
            inicial={rascunho}
            aoFechar={aoFechar}
            clientes={clientes}
            servicos={servicos}
            agendamentos={agendamentos}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function Formulario({
  inicial,
  aoFechar,
  clientes,
  servicos,
  agendamentos,
}: {
  inicial: Rascunho
  aoFechar: () => void
  clientes: Cliente[]
  servicos: Servico[]
  agendamentos: Agendamento[]
}) {
  const [f, setF] = useState(inicial)
  const [pendente, iniciar] = useTransition()
  const muda = (campo: keyof Rascunho, valor: string) => setF((x) => ({ ...x, [campo]: valor }))

  const clienteConhecido = buscarPorNome(clientes, f.cliente)
  const conflito = encontrarConflito(agendamentos, f)

  function aoMudarCliente(nome: string) {
    const c = buscarPorNome(clientes, nome)
    setF((x) => ({
      ...x,
      cliente: nome,
      telefone: c ? (c.telefone ?? "") : x.telefone,
      email: c ? (c.email ?? "") : x.email,
    }))
  }

  function aoMudarServico(nome: string) {
    const s = buscarPorNome(servicos, nome)
    setF((x) => ({ ...x, servico: nome, valor: s ? s.valor.toFixed(2).replace(".", ",") : x.valor }))
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    iniciar(async () => {
      const r = await salvarAgendamento(f)
      if (!r.ok) return void toast.error(r.erro)
      toast.success(f.id ? "Agendamento atualizado." : "Agendamento criado.")
      aoFechar()
    })
  }

  function excluir() {
    if (!f.id) return
    iniciar(async () => {
      const r = await excluirAgendamento(f.id!)
      if (!r.ok) return void toast.error(r.erro)
      toast.success("Agendamento excluído.")
      aoFechar()
    })
  }

  return (
    <form onSubmit={enviar} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{f.id ? "Editar agendamento" : "Novo agendamento"}</DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Data" id="ag-data">
          <Input id="ag-data" type="date" value={f.data} onChange={(e) => muda("data", e.target.value)} required />
        </Campo>
        <Campo rotulo="Hora" id="ag-hora">
          <Input id="ag-hora" type="time" value={f.hora} onChange={(e) => muda("hora", e.target.value)} required />
        </Campo>
        <Campo rotulo="Cliente" id="ag-cliente" largo dica={f.cliente && !clienteConhecido ? "Cliente novo: será cadastrado." : undefined}>
          <Input
            id="ag-cliente"
            list="lista-clientes"
            autoComplete="off"
            value={f.cliente}
            onChange={(e) => aoMudarCliente(e.target.value)}
            required
          />
          <datalist id="lista-clientes">
            {clientes.map((c) => (
              <option key={c.id} value={c.nome} />
            ))}
          </datalist>
        </Campo>
        <Campo rotulo="Telefone" id="ag-tel">
          <Input id="ag-tel" type="tel" placeholder="(00) 00000-0000" value={f.telefone} onChange={(e) => muda("telefone", e.target.value)} />
        </Campo>
        <Campo rotulo="E-mail (opcional)" id="ag-email">
          <Input id="ag-email" type="email" value={f.email} onChange={(e) => muda("email", e.target.value)} />
        </Campo>
        <Campo rotulo="Serviço" id="ag-servico">
          <Input
            id="ag-servico"
            list="lista-servicos"
            autoComplete="off"
            value={f.servico}
            onChange={(e) => aoMudarServico(e.target.value)}
            required
          />
          <datalist id="lista-servicos">
            {servicos.map((s) => (
              <option key={s.id} value={s.nome} />
            ))}
          </datalist>
        </Campo>
        <Campo rotulo="Valor (R$)" id="ag-valor">
          <Input
            id="ag-valor"
            inputMode="decimal"
            placeholder="0,00"
            value={f.valor}
            onChange={(e) => muda("valor", e.target.value)}
            required
          />
        </Campo>
        <Campo rotulo="Situação" id="ag-status">
          <SelectStatus id="ag-status" valor={f.status} aoMudar={(s) => muda("status", s)} />
        </Campo>
        <Campo rotulo="Observação" id="ag-obs">
          <Input id="ag-obs" value={f.obs} onChange={(e) => muda("obs", e.target.value)} />
        </Campo>
      </div>

      {conflito && (
        <p className="rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
          Já existe um agendamento com {conflito.cliente_nome} neste horário.
        </p>
      )}

      <DialogFooter>
        {f.id && (
          <Button type="button" variant="destructive" className="sm:mr-auto" onClick={excluir} disabled={pendente}>
            Excluir
          </Button>
        )}
        <Button type="button" variant="outline" onClick={aoFechar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pendente}>
          {pendente ? "Salvando..." : "Salvar"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function Campo({
  rotulo,
  id,
  largo,
  dica,
  children,
}: {
  rotulo: string
  id: string
  largo?: boolean
  dica?: string
  children: React.ReactNode
}) {
  return (
    <div className={largo ? "col-span-2 grid gap-1.5" : "col-span-2 grid gap-1.5 sm:col-span-1"}>
      <Label htmlFor={id}>{rotulo}</Label>
      {children}
      {dica && <span className="text-xs text-muted-foreground">{dica}</span>}
    </div>
  )
}
