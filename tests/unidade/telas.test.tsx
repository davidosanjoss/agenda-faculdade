import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { AlternarVisao } from "@/app/(app)/agenda/alternar-visao"
import { ListaClientes, type ClienteResumo } from "@/app/(app)/clientes/lista-clientes"
import { FormLogin } from "@/app/login/form-login"

vi.mock("@/app/(app)/acoes", () => ({ salvarCliente: vi.fn(), excluirCliente: vi.fn() }))
vi.mock("@/app/login/acoes", () => ({ entrar: vi.fn(), cadastrar: vi.fn() }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe("AlternarVisao", () => {
  it("marca a visão atual e mantém a data em foco nos links", () => {
    render(<AlternarVisao atual="mes" semana="2026-11-18" mes="2026-11" />)
    const semana = screen.getByRole("link", { name: /Semana/ })
    const mes = screen.getByRole("link", { name: /Mês/ })
    expect(semana).toHaveAttribute("href", "/agenda?semana=2026-11-18")
    expect(mes).toHaveAttribute("href", "/agenda?visao=mes&mes=2026-11")
    expect(mes).toHaveAttribute("aria-current", "page")
    expect(semana).not.toHaveAttribute("aria-current")
  })
})

const clientes: ClienteResumo[] = [
  { id: "1", nome: "Ana Souza", telefone: "(11) 98888-7777", email: null, atendimentos: 3, total: 105, ultimo: "2026-11-10", faltas: 1 },
  { id: "2", nome: "Bia Lima", telefone: "(21) 97777-1111", email: "bia@ex.com", atendimentos: 0, total: 0, ultimo: null, faltas: 0 },
]

describe("ListaClientes", () => {
  it("lista clientes com total gasto, faltas e link do WhatsApp", () => {
    render(<ListaClientes clientes={clientes} />)
    const linhaAna = screen.getByText("Ana Souza").closest("tr")!
    expect(within(linhaAna).getByText("1 falta(s)")).toBeInTheDocument()
    expect(within(linhaAna).getByText(/105,00/)).toBeInTheDocument()
    expect(within(linhaAna).getByTitle("Abrir no WhatsApp")).toHaveAttribute("href", "https://wa.me/5511988887777")
  })

  it("filtra por nome e por dígitos do telefone", async () => {
    const user = userEvent.setup()
    render(<ListaClientes clientes={clientes} />)
    const busca = screen.getByPlaceholderText("Buscar por nome ou telefone")

    await user.type(busca, "bia")
    expect(screen.queryByText("Ana Souza")).not.toBeInTheDocument()
    expect(screen.getByText("Bia Lima")).toBeInTheDocument()

    await user.clear(busca)
    await user.type(busca, "98888")
    expect(screen.getByText("Ana Souza")).toBeInTheDocument()
    expect(screen.queryByText("Bia Lima")).not.toBeInTheDocument()

    await user.clear(busca)
    await user.type(busca, "zzz")
    expect(screen.getByText("Nenhum cliente encontrado.")).toBeInTheDocument()
  })

  it("explica como cadastrar quando ainda não há clientes", () => {
    render(<ListaClientes clientes={[]} />)
    expect(screen.getByText(/Os clientes são cadastrados ao criar um agendamento/)).toBeInTheDocument()
  })
})

describe("FormLogin", () => {
  it("alterna entre entrar e criar conta", async () => {
    const user = userEvent.setup()
    render(<FormLogin linkInvalido={false} />)
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Ainda não tenho conta" }))
    expect(screen.getByRole("button", { name: "Criar conta" })).toBeInTheDocument()
    expect(screen.getByLabelText("Senha")).toHaveAttribute("autocomplete", "new-password")
  })

  it("mostra o aviso de link de confirmação inválido", () => {
    render(<FormLogin linkInvalido />)
    expect(screen.getByText(/link de confirmação é inválido ou expirou/)).toBeInTheDocument()
  })
})
