"use client"

import { useState, useTransition } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { brl } from "@/lib/formato"
import type { Servico } from "@/lib/tipos"
import { excluirServico, salvarServico } from "../acoes"

export function ListaServicos({ servicos, erro }: { servicos: Servico[]; erro?: string }) {
  const [id, setId] = useState<string | undefined>()
  const [nome, setNome] = useState("")
  const [valor, setValor] = useState("")
  const [pendente, iniciar] = useTransition()

  const limpar = () => {
    setId(undefined)
    setNome("")
    setValor("")
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    iniciar(async () => {
      const r = await salvarServico({ id, nome, valor: Number(valor.replace(",", ".")) })
      if (!r.ok) return void toast.error(r.erro)
      toast.success(id ? "Serviço atualizado." : "Serviço cadastrado.")
      limpar()
    })
  }

  function excluir(s: Servico) {
    if (!window.confirm(`Excluir o serviço ${s.nome}? Os agendamentos antigos não mudam.`)) return
    iniciar(async () => {
      const r = await excluirServico(s.id)
      if (r.ok) toast.success("Serviço excluído.")
      else toast.error(r.erro)
    })
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{id ? "Editar serviço" : "Novo serviço"}</CardTitle>
          <CardDescription>O preço preenche o valor automaticamente ao agendar (dá para mudar na hora).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={enviar} className="flex flex-wrap items-end gap-3">
            <div className="grid flex-1 basis-56 gap-1.5">
              <Label htmlFor="srv-nome">Serviço</Label>
              <Input id="srv-nome" placeholder="Ex.: Manicure + pedicure" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="grid w-36 gap-1.5">
              <Label htmlFor="srv-valor">Preço (R$)</Label>
              <Input id="srv-valor" type="number" inputMode="decimal" step="0.01" min="0" value={valor} onChange={(e) => setValor(e.target.value)} required />
            </div>
            <Button type="submit" disabled={pendente}>
              {id ? "Salvar" : "Adicionar"}
            </Button>
            {id && (
              <Button type="button" variant="outline" onClick={limpar}>
                Cancelar
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {erro && <p className="text-sm text-destructive">Erro ao carregar: {erro}</p>}

      <Card>
        <CardContent className="px-0">
          {servicos.length === 0 ? (
            <p className="px-4 text-sm text-muted-foreground">Nenhum serviço cadastrado ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Serviço</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="pr-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {servicos.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="pl-4 font-medium">{s.nome}</TableCell>
                    <TableCell className="text-right tabular-nums">{brl(s.valor)}</TableCell>
                    <TableCell className="pr-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Editar ${s.nome}`}
                        onClick={() => {
                          setId(s.id)
                          setNome(s.nome)
                          setValor(String(s.valor))
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label={`Excluir ${s.nome}`} onClick={() => excluir(s)}>
                        <Trash2 />
                      </Button>
                    </TableCell>
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
