import { defineConfig, devices } from "@playwright/test"

// Testes de sistema (ponta a ponta) no navegador, contra o Supabase local.
// Localmente reaproveita o `npm run dev` se estiver no ar; no CI sobe o build de produção.
const porta = Number(process.env.PORTA_E2E ?? 3000)

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${porta}`,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chrome",
      testIgnore: /capturas/,
      use: { ...devices["Desktop Chrome"], channel: process.env.CI ? undefined : "chrome" },
    },
    {
      name: "capturas",
      testMatch: /capturas/,
      use: { ...devices["Desktop Chrome"], channel: process.env.CI ? undefined : "chrome", viewport: { width: 1280, height: 860 } },
    },
  ],
  webServer: {
    command: process.env.CI ? `npm run build && npm start -- -p ${porta}` : `npm run dev -- -p ${porta}`,
    url: `http://localhost:${porta}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
