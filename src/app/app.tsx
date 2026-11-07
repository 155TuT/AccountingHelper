import { lazy, Suspense, useMemo, useState, type CSSProperties } from 'react'
import {
  AlertCircle,
  Check,
  FileText,
  LayoutDashboard,
  ListOrdered,
  LoaderCircle,
  Plus,
  X,
} from 'lucide-react'
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
import { EMPTY_FILTERS } from '@/domain/ledger/constants'
import { filterEntries, summarize } from '@/domain/ledger/selectors'
import type { EntryDraft } from '@/domain/ledger/types'
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
  const [view, setView] = useState<View>('overview')
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS })
  const [addOpen, setAddOpen] = useState(false)

  const selected = ledger.selectedLedger
  const entries = useMemo(
    () => filterEntries(selected?.entries ?? [], filters),
    [selected?.entries, filters],
  )
  const totals = useMemo(() => summarize(entries), [entries])
  const hasFilters = Object.values(filters).some(Boolean)

  async function submitEntry(draft: EntryDraft) {
    const ok = await ledger.add(draft)
    if (ok) setAddOpen(false)
    return ok
  }

  const saveState = ledger.isBusy
    ? 'busy'
    : !selected || !selected.session || selected.dirty
      ? 'unsaved'
      : 'saved'

  return (
    <SidebarProvider style={{ '--sidebar-width': '232px' } as CSSProperties}>
      <AppSidebar ledger={ledger} theme={theme} toggleTheme={toggleTheme} />
      <SidebarInset className="min-w-0 bg-background">
        <header className="flex h-22 shrink-0 items-center justify-between border-b bg-card px-8">
          <div className="flex min-w-0 items-center gap-3">
            <FileText className="size-5 shrink-0 text-muted-foreground" />
            <CardTitle className="max-w-96 truncate text-base font-medium" title={selected?.name}>
              {selected?.name ?? '未命名账本'}
            </CardTitle>
            <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 font-normal">
              {saveState === 'busy' ? (
                <>
                  <LoaderCircle className="size-3 animate-spin" />
                  正在处理
                </>
              ) : saveState === 'saved' ? (
                <>
                  <Check className="size-3" />
                  已保存
                </>
              ) : (
                <>
                  <FileText className="size-3" />
                  未保存
                </>
              )}
            </Badge>
          </div>
        </header>
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 p-8">
              <div className="flex items-center justify-between">
                <Tabs value={view} onValueChange={(value) => setView(value as View)}>
                  <TabsList>
                    <TabsTrigger value="overview" className="gap-2">
                      <LayoutDashboard className="size-4" />
                      收支总览
                    </TabsTrigger>
                    <TabsTrigger value="entries" className="gap-2">
                      <ListOrdered className="size-4" />
                      全部账目
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <FilterPopover filters={filters} onApply={setFilters} />
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
              <ActiveFilters filters={filters} />
              <SummaryCards totals={totals} />
              {view === 'overview' && (
                <Suspense fallback={<Skeleton className="h-[315px] rounded-xl" />}>
                  <TrendChart entries={entries} />
                </Suspense>
              )}
              <EntryTable
                key={`${selected?.id ?? 'empty'}-${view}-${JSON.stringify(filters)}`}
                entries={entries}
                showAll={view === 'entries'}
                hasFilters={hasFilters}
                onViewAll={() => setView('entries')}
              />
              {view === 'overview' && (
                <Suspense fallback={<Skeleton className="h-[365px] rounded-xl" />}>
                  <CategoryChart entries={entries} />
                </Suspense>
              )}
            </div>
          </main>
          <aside className="w-1/3 min-w-80 shrink-0 border-l bg-card p-6">
            <EntryDetail entry={ledger.selectedEntry} />
          </aside>
        </div>
      </SidebarInset>
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle>记一笔</SheetTitle>
            <SheetDescription className="sr-only">填写一笔新的收支记录</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <EntryForm
              isBusy={ledger.isBusy}
              disabled={!ledger.fileSystemSupported}
              autoFocus
              onSubmit={submitEntry}
            />
          </div>
        </SheetContent>
      </Sheet>
      <Button
        onClick={() => setAddOpen(true)}
        disabled={!ledger.fileSystemSupported}
        aria-label="记一笔"
        className="fixed right-6 bottom-6 z-40 size-14 rounded-full shadow-lg"
      >
        <Plus className="size-6" />
      </Button>
      <Toaster theme={theme} position="bottom-right" offset={{ bottom: 96, right: 24 }} />
    </SidebarProvider>
  )
}
