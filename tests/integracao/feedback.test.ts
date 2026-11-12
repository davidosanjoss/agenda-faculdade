// Avaliações dos testadores: envio, prints no Storage e laudo restrito ao administrador.
import type { SupabaseClient } from "@supabase/supabase-js"
import { beforeAll, describe, expect, it, vi } from "vitest"
import { idDe, novoUsuario, tornarAdmin } from "./ambiente"

const sessao = vi.hoisted(() => ({ cliente: null as SupabaseClient | null }))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => sessao.cliente }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
const { enviarFeedback, registrarCorrecao } = await import("@/app/(app)/feedback/acoes")

// PNG de 1x1 pixel
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64")

let testador: SupabaseClient
let outro: SupabaseClient
let admin: SupabaseClient
let caminhoPrint: string
// Nome único por execução: o banco local acumula dados de execuções anteriores.
const colega = `Colega ${Date.now()}`

beforeAll(async () => {
  ;[testador, outro, admin] = await Promise.all([novoUsuario("testador"), novoUsuario("outro"), novoUsuario("admin")])
  await tornarAdmin(admin)
  caminhoPrint = `${await idDe(testador)}/lote-1/1.png`
})

describe("envio da avaliação", () => {
  it("testador envia print para a própria pasta, mas não para a de outro", async () => {
    const ok = await testador.storage.from("prints").upload(caminhoPrint, png, { contentType: "image/png" })
    expect(ok.error).toBeNull()
    const invasao = await testador.storage
      .from("prints")
      .upload(`${await idDe(outro)}/x/1.png`, png, { contentType: "image/png" })
    expect(invasao.error).not.toBeNull()
  })

  it("Storage recusa arquivo que não é imagem", async () => {
    const { error } = await testador.storage
      .from("prints")
      .upload(`${await idDe(testador)}/lote-1/x.txt`, Buffer.from("oi"), { contentType: "text/plain" })
    expect(error).not.toBeNull()
  })

  it("grava a avaliação pelo controller", async () => {
    sessao.cliente = testador
    const r = await enviarFeedback({
      testador: colega,
      dataTeste: "2026-11-20",
      funcionou: "Agendar e ver o financeiro",
      naoFuncionou: "Ao excluir cliente com agendamento a mensagem demorou",
      prints: [caminhoPrint],
    })
    expect(r).toEqual({ ok: true })
    const { data } = await testador.from("feedbacks").select("testador,prints,situacao")
    expect(data).toEqual([{ testador: colega, prints: [caminhoPrint], situacao: "pendente" }])
  })

  it("não aceita prints de outro usuário nem já marcados como corrigidos", async () => {
    sessao.cliente = outro
    expect(await enviarFeedback({ testador: "X", dataTeste: "2026-11-20", funcionou: "x", prints: [caminhoPrint] })).toEqual({
      ok: false,
      erro: "Print inválido.",
    })
    const direto = await outro
      .from("feedbacks")
      .insert({ testador: "X", funcionou: "x", situacao: "corrigido", correcao: "fake" })
    expect(direto.error).not.toBeNull()
  })
})

describe("laudo de qualidade", () => {
  it("outro usuário não vê a avaliação nem o print", async () => {
    expect((await outro.from("feedbacks").select("id")).data).toEqual([])
    const { error } = await outro.storage.from("prints").download(caminhoPrint)
    expect(error).not.toBeNull()
  })

  it("testador não consegue marcar a própria avaliação como corrigida", async () => {
    sessao.cliente = testador
    const { data } = await testador.from("feedbacks").select("id").single()
    expect(await registrarCorrecao(data!.id, "corrigido", "feito")).toEqual({
      ok: false,
      erro: "Apenas o administrador pode registrar correções.",
    })
  })

  it("administrador vê todas, baixa o print e registra a correção", async () => {
    expect((await admin.rpc("eh_admin")).data).toBe(true)
    const { data } = await admin.from("feedbacks").select("id,testador").eq("testador", colega)
    expect(data).toHaveLength(1)
    const baixado = await admin.storage.from("prints").download(caminhoPrint)
    expect(baixado.error).toBeNull()

    sessao.cliente = admin
    expect(await registrarCorrecao(data![0].id, "corrigido", "Mensagem aparece na hora (commit abc123)")).toEqual({ ok: true })
    const { data: final } = await testador.from("feedbacks").select("situacao,correcao").single()
    expect(final).toEqual({ situacao: "corrigido", correcao: "Mensagem aparece na hora (commit abc123)" })
    expect(await registrarCorrecao(data![0].id, "feito", "")).toEqual({ ok: false, erro: "Situação inválida." })
  })

  it("só administrador pode consultar eh_admin = true", async () => {
    expect((await testador.rpc("eh_admin")).data).toBe(false)
  })
})
