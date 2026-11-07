import { BookOpen, Moon, Sun } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
  toggleTheme(): void
}

export function AppSidebar({ ledger, theme, toggleTheme, onSelectDate }: AppSidebarProps) {
  return (
    <Sidebar collapsible="none" className="sticky top-0 h-svh shrink-0 border-r">
      <SidebarHeader className="h-22 justify-center px-5">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2.5 px-1">
              <Badge className="size-9 shrink-0 justify-center rounded-xl p-0">
                <BookOpen className="size-5!" strokeWidth={1.8} />
              </Badge>
              <span className="text-[17px] font-semibold tracking-tight">AccountingHelper</span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-1">
        <SidebarGroup className="h-full p-1">
          <LedgerTree ledger={ledger} onSelectDate={onSelectDate} />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t px-3 py-2">
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
          <TooltipContent side="right">{theme === 'dark' ? '切换浅色' : '切换深色'}</TooltipContent>
        </Tooltip>
      </SidebarFooter>
    </Sidebar>
  )
}
