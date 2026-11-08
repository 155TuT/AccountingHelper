import { describe, expect, it } from 'vitest'
import { convertFilters, projectEntries } from '@/domain/currency/projection'
import {
  categoryNames,
  removeCategory,
  renameCategory,
  sanitizeCategoryCatalog,
  DEFAULT_CATEGORY_CATALOG,
} from '@/domain/ledger/categories'
import { EMPTY_FILTERS } from '@/domain/ledger/constants'
import { categoryBreakdown, filterEntries, summarize } from '@/domain/ledger/selectors'
import type { LedgerFilters } from '@/domain/ledger/types'
import { createEntry } from '@/domain/ledger/validation'
import { parseJsonl, serializeJsonl } from '@/infrastructure/storage/jsonl'
const entry = createEntry(
  { type: 'expense', date: '2026-11-07', amount: '10', category: '旧类别', note: '' },
  'USD',
)

describe('类别、币种与文件联调', () => {
  it('旧格式与自定义类别混合账本换算筛选，保存仍使用原币种和金额', () => {
    const legacy = { ...entry, id: 'legacy', currency: undefined, amountCents: 2550 }
    const raw = parseJsonl(`${JSON.stringify(legacy)}\n${JSON.stringify(entry)}\n`)
    const catalog = removeCategory(
      renameCategory(
        { expense: ['旧类别', '保留'], income: ['工资'] },
        'expense',
        '旧类别',
        '新类别',
      ),
      'expense',
      '新类别',
    )
    expect(categoryNames(catalog, raw)).toContain('旧类别')
    const display = projectEntries(raw, 'CNY')
    const filtered = filterEntries(display, {
      ...EMPTY_FILTERS,
      categories: [{ type: 'expense', category: '旧类别' }],
      minAmount: '25.50',
      maxAmount: '71',
    })
    expect(summarize(filtered).expense).toBe(9650)
    expect(categoryBreakdown(filtered, 'expense')).toEqual([
      { category: '旧类别', amount: 9650, count: 2 },
    ])
    expect(
      parseJsonl(serializeJsonl(raw)).map((item) => [item.currency, item.amountCents]),
    ).toEqual([
      ['CNY', 2550],
      ['USD', 1000],
    ])
  })
  it('按币种校验原始合计，换算溢出只影响展示，同币种合计溢出报告行号', () => {
    const large = { ...entry, amountCents: Number.MAX_SAFE_INTEGER }
    const other = { ...large, id: 'other', currency: 'CNY' }
    const raw = parseJsonl(`${JSON.stringify(large)}\n${JSON.stringify(other)}`)
    expect(raw).toHaveLength(2)
    expect(() => summarize(raw)).toThrow('同一币种')
    expect(() => projectEntries(raw, 'JPY')).toThrow('精确计算')
    expect(parseJsonl(serializeJsonl(raw))).toEqual(raw)
    expect(() =>
      parseJsonl(
        `${JSON.stringify(large)}\n${JSON.stringify({ ...entry, id: 'overflow', amountCents: 1 })}`,
      ),
    ).toThrow('第 2 行')
  })
  it('明确空币种无效，缺失币种兼容旧格式', () => {
    expect(() => parseJsonl(JSON.stringify({ ...entry, currency: null }))).toThrow('第 1 行')
    expect(parseJsonl(JSON.stringify({ ...entry, currency: undefined }))[0]!.currency).toBe('CNY')
  })
  it('换算到零的微额账目保留笔数，原始记录可继续保存', () => {
    const raw = [{ ...entry, currency: 'JPY' as const, amountCents: 1 }]
    const display = projectEntries(raw, 'USD')
    expect(summarize(display).expense).toBe(0)
    expect(categoryBreakdown(display, 'expense')[0]).toMatchObject({ count: 1, amount: 0 })
    expect(parseJsonl(serializeJsonl(raw))[0]!.amountCents).toBe(1)
  })
  it('切换金额筛选口径不插入千分位，溢出时不改写原条件', () => {
    const filters: LedgerFilters = {
      ...EMPTY_FILTERS,
      minAmount: '1000',
      maxAmount: '2000',
      categories: [
        { type: 'expense', category: '旧类别' },
        { type: 'income', category: '工资' },
      ],
    }
    const converted = convertFilters(filters, 'USD', 'CNY')
    expect(converted).toMatchObject({ minAmount: '7100.00', maxAmount: '14200.00' })
    expect(converted.categories).toEqual(filters.categories)
    expect(() => filterEntries([], converted)).not.toThrow()
    const huge = { ...filters, maxAmount: '90071992547409.91' }
    expect(() => convertFilters(huge, 'GBP', 'JPY')).toThrow()
    expect(huge.maxAmount).toBe('90071992547409.91')
  })
  it('历史类别大小写均可独立筛选，损坏目录不产生空列表', () => {
    expect(
      categoryNames({ expense: ['coffee'], income: ['收入'] }, [{ category: 'Coffee' }]),
    ).toContain('Coffee')
    const repaired = sanitizeCategoryCatalog({
      expense: DEFAULT_CATEGORY_CATALOG.income,
      income: [],
    })
    expect(repaired.expense.length).toBeGreaterThan(0)
    expect(repaired.income.length).toBeGreaterThan(0)
  })
})
