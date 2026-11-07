import { useRef, useState, type FormEvent } from 'react'
import { ArrowDownLeft, ArrowUpRight, LoaderCircle, Plus } from 'lucide-react'
import { DatePicker } from '@/components/date-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CATEGORIES } from '@/domain/ledger/constants'
import type { CurrencyCode } from '@/domain/currency/currencies'
import type { EntryDraft, EntryType } from '@/domain/ledger/types'
import { createEntry, localDate } from '@/domain/ledger/validation'
import { CurrencyPicker } from '@/features/currency/currency-picker'

interface EntryFormProps {
  isBusy: boolean
  disabled?: boolean
  currency: CurrencyCode
  onCurrencyChange(currency: CurrencyCode): void
  onSubmit(draft: EntryDraft, currency: CurrencyCode): Promise<boolean>
}

export function EntryForm({
  isBusy,
  disabled,
  currency,
  onCurrencyChange,
  onSubmit,
}: EntryFormProps) {
  const [draft, setDraft] = useState<EntryDraft>({
    type: 'expense',
    date: localDate(),
    amount: '',
    category: '饮食',
    note: '',
  })
  const [error, setError] = useState('')
  const amountInput = useRef<HTMLInputElement>(null)

  function update<K extends keyof EntryDraft>(key: K, value: EntryDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
    setError('')
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    try {
      createEntry(draft, currency)
      setError('')
      if (await onSubmit(draft, currency)) {
        setDraft((current) => ({ ...current, amount: '', note: '' }))
        amountInput.current?.focus()
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '请检查填写的内容。')
    }
  }

  return (
    <Card id="new-entry" className="gap-5">
      <CardHeader>
        <CardTitle className="text-lg">记一笔</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event) => void submit(event)}
          noValidate
          className="space-y-5"
          aria-label="记一笔"
        >
          <Tabs
            value={draft.type}
            onValueChange={(type) => {
              const next = type as EntryType
              setDraft((current) => ({ ...current, type: next, category: CATEGORIES[next][0]! }))
              setError('')
            }}
          >
            <TabsList className="grid h-11 w-full grid-cols-2">
              <TabsTrigger value="expense" disabled={isBusy} className="gap-2">
                <ArrowUpRight className="size-4" />
                支出
              </TabsTrigger>
              <TabsTrigger value="income" disabled={isBusy} className="gap-2">
                <ArrowDownLeft className="size-4" />
                收入
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel htmlFor="entry-amount">金额</FieldLabel>
              <InputGroup className="h-14">
                <InputGroupAddon className="pl-2">
                  <CurrencyPicker
                    currency={currency}
                    onChange={onCurrencyChange}
                    disabled={isBusy}
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
              <FieldLabel htmlFor="entry-category">类别</FieldLabel>
              <Select
                value={draft.category}
                onValueChange={(value) => update('category', value)}
                disabled={isBusy}
              >
                <SelectTrigger id="entry-category" className="h-10 w-full" aria-required="true">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES[draft.type].map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="entry-date">日期</FieldLabel>
              <DatePicker
                id="entry-date"
                label="日期"
                value={draft.date}
                onChange={(value) => update('date', value)}
                disabled={isBusy}
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
                className="h-10"
              />
            </Field>
          </FieldGroup>
          {error && <FieldError>{error}</FieldError>}
          <Button type="submit" disabled={isBusy || disabled} className="h-11 w-full gap-2">
            {isBusy ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {isBusy ? '正在保存' : '添加记录'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
