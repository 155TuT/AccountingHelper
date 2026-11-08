import { lazy, Suspense, useMemo, useState, type CSSProperties } from 'react'
import {
  AlertCircle,
  Check,
  Copy,
  FileText,
  FolderOpen,
  LayoutDashboard,
  ListOrdered,
  LoaderCircle,
  Save,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
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
import { useCurrency } from '@/features/currency/use-currency'
import { EntryComposer } from '@/features/entries/entry-composer'
import { EntryTable } from '@/features/entries/entry-table'
import { useLedger } from '@/features/ledger/use-ledger'
import { SettingsDialog, type SettingsValues } from '@/features/settings/settings-dialog'
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
  const { theme, setTheme, themeColor, setThemeColor, toggleTheme } = useTheme()
  const { currency, setCurrency } = useCurrency()
  const { categories, actions } = useCategories()
  const [view, setView] = useState<View>('overview')
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS })
  const [addOpen, setAddOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [entryFocusKey, setEntryFocusKey] = useState(0)
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
      ledger.selectEntry(ledgerId, entryId)
      setEntryFocusKey((current) => current + 1)
      setFilters({ ...EMPTY_FILTERS })
      setView('entries')
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
  function switchCurrency(next: CurrencyCode): boolean {
    if (next === currency) return true
    try {
      const nextFilters = convertFilters(filters, currency, next)
      // Validate the active filter after conversion before changing its unit.
      filterEntries([], nextFilters)
      setCurrency(next)
      setFilters(nextFilters)
      return true
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : '无法切换币种。')
      return false
    }
  }
  function saveSettings(values: SettingsValues): boolean {
    if (!switchCurrency(values.currency)) return false
    setTheme(values.theme)
    setThemeColor(values.themeColor)
    ledger.setDefaultDirectory(values.defaultDirectory)
    toast.success('设置已保存')
    return true
  }
  async function submitEntry(draft: EntryDraft, entryCurrency: CurrencyCode) {
    const ok = await ledger.add(draft, entryCurrency, selected.id)
    if (ok) setAddOpen(false)
    return ok
  }
  function changeEntryOpen(open: boolean, ledgerId?: string) {
    if (ledger.isBusy || (open && !ledger.fileSystemSupported)) return
    if (open && ledgerId && ledgerId !== selected.id) navigation.selectLedger(ledgerId)
    setAddOpen(open)
  }
  const saveState = ledger.isBusy ? 'busy' : selected.session ? 'saved' : 'unsaved'
  const fileActionsDisabled = ledger.isBusy || !ledger.fileSystemSupported

  return (
    <SidebarProvider style={{ '--sidebar-width': '248px' } as CSSProperties}>
      <AppSidebar
        ledger={navigation}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenSettings={() => setSettingsOpen(true)}
        onNewEntry={(id) => changeEntryOpen(true, id)}
        onSelectDate={(id, date) => {
          if (ledger.isBusy) return
          ledger.selectLedger(id)
          setFilters({ ...EMPTY_FILTERS, startDate: date, endDate: date })
          setView('entries')
        }}
      />
      <SidebarInset className="min-w-0 bg-background">
        <header className="flex h-(--toolbar-height) shrink-0 items-center justify-between gap-(--panel-gap) border-b bg-card p-(--panel-padding)">
          <div className="flex min-w-0 items-center gap-3">
            <h1 className="truncate text-base font-medium" title={selected.name}>
              {selected.name}
            </h1>
            <Badge
              variant="secondary"
              className="shrink-0 gap-1.5 rounded-lg px-2.5 py-1 font-normal"
            >
              {saveState === 'busy' ? (
                <LoaderCircle className="size-3 animate-spin" />
              ) : saveState === 'saved' ? (
                <Check className="size-3" />
              ) : (
                <FileText className="size-3" />
              )}
              {saveState === 'busy' ? '正在处理' : saveState === 'saved' ? '已保存' : '未保存'}
            </Badge>
          </div>
          <div
            role="group"
            aria-label="文件操作"
            className="flex shrink-0 items-center justify-end gap-2"
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={fileActionsDisabled}
              onClick={() => void navigation.open()}
            >
              <FolderOpen />
              打开
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={fileActionsDisabled}
              onClick={() => void ledger.save()}
            >
              <Save />
              保存
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={fileActionsDisabled}
              onClick={() => void ledger.saveAs()}
            >
              <Copy />
              另存为
            </Button>
          </div>
        </header>
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="@container mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-6 pb-24">
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
              key={`${selected.id}-${entryFocusKey}-${ledger.selectedEntryId}-${view}-${JSON.stringify(filters)}`}
              entries={display.entries}
              selectedEntryId={ledger.selectedEntryId}
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
        </div>
      </SidebarInset>
      <EntryComposer
        key={selected.id}
        open={addOpen}
        onOpenChange={changeEntryOpen}
        isBusy={ledger.isBusy}
        disabled={!ledger.fileSystemSupported}
        categories={categories}
        categoryActions={actions}
        currency={currency}
        onCurrencyChange={switchCurrency}
        onSubmit={submitEntry}
        submitError={ledger.error}
      />
      {settingsOpen && (
        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          currency={currency}
          theme={theme}
          themeColor={themeColor}
          defaultDirectory={ledger.defaultDirectory}
          directoryPickerSupported={ledger.directoryPickerSupported}
          onChooseDirectory={ledger.chooseDefaultDirectory}
          onSave={saveSettings}
        />
      )}
      <Toaster theme={theme} position="bottom-right" offset={{ bottom: 96, right: 24 }} />
    </SidebarProvider>
  )
}
