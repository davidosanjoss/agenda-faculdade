import Link from "next/link"
import { CalendarDays, Rows3 } from "lucide-react"
import { cn } from "@/lib/utils"

/** Alterna entre a lista da semana e o calendário do mês, mantendo a data em foco. */
export function AlternarVisao({ atual, semana, mes }: { atual: "semana" | "mes"; semana: string; mes: string }) {
  const item = (ativo: boolean) =>
    cn(
      "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors [&_svg]:size-3.5",
      ativo ? "bg-background font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
    )
  return (
    <div className="ml-auto inline-flex items-center rounded-lg bg-muted p-0.5" role="group" aria-label="Visão da agenda">
      <Link href={`/agenda?semana=${semana}`} className={item(atual === "semana")} aria-current={atual === "semana" ? "page" : undefined}>
        <Rows3 /> Semana
      </Link>
      <Link href={`/agenda?visao=mes&mes=${mes}`} className={item(atual === "mes")} aria-current={atual === "mes" ? "page" : undefined}>
        <CalendarDays /> Mês
      </Link>
    </div>
  )
}
