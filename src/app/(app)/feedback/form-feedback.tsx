"use client"

import { useRef, useState, useTransition } from "react"
import { CheckCircle2, ImagePlus, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { MAX_PRINTS, problemaNoPrint } from "@/lib/validacao"
import { enviarFeedback } from "./acoes"

const CAMPOS = [
  { nome: "funcionou", rotulo: "O que testou e funcionou", dica: "Ex.: criei um agendamento, marquei como realizado e o valor apareceu no financeiro." },
  { nome: "naoFuncionou", rotulo: "O que testou e não funcionou – o que deve ser corrigido", dica: "Descreva o passo a passo até o erro e o que você esperava que acontecesse." },
  { nome: "naoTestado", rotulo: "Funcionalidade não testada (faltou ou não foi implementada)", dica: "O que você não conseguiu testar, e por quê." },
  { nome: "sugestoes", rotulo: "Sugestões de melhoria", dica: "Opcional." },
] as const

type Campo = (typeof CAMPOS)[number]["nome"]

export function FormFeedback({ userId, hoje }: { userId: string; hoje: string }) {
  const vazio = { testador: "", dataTeste: hoje, funcionou: "", naoFuncionou: "", naoTestado: "", sugestoes: "" }
  const [f, setF] = useState(vazio)
  const [prints, setPrints] = useState<File[]>([])
  const [enviado, setEnviado] = useState(false)
  const [pendente, iniciar] = useTransition()
  const entradaArquivo = useRef<HTMLInputElement>(null)

  function adicionarPrints(lista: FileList | null) {
    const novos = [...(lista ?? [])]
    const problema = novos.map(problemaNoPrint).find(Boolean)
    if (problema) return void toast.error(problema)
    if (prints.length + novos.length > MAX_PRINTS) return void toast.error(`Envie no máximo ${MAX_PRINTS} prints.`)
    setPrints((p) => [...p, ...novos])
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    iniciar(async () => {
      // 1) Prints vão direto para o Storage, na pasta do usuário.
      const supabase = createClient()
      const lote = crypto.randomUUID()
      const caminhos: string[] = []
      for (const [i, arq] of prints.entries()) {
        const ext = arq.type.split("/")[1].replace("jpeg", "jpg")
        const caminho = `${userId}/${lote}/${i + 1}.${ext}`
        const { error } = await supabase.storage.from("prints").upload(caminho, arq, { contentType: arq.type })
        if (error) return void toast.error(`Não foi possível enviar ${arq.name}. Tente de novo.`)
        caminhos.push(caminho)
      }
      // 2) A avaliação é gravada pelo servidor, já com os caminhos dos prints.
      const r = await enviarFeedback({ ...f, prints: caminhos, navegador: navigator.userAgent })
      if (!r.ok) return void toast.error(r.erro)
      setEnviado(true)
      setF(vazio)
      setPrints([])
    })
  }

  if (enviado) {
    return (
      <Card>
        <CardContent className="grid justify-items-center gap-2 py-6 text-center">
          <CheckCircle2 className="size-10 text-emerald-500" />
          <p className="font-medium">Avaliação enviada. Muito obrigado!</p>
          <Button variant="outline" onClick={() => setEnviado(false)}>
            Enviar outra avaliação
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <form onSubmit={enviar}>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
            <div className="grid gap-1.5">
              <Label htmlFor="fb-nome">Seu nome</Label>
              <Input id="fb-nome" value={f.testador} onChange={(e) => setF({ ...f, testador: e.target.value })} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="fb-data">Data do teste</Label>
              <Input id="fb-data" type="date" value={f.dataTeste} onChange={(e) => setF({ ...f, dataTeste: e.target.value })} required />
            </div>
          </div>

          {CAMPOS.map((c) => (
            <div key={c.nome} className="grid gap-1.5">
              <Label htmlFor={`fb-${c.nome}`}>{c.rotulo}</Label>
              <Textarea
                id={`fb-${c.nome}`}
                placeholder={c.dica}
                rows={3}
                value={f[c.nome as Campo]}
                onChange={(e) => setF({ ...f, [c.nome]: e.target.value })}
              />
            </div>
          ))}

          <div className="grid gap-2">
            <Label htmlFor="fb-prints">Prints das telas (até {MAX_PRINTS}, PNG/JPG até 5 MB)</Label>
            <input
              ref={entradaArquivo}
              id="fb-prints"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="sr-only"
              onChange={(e) => {
                adicionarPrints(e.target.files)
                e.target.value = ""
              }}
            />
            <div className="flex flex-wrap items-center gap-2">
              {prints.map((p, i) => (
                <span key={`${p.name}-${i}`} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
                  {p.name}
                  <button type="button" aria-label={`Remover ${p.name}`} onClick={() => setPrints(prints.filter((_, j) => j !== i))}>
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              {prints.length < MAX_PRINTS && (
                <Button type="button" variant="outline" size="sm" onClick={() => entradaArquivo.current?.click()}>
                  <ImagePlus /> Adicionar print
                </Button>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="mt-4 justify-end">
          <Button type="submit" disabled={pendente}>
            {pendente ? "Enviando..." : "Enviar avaliação"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
