"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ROTULO_STATUS, STATUS, type Status } from "@/lib/tipos"

const ITENS = STATUS.map((s) => ({ value: s, label: ROTULO_STATUS[s] }))

export function SelectStatus({
  valor,
  aoMudar,
  tamanho = "default",
  id,
}: {
  valor: Status
  aoMudar: (s: Status) => void
  tamanho?: "sm" | "default"
  id?: string
}) {
  return (
    <Select items={ITENS} value={valor} onValueChange={(v) => v && aoMudar(v as Status)}>
      <SelectTrigger id={id} size={tamanho} className={tamanho === "sm" ? "w-28" : "w-full"}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ITENS.map((i) => (
          <SelectItem key={i.value} value={i.value}>
            {i.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
