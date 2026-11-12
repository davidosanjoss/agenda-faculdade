import { describe, expect, it } from "vitest"
import { problemaNoPrint, situacaoFeedbackValida, validarFeedback } from "@/lib/validacao"

const uid = "11111111-1111-1111-1111-111111111111"
const base = { testador: " João ", dataTeste: "2026-11-20", naoFuncionou: "O botão salvar não responde" }

describe("validarFeedback()", () => {
  it("aceita uma avaliação com pelo menos um item e normaliza os campos", () => {
    expect(validarFeedback({ ...base, prints: [`${uid}/lote/1.png`] }, uid)).toEqual({
      ok: true,
      dados: {
        testador: "João",
        data_teste: "2026-11-20",
        funcionou: null,
        nao_funcionou: "O botão salvar não responde",
        nao_testado: null,
        sugestoes: null,
        prints: [`${uid}/lote/1.png`],
        navegador: null,
      },
    })
  })

  it.each([
    ["sem nome", { testador: " " }, "Informe seu nome."],
    ["data inválida", { dataTeste: "2026-02-31" }, "Data do teste inválida."],
    ["todos os itens vazios", { naoFuncionou: "  " }, "Descreva pelo menos um item do teste."],
  ])("recusa %s", (_, mudanca, erro) => {
    expect(validarFeedback({ ...base, ...mudanca }, uid)).toEqual({ ok: false, erro })
  })

  it("recusa prints de outra pasta, caminhos com .. e mais de 5 imagens", () => {
    expect(validarFeedback({ ...base, prints: ["outro-usuario/1.png"] }, uid)).toEqual({ ok: false, erro: "Print inválido." })
    expect(validarFeedback({ ...base, prints: [`${uid}/../x.png`] }, uid)).toEqual({ ok: false, erro: "Print inválido." })
    const seis = Array.from({ length: 6 }, (_, i) => `${uid}/l/${i}.png`)
    expect(validarFeedback({ ...base, prints: seis }, uid)).toEqual({ ok: false, erro: "Envie no máximo 5 prints." })
  })
})

describe("problemaNoPrint()", () => {
  it("aceita imagens até 5 MB", () => {
    expect(problemaNoPrint({ name: "a.png", type: "image/png", size: 1024 })).toBeNull()
  })
  it("recusa outros tipos e imagens grandes", () => {
    expect(problemaNoPrint({ name: "a.pdf", type: "application/pdf", size: 10 })).toMatch(/PNG, JPG ou WEBP/)
    expect(problemaNoPrint({ name: "a.png", type: "image/png", size: 6 * 1024 * 1024 })).toMatch(/5 MB/)
  })
  it("valida a situação da correção", () => {
    expect(situacaoFeedbackValida("corrigido")).toBe(true)
    expect(situacaoFeedbackValida("feito")).toBe(false)
  })
})
