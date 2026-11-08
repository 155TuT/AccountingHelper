import { ChartBar, ChartColumn, ChartLine, ChartPie } from 'lucide-react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/domain/ledger/money'
import { categoryBreakdown, dailyTotals } from '@/domain/ledger/selectors'
import type { CurrencyCode } from '@/domain/currency/currencies'
import type { EntryType, LedgerEntry, LedgerMetric } from '@/domain/ledger/types'
import { cn } from '@/lib/utils'

const trendConfig = {
  income: { label: '收入', color: 'var(--income)' },
  expense: { label: '支出', color: 'var(--expense)' },
  balance: { label: '累计结余', color: 'var(--chart-4)' },
} satisfies ChartConfig
const series = ['income', 'expense', 'balance'] as const
const trendStyles = [
  { value: 'bar', label: '柱状图', Icon: ChartColumn },
  { value: 'line', label: '折线图', Icon: ChartLine },
] as const
const axisAmount = new Intl.NumberFormat('zh-CN', {
  notation: 'compact',
  maximumSignificantDigits: 4,
})

export function TrendChart({
  entries,
  currency,
  hasFilters,
  metric = null,
}: {
  entries: readonly LedgerEntry[]
  currency: CurrencyCode
  hasFilters: boolean
  metric?: LedgerMetric | null
}) {
  const data = dailyTotals(entries)
  const visibleSeries = metric ? [metric] : series
  const spansYears = data[0]?.date.slice(0, 4) !== data.at(-1)?.date.slice(0, 4)

  return (
    <Card className="min-w-0">
      <Tabs defaultValue="bar" className="gap-5">
        <CardHeader>
          <CardTitle role="heading" aria-level={2} className="text-lg">
            收支走势
          </CardTitle>
          <CardAction className="self-center">
            <TabsList aria-label="收支走势图表样式">
              {trendStyles.map(({ value, label, Icon }) => (
                <TabsTrigger key={value} value={value}>
                  <Icon aria-hidden="true" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </CardAction>
        </CardHeader>
        {trendStyles.map(({ value, label }) => (
          <TabsContent key={value} value={value}>
            <CardContent>
              {data.length ? (
                <ChartContainer config={trendConfig} className="h-[386px] w-full">
                  <ComposedChart
                    accessibilityLayer
                    aria-label={`每日${metric ? trendConfig[metric].label : '收支'}${label}`}
                    data={data}
                    barGap={4}
                    margin={{ top: 12, right: 12, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'var(--muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      padding={{ left: 12, right: 12 }}
                      minTickGap={18}
                      tickFormatter={(date: string) =>
                        (spansYears ? date : date.slice(5)).replaceAll('-', '/')
                      }
                    />
                    <YAxis
                      tick={{ fill: 'var(--muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      width="auto"
                      allowDecimals={false}
                      tickFormatter={(cents: number) => axisAmount.format(cents / 100)}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(amount, name) => (
                            <>
                              <span className="text-muted-foreground">{name}</span>
                              <span className="ml-auto font-medium tabular-nums">
                                {formatCurrency(Number(amount), currency)}
                              </span>
                            </>
                          )}
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.5} />
                    {visibleSeries.map((key) =>
                      value === 'bar' ? (
                        <Bar
                          key={key}
                          dataKey={key}
                          name={trendConfig[key].label}
                          fill={`var(--color-${key})`}
                          radius={[4, 4, 0, 0]}
                          maxBarSize={28}
                          isAnimationActive={false}
                        />
                      ) : (
                        <Line
                          key={key}
                          dataKey={key}
                          type="monotone"
                          name={trendConfig[key].label}
                          stroke={`var(--color-${key})`}
                          strokeWidth={2.5}
                          strokeDasharray={key === 'expense' ? '5 3' : undefined}
                          dot={data.length === 1 ? { r: 3, fill: `var(--color-${key})` } : false}
                          activeDot={{ r: 5 }}
                          isAnimationActive={false}
                        />
                      ),
                    )}
                  </ComposedChart>
                </ChartContainer>
              ) : (
                <Empty className="h-[386px]">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ChartLine />
                    </EmptyMedia>
                    <EmptyTitle>
                      {hasFilters ? '当前筛选下没有账目' : '记录之后，趋势就会出现'}
                    </EmptyTitle>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  )
}

const categoryColors = {
  expense: ['var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'],
  income: ['var(--chart-1)', 'var(--chart-4)', 'var(--chart-5)'],
}
const categoryStyles = [
  { value: 'donut', label: '环形图', Icon: ChartPie },
  { value: 'bar', label: '条形图', Icon: ChartBar },
] as const
const percent = new Intl.NumberFormat('zh-CN', { style: 'percent', maximumFractionDigits: 1 })

export function CategoryChart({
  entries,
  type,
  total,
  currency,
  hasFilters,
}: {
  entries: readonly LedgerEntry[]
  type: EntryType
  total: number
  currency: CurrencyCode
  hasFilters: boolean
}) {
  const typeLabel = type === 'expense' ? '支出' : '收入'
  const title = `分类${typeLabel}`
  const colors = categoryColors[type]
  const data = categoryBreakdown(entries, type).map((item, index) => ({
    ...item,
    fill: colors[index % colors.length]!,
  }))
  const count = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card className="min-w-0">
      <Tabs defaultValue="donut" className="gap-4">
        <CardHeader className="items-center">
          <CardTitle role="heading" aria-level={2} className="text-lg">
            {title}
          </CardTitle>
          <CardAction>
            <TabsList aria-label={`${title}图表样式`}>
              {categoryStyles.map(({ value, label, Icon }) => (
                <TabsTrigger key={value} value={value}>
                  <Icon aria-hidden="true" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </CardAction>
        </CardHeader>
        {categoryStyles.map(({ value }) => (
          <TabsContent key={value} value={value}>
            <CardContent className="@container">
              {data.length ? (
                <div
                  className={cn(
                    'grid min-h-52 items-start gap-4',
                    value === 'donut' && '@min-[340px]:grid-cols-[132px_minmax(0,1fr)]',
                  )}
                >
                  {value === 'donut' && (
                    <div className="relative mx-auto size-[132px]">
                      <ChartContainer config={{}} className="size-full">
                        <PieChart accessibilityLayer aria-label={`${typeLabel}类别占比`}>
                          <ChartTooltip
                            content={
                              <ChartTooltipContent
                                hideLabel
                                formatter={(amount, name) => (
                                  <>
                                    <span className="text-muted-foreground">{name}</span>
                                    <span className="ml-auto font-medium tabular-nums">
                                      {formatCurrency(Number(amount), currency)}
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
                            innerRadius="72%"
                            outerRadius="100%"
                            stroke="none"
                            isAnimationActive={false}
                          />
                        </PieChart>
                      </ChartContainer>
                      <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
                        <span className="text-2xl font-semibold tabular-nums">{count}</span>
                        <span className="text-xs text-muted-foreground">{typeLabel}笔数</span>
                      </div>
                    </div>
                  )}
                  <ul className="grid divide-y">
                    {data.map((item) => {
                      const share = total > 0 ? item.amount / total : 0
                      return (
                        <li key={item.category} className="grid gap-1.5 py-2.5 text-sm">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                            <span className="flex items-center gap-2 font-medium">
                              <span
                                aria-hidden="true"
                                className="size-2 shrink-0 rounded-full"
                                style={{ backgroundColor: item.fill }}
                              />
                              {item.category}
                            </span>
                            <span className="font-medium tabular-nums">
                              {formatCurrency(item.amount, currency)}
                            </span>
                          </div>
                          <div className="flex justify-between gap-2 pl-4 text-xs text-muted-foreground tabular-nums">
                            <span>{item.count} 笔</span>
                            <span>{percent.format(share)}</span>
                          </div>
                          {value === 'bar' && (
                            <div
                              aria-hidden="true"
                              className="h-2 overflow-hidden rounded-full bg-muted"
                            >
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${share * 100}%`, backgroundColor: item.fill }}
                              />
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : (
                <Empty className="min-h-52 px-0">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ChartPie />
                    </EmptyMedia>
                    <EmptyTitle>
                      {hasFilters ? `当前筛选下无${typeLabel}记录` : `还没有${typeLabel}记录`}
                    </EmptyTitle>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  )
}
