import { fileURLToPath } from "node:url"
import { loadEnv } from "vite"
import { defineConfig } from "vitest/config"

const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) }

export default defineConfig({
  resolve: { alias },
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    // .env, .env.local etc. (as chaves do Supabase local para os testes de integração)
    env: loadEnv("test", process.cwd(), ""),
    projects: [
      {
        extends: true,
        test: {
          name: "unidade",
          include: ["tests/unidade/**/*.test.{ts,tsx}"],
          environment: "jsdom",
          setupFiles: ["tests/setup.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integracao",
          include: ["tests/integracao/**/*.test.ts"],
          environment: "node",
          // Os testes compartilham o mesmo banco local: rodam um arquivo por vez.
          fileParallelism: false,
          testTimeout: 20_000,
        },
      },
    ],
  },
})
