"use client"

import { useState, useTransition } from "react"
import { Printer } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { registrarCorrecao } from "../acoes"

export function BotaoImprimir() {
  return (
    <Button variant="outline" className="ml-auto print:hidden" onClick={() => window.print()}>
      <Printer /> Imprimir / salvar PDF
    </Button>
  )
}

const SITUACOES = [
  { value: "pendente", label: "Pendente" },
  { value: "corrigido", label: "Corrigido" },
  { value: "nao_procede", label: "Não procede" },
]

/** Registro da correção feita para o problema relatado (aparece no PDF como texto). */
export function EditorCorrecao({ id, situacao, correcao }: { id: string; situacao: string; correcao: string }) {
  const [s, setS] = useState(situacao)
  const [texto, setTexto] = useState(correcao)
  const [pendente, iniciar] = useTransition()
  const mudou = s !== situacao || texto !== correcao

  function salvar() {
    iniciar(async () => {
      const r = await registrarCorrecao(id, s, texto)
      if (r.ok) toast.success("Correção registrada.")
      else toast.error(r.erro)
    })
  }

  return (
    <div className="grid gap-2 rounded-lg border border-dashed p-3">
      <span className="font-medium">Correção</span>
      <p className="hidden whitespace-pre-line text-muted-foreground print:block">
        {SITUACOES.find((x) => x.value === situacao)?.label}
        {correcao ? ` — ${correcao}` : ""}
      </p>
      <div className="grid gap-2 print:hidden sm:grid-cols-[10rem_1fr]">
        <div className="grid gap-1">
          <Label htmlFor={`sit-${id}`} className="text-xs">
            Situação
          </Label>
          <Select items={SITUACOES} value={s} onValueChange={(v) => v && setS(v)}>
            <SelectTrigger id={`sit-${id}`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SITUACOES.map((i) => (
                <SelectItem key={i.value} value={i.value}>
                  {i.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1">
          <Label htmlFor={`cor-${id}`} className="text-xs">
            O que foi feito (ex.: commit, tela alterada)
          </Label>
          <Textarea id={`cor-${id}`} rows={2} value={texto} onChange={(e) => setTexto(e.target.value)} />
        </div>
      </div>
      {mudou && (
        <Button size="sm" className="justify-self-end print:hidden" onClick={salvar} disabled={pendente}>
          {pendente ? "Salvando..." : "Salvar correção"}
        </Button>
      )}
    </div>
  )
}
