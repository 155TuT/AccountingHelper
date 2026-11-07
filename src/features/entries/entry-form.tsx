import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { ArrowDownLeft, ArrowUpRight, Check, LoaderCircle, X } from 'lucide-react'
import { DatePicker } from '@/components/date-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { CategoryActions, CategoryCatalog, EntryDraft, EntryType } from '@/domain/ledger/types'
import { CategoryManagerDialog } from '@/features/categories/category-manager-dialog'
import { CategoryPicker } from '@/features/categories/category-picker'
import type { CurrencyCode } from '@/domain/currency/currencies'
import { createEntry, localDate } from '@/domain/ledger/validation'
import { CurrencyPicker } from '@/features/currency/currency-picker'
import { useExclusivePopup } from '@/hooks/use-exclusive-popup'

export interface EntryFormProps {
  isBusy: boolean
  disabled?: boolean
  autoFocus?: boolean
  categories: CategoryCatalog
  categoryActions: CategoryActions
  currency: CurrencyCode
  onCurrencyChange(currency: CurrencyCode): void
  submitError?: string | null
  onCancel(): void
  onSubmit(draft: EntryDraft, currency: CurrencyCode): Promise<boolean>
}

export function EntryForm({
  isBusy,
  disabled,
  autoFocus,
  categories,
  categoryActions,
  currency,
  onCurrencyChange,
  onSubmit,
  onCancel,
  submitError,
}: EntryFormProps) {
  const titleId = useId()
  const { popupProps, closePopups } = useExclusivePopup<'date' | 'category' | 'currency'>()
  const [draft, setDraft] = useState<EntryDraft>({
    type: 'expense',
    date: localDate(),
    amount: '',
    category: categories.expense[0]!,
    note: '',
  })
  const [error, setError] = useState('')
  const amountInput = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (autoFocus) amountInput.current?.focus({ preventScroll: true })
  }, [autoFocus])

  useEffect(() => {
    if (categories[draft.type].includes(draft.category)) return
    setDraft((current) => ({ ...current, category: categories[current.type][0]! }))
  }, [categories, draft.category, draft.type])

  function update<K extends keyof EntryDraft>(key: K, value: EntryDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
    setError('')
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (isBusy || disabled) return
    try {
      createEntry(draft, currency)
      setError('')
      if (await onSubmit(draft, currency)) {
        setDraft((current) => ({ ...current, amount: '', note: '' }))
        amountInput.current?.focus({ preventScroll: true })
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '请检查填写的内容。')
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} noValidate aria-labelledby={titleId}>
      <Card id="new-entry" className="gap-(--panel-gap) rounded-2xl py-(--panel-padding) shadow-xl">
        <CardHeader className="grid-cols-[36px_1fr_36px] grid-rows-1 items-center gap-3 px-(--panel-padding)">
          <Button
            type="submit"
            size="icon"
            disabled={isBusy || disabled}
            aria-label={isBusy ? '正在保存' : '保存账目'}
            title="保存账目"
            className="rounded-full bg-primary text-white hover:bg-primary/90"
          >
            {isBusy ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : (
              <Check className="size-5" strokeWidth={2.5} />
            )}
          </Button>
          <CardTitle id={titleId} role="heading" aria-level={2} className="text-center text-lg">
            新建账目
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isBusy}
            onClick={onCancel}
            aria-label="取消新建账目"
            title="取消"
            className="rounded-full border-0 bg-transparent text-destructive shadow-none hover:bg-transparent hover:text-destructive/70 dark:hover:bg-transparent"
          >
            <X className="size-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-(--panel-gap) px-(--panel-padding)">
          <Tabs
            value={draft.type}
            onValueChange={(type) => {
              const next = type as EntryType
              setDraft((current) => ({ ...current, type: next, category: categories[next][0]! }))
              setError('')
              closePopups()
            }}
          >
            <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl">
              <TabsTrigger value="expense" disabled={isBusy} className="gap-2 rounded-lg">
                <ArrowUpRight className="size-4" />
                支出
              </TabsTrigger>
              <TabsTrigger value="income" disabled={isBusy} className="gap-2 rounded-lg">
                <ArrowDownLeft className="size-4" />
                收入
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel htmlFor="entry-amount">金额</FieldLabel>
              <InputGroup className="h-14 rounded-xl">
                <InputGroupAddon className="pl-2">
                  <CurrencyPicker
                    currency={currency}
                    onChange={onCurrencyChange}
                    disabled={isBusy}
                    {...popupProps('currency')}
                    side="left"
                    align="end"
                  />
                </InputGroupAddon>
                <InputGroupInput
                  ref={amountInput}
                  id="entry-amount"
                  name="amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={draft.amount}
                  onChange={(event) => update('amount', event.target.value)}
                  disabled={isBusy}
                  className="font-mono text-2xl md:text-2xl"
                  aria-required="true"
                />
              </InputGroup>
            </Field>
            <Field>
              <div className="flex items-center justify-between gap-3">
                <FieldLabel htmlFor="entry-category">类别</FieldLabel>
                <CategoryManagerDialog
                  disabled={isBusy}
                  categories={categories}
                  actions={categoryActions}
                  onOpenChange={(open) => {
                    if (open) closePopups()
                  }}
                />
              </div>
              <CategoryPicker
                id="entry-category"
                value={draft.category}
                categories={categories[draft.type]}
                onChange={(value) => update('category', value)}
                disabled={isBusy}
                side="left"
                align="end"
                {...popupProps('category')}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="entry-date">日期</FieldLabel>
              <DatePicker
                className="rounded-lg"
                id="entry-date"
                label="日期"
                value={draft.date}
                onChange={(value) => update('date', value)}
                disabled={isBusy}
                side="left"
                align="end"
                {...popupProps('date')}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="entry-note">备注（选填）</FieldLabel>
              <Input
                id="entry-note"
                value={draft.note}
                onChange={(event) => update('note', event.target.value)}
                placeholder="这笔钱用在了哪里？"
                disabled={isBusy}
                className="h-10 rounded-lg"
              />
            </Field>
          </FieldGroup>
          {(error || submitError) && <FieldError>{error || submitError}</FieldError>}
        </CardContent>
      </Card>
    </form>
  )
}
