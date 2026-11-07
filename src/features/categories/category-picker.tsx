import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface CategoryPickerProps {
  id: string
  value: string
  categories: readonly string[]
  onChange(value: string): void
  open: boolean
  onOpenChange(open: boolean): void
  disabled?: boolean
  optional?: boolean
  side?: 'bottom' | 'left'
  align?: 'start' | 'end'
}

export function CategoryPicker({
  id,
  value,
  categories,
  onChange,
  open,
  onOpenChange,
  disabled,
  optional,
  side = 'bottom',
  align = 'start',
}: CategoryPickerProps) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={`类别：${value || '全部类别'}`}
          className="h-10 w-full justify-between rounded-lg border-input bg-transparent font-normal shadow-xs data-[state=open]:border-ring data-[state=open]:bg-accent dark:bg-input/30"
        >
          <span className="truncate">{value || '全部类别'}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={side}
        align={align}
        sideOffset={side === 'left' ? 16 : 8}
        collisionPadding={16}
        loop
        aria-label="选择类别"
        className="max-h-72 min-w-48 rounded-xl p-1.5"
      >
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {(optional ? ['', ...categories] : categories).map((category) => (
            <DropdownMenuRadioItem
              key={category}
              value={category}
              className="min-h-9 cursor-pointer rounded-lg data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground"
            >
              {category || '全部类别'}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
