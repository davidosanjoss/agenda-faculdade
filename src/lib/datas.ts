// Datas tratadas como texto (YYYY-MM-DD / YYYY-MM) para não sofrer com fuso:
// o servidor da Vercel roda em UTC, e o "hoje" é sempre o de São Paulo.
const FUSO = "America/Sao_Paulo"

const partes = (iso: string) => iso.split("-").map(Number)
const utc = (iso: string) => {
  const [y, m, d] = partes(iso)
  return new Date(Date.UTC(y, m - 1, d ?? 1))
}

export const ehData = (s?: string): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(utc(s).getTime())
export const ehMes = (s?: string): s is string => !!s && /^\d{4}-(0[1-9]|1[0-2])$/.test(s)
export const ehHora = (s?: string): s is string => !!s && /^([01]\d|2[0-3]):[0-5]\d$/.test(s)

export function hoje() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(new Date())
}

export function somaDias(iso: string, n: number) {
  const d = utc(iso)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function segundaDaSemana(iso: string) {
  return somaDias(iso, -((utc(iso).getUTCDay() + 6) % 7))
}

export function somaMeses(ym: string, n: number) {
  const [y, m] = partes(ym)
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7)
}

export function nomeMes(ym: string, curto = false) {
  const s = utc(`${ym}-01`).toLocaleDateString("pt-BR", {
    month: curto ? "short" : "long",
    year: curto ? "2-digit" : "numeric",
    timeZone: "UTC",
  })
  return curto ? s.replace(". de ", "/").replace(" de ", "/") : s
}

export function nomeDia(iso: string) {
  return utc(iso).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", timeZone: "UTC" })
}

export function diaCurto(iso: string) {
  return utc(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" })
}

/** Dias (seg a dom) de todas as semanas que cobrem o mês, para a grade do calendário. */
export function diasDaGrade(mes: string) {
  const ultimo = somaDias(`${somaMeses(mes, 1)}-01`, -1)
  const dias: string[] = []
  for (let d = segundaDaSemana(`${mes}-01`); d <= ultimo || dias.length % 7 !== 0; d = somaDias(d, 1)) dias.push(d)
  return dias
}
