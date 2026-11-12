"use client"

import { useActionState, useState } from "react"
import { CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cadastrar, entrar, type EstadoLogin } from "./acoes"

export function FormLogin({ linkInvalido }: { linkInvalido: boolean }) {
  const [modo, setModo] = useState<"entrar" | "cadastrar">("entrar")
  const [estado, acao, pendente] = useActionState<EstadoLogin, FormData>(
    modo === "entrar" ? entrar : cadastrar,
    linkInvalido ? { erro: "O link de confirmação é inválido ou expirou. Tente entrar ou crie a conta de novo." } : {},
  )

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <CalendarDays className="size-5" />
        </div>
        <CardTitle className="text-xl">Agenda MEI</CardTitle>
        <CardDescription>
          {modo === "entrar"
            ? "Entre para ver sua agenda e sua previsão de faturamento."
            : "Crie sua conta grátis. Seus dados ficam visíveis só para você."}
        </CardDescription>
      </CardHeader>
      <form action={acao}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              name="senha"
              type="password"
              minLength={6}
              autoComplete={modo === "entrar" ? "current-password" : "new-password"}
              required
            />
          </div>
          {estado.erro && <p className="text-sm text-destructive">{estado.erro}</p>}
          {estado.aviso && <p className="text-sm text-primary">{estado.aviso}</p>}
        </CardContent>
        <CardFooter className="mt-4 flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={pendente}>
            {pendente ? "Aguarde..." : modo === "entrar" ? "Entrar" : "Criar conta"}
          </Button>
          <Button
            type="button"
            variant="link"
            onClick={() => setModo(modo === "entrar" ? "cadastrar" : "entrar")}
          >
            {modo === "entrar" ? "Ainda não tenho conta" : "Já tenho conta"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
