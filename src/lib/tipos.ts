export const STATUS = ["agendado", "realizado", "faltou", "cancelado"] as const
export type Status = (typeof STATUS)[number]

export const ROTULO_STATUS: Record<Status, string> = {
  agendado: "Agendado",
  realizado: "Realizado",
  faltou: "Faltou",
  cancelado: "Cancelado",
}

export type Cliente = { id: string; nome: string; telefone: string | null; email: string | null }
export type Servico = { id: string; nome: string; valor: number }
export type Agendamento = {
  id: string
  cliente_id: string
  cliente_nome: string
  cliente_telefone: string | null
  servico: string
  valor: number
  data: string // YYYY-MM-DD
  hora: string // HH:MM
  status: Status
  obs: string | null
}

/** Dados do formulário de agendamento, como chegam da tela. */
export type DadosAgendamento = {
  id?: string
  data: string
  hora: string
  cliente: string
  telefone?: string
  email?: string
  servico: string
  valor: number | string
  status: Status
  obs?: string
}

export type Resultado = { ok: true } | { ok: false; erro: string }

/** Converte a linha do Supabase (com o join em clientes) para Agendamento. */
export function paraAgendamento(r: {
  id: string
  cliente_id: string
  servico: string
  valor: number | string
  data: string
  hora: string
  status: string
  obs: string | null
  clientes: { nome: string; telefone: string | null } | { nome: string; telefone: string | null }[] | null
}): Agendamento {
  const c = Array.isArray(r.clientes) ? r.clientes[0] : r.clientes
  return {
    id: r.id,
    cliente_id: r.cliente_id,
    cliente_nome: c?.nome ?? "—",
    cliente_telefone: c?.telefone ?? null,
    servico: r.servico,
    valor: Number(r.valor),
    data: r.data,
    hora: r.hora.slice(0, 5),
    status: r.status as Status,
    obs: r.obs,
  }
}

export const SELECT_AGENDAMENTO = "id,cliente_id,servico,valor,data,hora,status,obs,clientes(nome,telefone)"
