import { currencyInfo, type CurrencyCode } from '@/domain/currency/currencies'
import { useState, type FormEvent } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { DatePicker } from '@/components/date-picker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useExclusivePopup } from '@/hooks/use-exclusive-popup'
import { EMPTY_FILTERS } from '@/domain/ledger/constants'
import { countActiveFilters, validateFilters } from '@/domain/ledger/selectors'
import type { CategoryCatalog, LedgerFilters } from '@/domain/ledger/types'
import { CategoryFilterPicker } from './category-filter-picker'

export function FilterPopover({
  filters,
  categories,
  currency,
  onApply,
}: {
  filters: LedgerFilters
  currency: CurrencyCode
  categories: CategoryCatalog
  onApply(filters: LedgerFilters): void
}) {
  const [open, setOpen] = useState(false)
  const { popupProps, closePopups } = useExclusivePopup<'start' | 'end' | 'category'>()
  const [draft, setDraft] = useState(filters)
  const [error, setError] = useState('')
  const unit = currencyInfo(currency).unit
  const count = countActiveFilters(filters)

  function update<K extends keyof LedgerFilters>(key: K, value: LedgerFilters[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
    setError('')
  }

  function apply(event: FormEvent) {
    event.preventDefault()
    try {
      validateFilters(draft)
      onApply(draft)
      setOpen(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '请检查筛选条件。')
    }
  }

  return (
    <div className="flex items-center gap-2">
      {count > 0 && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="清除筛选"
          onClick={() => onApply({ ...EMPTY_FILTERS })}
        >
          <X className="size-4" />
        </Button>
      )}
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          closePopups()
          if (next) {
            setDraft(filters)
            setError('')
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <SlidersHorizontal className="size-4" />
            {count ? '已筛选' : '筛选账目'}
            {count > 0 && (
              <Badge className="ml-1 size-5 justify-center rounded-md p-0">{count}</Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-[480px] rounded-2xl p-(--panel-padding)"
          aria-label="筛选账目"
        >
          <form onSubmit={apply} noValidate className="space-y-(--panel-gap)">
            <FieldGroup className="grid grid-cols-2 gap-(--panel-gap)">
              <Field>
                <FieldLabel htmlFor="filter-start">开始日期</FieldLabel>
                <DatePicker
                  id="filter-start"
                  label="开始日期"
                  value={draft.startDate}
                  onChange={(value) => update('startDate', value)}
                  optional
                  {...popupProps('start')}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="filter-end">结束日期</FieldLabel>
                <DatePicker
                  id="filter-end"
                  label="结束日期"
                  value={draft.endDate}
                  onChange={(value) => update('endDate', value)}
                  optional
                  {...popupProps('end')}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="filter-min">最低金额（{unit}）</FieldLabel>
                <Input
                  id="filter-min"
                  className="h-10 rounded-lg"
                  inputMode="decimal"
                  placeholder="不限"
                  value={draft.minAmount}
                  onChange={(event) => update('minAmount', event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="filter-max">最高金额（{unit}）</FieldLabel>
                <Input
                  id="filter-max"
                  className="h-10 rounded-lg"
                  inputMode="decimal"
                  placeholder="不限"
                  value={draft.maxAmount}
                  onChange={(event) => update('maxAmount', event.target.value)}
                />
              </Field>
              <Field className="col-span-2">
                <FieldLabel htmlFor="filter-category">类别</FieldLabel>
                <CategoryFilterPicker
                  id="filter-category"
                  value={draft.categories}
                  categories={categories}
                  onChange={(value) => update('categories', value)}
                  {...popupProps('category')}
                />
              </Field>
            </FieldGroup>
            {error && <FieldError>{error}</FieldError>}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDraft({ ...EMPTY_FILTERS })
                  setError('')
                }}
              >
                重置条件
              </Button>
              <Button type="submit">应用筛选</Button>
            </div>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export function ActiveFilters({
  filters,
  currency,
}: {
  filters: LedgerFilters
  currency: CurrencyCode
}) {
  const symbol = currencyInfo(currency).symbol
  const labels = [
    (filters.startDate || filters.endDate) &&
      `${filters.startDate || '最早'} 至 ${filters.endDate || '至今'}`,
    ...(['income', 'expense'] as const).map((type) => {
      const names = filters.categories
        .filter((item) => item.type === type)
        .map((item) => item.category)
      return names.length ? `${type === 'income' ? '收入' : '支出'}：${names.join('、')}` : ''
    }),
    (filters.minAmount || filters.maxAmount) &&
      `${symbol}${filters.minAmount || '0'} — ${filters.maxAmount ? `${symbol}${filters.maxAmount}` : '不限'}`,
  ].filter(Boolean)
  if (!labels.length) return null
  return (
    <div className="flex flex-wrap gap-2" aria-label="当前筛选条件">
      {labels.map((label) => (
        <Badge
          variant="secondary"
          className="max-w-full px-3 py-1.5 text-sm font-normal whitespace-normal"
          key={String(label)}
        >
          {label}
        </Badge>
      ))}
    </div>
  )
}
