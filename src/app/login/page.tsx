import { Suspense } from "react"
import { FormLogin } from "./form-login"

async function ComErro({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { erro } = await searchParams
  return <FormLogin linkInvalido={erro === "link"} />
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Suspense fallback={<FormLogin linkInvalido={false} />}>
        <ComErro searchParams={searchParams} />
      </Suspense>
    </main>
  )
}
