import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  CURRENCIES,
  currencyInfo,
  rateLabel,
  type CurrencyCode,
} from '@/domain/currency/currencies'
import { cn } from '@/lib/utils'

interface CurrencyPickerProps {
  currency: CurrencyCode
  onChange(currency: CurrencyCode): void
  disabled?: boolean
  open?: boolean
  onOpenChange?(open: boolean): void
  side?: 'bottom' | 'left'
  align?: 'start' | 'end'
}

export function CurrencyPicker({
  currency,
  onChange,
  disabled,
  open: controlledOpen,
  onOpenChange,
  side = 'bottom',
  align = 'start',
}: CurrencyPickerProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  function setOpen(next: boolean) {
    setInternalOpen(next)
    onOpenChange?.(next)
  }
  const current = currencyInfo(currency)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          type="button"
          disabled={disabled}
          aria-label={`当前币种 ${current.name}（${current.code}），点击切换币种`}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 py-2 text-foreground transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
        >
          <span className="flex size-5 items-center justify-center text-xl leading-none">
            {current.symbol}
          </span>
          <span className="translate-y-px font-mono text-xs leading-4 tracking-tight text-muted-foreground">
            {current.code}
          </span>
          <ChevronsUpDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        sideOffset={side === 'left' ? 16 : 8}
        collisionPadding={16}
        className="w-68 rounded-xl p-1.5"
        aria-label="币种列表"
      >
        {CURRENCIES.map((item) => {
          const active = item.code === currency
          return (
            <Button
              variant="ghost"
              key={item.code}
              type="button"
              aria-pressed={active}
              onClick={() => {
                onChange(item.code)
                setOpen(false)
              }}
              className={cn(
                'h-auto justify-start flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors',
                active ? 'bg-accent text-accent-foreground' : 'hover:bg-muted',
              )}
            >
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-semibold"
              >
                {item.symbol}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{item.name}</span>
                <span className="block text-xs text-muted-foreground tabular-nums">
                  {item.code} · {rateLabel(item.code)}
                </span>
              </span>
              {active && <Check className="size-4 text-primary" aria-hidden="true" />}
            </Button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}
