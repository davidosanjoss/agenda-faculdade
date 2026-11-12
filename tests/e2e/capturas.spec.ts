import { expect, test } from "@playwright/test"

// Gera as imagens do manual de uso (docs/imagens) com a conta de demonstração.
// Rode depois de `node --env-file=.env.local scripts/dados-exemplo.mjs`:
//   npm run docs:capturas
const pasta = "docs/imagens"
const conta = { email: process.env.DEMO_EMAIL ?? "demo@agenda.local", senha: process.env.DEMO_SENHA ?? "demo123" }

test("capturas do manual", async ({ page }) => {
  const erros: string[] = []
  page.on("console", (m) => m.type() === "error" && erros.push(m.text()))
  page.on("pageerror", (e) => erros.push(e.message))
  // Espera a hidratação: o screenshot esconde o cursor alterando o estilo dos campos,
  // e fazer isso antes do React hidratar gera um aviso falso de "hydration mismatch".
  await page.goto("/login", { waitUntil: "networkidle" })
  await page.screenshot({ path: `${pasta}/01-login.png` })

  await page.getByLabel("E-mail").fill(conta.email)
  await page.getByLabel("Senha").fill(conta.senha)
  await page.getByRole("button", { name: "Entrar" }).click()
  await expect(page).toHaveURL(/\/agenda/)
  await page.getByText(/^Semana:/).waitFor()
  await page.screenshot({ path: `${pasta}/02-agenda-semana.png`, fullPage: true })

  await page.getByRole("button", { name: "Agendar" }).first().click()
  const dialogo = page.getByRole("dialog")
  await dialogo.getByLabel("Cliente").fill("Ana Souza")
  await dialogo.getByLabel("Serviço").fill("Manicure + pedicure")
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${pasta}/03-novo-agendamento.png` })
  await dialogo.getByRole("button", { name: "Cancelar" }).click()

  await page.getByRole("link", { name: /Mês/ }).click()
  await page.getByText(/^Mês:/).waitFor()
  await page.screenshot({ path: `${pasta}/04-agenda-mes.png`, fullPage: true })

  await page.getByRole("link", { name: "Financeiro" }).click()
  await page.locator(".recharts-bar-rectangle").first().waitFor()
  await page.waitForTimeout(600) // animação do gráfico
  await page.screenshot({ path: `${pasta}/05-financeiro.png`, fullPage: true })

  await page.getByRole("link", { name: "Clientes" }).click()
  await page.getByPlaceholder("Buscar por nome ou telefone").waitFor()
  await page.screenshot({ path: `${pasta}/06-clientes.png`, fullPage: true })

  await page.getByRole("link", { name: "Serviços" }).click()
  await page.getByText("Novo serviço").waitFor()
  await page.screenshot({ path: `${pasta}/07-servicos.png` })

  await page.getByRole("link", { name: "Avaliar", exact: true }).click()
  await page.getByLabel("Seu nome").waitFor()
  await page.screenshot({ path: `${pasta}/08-avaliar.png`, fullPage: true })

  await page.goto("/feedback/laudo", { waitUntil: "networkidle" })
  await page.getByText("Laudo de Qualidade").waitFor()
  await page.screenshot({ path: `${pasta}/09-laudo.png`, fullPage: true })

  // Celular
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/agenda?visao=mes", { waitUntil: "networkidle" })
  await page.getByText(/^Mês:/).waitFor()
  await page.screenshot({ path: `${pasta}/10-celular-mes.png`, fullPage: true })
  await page.goto("/agenda", { waitUntil: "networkidle" })
  await page.getByText(/^Semana:/).waitFor()
  await page.screenshot({ path: `${pasta}/11-celular-semana.png` })

  expect(erros, erros.join("\n")).toEqual([])
})
