"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { brl } from "@/lib/formato"

export type PontoMes = { mes: string; realizado: number; agendado: number }

const config = {
  realizado: { label: "Realizado", color: "var(--chart-1)" },
  agendado: { label: "Agendado (a receber)", color: "var(--chart-2)" },
} satisfies ChartConfig

const compacto = (v: number) =>
  v >= 1000 ? `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil` : `R$ ${v.toFixed(0)}`

export function GraficoMeses({ dados }: { dados: PontoMes[] }) {
  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <BarChart data={dados} margin={{ left: 4, right: 4 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={72} tickFormatter={compacto} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(valor, nome) => (
                <div className="flex w-full justify-between gap-4">
                  <span className="text-muted-foreground">{config[nome as keyof typeof config]?.label}</span>
                  <span className="font-medium tabular-nums">{brl(Number(valor))}</span>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="realizado" stackId="a" fill="var(--color-realizado)" radius={[0, 0, 4, 4]} />
        <Bar dataKey="agendado" stackId="a" fill="var(--color-agendado)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
