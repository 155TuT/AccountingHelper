import { describe, expect, it } from 'vitest'
import rawAcceptanceText from '../examples/acceptance.jsonl?raw'
import { ALL_CATEGORIES, EMPTY_FILTERS } from '@/domain/ledger/constants'
import { formatCurrency, formatMoney, parseMoney } from '@/domain/ledger/money'
import {
  categoryTotals,
  dailyTotals,
  filterEntries,
  sortEntries,
  summarize,
  validateFilters,
} from '@/domain/ledger/selectors'
import type { LedgerEntry } from '@/domain/ledger/types'
import { createEntry, isValidDate, validateEntry } from '@/domain/ledger/validation'
import { parseJsonl, serializeJsonl } from '@/infrastructure/storage/jsonl'

const entries = parseJsonl(rawAcceptanceText)
const acceptanceText = rawAcceptanceText.replace(/\r\n/g, '\n')
const firstEntry = entries[0]!

function entryWith(overrides: Partial<LedgerEntry>): LedgerEntry {
  return { ...firstEntry, ...overrides }
}

describe('PRD 验收账本', () => {
  it('三笔示例记录解析后得到 100.00 收入、27.50 支出和 72.50 结余', () => {
    expect(entries).toHaveLength(3)
    expect(summarize(entries)).toEqual({ income: 10000, expense: 2750, balance: 7250 })
    expect(summarize(filterEntries(entries, { ...EMPTY_FILTERS, category: '饮食' }))).toEqual({
      income: 0,
      expense: 2550,
      balance: -2550,
    })
  })

  it('筛选日期边界、类别和金额区间与示例账目一致', () => {
    expect(
      filterEntries(entries, {
        ...EMPTY_FILTERS,
        startDate: '2026-11-07',
        endDate: '2026-11-07',
      }).map((entry) => entry.id),
    ).toEqual(['acceptance-2', 'acceptance-3'])
    expect(
      filterEntries(entries, { ...EMPTY_FILTERS, minAmount: '25.50' }).map((entry) => entry.id),
    ).toEqual(['acceptance-1', 'acceptance-3'])
    expect(
      filterEntries(entries, { ...EMPTY_FILTERS, maxAmount: '2.00' }).map((entry) => entry.id),
    ).toEqual(['acceptance-2'])
    expect(filterEntries(entries, { ...EMPTY_FILTERS, category: '工资' })).toHaveLength(1)
  })

  it('最近记录按日期、录入时刻和标识稳定倒序，且不修改原数组', () => {
    expect(sortEntries(entries).map((entry) => entry.id)).toEqual([
      'acceptance-3',
      'acceptance-2',
      'acceptance-1',
    ])
    expect(entries.map((entry) => entry.id)).toEqual([
      'acceptance-1',
      'acceptance-2',
      'acceptance-3',
    ])
    const sameTime = [
      entryWith({ id: 'a', createdAt: '2026-11-07T09:00:00+08:00' }),
      entryWith({ id: 'c', createdAt: '2026-11-07T09:00:00+08:00' }),
      entryWith({ id: 'b', createdAt: '2026-11-07T10:00:00+08:00' }),
    ]
    expect(sortEntries(sameTime).map((entry) => entry.id)).toEqual(['b', 'c', 'a'])
  })

  it('图表与汇总使用同一批筛选结果', () => {
    expect(dailyTotals(entries)).toEqual([
      { date: '2026-11-06', income: 0, expense: 2550 },
      { date: '2026-11-07', income: 10000, expense: 200 },
    ])
    expect(categoryTotals(entries)).toEqual([
      { category: '饮食', amount: 2550 },
      { category: '交通', amount: 200 },
    ])
    const filtered = filterEntries(entries, { ...EMPTY_FILTERS, category: '交通' })
    expect(summarize(filtered)).toEqual({ income: 0, expense: 200, balance: -200 })
    expect(categoryTotals(filtered)).toEqual([{ category: '交通', amount: 200 }])
  })

  it('示例账本序列化后可无损读回，并兼容 CRLF', () => {
    const text = serializeJsonl(entries)
    expect(text).toBe(acceptanceText)
    expect(parseJsonl(text.replace(/\n/g, '\r\n'))).toEqual(entries)
    expect(parseJsonl('')).toEqual([])
    expect(serializeJsonl([])).toBe('')
  })
})

