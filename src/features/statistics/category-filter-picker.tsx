import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { filterCategoryCatalog } from '@/domain/ledger/categories'
import type { CategoryCatalog, CategoryFilter, EntryType } from '@/domain/ledger/types'

const groups = [
  { type: 'income', label: '收入' },
  { type: 'expense', label: '支出' },
] as const
const itemClassName =
  'min-h-9 cursor-pointer rounded-lg data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground data-[state=indeterminate]:bg-accent data-[state=indeterminate]:text-accent-foreground'

export function CategoryFilterPicker({
  id,
  value,
  categories,
  onChange,
  open,
  onOpenChange,
}: {
  id: string
  value: readonly CategoryFilter[]
  categories: CategoryCatalog
  onChange(value: readonly CategoryFilter[]): void
  open: boolean
  onOpenChange(open: boolean): void
}) {
  const options = filterCategoryCatalog(categories, value)
  const label = value.length ? `已选 ${value.length} 个类别` : '全部类别'
  const isSelected = (type: EntryType, category: string) =>
    value.some((item) => item.type === type && item.category === category)

  function toggleCategory(type: EntryType, category: string) {
    onChange(
      isSelected(type, category)
        ? value.filter((item) => item.type !== type || item.category !== category)
        : [...value, { type, category }],
    )
  }

  function toggleGroup(type: EntryType) {
    const others = value.filter((item) => item.type !== type)
    onChange(
      options[type].every((category) => isSelected(type, category))
        ? others
        : [...others, ...options[type].map((category) => ({ type, category }))],
    )
  }

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-label={`筛选类别：${label}`}
          className="h-10 w-full justify-between rounded-lg border-input bg-transparent font-normal shadow-xs data-[state=open]:border-ring data-[state=open]:bg-accent dark:bg-input/30"
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="left"
        align="end"
        sideOffset={16}
        collisionPadding={16}
        loop
        aria-label="筛选类别"
        className="max-h-[min(440px,var(--radix-dropdown-menu-content-available-height))] w-[360px] rounded-xl p-(--panel-padding)"
      >
        <DropdownMenuCheckboxItem
          checked={value.length === 0}
          onSelect={(event) => event.preventDefault()}
          onCheckedChange={() => onChange([])}
          className={itemClassName}
        >
          全部类别
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator className="my-(--panel-gap)" />
        <div className="grid grid-cols-2 gap-(--panel-gap)">
          {groups.map(({ type, label: groupLabel }) => {
            const selectedCount = options[type].filter((category) =>
              isSelected(type, category),
            ).length
            return (
              <DropdownMenuGroup
                key={type}
                aria-label={`${groupLabel}类别`}
                className="min-w-0 space-y-1"
              >
                <DropdownMenuCheckboxItem
                  checked={
                    selectedCount === options[type].length
                      ? true
                      : selectedCount > 0
                        ? 'indeterminate'
                        : false
                  }
                  onSelect={(event) => event.preventDefault()}
                  onCheckedChange={() => toggleGroup(type)}
                  className={`${itemClassName} bg-muted/50 font-medium`}
                >
                  {groupLabel}
                </DropdownMenuCheckboxItem>
                <div className="ml-3 grid gap-1 border-l pl-2">
                  {options[type].map((category) => (
                    <DropdownMenuCheckboxItem
                      key={category}
                      checked={isSelected(type, category)}
                      aria-label={`${groupLabel}：${category}`}
                      onSelect={(event) => event.preventDefault()}
                      onCheckedChange={() => toggleCategory(type, category)}
                      className={itemClassName}
                      title={category}
                    >
                      <span className="truncate">{category}</span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
              </DropdownMenuGroup>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
