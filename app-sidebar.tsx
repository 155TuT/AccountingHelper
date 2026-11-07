import { useMemo, useState } from 'react'
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  LayoutDashboard,
  ListOrdered,
  Moon,
  Plus,
  Save,
  Sun,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import type { LedgerItem } from '@/features/ledger/use-ledger'
import type { Theme } from '@/features/theme/use-theme'

export type View = 'overview' | 'entries'

interface AppSidebarProps {
  view: View
  onViewChange(view: View): void
  onOverview(): void
  onAllEntries(): void

  ledgers: LedgerItem[]
  activeLedgerId: string | null
  selectedDate: string | null

  onOpen(): void
  onCreate(): void
  onSaveLedger(id: string): void
  onRemoveLedger(id: string): void
  onLedgerSelect(id: string): void
  onDateSelect(date: string, ledgerId: string): void
  onOverview(): void

  fileActionsDisabled: boolean
  theme: Theme
  toggleTheme(): void
}

function formatDate(date: string) {
  const [year, month, day] = date.split('-')

  if (!year || !month || !day) return date

  return `${year}年${Number(month)}月${Number(day)}日`
}

export function AppSidebar({
  view,
  onViewChange,
  onOverview,
  onAllEntries,
  ledgers,
  activeLedgerId,
  selectedDate,
  onOpen,
  onCreate,
  onSaveLedger,
  onRemoveLedger,
  onLedgerSelect,
  onDateSelect,
  fileActionsDisabled,
  theme,
  toggleTheme,
}: AppSidebarProps) {
  const [expandedLedgers, setExpandedLedgers] = useState<Set<string>>(() => new Set())

  const dateGroups = useMemo(() => {
    return new Map(
      ledgers.map((ledger) => {
        const groups = new Map<string, typeof ledger.entries>()

        for (const entry of ledger.entries) {
          const current = groups.get(entry.date) ?? []
          groups.set(entry.date, [...current, entry])
        }

        return [ledger.id, [...groups.entries()].sort(([a], [b]) => b.localeCompare(a))] as const
      }),
    )
  }, [ledgers])

  function toggleExpanded(id: string) {
    setExpandedLedgers((previous) => {
      const next = new Set(previous)

      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }

      return next
    })
  }

  return (
    <Sidebar collapsible="none" className="sticky top-0 h-svh shrink-0 border-r">
      {/* 顶部品牌区域 */}
      <SidebarHeader className="px-4 pt-5 pb-4">
        <div className="flex h-10 items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BookOpen className="size-5" />
          </div>

          <span className="text-base font-semibold tracking-tight">AccountingHelper</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0 overflow-x-hidden">
        {/* 原版导航入口 */}
        <SidebarGroup className="px-4 pt-5">
          <SidebarMenu className="gap-2">
            {/* 收支总览 */}
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={view === 'overview' && !selectedDate}
                onClick={onOverview}
                className="h-11 gap-3 px-3 text-[15px]"
              >
                <LayoutDashboard />
                收支总览
              </SidebarMenuButton>
            </SidebarMenuItem>
            {/* 全部账目 */}
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={view === 'entries' && !selectedDate}
                onClick={onAllEntries}
                className="h-11 gap-3 px-3 text-[15px]"
              >
                <ListOrdered />
                全部账目
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        {/* 导航与资源管理器分隔线 */}
        <Separator className="mx-6 my-3 w-auto" />
        {/* 文件树标题 */}
        <SidebarGroup className="px-4 pt-2">
          <div className="mb-2 flex h-8 items-center justify-between px-2">
            <span className="text-[16px] font-semibold tracking-wider text-muted-foreground">
              账目管理
            </span>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                title="打开账本"
                aria-label="打开账本"
                disabled={fileActionsDisabled}
                onClick={onOpen}
              >
                <FolderOpen className="size-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                title="新建账本"
                aria-label="新建账本"
                disabled={fileActionsDisabled}
                onClick={onCreate}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          <SidebarMenu className="gap-1">
            {/* 账本根节点 */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => {
                  setExpandedLedgers(new Set())
                }}
                isActive={false}
                className="h-8 gap-2 px-2 text-sm font-medium"
              >
                <BookOpen className="size-4" />
                <span>我的账本</span>
                <span className="ml-auto text-xs text-muted-foreground">{ledgers.length}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* 多账本列表 */}
            {ledgers.map((ledger) => {
              const expanded = expandedLedgers.has(ledger.id)
              const active = activeLedgerId === ledger.id
              const groups = dateGroups.get(ledger.id) ?? []

              return (
                <SidebarMenuItem key={ledger.id}>
                  <div className="group/ledger relative">
                    <SidebarMenuButton
                      isActive={active}
                      onClick={() => {
                        toggleExpanded(ledger.id)
                        onLedgerSelect(ledger.id)
                        onViewChange('overview')
                      }}
                      className="h-9 gap-2 pr-16 text-sm"
                      title={ledger.name}
                    >
                      {expanded ? (
                        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                      )}

                      <BookOpen className="size-4 shrink-0" />

                      <span className="min-w-0 flex-1 truncate">
                        {ledger.name.replace(/\.jsonl$/i, '')}
                      </span>
                    </SidebarMenuButton>

                    {/* Hover 操作 */}
                    <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover/ledger:opacity-100 group-focus-within/ledger:opacity-100">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        title="保存账本"
                        aria-label={`保存${ledger.name}`}
                        disabled={fileActionsDisabled || !ledger.session}
                        onClick={(event) => {
                          event.stopPropagation()
                          onSaveLedger(ledger.id)
                        }}
                      >
                        <Save className="size-3.5" />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        title="从工作区移除"
                        aria-label={`移除${ledger.name}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          onRemoveLedger(ledger.id)
                        }}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* 日期分组 */}
                  {expanded && (
                    <div className="ml-5 mt-1 flex flex-col gap-1 border-l pl-3">
                      {groups.length === 0 ? (
                        <div className="px-2 py-2 text-xs text-muted-foreground">暂无账目</div>
                      ) : (
                        groups.map(([date, dayEntries]) => {
                          const selected = active && selectedDate === date

                          return (
                            <button
                              key={date}
                              type="button"
                              onClick={() => {
                                onLedgerSelect(ledger.id)
                                onViewChange('entries')
                                onDateSelect(date, ledger.id)
                              }}
                              className={[
                                'flex h-8 min-w-0 items-center gap-2 rounded-md px-2 text-left text-xs transition-colors',
                                selected
                                  ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                              ].join(' ')}
                              title={`${formatDate(date)}，${dayEntries.length} 笔账目`}
                            >
                              <CalendarDays className="size-3.5 shrink-0" />

                              <span className="min-w-0 flex-1 truncate">{formatDate(date)}</span>

                              <span className="text-[10px] opacity-70">{dayEntries.length}</span>
                            </button>
                          )
                        })
                      )}
                    </div>
                  )}
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* 底部主题按钮 */}
      <SidebarFooter className="px-4 pb-5">
        <div className="border-t pt-3">
          <Button
            variant="ghost"
            onClick={toggleTheme}
            className="relative h-14 w-full justify-center px-4 text-lg font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
          >
            {theme === 'dark' ? (
              <Sun className="absolute left-1/2 -translate-x-[75px] h-6 w-6" />
            ) : (
              <Moon className="absolute left-1/2 -translate-x-[75px] h-6 w-6" />
            )}

            <span className="text-center">{theme === 'dark' ? '切换浅色' : '切换深色'}</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
