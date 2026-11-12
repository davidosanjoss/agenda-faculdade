"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { Resultado } from "@/lib/tipos"
import { situacaoFeedbackValida, validarFeedback, type DadosFeedback } from "@/lib/validacao"

export async function enviarFeedback(entrada: DadosFeedback): Promise<Resultado> {
  const sb = await createClient()
  const { data: auth } = await sb.auth.getClaims()
  const userId = auth?.claims?.sub
  if (!userId) return { ok: false, erro: "Sua sessão expirou. Entre novamente." }

  const v = validarFeedback(entrada, userId)
  if (!v.ok) return v
  const { error } = await sb.from("feedbacks").insert(v.dados)
  if (error) {
    console.error("[feedback]", error)
    return { ok: false, erro: "Não foi possível enviar a avaliação. Tente de novo." }
  }
  revalidatePath("/feedback", "layout")
  return { ok: true }
}

export async function registrarCorrecao(id: string, situacao: string, correcao: string): Promise<Resultado> {
  if (!situacaoFeedbackValida(situacao)) return { ok: false, erro: "Situação inválida." }
  const sb = await createClient()
  const { data, error } = await sb
    .from("feedbacks")
    .update({ situacao, correcao: correcao.trim() || null })
    .eq("id", id)
    .select("id")
  if (error) return { ok: false, erro: "Não foi possível salvar a correção." }
  // Sem permissão o RLS não devolve erro, só não atualiza nada.
  if (!data?.length) return { ok: false, erro: "Apenas o administrador pode registrar correções." }
  revalidatePath("/feedback", "layout")
  return { ok: true }
}
