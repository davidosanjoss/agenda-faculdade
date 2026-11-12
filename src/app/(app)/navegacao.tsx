"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const ITENS = [
  { href: "/agenda", rotulo: "Agenda" },
  { href: "/financeiro", rotulo: "Financeiro" },
  { href: "/clientes", rotulo: "Clientes" },
  { href: "/servicos", rotulo: "Serviços" },
  { href: "/feedback", rotulo: "Avaliar" },
] as const

export function Navegacao() {
  const caminho = usePathname()
  return (
    <nav className="mx-auto flex max-w-5xl gap-0 overflow-x-auto px-1.5 sm:gap-1 sm:px-2">
      {ITENS.map((i) => {
        const ativo = caminho.startsWith(i.href)
        return (
          <Link
            key={i.href}
            href={i.href}
            className={cn(
              "border-b-2 px-2.5 py-2 text-sm whitespace-nowrap transition-colors sm:px-3",
              ativo
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {i.rotulo}
          </Link>
        )
      })}
    </nav>
  )
}
