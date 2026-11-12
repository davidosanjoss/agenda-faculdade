import { expect, test, type Page } from "@playwright/test"

// Fluxo completo de um profissional novo: cadastro → agenda → financeiro → clientes → sair.
const email = `e2e-${Date.now()}@teste.local`
const senha = "senha-e2e-123"

async function criarConta(page: Page) {
  await page.goto("/login")
  await page.getByRole("button", { name: "Ainda não tenho conta" }).click()
  await page.getByLabel("E-mail").fill(email)
  await page.getByLabel("Senha").fill(senha)
  await page.getByRole("button", { name: "Criar conta" }).click()
  await expect(page).toHaveURL(/\/agenda/)
}

async function entrar(page: Page) {
  await page.goto("/login")
  await page.getByLabel("E-mail").fill(email)
  await page.getByLabel("Senha").fill(senha)
  await page.getByRole("button", { name: "Entrar" }).click()
  await expect(page).toHaveURL(/\/agenda/)
}

test.describe.configure({ mode: "serial" })

test("visitante sem login é levado para a tela de entrada", async ({ page }) => {
  await page.goto("/financeiro")
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible()
})

test("senha errada mostra mensagem clara", async ({ page }) => {
  await page.goto("/login")
  await page.getByLabel("E-mail").fill("ninguem@teste.local")
  await page.getByLabel("Senha").fill("errada123")
  await page.getByRole("button", { name: "Entrar" }).click()
  await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible()
})

test("profissional agenda, dá baixa e vê o resultado no financeiro", async ({ page }) => {
  await criarConta(page)

  // Novo agendamento (data de hoje vem preenchida)
  await page.getByRole("button", { name: "Agendar" }).first().click()
  const dialogo = page.getByRole("dialog")
  await dialogo.getByLabel("Hora").fill("14:30")
  await dialogo.getByLabel("Cliente").fill("Carla Teste")
  await expect(dialogo.getByText("Cliente novo: será cadastrado.")).toBeVisible()
  await dialogo.getByLabel("Telefone").fill("(11) 91234-5678")
  await dialogo.getByLabel("Serviço").fill("Escova")
  await dialogo.getByLabel("Valor (R$)").fill("65,00")
  await dialogo.getByRole("button", { name: "Salvar" }).click()
  await expect(page.getByText("Agendamento criado.")).toBeVisible()
  await expect(dialogo).toBeHidden()

  // Aparece na semana com valor previsto
  const linha = page.getByRole("button", { name: /Carla Teste/ })
  await expect(linha).toBeVisible()
  await expect(page.getByText(/previsto\s+R\$\s*65,00/)).toBeVisible()

  // Conflito de horário é avisado
  await page.getByRole("button", { name: "Agendar" }).first().click()
  await dialogo.getByLabel("Hora").fill("14:30")
  await expect(dialogo.getByText(/Já existe um agendamento com Carla Teste/)).toBeVisible()
  await dialogo.getByRole("button", { name: "Cancelar" }).click()

  // Valor inválido é recusado pelo servidor
  await page.getByRole("button", { name: "Agendar" }).first().click()
  await dialogo.getByLabel("Cliente").fill("Outra")
  await dialogo.getByLabel("Serviço").fill("Corte")
  await dialogo.getByLabel("Valor (R$)").fill("abc")
  await dialogo.getByRole("button", { name: "Salvar" }).click()
  await expect(page.getByText("Valor inválido.")).toBeVisible()
  await dialogo.getByRole("button", { name: "Cancelar" }).click()

  // Dá baixa como realizado
  const card = page.locator("div").filter({ has: linha }).filter({ has: page.getByRole("combobox") }).last()
  await card.getByRole("combobox").click()
  await page.getByRole("option", { name: "Realizado" }).click()
  await expect(page.getByText(/já realizado\s+R\$\s*65,00/)).toBeVisible()

  // Financeiro reflete a baixa
  await page.getByRole("link", { name: "Financeiro" }).click()
  await expect(page.getByText("Já realizado")).toBeVisible()
  await expect(page.locator("[data-slot=card]").filter({ hasText: "Já realizado" })).toContainText("65,00")
  await expect(page.getByRole("cell", { name: "Escova" })).toBeVisible()

  // Calendário do mês mostra o atendimento
  await page.goto("/agenda?visao=mes")
  await expect(page.getByText(/Mês:\s*1\s*atendimentos/)).toBeVisible()
  await expect(page.getByRole("button", { name: /Carla Teste/ })).toBeVisible()

  // Cliente foi cadastrado automaticamente
  await page.getByRole("link", { name: "Clientes" }).click()
  const cliente = page.getByRole("row").filter({ hasText: "Carla Teste" })
  await expect(cliente).toContainText("(11) 91234-5678")
  await expect(cliente).toContainText("65,00")

  // Serviço entrou no catálogo
  await page.getByRole("link", { name: "Serviços" }).click()
  await expect(page.getByRole("row").filter({ hasText: "Escova" })).toContainText("65,00")

  // Sair
  await page.getByRole("button", { name: "Sair" }).click()
  await expect(page).toHaveURL(/\/login$/)
})

test("testador envia avaliação com print", async ({ page }) => {
  await entrar(page)

  await page.getByRole("link", { name: "Avaliar", exact: true }).click()
  await page.getByLabel("Seu nome").fill("Testador E2E")
  await page.getByLabel("O que testou e funcionou").fill("Agendar, dar baixa e ver o financeiro.")
  await page.getByLabel(/não funcionou/).fill("Nada a relatar neste teste automatizado.")
  await page.locator("#fb-prints").setInputFiles({
    name: "tela.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64",
    ),
  })
  await expect(page.getByText("tela.png")).toBeVisible()
  await page.getByRole("button", { name: "Enviar avaliação" }).click()
  await expect(page.getByText("Avaliação enviada. Muito obrigado!")).toBeVisible()
})

test("página inexistente mostra 404 amigável", async ({ page }) => {
  await entrar(page)
  await page.goto("/nao-existe")
  await expect(page.getByText("Página não encontrada")).toBeVisible()
  await page.getByRole("link", { name: "Ir para a agenda" }).click()
  await expect(page).toHaveURL(/\/agenda/)
})
