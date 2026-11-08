import { Moon, Settings, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { LedgerTree } from '@/features/ledger/ledger-tree'
import type { LedgerApi } from '@/features/ledger/use-ledger'
import type { Theme } from '@/features/theme/use-theme'

interface AppSidebarProps {
  ledger: LedgerApi
  theme: Theme
  onSelectDate(id: string, date: string): void
  onNewEntry(id: string): void
  toggleTheme(): void
  onOpenSettings(): void
}

export function AppSidebar({
  ledger,
  theme,
  toggleTheme,
  onOpenSettings,
  onSelectDate,
  onNewEntry,
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="none" className="sticky top-0 h-svh shrink-0 border-r">
      <SidebarHeader className="h-(--toolbar-height) justify-center border-b border-sidebar-border px-5">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2.5 px-1">
              <img
                src={`${import.meta.env.BASE_URL}${theme === 'dark' ? 'favicon-dark.svg' : 'favicon.svg'}`}
                alt=""
                width={36}
                height={36}
                className="size-9 shrink-0"
              />
              <span className="text-[17px] font-semibold tracking-tight">AccountingHelper</span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-1">
        <SidebarGroup className="h-full p-1">
          <LedgerTree ledger={ledger} onSelectDate={onSelectDate} onNewEntry={onNewEntry} />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border px-3 py-2">
        <div className="flex items-center justify-between">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={theme === 'dark' ? '切换浅色' : '切换深色'}
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {theme === 'dark' ? '切换浅色' : '切换深色'}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="打开全局设置"
                disabled={ledger.isBusy}
                onClick={onOpenSettings}
              >
                <Settings className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">全局设置</TooltipContent>
          </Tooltip>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
