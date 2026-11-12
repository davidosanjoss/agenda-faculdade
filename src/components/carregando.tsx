export function Carregando() {
  return (
    <div className="grid gap-3" aria-busy="true" aria-label="Carregando">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
    </div>
  )
}
