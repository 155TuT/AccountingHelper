import { BarChart3, ChartPie } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { formatCurrency } from '@/domain/ledger/money'
import { categoryTotals, dailyTotals } from '@/domain/ledger/selectors'
import type { LedgerEntry } from '@/domain/ledger/types'

const trendConfig = {
  income: { label: '收入', color: 'var(--chart-1)' },
  expense: { label: '支出', color: 'var(--chart-2)' },
} satisfies ChartConfig
const categoryColors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)']

export function TrendChart({ entries }: { entries: LedgerEntry[] }) {
  const data = dailyTotals(entries)
  return (
    <Card className="gap-4">
      <CardHeader className="items-center">
        <CardTitle className="text-lg">收支走势</CardTitle>
        <CardAction className="flex gap-3">
          <Badge variant="outline" className="gap-2 border-0 text-sm font-normal">
            <span className="size-2 rounded-full bg-chart-1" />
            收入
          </Badge>
          <Badge variant="outline" className="gap-2 border-0 text-sm font-normal">
            <span className="size-2 rounded-full bg-chart-2" />
            支出
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        {data.length ? (
          <ChartContainer
            config={trendConfig}
            className="h-[225px] w-full"
            aria-label="按记账日期汇总的收入与支出柱状图"
          >
            <BarChart
              data={data}
              accessibilityLayer
              barGap={5}
              margin={{ top: 15, right: 0, left: -12, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="4 4" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                tickFormatter={(value: string) => value.slice(5).replace('-', '/')}
                minTickGap={26}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={58}
                tickFormatter={(value: number) =>
                  value >= 100000 ? `${value / 100000}k` : String(value / 100)
                }
              />
              <ChartTooltip
                cursor={{ fill: 'var(--muted)' }}
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <>
                        <span className="text-muted-foreground">
                          {name === 'income' ? '收入' : '支出'}
                        </span>
                        <span className="ml-auto font-medium tabular-nums">
                          {formatCurrency(Number(value))}
                        </span>
                      </>
                    )}
                  />
                }
              />
              <Bar
                dataKey="income"
                fill="var(--color-income)"
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
              />
              <Bar
                dataKey="expense"
                fill="var(--color-expense)"
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <Empty className="h-[225px]">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BarChart3 />
              </EmptyMedia>
              <EmptyTitle>记录之后，趋势就会出现</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  )
}

export function CategoryChart({ entries }: { entries: LedgerEntry[] }) {
  const data = categoryTotals(entries).map((item, index) => ({
    ...item,
    fill: categoryColors[index % categoryColors.length]!,
  }))
  const config = Object.fromEntries(
    data.map((item) => [item.category, { label: item.category, color: item.fill }]),
  ) satisfies ChartConfig
  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle className="text-lg">分类支出</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length ? (
          <>
            <ChartContainer
              config={config}
              className="mx-auto h-[165px] w-full"
              aria-label="支出类别占比"
            >
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      nameKey="category"
                      hideLabel
                      formatter={(value, name) => (
                        <>
                          <span className="text-muted-foreground">{name}</span>
                          <span className="ml-auto font-medium tabular-nums">
                            {formatCurrency(Number(value))}
                          </span>
                        </>
                      )}
                    />
                  }
                />
                <Pie
                  data={data}
                  dataKey="amount"
                  nameKey="category"
                  innerRadius={49}
                  outerRadius={72}
                  paddingAngle={4}
                  cornerRadius={4}
                  strokeWidth={0}
                >
                  {data.map((item) => (
                    <Cell key={item.category} fill={item.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="mt-3 grid gap-4">
              {data.map((item) => (
                <div key={item.category} className="flex items-center justify-between text-sm">
                  <Badge variant="outline" className="gap-2.5 border-0 p-0 text-sm font-normal">
                    <span className="size-2.5 rounded-full" style={{ background: item.fill }} />
                    {item.category}
                  </Badge>
                  <span className="font-medium tabular-nums">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <Empty className="min-h-52 px-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ChartPie />
              </EmptyMedia>
              <EmptyTitle>还没有支出记录</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  )
}
