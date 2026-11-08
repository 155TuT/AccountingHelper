import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMoney } from '@/domain/ledger/money'
import { currencyInfo, type CurrencyCode } from '@/domain/currency/currencies'
import type { LedgerMetric, LedgerTotals } from '@/domain/ledger/types'
import { cn } from '@/lib/utils'

export function SummaryCards({
  totals,
  currency,
  activeMetric,
  onMetricChange,
}: {
  totals: LedgerTotals
  currency: CurrencyCode
  activeMetric: LedgerMetric | null
  onMetricChange(metric: LedgerMetric): void
}) {
  const symbol = currencyInfo(currency).symbol
  const metrics = [
    {
      metric: 'income',
      title: '总收入',
      value: totals.income,
      Icon: ArrowDownLeft,
      tone: 'bg-income/10 text-income',
    },
    {
      metric: 'expense',
      title: '总支出',
      value: totals.expense,
      Icon: ArrowUpRight,
      tone: 'bg-expense/10 text-expense',
    },
    {
      metric: 'balance',
      title: '收支结余',
      value: totals.balance,
      Icon: Wallet,
      tone: 'bg-chart-4/10 text-chart-4',
    },
  ] as const
  return (
    <div className="grid grid-cols-3 gap-5">
      {metrics.map(({ metric, title, value, Icon, tone }) => (
        <Card
          key={metric}
          className={cn(
            'relative gap-5 transition-colors',
            activeMetric === metric && 'border-primary bg-accent/40',
          )}
        >
          <Button
            type="button"
            variant="ghost"
            aria-label={`查看${title}走势`}
            aria-pressed={activeMetric === metric}
            title={activeMetric === metric ? '再次点击显示全部走势' : `查看${title}走势`}
            onClick={() => onMetricChange(metric)}
            className="absolute inset-0 z-10 size-full cursor-pointer rounded-xl hover:bg-accent/20 dark:hover:bg-accent/20"
          />
          <CardHeader className="items-center">
            <CardTitle className="text-base font-medium text-muted-foreground">{title}</CardTitle>
            <CardAction>
              <Badge className={cn('size-9 justify-center rounded-xl border-0 p-0', tone)}>
                <Icon className="size-5!" strokeWidth={1.7} />
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex items-baseline gap-2">
            <span className="text-xl text-muted-foreground">{symbol}</span>
            <span className="text-[32px] leading-none font-semibold tracking-tight tabular-nums">
              {formatMoney(value)}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
