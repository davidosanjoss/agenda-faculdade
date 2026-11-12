import { notFound } from "next/navigation"
import { Suspense } from "react"
import { Carregando } from "@/components/carregando"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { diaCurto, hoje } from "@/lib/datas"
import { createClient } from "@/lib/supabase/server"
import { BotaoImprimir, EditorCorrecao } from "./controles"

type Feedback = {
  id: string
  testador: string
  data_teste: string
  funcionou: string | null
  nao_funcionou: string | null
  nao_testado: string | null
  sugestoes: string | null
  prints: string[]
  navegador: string | null
  situacao: "pendente" | "corrigido" | "nao_procede"
  correcao: string | null
}

const ROTULO = { pendente: "Pendente", corrigido: "Corrigido", nao_procede: "Não procede" } as const

async function Conteudo() {
  const sb = await createClient()
  const { data: admin } = await sb.rpc("eh_admin")
  if (!admin) notFound()

  const { data } = await sb
    .from("feedbacks")
    .select("id,testador,data_teste,funcionou,nao_funcionou,nao_testado,sugestoes,prints,navegador,situacao,correcao")
    .order("data_teste")
    .order("created_at")
  const feedbacks = (data ?? []) as Feedback[]

  // Links temporários (1 h) para exibir os prints do bucket privado.
  const caminhos = feedbacks.flatMap((f) => f.prints)
  const { data: assinados } = caminhos.length
    ? await sb.storage.from("prints").createSignedUrls(caminhos, 3600)
    : { data: [] as { path: string | null; signedUrl: string }[] }
  const urlDe = new Map<string, string>()
  for (const a of assinados ?? []) if (a.path && a.signedUrl) urlDe.set(a.path, a.signedUrl)

  const comProblema = feedbacks.filter((f) => f.nao_funcionou)
  const corrigidos = comProblema.filter((f) => f.situacao === "corrigido").length
  const pendentes = comProblema.filter((f) => f.situacao === "pendente").length

  return (
    <div className="grid gap-5 print:gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-xl font-semibold">Laudo de Qualidade — Agenda MEI</h1>
          <p className="text-sm text-muted-foreground">
            Testes de aceitação feitos por usuários convidados · gerado em {diaCurto(hoje())}/{hoje().slice(0, 4)}
          </p>
        </div>
        <BotaoImprimir />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Indicador titulo="Testadores" valor={new Set(feedbacks.map((f) => f.testador.toLowerCase())).size} />
        <Indicador titulo="Problemas relatados" valor={comProblema.length} />
        <Indicador titulo="Corrigidos" valor={corrigidos} />
        <Indicador titulo="Pendentes" valor={pendentes} />
      </div>

      {feedbacks.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma avaliação recebida ainda. Envie o link /feedback para os testadores.</p>
      )}

      {feedbacks.map((f, i) => (
        <Card key={f.id} className="break-inside-avoid print:shadow-none">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              Teste {i + 1}: {f.testador}
              {f.nao_funcionou && (
                <Badge variant={f.situacao === "pendente" ? "destructive" : "secondary"}>{ROTULO[f.situacao]}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Data do teste: {diaCurto(f.data_teste)}/{f.data_teste.slice(0, 4)}
              {f.navegador && <span className="block truncate text-xs print:hidden">{f.navegador}</span>}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <Item titulo="O que testou e funcionou" texto={f.funcionou} />
            <Item titulo="O que testou e não funcionou – o que deve ser corrigido" texto={f.nao_funcionou} />
            <Item titulo="Funcionalidade não testada" texto={f.nao_testado} />
            <Item titulo="Sugestões de melhoria" texto={f.sugestoes} />
            {f.prints.length > 0 && (
              <div className="grid gap-1.5">
                <span className="font-medium">Evidências</span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {f.prints.map((p) => {
                    const url = urlDe.get(p)
                    return url ? (
                      <a key={p} href={url} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element -- link assinado e temporário do Storage */}
                        <img src={url} alt={`Print enviado por ${f.testador}`} className="aspect-video w-full rounded-md border bg-muted object-contain" />
                      </a>
                    ) : null
                  })}
                </div>
              </div>
            )}
            {(f.nao_funcionou || f.sugestoes) && (
              <EditorCorrecao id={f.id} situacao={f.situacao} correcao={f.correcao ?? ""} />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function Indicador({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{titulo}</CardDescription>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{valor}</p>
      </CardHeader>
    </Card>
  )
}

function Item({ titulo, texto }: { titulo: string; texto: string | null }) {
  return (
    <div className="grid gap-0.5">
      <span className="font-medium">{titulo}</span>
      <p className="whitespace-pre-line text-muted-foreground">{texto || "—"}</p>
    </div>
  )
}

export default function LaudoPage() {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo />
    </Suspense>
  )
}
