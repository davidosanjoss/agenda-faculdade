export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export function variacao(atual: number, anterior: number) {
  if (anterior === 0) return atual === 0 ? 0 : null
  return ((atual - anterior) / anterior) * 100
}

/** Link do WhatsApp para telefones brasileiros (adiciona 55 quando falta). */
export function linkWhatsApp(telefone: string | null, mensagem?: string) {
  if (!telefone) return null
  let n = telefone.replace(/\D/g, "")
  if (n.length < 10) return null
  if (n.length <= 11) n = "55" + n
  return `https://wa.me/${n}${mensagem ? `?text=${encodeURIComponent(mensagem)}` : ""}`
}
