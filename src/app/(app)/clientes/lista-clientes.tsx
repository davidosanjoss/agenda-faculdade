"use client"

import { useState, useTransition } from "react"
import { MessageCircle, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { diaCurto } from "@/lib/datas"
import { brl, linkWhatsApp } from "@/lib/formato"
import type { Cliente } from "@/lib/tipos"
import { excluirCliente, salvarCliente } from "../acoes"

export type ClienteResumo = Cliente & { atendimentos: number; total: number; ultimo: string | null; faltas: number }

export function ListaClientes({ clientes, erro }: { clientes: ClienteResumo[]; erro?: string }) {
  const [busca, setBusca] = useState("")
  const [editando, setEditando] = useState<Partial<Cliente> | null>(null)
  const [pendente, iniciar] = useTransition()

  const termo = busca.trim().toLowerCase()
  const digitos = termo.replace(/\D/g, "")
  const filtrados = clientes.filter(
    (c) =>
      !termo ||
      c.nome.toLowerCase().includes(termo) ||
      (digitos.length > 0 && (c.telefone ?? "").replace(/\D/g, "").includes(digitos)),
  )

  function excluir(c: ClienteResumo) {
    if (!window.confirm(`Excluir ${c.nome}?`)) return
    iniciar(async () => {
      const r = await excluirCliente(c.id)
      if (r.ok) toast.success("Cliente excluído.")
      else toast.error(r.erro)
    })
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="search"
          placeholder="Buscar por nome ou telefone"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="max-w-xs"
        />
        <span className="text-sm text-muted-foreground">{clientes.length} cliente(s)</span>
        <Button className="ml-auto" onClick={() => setEditando({})}>
          <Plus /> Cliente
        </Button>
      </div>

      {erro && <p className="text-sm text-destructive">Erro ao carregar: {erro}</p>}

      <Card>
        <CardContent className="px-0">
          {filtrados.length === 0 ? (
            <p className="px-4 text-sm text-muted-foreground">
              {clientes.length ? "Nenhum cliente encontrado." : "Os clientes são cadastrados ao criar um agendamento, ou pelo botão “+ Cliente”."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="text-right">Atendimentos</TableHead>
                  <TableHead className="text-right">Total gasto</TableHead>
                  <TableHead>Último</TableHead>
                  <TableHead className="pr-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((c) => {
                  const whats = linkWhatsApp(c.telefone)
                  return (
                    <TableRow key={c.id} className={pendente ? "opacity-70" : undefined}>
                      <TableCell className="pl-4 font-medium">
                        {c.nome}
                        {c.faltas > 0 && <span className="ml-2 text-xs text-muted-foreground">{c.faltas} falta(s)</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          {c.telefone && (
                            <span className="inline-flex items-center gap-1">
                              {c.telefone}
                              {whats && (
                                <a href={whats} target="_blank" rel="noreferrer" title="Abrir no WhatsApp" className="text-primary">
                                  <MessageCircle className="size-3.5" />
                                </a>
                              )}
                            </span>
                          )}
                          {c.email && <span className="text-muted-foreground">{c.email}</span>}
                          {!c.telefone && !c.email && <span className="text-muted-foreground">—</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{c.atendimentos}</TableCell>
                      <TableCell className="text-right tabular-nums">{brl(c.total)}</TableCell>
                      <TableCell className="text-muted-foreground">{c.ultimo ? diaCurto(c.ultimo) : "—"}</TableCell>
                      <TableCell className="pr-4 text-right">
                        <Button variant="ghost" size="icon-sm" onClick={() => setEditando(c)} aria-label={`Editar ${c.nome}`}>
                          <Pencil />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => excluir(c)} aria-label={`Excluir ${c.nome}`}>
                          <Trash2 />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={editando !== null} onOpenChange={(a) => !a && setEditando(null)}>
        <DialogContent>
          {editando && <FormCliente key={editando.id ?? "novo"} inicial={editando} aoFechar={() => setEditando(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FormCliente({ inicial, aoFechar }: { inicial: Partial<Cliente>; aoFechar: () => void }) {
  const [nome, setNome] = useState(inicial.nome ?? "")
  const [telefone, setTelefone] = useState(inicial.telefone ?? "")
  const [email, setEmail] = useState(inicial.email ?? "")
  const [pendente, iniciar] = useTransition()

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    iniciar(async () => {
      const r = await salvarCliente({ id: inicial.id, nome, telefone, email })
      if (!r.ok) return void toast.error(r.erro)
      toast.success("Cliente salvo.")
      aoFechar()
    })
  }

  return (
    <form onSubmit={enviar} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{inicial.id ? "Editar cliente" : "Novo cliente"}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-1.5">
        <Label htmlFor="cli-nome">Nome</Label>
        <Input id="cli-nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="cli-tel">Telefone</Label>
        <Input id="cli-tel" type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="cli-email">E-mail (opcional)</Label>
        <Input id="cli-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <DialogFooter>
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
