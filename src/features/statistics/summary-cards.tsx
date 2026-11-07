import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMoney } from '@/domain/ledger/money'
import type { LedgerTotals } from '@/domain/ledger/types'
import { cn } from '@/lib/utils'

export function SummaryCards({ totals }: { totals: LedgerTotals }) {
  const metrics = [
    {
      title: '总收入',
      value: totals.income,
      Icon: ArrowDownLeft,
      tone: 'bg-income/10 text-income',
    },
    {
      title: '总支出',
      value: totals.expense,
      Icon: ArrowUpRight,
      tone: 'bg-expense/10 text-expense',
    },
    { title: '收支结余', value: totals.balance, Icon: Wallet, tone: 'bg-primary/10 text-primary' },
  ]
  return (
    <div className="grid grid-cols-3 gap-5">
      {metrics.map(({ title, value, Icon, tone }) => (
        <Card key={title} className="gap-5">
          <CardHeader className="items-center">
            <CardTitle className="text-base font-medium text-muted-foreground">{title}</CardTitle>
            <CardAction>
              <Badge className={cn('size-9 justify-center rounded-xl border-0 p-0', tone)}>
                <Icon className="size-5!" strokeWidth={1.7} />
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex items-baseline gap-2">
            <span className="text-xl text-muted-foreground">¥</span>
            <span className="text-[32px] leading-none font-semibold tracking-tight tabular-nums">
              {formatMoney(value)}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
