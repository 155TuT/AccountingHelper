import { lazy, Suspense, useMemo, useState, type CSSProperties } from 'react'
import {
  AlertCircle,
  Check,
  Copy,
  FileText,
  LayoutDashboard,
  ListOrdered,
  LoaderCircle,
  Plus,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardTitle } from '@/components/ui/card'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from '@/components/ui/sonner'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type CurrencyCode } from '@/domain/currency/currencies'
import { convertFilters, projectEntries } from '@/domain/currency/projection'
import { categoryNames } from '@/domain/ledger/categories'
import { EMPTY_FILTERS } from '@/domain/ledger/constants'
import { filterEntries, summarize } from '@/domain/ledger/selectors'
import type { EntryDraft } from '@/domain/ledger/types'
import { useCategories } from '@/features/categories/use-categories'
import { CurrencyPicker } from '@/features/currency/currency-picker'
import { useCurrency } from '@/features/currency/use-currency'
import { EntryDetail } from '@/features/entries/entry-detail'
import { EntryForm } from '@/features/entries/entry-form'
import { EntryTable } from '@/features/entries/entry-table'
import { useLedger } from '@/features/ledger/use-ledger'
import { ActiveFilters, FilterPopover } from '@/features/statistics/filter-popover'
import { SummaryCards } from '@/features/statistics/summary-cards'
import { useTheme } from '@/features/theme/use-theme'
import { AppSidebar } from './app-sidebar'

const TrendChart = lazy(() =>
  import('@/features/statistics/charts').then((module) => ({ default: module.TrendChart })),
)
const CategoryChart = lazy(() =>
  import('@/features/statistics/charts').then((module) => ({ default: module.CategoryChart })),
)
type View = 'overview' | 'entries'

