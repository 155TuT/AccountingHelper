import { useState } from 'react'
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
}

export function DatePicker({ id, label, value, onChange, disabled, optional }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = value ? new Date(`${value}T12:00:00`) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={label}
          className={cn(
            'h-10 w-full justify-between font-normal',
            !value && 'text-muted-foreground',
          )}
        >
          {value || '不限日期'}
          <CalendarDays className="size-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          locale={zhCN}
          autoFocus
          onSelect={(date) => {
            if (date) {
              onChange(localDate(date))
              setOpen(false)
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
                setOpen(false)
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
