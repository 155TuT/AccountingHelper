import { useState } from 'react'
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ReceiptText,
  ShoppingBag,
  TrainFront,
  Utensils,
  Wallet,
  CircleEllipsis,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PAGE_SIZE } from '@/domain/ledger/constants'
import { formatMoney } from '@/domain/ledger/money'
import { sortEntries } from '@/domain/ledger/selectors'
import type { LedgerEntry } from '@/domain/ledger/types'
import { cn } from '@/lib/utils'

const categoryIcons = {
  饮食: Utensils,
  交通: TrainFront,
  购物: ShoppingBag,
  工资: Wallet,
  生活费: Wallet,
  其他收入: ArrowDownLeft,
  其他支出: CircleEllipsis,
}

interface EntryTableProps {
  entries: LedgerEntry[]
  showAll?: boolean
  hasFilters: boolean
  onViewAll(): void
}

export function EntryTable({ entries, showAll = false, hasFilters, onViewAll }: EntryTableProps) {
  const [page, setPage] = useState(1)
  const pages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE))
  const currentPage = showAll ? Math.min(page, pages) : 1
  const displayed = sortEntries(entries).slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  return (
    <Card className="gap-4 overflow-hidden">
      <CardHeader className="items-center">
        <CardTitle className="text-lg">{showAll ? '账目明细' : '最近记录'}</CardTitle>
        <CardAction>
          {showAll ? (
            <Badge variant="secondary" className="text-sm">
              {entries.length} 笔
            </Badge>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAll}
              className="gap-1 text-muted-foreground"
            >
              查看全部
              <ArrowRight className="size-4" />
            </Button>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        {displayed.length ? (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="pl-6">类别</TableHead>
                <TableHead>日期</TableHead>
                <TableHead>备注</TableHead>
                <TableHead>类型</TableHead>
                <TableHead className="pr-6 text-right">金额</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayed.map((entry) => {
                const Icon =
                  categoryIcons[entry.category as keyof typeof categoryIcons] ?? CircleEllipsis
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="py-3 pl-6">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="secondary"
                          className="size-9 shrink-0 justify-center rounded-xl border-0 p-0"
                          aria-hidden="true"
                        >
                          <Icon className="size-4!" strokeWidth={1.7} />
                        </Badge>
                        <span className="font-medium">{entry.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {entry.date}
                    </TableCell>
                    <TableCell
                      className="max-w-44 truncate text-muted-foreground"
                      title={entry.note}
                    >
                      {entry.note || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'gap-1 border-0 font-normal',
                          entry.type === 'income'
                            ? 'bg-income/10 text-income'
                            : 'bg-expense/10 text-expense',
                        )}
                      >
                        {entry.type === 'income' ? <ArrowDownLeft /> : <ArrowUpRight />}
                        {entry.type === 'income' ? '收入' : '支出'}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={cn(
                        'pr-6 text-right font-medium tabular-nums',
                        entry.type === 'income' && 'text-income',
                      )}
                    >
                      {entry.type === 'income' ? '+' : '−'}¥{formatMoney(entry.amountCents)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <Empty className="min-h-60">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ReceiptText />
              </EmptyMedia>
              <EmptyTitle>{hasFilters ? '没有符合条件的账目' : '从第一笔记录开始'}</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
      {showAll && pages > 1 && (
        <CardFooter className="justify-between border-t pt-4">
          <Badge variant="outline" className="border-0 text-sm font-normal">
            第 {currentPage} / {pages} 页
          </Badge>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="上一页"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="下一页"
              disabled={currentPage >= pages}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
