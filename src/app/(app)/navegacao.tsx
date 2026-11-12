"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const ITENS = [
  { href: "/agenda", rotulo: "Agenda" },
  { href: "/financeiro", rotulo: "Financeiro" },
  { href: "/clientes", rotulo: "Clientes" },
  { href: "/servicos", rotulo: "Serviços" },
] as const

export function Navegacao() {
  const caminho = usePathname()
  return (
    <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-2">
      {ITENS.map((i) => {
        const ativo = caminho.startsWith(i.href)
        return (
          <Link
            key={i.href}
            href={i.href}
            className={cn(
              "border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors",
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
