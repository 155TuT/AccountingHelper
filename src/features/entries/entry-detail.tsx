import { ArrowDownLeft, ArrowUpRight, ReceiptText } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { formatMoney } from '@/domain/ledger/money'
import type { LedgerEntry } from '@/domain/ledger/types'
import { cn } from '@/lib/utils'

interface EntryDetailProps {
  entry: LedgerEntry | null
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-3 last:border-b-0">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <div className="min-w-0 text-right text-sm font-medium text-foreground">{children}</div>
    </div>
  )
}

export function EntryDetail({ entry }: EntryDetailProps) {
  if (!entry) {
    return (
      <Card className="h-full min-h-96 border-dashed">
        <CardContent className="flex h-full items-center justify-center">
          <Empty className="min-h-0 border-none p-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ReceiptText />
              </EmptyMedia>
              <EmptyTitle>选择一笔账目查看明细</EmptyTitle>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  const isIncome = entry.type === 'income'

  return (
    <Card className="gap-5">
      <CardHeader>
        <CardTitle className="text-lg">账目明细</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-1">
        <DetailRow label="类型">
          <Badge
            variant="outline"
            className={cn(
              'gap-1 border-0 font-normal',
              isIncome ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense',
            )}
          >
            {isIncome ? <ArrowDownLeft /> : <ArrowUpRight />}
            {isIncome ? '收入' : '支出'}
          </Badge>
        </DetailRow>
        <DetailRow label="类别">{entry.category}</DetailRow>
        <DetailRow label="日期">{entry.date}</DetailRow>
        <DetailRow label="金额">
          <span className={cn('font-mono tabular-nums', isIncome && 'text-income')}>
            {isIncome ? '+' : '−'}¥{formatMoney(entry.amountCents)}
          </span>
        </DetailRow>
        <DetailRow label="备注">
          <span className="whitespace-pre-wrap">{entry.note || '—'}</span>
        </DetailRow>
      </CardContent>
    </Card>
  )
}
