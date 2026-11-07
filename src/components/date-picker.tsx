import { CalendarDays } from 'lucide-react'
import { zhCN } from 'react-day-picker/locale'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { localDate } from '@/domain/ledger/validation'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  id: string
  label: string
  value: string
  onChange(value: string): void
  disabled?: boolean
  optional?: boolean
  className?: string
  open: boolean
  onOpenChange(open: boolean): void
  side?: 'bottom' | 'left'
  align?: 'start' | 'end'
}

export function DatePicker({
  id,
  label,
  value,
  onChange,
  disabled,
  optional,
  className,
  open,
  onOpenChange,
  side = 'bottom',
  align = 'start',
}: DatePickerProps) {
  const selected = value ? new Date(`${value}T12:00:00`) : undefined

  return (
    <Popover open={open} onOpenChange={onOpenChange} modal={false}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={label}
          className={cn(
            'h-10 w-full justify-between rounded-lg border-input bg-transparent font-normal shadow-xs data-[state=open]:border-ring data-[state=open]:bg-accent dark:bg-input/30',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          {value || '不限日期'}
          <CalendarDays className="size-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto overflow-hidden rounded-xl p-0"
        side={side}
        align={align}
        sideOffset={side === 'left' ? 16 : 8}
        collisionPadding={16}
        aria-label={`${label}选择`}
      >
        <Calendar
          mode="single"
          required
          selected={selected}
          defaultMonth={selected}
          locale={zhCN}
          autoFocus
          onSelect={(date) => {
            if (date) {
              onChange(localDate(date))
              onOpenChange(false)
            }
          }}
        />
        {optional && (
          <div className="border-t p-2">
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                onChange('')
                onOpenChange(false)
              }}
            >
              清除日期
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
