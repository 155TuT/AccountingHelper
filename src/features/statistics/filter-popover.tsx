import { useState, type FormEvent } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { DatePicker } from '@/components/date-picker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EMPTY_FILTERS } from '@/domain/ledger/constants'
import { validateFilters } from '@/domain/ledger/selectors'
import type { LedgerFilters } from '@/domain/ledger/types'

export function FilterPopover({
  filters,
  categories,
  onApply,
}: {
  filters: LedgerFilters
  categories: readonly string[]
  onApply(filters: LedgerFilters): void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(filters)
  const [error, setError] = useState('')
  const count = Object.values(filters).filter(Boolean).length
  const options =
    draft.category && !categories.includes(draft.category)
      ? [draft.category, ...categories]
      : categories

  function update(key: keyof LedgerFilters, value: string) {
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
        <PopoverContent align="end" className="w-[480px] p-6" aria-label="筛选账目">
          <form onSubmit={apply} noValidate className="space-y-5">
            <FieldGroup className="grid grid-cols-2 gap-5">
              <Field>
                <FieldLabel htmlFor="filter-start">开始日期</FieldLabel>
                <DatePicker
                  id="filter-start"
                  label="开始日期"
                  value={draft.startDate}
                  onChange={(value) => update('startDate', value)}
                  optional
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
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="filter-min">最低金额（元）</FieldLabel>
                <Input
                  id="filter-min"
                  inputMode="decimal"
                  placeholder="不限"
                  value={draft.minAmount}
                  onChange={(event) => update('minAmount', event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="filter-max">最高金额（元）</FieldLabel>
                <Input
                  id="filter-max"
                  inputMode="decimal"
                  placeholder="不限"
                  value={draft.maxAmount}
                  onChange={(event) => update('maxAmount', event.target.value)}
                />
              </Field>
              <Field className="col-span-2">
                <FieldLabel htmlFor="filter-category">类别</FieldLabel>
                <Select
                  value={draft.category || 'all'}
                  onValueChange={(value) => update('category', value === 'all' ? '' : value)}
                >
                  <SelectTrigger id="filter-category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类别</SelectItem>
                    {options.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

export function ActiveFilters({ filters }: { filters: LedgerFilters }) {
  const labels = [
    (filters.startDate || filters.endDate) &&
      `${filters.startDate || '最早'} 至 ${filters.endDate || '至今'}`,
    filters.category,
    (filters.minAmount || filters.maxAmount) &&
      `¥${filters.minAmount || '0'} — ${filters.maxAmount ? `¥${filters.maxAmount}` : '不限'}`,
  ].filter(Boolean)
  if (!labels.length) return null
  return (
    <div className="flex flex-wrap gap-2" aria-label="当前筛选条件">
      {labels.map((label) => (
        <Badge variant="secondary" className="px-3 py-1.5 text-sm font-normal" key={String(label)}>
          {label}
        </Badge>
      ))}
    </div>
  )
}
