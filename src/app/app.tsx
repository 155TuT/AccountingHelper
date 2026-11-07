import { lazy, Suspense, useMemo, useState, type CSSProperties } from 'react'
import { AlertCircle, Check, FilePlus2, FileText, LoaderCircle, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardTitle } from '@/components/ui/card'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from '@/components/ui/sonner'
import { currencyInfo, convertCents, type CurrencyCode } from '@/domain/currency/currencies'
import { projectEntries } from '@/domain/currency/projection'
import { EMPTY_FILTERS } from '@/domain/ledger/constants'
import { parseMoney } from '@/domain/ledger/money'
import { filterEntries, summarize } from '@/domain/ledger/selectors'
import { useCurrency } from '@/features/currency/use-currency'
import { EntryForm } from '@/features/entries/entry-form'
import { EntryTable } from '@/features/entries/entry-table'
import { useLedger } from '@/features/ledger/use-ledger'
import { ActiveFilters, FilterPopover } from '@/features/statistics/filter-popover'
import { SummaryCards } from '@/features/statistics/summary-cards'
import { useTheme } from '@/features/theme/use-theme'
import { AppSidebar, type View } from './app-sidebar'

const TrendChart = lazy(() =>
  import('@/features/statistics/charts').then((module) => ({ default: module.TrendChart })),
)
const CategoryChart = lazy(() =>
  import('@/features/statistics/charts').then((module) => ({ default: module.CategoryChart })),
)

export function App() {
  const ledger = useLedger()
  const { theme, toggleTheme } = useTheme()
  const { currency, setCurrency } = useCurrency()
  const [view, setView] = useState<View>('overview')
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS })
  const displayEntries = useMemo(
    () => projectEntries(ledger.entries, currency),
    [ledger.entries, currency],
  )
  const entries = useMemo(() => filterEntries(displayEntries, filters), [displayEntries, filters])
  const totals = useMemo(() => summarize(entries), [entries])
  const hasFilters = Object.values(filters).some(Boolean)
  const fileActionsDisabled = ledger.isBusy || !ledger.fileSystemSupported

  function switchCurrency(next: CurrencyCode) {
    if (next === currency) return
    const convertAmount = (value: string) => {
      if (!value.trim()) return value
      try {
        const cents = convertCents(parseMoney(value, true), currency, next)
        return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`
      } catch {
        return value
      }
    }
    setCurrency(next)
    setFilters((current) => ({
      ...current,
      minAmount: convertAmount(current.minAmount),
      maxAmount: convertAmount(current.maxAmount),
    }))
    toast.info(`已切换为${currencyInfo(next).name}，账目按参考汇率换算展示`)
  }

  async function switchLedger(action: () => Promise<boolean>) {
    if (await action()) {
      setFilters({ ...EMPTY_FILTERS })
      setView('overview')
    }
  }

  return (
    <SidebarProvider style={{ '--sidebar-width': '232px' } as CSSProperties}>
      <AppSidebar
        view={view}
        onViewChange={setView}
        onOpen={() => void switchLedger(ledger.open)}
        onCreate={() => void switchLedger(ledger.create)}
        fileActionsDisabled={fileActionsDisabled}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <SidebarInset className="min-w-0 bg-background">
        <header className="flex h-22 shrink-0 items-center justify-between border-b bg-card px-8">
          <div className="flex min-w-0 items-center gap-3">
            <FileText className="size-5 shrink-0 text-muted-foreground" />
            <CardTitle className="max-w-96 truncate text-base font-medium" title={ledger.fileName}>
              {ledger.fileName}
            </CardTitle>
            <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 font-normal">
              {ledger.isBusy ? (
                <>
                  <LoaderCircle className="size-3 animate-spin" />
                  正在处理
                </>
              ) : !ledger.hasFile ? (
                '准备就绪'
              ) : (
                <>
                  <Check className="size-3" />
                  已保存
                </>
              )}
            </Badge>
          </div>
          <Button
            variant="outline"
            onClick={() => void (ledger.hasFile ? ledger.saveAs() : switchLedger(ledger.create))}
            disabled={fileActionsDisabled}
            className="gap-2"
          >
            {ledger.hasFile ? <Save className="size-4" /> : <FilePlus2 className="size-4" />}
            {ledger.hasFile ? '另存为' : '新建账本'}
          </Button>
        </header>
        <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6 p-8">
          <div className="flex items-center justify-between">
            <CardTitle
              role="heading"
              aria-level={1}
              className="text-[28px] font-semibold tracking-tight"
            >
              {view === 'overview' ? '收支总览' : '全部账目'}
            </CardTitle>
            <FilterPopover filters={filters} currency={currency} onApply={setFilters} />
          </div>
          {!ledger.fileSystemSupported && (
            <Alert>
              <AlertCircle />
              <AlertTitle>请在桌面版 Chrome 或 Edge 中打开账本</AlertTitle>
              <AlertDescription>文件读写需要通过 localhost 或 HTTPS 访问。</AlertDescription>
            </Alert>
          )}
          {ledger.error && (
            <Alert variant="destructive" className="pr-12">
              <AlertCircle />
              <AlertTitle>账本操作未完成</AlertTitle>
              <AlertDescription>{ledger.error}</AlertDescription>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 size-8"
                aria-label="关闭错误提示"
                onClick={ledger.clearError}
              >
                <X className="size-4" />
              </Button>
            </Alert>
          )}
          <ActiveFilters filters={filters} currency={currency} />
          <SummaryCards totals={totals} currency={currency} />
          <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-6">
            {view === 'overview' && (
              <Suspense fallback={<Skeleton className="h-[500px] rounded-xl" />}>
                <TrendChart entries={entries} currency={currency} hasFilters={hasFilters} />
              </Suspense>
            )}
            <div className="col-start-2 row-start-1 min-w-0 self-start">
              <EntryForm
                key={ledger.key}
                isBusy={ledger.isBusy}
                disabled={!ledger.fileSystemSupported}
                currency={currency}
                onCurrencyChange={switchCurrency}
                onSubmit={ledger.add}
              />
            </div>
            {view === 'overview' && (
              <section aria-label="分类分析" className="col-span-2 grid grid-cols-2 gap-6">
                <Suspense fallback={<Skeleton className="col-span-2 h-[310px] rounded-xl" />}>
                  <CategoryChart
                    entries={entries}
                    type="expense"
                    total={totals.expense}
                    currency={currency}
                    hasFilters={hasFilters}
                  />
                  <CategoryChart
                    entries={entries}
                    type="income"
                    total={totals.income}
                    currency={currency}
                    hasFilters={hasFilters}
                  />
                </Suspense>
              </section>
            )}
            <div className={view === 'overview' ? 'col-span-2 min-w-0' : 'min-w-0 self-start'}>
              <EntryTable
                key={`${ledger.key}-${view}-${JSON.stringify(filters)}`}
                entries={entries}
                showAll={view === 'entries'}
                hasFilters={hasFilters}
                onViewAll={() => setView('entries')}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
      <Toaster theme={theme} position="bottom-right" />
    </SidebarProvider>
  )
}
