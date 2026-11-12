import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { DialogoAgendamento, rascunhoVazio } from "@/app/(app)/agenda/dialogo-agendamento"
import type { Agendamento, Cliente, Servico } from "@/lib/tipos"

const acoes = vi.hoisted(() => ({ salvarAgendamento: vi.fn(), excluirAgendamento: vi.fn() }))
vi.mock("@/app/(app)/acoes", () => acoes)
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock("sonner", () => ({ toast }))

const clientes: Cliente[] = [{ id: "c1", nome: "Ana Souza", telefone: "(11) 98888-7777", email: "ana@ex.com" }]
const servicos: Servico[] = [{ id: "s1", nome: "Manicure", valor: 35 }]
const ocupado: Agendamento = {
  id: "a1",
  cliente_id: "c1",
  cliente_nome: "Ana Souza",
  cliente_telefone: null,
  servico: "Manicure",
  valor: 35,
  data: "2026-11-20",
  hora: "09:00",
  status: "agendado",
  obs: null,
}

function abrir(aoFechar = vi.fn()) {
  render(
    <DialogoAgendamento
      rascunho={rascunhoVazio("2026-11-20")}
      aoFechar={aoFechar}
      clientes={clientes}
      servicos={servicos}
      agendamentos={[ocupado]}
    />,
  )
  return aoFechar
}

describe("DialogoAgendamento", () => {
  beforeEach(() => vi.clearAllMocks())

  it("preenche contato do cliente conhecido e o preço do serviço do catálogo", async () => {
    const user = userEvent.setup()
    abrir()
    await user.type(screen.getByLabelText("Cliente"), "ana souza")
    expect(screen.getByLabelText("Telefone")).toHaveValue("(11) 98888-7777")
    expect(screen.getByLabelText("E-mail (opcional)")).toHaveValue("ana@ex.com")
    expect(screen.queryByText("Cliente novo: será cadastrado.")).not.toBeInTheDocument()

    await user.type(screen.getByLabelText("Serviço"), "Manicure")
    expect(screen.getByLabelText("Valor (R$)")).toHaveValue("35,00")
  })

  it("avisa quando o cliente é novo", async () => {
    const user = userEvent.setup()
    abrir()
    await user.type(screen.getByLabelText("Cliente"), "Carla")
    expect(screen.getByText("Cliente novo: será cadastrado.")).toBeInTheDocument()
  })

  it("avisa conflito de horário com outro agendamento", () => {
    abrir()
    // o rascunho começa às 09:00 do dia 20, mesmo horário do agendamento da Ana
    expect(screen.getByText(/Já existe um agendamento com Ana Souza neste horário/)).toBeInTheDocument()
  })

  it("salva, confirma e fecha", async () => {
    acoes.salvarAgendamento.mockResolvedValue({ ok: true })
    const user = userEvent.setup()
    const aoFechar = abrir()
    await user.type(screen.getByLabelText("Cliente"), "Bia Lima")
    await user.type(screen.getByLabelText("Serviço"), "Pedicure")
    await user.type(screen.getByLabelText("Valor (R$)"), "40,50")
    await user.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => expect(aoFechar).toHaveBeenCalled())
    expect(acoes.salvarAgendamento).toHaveBeenCalledWith(
      expect.objectContaining({ data: "2026-11-20", hora: "09:00", cliente: "Bia Lima", servico: "Pedicure", valor: "40,50", status: "agendado" }),
    )
    expect(toast.success).toHaveBeenCalledWith("Agendamento criado.")
  })

  it("mostra o erro do servidor e mantém o formulário aberto", async () => {
    acoes.salvarAgendamento.mockResolvedValue({ ok: false, erro: "Valor inválido." })
    const user = userEvent.setup()
    const aoFechar = abrir()
    await user.type(screen.getByLabelText("Cliente"), "Bia")
    await user.type(screen.getByLabelText("Serviço"), "Pedicure")
    await user.type(screen.getByLabelText("Valor (R$)"), "1")
    await user.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Valor inválido."))
    expect(aoFechar).not.toHaveBeenCalled()
  })
})
