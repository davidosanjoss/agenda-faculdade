import Link from "next/link"
import { Suspense } from "react"
import { ClipboardCheck } from "lucide-react"
import { Carregando } from "@/components/carregando"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { diaCurto, hoje } from "@/lib/datas"
import { createClient } from "@/lib/supabase/server"
import { FormFeedback } from "./form-feedback"

async function Conteudo() {
  const sb = await createClient()
  const [{ data: auth }, { data: admin }, { data: minhas }] = await Promise.all([
    sb.auth.getClaims(),
    sb.rpc("eh_admin"),
    sb.from("feedbacks").select("id,testador,data_teste,situacao").order("created_at", { ascending: false }),
  ])
  const userId = auth?.claims?.sub as string
  const doUsuario = minhas ?? []

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="grid gap-1">
          <h1 className="text-lg font-semibold">Avaliar o sistema</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Use o sistema normalmente (agende, mude situações, veja o financeiro) e conte aqui o que funcionou, o que deu
            errado e o que você não conseguiu testar. Prints das telas com erro ajudam muito na correção.
          </p>
        </div>
        {admin && (
          <Link href="/feedback/laudo" className={buttonVariants({ variant: "outline", className: "ml-auto" })}>
            <ClipboardCheck /> Laudo de qualidade
          </Link>
        )}
      </div>

      <FormFeedback userId={userId} hoje={hoje()} />

      {!admin && doUsuario.length > 0 && (
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm">Suas avaliações enviadas</CardTitle>
            <CardDescription>Obrigado! O desenvolvedor acompanha cada uma.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-1 text-sm">
            {doUsuario.map((f) => (
              <span key={f.id}>
                {diaCurto(f.data_teste)} · {f.testador} ·{" "}
                <span className="text-muted-foreground">
                  {f.situacao === "corrigido" ? "corrigido" : f.situacao === "nao_procede" ? "analisado" : "em análise"}
                </span>
              </span>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo />
    </Suspense>
  )
}
