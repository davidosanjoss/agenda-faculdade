import { Suspense } from "react"
import { CalendarDays, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { sair } from "../login/acoes"
import { Navegacao } from "./navegacao"

async function EmailUsuario() {
  const sb = await createClient()
  const { data } = await sb.auth.getClaims()
  return <>{(data?.claims?.email as string | undefined) ?? ""}</>
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CalendarDays className="size-4" />
          </div>
          <span className="font-semibold">Agenda MEI</span>
          <span className="ml-auto hidden truncate text-sm text-muted-foreground sm:block">
            <Suspense>
              <EmailUsuario />
            </Suspense>
          </span>
          <form action={sair} className="ml-auto sm:ml-0">
            <Button type="submit" variant="ghost" size="sm">
              <LogOut /> Sair
            </Button>
          </form>
        </div>
        <Navegacao />
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5">
        {children}
      </main>
    </>
  )
}