export function App() {
  const ledger = useLedger()
  const { theme, toggleTheme } = useTheme()
  const { currency, setCurrency } = useCurrency()
  const { categories, actions } = useCategories()
  const [view, setView] = useState<View>('overview')
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS })
  const [addOpen, setAddOpen] = useState(false)
  const selected = ledger.selectedLedger
  // An overflow must leave original records available for inspection and saving.
  const display = useMemo(() => {
    try {
      const entries = filterEntries(projectEntries(selected.entries, currency), filters)
      return { entries, totals: summarize(entries), error: null }
    } catch (cause) {
      return {
        entries: selected.entries,
        totals: null,
        error: cause instanceof Error ? cause.message : '金额无法换算。',
      }
    }
  }, [selected.entries, filters, currency])
  const hasFilters = Object.values(filters).some(Boolean)
  const filterCategories = categoryNames(categories, selected.entries)

  function resetView() {
    setFilters({ ...EMPTY_FILTERS })
    setView('overview')
  }
  const navigation = {
    ...ledger,
    selectLedger(id: string) {
      if (ledger.isBusy) return
      ledger.selectLedger(id)
      resetView()
    },
    selectEntry(ledgerId: string, entryId: string) {
      if (ledger.isBusy) return
      if (ledgerId !== selected.id) resetView()
      ledger.selectEntry(ledgerId, entryId)
    },
    async open() {
      const ok = await ledger.open()
      if (ok) resetView()
      return ok
    },
    async create() {
      const ok = await ledger.create()
      if (ok) resetView()
      return ok
    },
    remove(id: string) {
      if (ledger.isBusy) return
      ledger.remove(id)
      if (id === selected.id) resetView()
    },
  }
  function switchCurrency(next: CurrencyCode) {
    if (next === currency) return
    try {
      const nextFilters = convertFilters(filters, currency, next)
      // Validate the active filter after conversion before changing its unit.
      filterEntries([], nextFilters)
      setCurrency(next)
      setFilters(nextFilters)
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : '无法切换币种。')
    }
  }
  async function submitEntry(draft: EntryDraft, entryCurrency: CurrencyCode) {
    const ok = await ledger.add(draft, entryCurrency, selected.id)
    if (ok) setAddOpen(false)
    return ok
  }
  const saveState = ledger.isBusy ? 'busy' : selected.session ? 'saved' : 'unsaved'

  return (
    <SidebarProvider style={{ '--sidebar-width': '248px' } as CSSProperties}>
      <AppSidebar
        ledger={navigation}
        theme={theme}
        toggleTheme={toggleTheme}
        onSelectDate={(id, date) => {
          if (ledger.isBusy) return
          ledger.selectLedger(id)
          setFilters({ ...EMPTY_FILTERS, startDate: date, endDate: date })
          setView('entries')
        }}
      />
      <SidebarInset className="min-w-0 bg-background">
        <header className="grid h-22 shrink-0 grid-cols-[1fr_minmax(0,2fr)_1fr] items-center gap-3 border-b bg-card px-6">
          <Badge variant="secondary" className="gap-1.5 justify-self-start px-2.5 py-1 font-normal">
            {saveState === 'busy' ? (
              <LoaderCircle className="size-3 animate-spin" />
            ) : saveState === 'saved' ? (
              <Check className="size-3" />
            ) : (
              <FileText className="size-3" />
            )}
            {saveState === 'busy' ? '正在处理' : saveState === 'saved' ? '已保存' : '未保存'}
          </Badge>
          <CardTitle className="truncate text-center text-base font-medium" title={selected.name}>
            {selected.name}
          </CardTitle>
          <div className="flex items-center justify-end gap-2">
            <CurrencyPicker
              currency={currency}
              onChange={switchCurrency}
              disabled={ledger.isBusy}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={ledger.isBusy || !ledger.fileSystemSupported}
              onClick={() => void ledger.saveAs()}
            >
              <Copy />
              另存为
            </Button>
          </div>
        </header>
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto">
            <div className="@container mx-auto flex w-full max-w-[1200px] flex-col gap-6 p-6 pb-24">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Tabs value={view} onValueChange={(value) => setView(value as View)}>
                  <TabsList>
                    <TabsTrigger value="overview">
                      <LayoutDashboard />
                      收支总览
                    </TabsTrigger>
                    <TabsTrigger value="entries">
                      <ListOrdered />
                      全部账目
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <FilterPopover
                  key={selected.id}
                  filters={filters}
                  categories={filterCategories}
                  currency={currency}
                  onApply={setFilters}
                />
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
                    <X />
                  </Button>
                </Alert>
              )}
              {display.error ? (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertTitle>无法按当前币种汇总</AlertTitle>
                  <AlertDescription>
                    {display.error} 下方显示原币种账目，仍可保存或切换币种。
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <ActiveFilters filters={filters} currency={currency} />
                  <SummaryCards totals={display.totals!} currency={currency} />
                  {view === 'overview' && (
                    <Suspense fallback={<Skeleton className="h-[386px] rounded-xl" />}>
                      <TrendChart
                        entries={display.entries}
                        currency={currency}
                        hasFilters={hasFilters}
                      />
                    </Suspense>
                  )}
                </>
              )}
              <EntryTable
                key={`${selected.id}-${view}-${JSON.stringify(filters)}`}
                entries={display.entries}
                showAll={view === 'entries'}
                hasFilters={!display.error && hasFilters}
                onViewAll={() => setView('entries')}
              />
              {view === 'overview' && display.totals && (
                <section aria-label="分类分析" className="grid gap-6 @min-[760px]:grid-cols-2">
                  <Suspense fallback={<Skeleton className="h-[310px] rounded-xl" />}>
                    <CategoryChart
                      entries={display.entries}
                      type="expense"
                      total={display.totals.expense}
                      currency={currency}
                      hasFilters={hasFilters}
                    />
                    <CategoryChart
                      entries={display.entries}
                      type="income"
                      total={display.totals.income}
                      currency={currency}
                      hasFilters={hasFilters}
                    />
                  </Suspense>
                </section>
              )}
            </div>
          </main>
          <aside className="w-1/3 min-w-72 shrink-0 border-l bg-card p-5">
            <div className="sticky top-6">
              <EntryDetail entry={ledger.selectedEntry} />
            </div>
          </aside>
        </div>
      </SidebarInset>
      <Sheet
        open={addOpen}
        onOpenChange={(open) => {
          if (!ledger.isBusy) setAddOpen(open)
        }}
      >
        <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle>记一笔</SheetTitle>
            <SheetDescription>记录到 {selected.name}</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {ledger.error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{ledger.error}</AlertDescription>
              </Alert>
            )}
            <EntryForm
              key={selected.id}
              isBusy={ledger.isBusy}
              disabled={!ledger.fileSystemSupported}
              autoFocus
              categories={categories}
              categoryActions={actions}
              currency={currency}
              onCurrencyChange={switchCurrency}
              onSubmit={submitEntry}
            />
          </div>
        </SheetContent>
      </Sheet>
      <Button
        onClick={() => setAddOpen(true)}
        disabled={ledger.isBusy || !ledger.fileSystemSupported}
        aria-label="记一笔"
        className="fixed right-6 bottom-6 z-40 size-14 rounded-full shadow-lg"
      >
        <Plus className="size-6" />
      </Button>
      <Toaster theme={theme} position="bottom-right" offset={{ bottom: 96, right: 24 }} />
    </SidebarProvider>
  )
}
