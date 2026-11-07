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
}

export function CurrencyPicker({ currency, onChange, disabled }: CurrencyPickerProps) {
  const [open, setOpen] = useState(false)
  const current = currencyInfo(currency)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={`当前币种 ${current.name}（${current.code}），点击切换币种`}
          className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-foreground transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
        >
          <span className="text-xl leading-none">{current.symbol}</span>
          <span className="font-mono text-[11px] leading-none tracking-tight text-muted-foreground">
            {current.code}
          </span>
          <ChevronsUpDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-68 gap-0.5 p-1.5"
        aria-label="币种列表"
      >
        <p className="px-2.5 py-1.5 text-xs text-muted-foreground">切换后全局按参考汇率换算展示</p>
        {CURRENCIES.map((item) => {
          const active = item.code === currency
          return (
            <button
              key={item.code}
              type="button"
              aria-pressed={active}
              onClick={() => {
                onChange(item.code)
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors',
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
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}
