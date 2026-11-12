"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

// Erro inesperado numa tela logada: mostra uma mensagem clara e permite tentar de novo.
export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[tela]", error)
  }, [error])

  return (
    <div role="alert" className="mx-auto grid max-w-md justify-items-center gap-3 py-16 text-center">
      <AlertTriangle className="size-10 text-amber-500" />
      <h1 className="text-lg font-semibold">Algo deu errado ao carregar esta tela</h1>
      <p className="text-sm text-muted-foreground">
        Pode ser uma falha momentânea de conexão. Seus dados não foram perdidos.
        {error.digest && <span className="mt-1 block text-xs">Código do erro: {error.digest}</span>}
      </p>
      <Button onClick={reset}>Tentar de novo</Button>
    </div>
  )
}
