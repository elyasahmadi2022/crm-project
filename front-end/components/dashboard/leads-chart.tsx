"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

type LeadsChartData = {
  month: string
  new: number
  contacted: number
  won: number
}

type LeadsChartProps = {
  data: LeadsChartData[]
}

const chartConfig = {
  leads: {
    label: "Leads",
  },
  new: {
    label: "New Leads",
    color: "var(--chart-1)",
  },
  contacted: {
    label: "Contacted",
    color: "var(--chart-2)",
  },
  won: {
    label: "Won",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

export function LeadsChart({ data }: LeadsChartProps) {
  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Leads Overview</CardTitle>
          <CardDescription>New leads, contacted, and conversions over the last 6 months</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillNew" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--color-new)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-new)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillContacted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--color-contacted)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-contacted)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillWon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--color-won)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-won)" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />

            <Area
              dataKey="won"
              type="natural"
              fill="url(#fillWon)"
              stroke="var(--color-won)"
              stackId="a"
            />
            <Area
              dataKey="contacted"
              type="natural"
              fill="url(#fillContacted)"
              stroke="var(--color-contacted)"
              stackId="a"
            />
            <Area
              dataKey="new"
              type="natural"
              fill="url(#fillNew)"
              stroke="var(--color-new)"
              stackId="a"
            />

            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
