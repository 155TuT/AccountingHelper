import {
  BookOpen,
  FilePlus2,
  FolderOpen,
  LayoutDashboard,
  ListOrdered,
  Moon,
  Sun,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
import type { Theme } from '@/features/theme/use-theme'

export type View = 'overview' | 'entries'

interface AppSidebarProps {
  view: View
  onViewChange(view: View): void
  onOpen(): void
  onCreate(): void
  fileActionsDisabled: boolean
  theme: Theme
  toggleTheme(): void
}

export function AppSidebar({
  view,
  onViewChange,
  onOpen,
  onCreate,
  fileActionsDisabled,
  theme,
  toggleTheme,
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="none" className="sticky top-0 h-svh shrink-0 border-r">
      <SidebarHeader className="h-22 justify-center px-5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => onViewChange('overview')}
              className="gap-2.5 px-0 hover:bg-transparent"
            >
              <Badge className="size-9 shrink-0 justify-center rounded-xl p-0">
                <BookOpen className="size-5!" strokeWidth={1.8} />
              </Badge>
              <span className="text-[17px] font-semibold tracking-tight">AccountingHelper</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="px-4 pt-5">
          <SidebarMenu className="gap-2">
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={view === 'overview'}
                onClick={() => onViewChange('overview')}
                className="h-11 gap-3 px-3 text-[15px]"
              >
                <LayoutDashboard />
                收支总览
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={view === 'entries'}
                onClick={() => onViewChange('entries')}
                className="h-11 gap-3 px-3 text-[15px]"
              >
                <ListOrdered />
                全部账目
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <Separator className="mx-6 my-3 w-auto" />
        <SidebarGroup className="px-4">
          <SidebarMenu className="gap-2">
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={onOpen}
                disabled={fileActionsDisabled}
                className="h-11 gap-3 px-3 text-[15px]"
              >
                <FolderOpen />
                打开账本
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={onCreate}
                disabled={fileActionsDisabled}
                className="h-11 gap-3 px-3 text-[15px]"
              >
                <FilePlus2 />
                新建账本
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-2 px-4 pb-6">
        <SidebarMenu className="gap-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleTheme}
              className="h-11 gap-3 px-3 text-[15px] text-muted-foreground"
            >
              {theme === 'dark' ? <Sun /> : <Moon />}
              {theme === 'dark' ? '切换浅色' : '切换深色'}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