describe('金额边界', () => {
  it('接受整数、一位或两位小数、前后空白和安全整数上限', () => {
    expect(parseMoney(' 25.5 ')).toBe(2550)
    expect(parseMoney('25.50')).toBe(2550)
    expect(parseMoney('001.05')).toBe(105)
    expect(parseMoney('0', true)).toBe(0)
    expect(parseMoney('0.00', true)).toBe(0)
    expect(parseMoney('90071992547409.91')).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('拒绝空值、符号、科学计数法、三位小数和超出安全整数的金额', () => {
    for (const input of ['', ' ', '+1', '-1', '.5', '1.', '1.234', '1e3', 'NaN', 'Infinity', '１'])
      expect(() => parseMoney(input)).toThrow()
    expect(() => parseMoney('0')).toThrow('大于 0')
    expect(() => parseMoney('90071992547409.92')).toThrow('金额过大')
  })

  it('展示保留两位小数、千分位和负号', () => {
    expect(formatMoney(0)).toBe('0.00')
    expect(formatMoney(5)).toBe('0.05')
    expect(formatMoney(-5)).toBe('-0.05')
    expect(formatMoney(123456789)).toBe('1,234,567.89')
    expect(formatCurrency(10000)).toBe('¥100.00')
    expect(formatCurrency(-2550)).toBe('-¥25.50')
  })
})

describe('日期与账目校验', () => {
  it('接受真实日期并拒绝非法日历日期和格式', () => {
    for (const value of ['2024-02-29', '2000-02-29', '2026-11-07', '1000-01-01', '9999-12-31'])
      expect(isValidDate(value)).toBe(true)
    for (const value of [
      '1900-02-29',
      '2100-02-29',
      '2026-02-29',
      '2026-04-31',
      '2026-13-01',
      '2026-00-10',
      '2026-11-00',
      '2026-1-1',
      '2026/11/07',
      ' 2026-11-07',
      '0999-12-31',
    ])
      expect(isValidDate(value)).toBe(false)
  })

  it('校验账目必填字段、收支类别和带时区的录入时间', () => {
    const base = entryWith({})
    expect(validateEntry(base)).toEqual(base)
    expect(validateEntry({ ...base, note: '' })).toEqual({ ...base, note: '' })

    const invalid: unknown[] = [
      null,
      [],
      '账目',
      { ...base, extra: true },
      { ...base, id: '   ' },
      { ...base, type: 'transfer' },
      { ...base, date: '2026-02-30' },
      { ...base, amountCents: 0 },
      { ...base, amountCents: 25.5 },
      { ...base, amountCents: Number.MAX_SAFE_INTEGER + 1 },
      { ...base, category: '工资' },
      { ...base, type: 'income' },
      { ...base, note: null },
      { ...base, createdAt: '2026-11-07T12:00:00' },
      { ...base, createdAt: '2026-02-30T12:00:00+08:00' },
      { ...base, currency: 'usd' },
      { ...base, currency: 1 },
    ]
    for (const value of invalid) expect(() => validateEntry(value)).toThrow()
  })

  it('读取旧账本时补人民币币种，新记录使用当前币种', () => {
    const legacy = { ...firstEntry } as Partial<LedgerEntry>
    delete legacy.currency
    expect(parseJsonl(JSON.stringify(legacy))[0]?.currency).toBe('CNY')
    expect(() => parseJsonl(JSON.stringify({ ...firstEntry, currency: 'usd' }))).toThrow('币种')
    const usd = createEntry(
      { type: 'expense', date: '2026-11-07', amount: '25.50', category: '饮食', note: '' },
      'USD',
    )
    expect(usd).toMatchObject({ currency: 'USD', amountCents: 2550 })
  })

  it('新增账目统一换算金额、去除备注首尾空白并生成标识', () => {
    const entry = createEntry({
      type: 'expense',
      date: '2026-11-07',
      amount: '25.50',
      category: '饮食',
      note: '  午餐  ',
    })
    expect(entry).toMatchObject({
      type: 'expense',
      date: '2026-11-07',
      amountCents: 2550,
      category: '饮食',
      note: '午餐',
    })
    expect(entry.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(Number.isFinite(Date.parse(entry.createdAt))).toBe(true)
    expect(() =>
      createEntry({
        type: 'expense',
        date: '2026-11-07',
        amount: '0',
        category: '饮食',
        note: '',
      }),
    ).toThrow()
  })
})

describe('筛选与统计异常', () => {
  it('留空条件表示不限，零金额边界包含零但账目金额始终大于零', () => {
    expect(filterEntries(entries, EMPTY_FILTERS)).toHaveLength(3)
    expect(filterEntries(entries, { ...EMPTY_FILTERS, minAmount: '  ' })).toHaveLength(3)
    expect(filterEntries(entries, { ...EMPTY_FILTERS, minAmount: '0', maxAmount: '0' })).toEqual([])
  })

  it('非法日期、类别和颠倒区间给出明确错误', () => {
    expect(() => validateFilters({ ...EMPTY_FILTERS, startDate: '2026-02-30' })).toThrow('有效日期')
    expect(() => validateFilters({ ...EMPTY_FILTERS, category: '餐饮' })).toThrow('有效类别')
    expect(() => validateFilters({ ...EMPTY_FILTERS, minAmount: '-1' })).toThrow()
    expect(() =>
      validateFilters({ ...EMPTY_FILTERS, startDate: '2026-11-08', endDate: '2026-11-07' }),
    ).toThrow('开始日期')
    expect(() => validateFilters({ ...EMPTY_FILTERS, minAmount: '10', maxAmount: '9.99' })).toThrow(
      '最低金额',
    )
  })

  it('空账本统计为零，合计超出安全整数时拒绝继续累加', () => {
    expect(summarize([])).toEqual({ income: 0, expense: 0, balance: 0 })
    expect(() =>
      summarize([
        entryWith({ id: 'a', type: 'income', amountCents: Number.MAX_SAFE_INTEGER }),
        entryWith({ id: 'b', type: 'income', amountCents: 1 }),
      ]),
    ).toThrow('拆分账本')
  })

  it('JSONL 读取报告行号并拒绝空行、重复标识和额外字段', () => {
    expect(() => parseJsonl(`${JSON.stringify(firstEntry)}\n{broken}\n`)).toThrow('第 2 行')
    expect(() => parseJsonl(`${JSON.stringify(firstEntry)}\n\n`)).toThrow('第 2 行')
    expect(() =>
      parseJsonl(`${JSON.stringify(firstEntry)}\n${JSON.stringify(firstEntry)}\n`),
    ).toThrow('重复')
    expect(() => parseJsonl(JSON.stringify({ ...firstEntry, extra: true }))).toThrow('无法识别')
  })

  it('类别常量覆盖全部预设收支类别', () => {
    expect(ALL_CATEGORIES).toEqual([
      '饮食',
      '交通',
      '购物',
      '其他支出',
      '工资',
      '生活费',
      '其他收入',
    ])
  })
})
