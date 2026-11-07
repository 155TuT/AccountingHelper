import { lazy, Suspense, useMemo, useState, type CSSProperties } from 'react'
import { AlertCircle, Check, FileText, LoaderCircle, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardTitle } from '@/components/ui/card'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from '@/components/ui/sonner'
import { EMPTY_FILTERS } from '@/domain/ledger/constants'
import { filterEntries, summarize } from '@/domain/ledger/selectors'
import { EntryForm } from '@/features/entries/entry-form'
import { EntryTable } from '@/features/entries/entry-table'
import { useLedger } from '@/features/ledger/use-ledger'
import { ActiveFilters, FilterPopover } from '@/features/statistics/filter-popover'
import { SummaryCards } from '@/features/statistics/summary-cards'
import { useTheme } from '@/features/theme/use-theme'
import { AppSidebar, type View } from './app-sidebar'
import { Save } from 'lucide-react'

const TrendChart = lazy(() =>
  import('@/features/statistics/charts').then((module) => ({
    default: module.TrendChart,
  })),
)

const CategoryChart = lazy(() =>
  import('@/features/statistics/charts').then((module) => ({
    default: module.CategoryChart,
  })),
)

export function App() {
  const ledger = useLedger()
  const { theme, toggleTheme } = useTheme()

  const [view, setView] = useState<View>('overview')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS })

  // 当前账本的筛选结果
  const entries = useMemo(() => filterEntries(ledger.entries, filters), [ledger.entries, filters])

  const totals = useMemo(() => summarize(entries), [entries])

  const hasFilters = Object.values(filters).some(Boolean)
  const fileActionsDisabled = ledger.isBusy || !ledger.fileSystemSupported

  // 新建或打开账本成功后重置页面筛选
  async function runLedgerAction(action: () => Promise<boolean>) {
    if (await action()) {
      setFilters({ ...EMPTY_FILTERS })
      setSelectedDate(null)
      setView('overview')
    }
  }

  // 返回收支总览
  function handleOverview() {
    setView('overview')
    setSelectedDate(null)
    setFilters({ ...EMPTY_FILTERS })
  }

  // 查看全部账目
  function handleAllEntries() {
    setView('entries')
    setSelectedDate(null)
    setFilters({ ...EMPTY_FILTERS })
  }

  // 选择账本
  function handleLedgerSelect(id: string) {
    ledger.switchLedger(id)
    setFilters({ ...EMPTY_FILTERS })
    setSelectedDate(null)
    setView('overview')
  }

  function handleRemoveLedger(id: string) {
    const isActive = ledger.activeLedgerId === id

    ledger.removeLedger(id)

    if (isActive) {
      setSelectedDate(null)
      setFilters({ ...EMPTY_FILTERS })
      setView('overview')
    }
  }

  // 选择日期
  function handleDateSelect(date: string, ledgerId: string) {
    ledger.switchLedger(ledgerId)
    setSelectedDate(date)

    setFilters({
      ...EMPTY_FILTERS,
      startDate: date,
      endDate: date,
    })

    setView('entries')
  }

  // 修改普通筛选条件时，取消日期树节点的选中状态
  function handleFilterApply(nextFilters: typeof EMPTY_FILTERS) {
    setFilters(nextFilters)
    setSelectedDate(null)
  }

  return (
    <SidebarProvider style={{ '--sidebar-width': '280px' } as CSSProperties}>
      <AppSidebar
        view={view}
        onViewChange={setView}
        onOverview={handleOverview}
        onAllEntries={handleAllEntries}
        ledgers={ledger.ledgers}
        activeLedgerId={ledger.activeLedgerId}
        selectedDate={selectedDate}
        onLedgerSelect={handleLedgerSelect}
        onDateSelect={handleDateSelect}
        onOpen={() => void runLedgerAction(ledger.openMany)}
        onCreate={() => void runLedgerAction(ledger.create)}
        onSaveLedger={(id) => void ledger.saveLedger(id)}
        onRemoveLedger={handleRemoveLedger}
        fileActionsDisabled={fileActionsDisabled}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <SidebarInset className="min-w-0 bg-background">
        {/* 顶部工具栏 */}
        <header className="sticky top-0 z-10 grid h-16 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b bg-card/95 px-6 backdrop-blur">
          {/* 左侧：未打开提示 / 文件状态 */}
          <div className="flex min-w-0 items-center gap-3">
            {ledger.activeLedger ? (
              <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 font-normal">
                {ledger.isBusy ? (
                  <>
                    <LoaderCircle className="size-3 animate-spin" />
                    正在处理
                  </>
                ) : (
                  <>
                    <Check className="size-3" />
                    已保存
                  </>
                )}
              </Badge>
            ) : (
              <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                <FileText className="size-5 shrink-0" />
                <span>还未打开任何账本</span>
              </div>
            )}
          </div>

          {/* 中间：当前账本文件名 */}
          <div className="flex min-w-0 items-center justify-center gap-2">
            {ledger.activeLedger && (
              <>
                <FileText className="size-5 shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-col items-center">
                  <CardTitle
                    className="max-w-96 truncate text-sm font-semibold"
                    title={ledger.fileName}
                  >
                    {ledger.fileName}
                  </CardTitle>

                  {selectedDate && (
                    <span className="text-xs text-muted-foreground">{selectedDate}</span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* 右侧：另存为 */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="default"
              className="gap-2"
              onClick={() => void ledger.saveAs()}
              disabled={!ledger.activeLedger || ledger.isBusy || !ledger.fileSystemSupported}
            >
              <Save className="size-4" />
              另存为
            </Button>
          </div>
        </header>

        {/* 主内容区 */}
        <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6 p-8">
          <div className="flex items-center justify-between gap-4">
            <CardTitle
              role="heading"
              aria-level={1}
              className="truncate text-[28px] font-semibold tracking-tight"
            >
              {view === 'overview'
                ? '收支总览'
                : selectedDate
                  ? `${selectedDate} 的账目`
                  : '全部账目'}
            </CardTitle>

            <FilterPopover filters={filters} onApply={handleFilterApply} />
          </div>

          {!ledger.fileSystemSupported && (
            <Alert>
              <AlertCircle />
              <AlertTitle>请在桌面版 Chrome 或 Edge 中打开账本</AlertTitle>
              <AlertDescription>文件读写需要通过 localhost 或 HTTPS 访问。</AlertDescription>
            </Alert>
          )}

          {!ledger.activeLedger && (
            <Alert>
              <FileText />
              <AlertTitle>请在左侧资源管理器中新建账本或打开已有的 JSONL 账本文件。</AlertTitle>
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

          <ActiveFilters filters={filters} />

          <SummaryCards totals={totals} />

          <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-6">
            <div className="grid min-w-0 gap-6">
              {view === 'overview' && (
                <Suspense fallback={<Skeleton className="h-[315px] rounded-xl" />}>
                  <TrendChart entries={entries} />
                </Suspense>
              )}

              <EntryTable
                key={`${ledger.key}-${view}-${JSON.stringify(filters)}`}
                entries={entries}
                showAll={view === 'entries'}
                hasFilters={hasFilters}
                onViewAll={() => {
                  setSelectedDate(null)
                  setFilters({ ...EMPTY_FILTERS })
                  setView('entries')
                }}
              />
            </div>

            <div className="grid min-w-0 gap-6">
              <EntryForm
                key={ledger.key}
                isBusy={ledger.isBusy}
                disabled={!ledger.fileSystemSupported || !ledger.activeLedger}
                onSubmit={ledger.add}
              />

              {view === 'overview' && (
                <Suspense fallback={<Skeleton className="h-[365px] rounded-xl" />}>
                  <CategoryChart entries={entries} />
                </Suspense>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>

      <Toaster theme={theme} position="bottom-right" />
    </SidebarProvider>
  )
}
