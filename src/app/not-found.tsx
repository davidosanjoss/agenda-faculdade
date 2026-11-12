import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"

export default function NaoEncontrado() {
  return (
    <main className="mx-auto grid max-w-md flex-1 content-center justify-items-center gap-3 p-4 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <h1 className="text-lg font-semibold">Página não encontrada</h1>
      <p className="text-sm text-muted-foreground">O endereço pode estar errado ou a página foi removida.</p>
      <Link href="/agenda" className={buttonVariants()}>
        Ir para a agenda
      </Link>
    </main>
  )
}
