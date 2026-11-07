import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createEntry } from '@/domain/ledger/validation'
import { CategoryChart } from '@/features/statistics/charts'
import { EntryDetail } from './entry-detail'
import { EntryTable } from './entry-table'
import { EntryForm } from './entry-form'
const entry = createEntry(
  {
    type: 'expense',
    date: '2026-11-07',
    amount: '10',
    category: '自定义咖啡',
    note: '<script>unexpected</script>',
  },
  'USD',
)

describe('界面输出回归', () => {
  it('原币明细显示币种与金额，备注按文本转义', () => {
    const html = renderToStaticMarkup(<EntryDetail entry={entry} />)
    expect(html).toContain('USD')
    expect(html).toContain('$10.00')
    expect(html).toContain('&lt;script&gt;unexpected&lt;/script&gt;')
    expect(html).not.toContain('¥')
  })
  it('空工作台和未选明细提供可操作提示', () => {
    expect(renderToStaticMarkup(<EntryDetail entry={null} />)).toContain('选择一笔账目查看明细')
    expect(
      renderToStaticMarkup(<EntryTable entries={[]} hasFilters={false} onViewAll={() => {}} />),
    ).toContain('从第一笔记录开始')
    expect(
      renderToStaticMarkup(<EntryTable entries={[]} hasFilters onViewAll={() => {}} />),
    ).toContain('没有符合条件的账目')
  })
  it('自定义类别有通用图标，超过十笔出现分页控件', () => {
    const entries = Array.from({ length: 11 }, (_, index) => ({ ...entry, id: String(index) }))
    const html = renderToStaticMarkup(
      <EntryTable entries={entries} showAll hasFilters={false} onViewAll={() => {}} />,
    )
    expect(html).toContain('自定义咖啡')
    expect(html).toContain('aria-label="下一页"')
    expect(html.match(/\$10\.00/g)).toHaveLength(10)
  })
  it('小额换算归零后分类占比仍为有效数字', () => {
    const html = renderToStaticMarkup(
      <CategoryChart
        entries={[{ ...entry, amountCents: 0 }]}
        type="expense"
        total={0}
        currency="USD"
        hasFilters={false}
      />,
    )
    expect(html).not.toContain('NaN')
    expect(html).not.toContain('Infinity')
    expect(html).toContain('0%')
  })
  it('记账表单组合币种和自定义类别，保存期间禁用提交', () => {
    const html = renderToStaticMarkup(
      <EntryForm
        isBusy
        categories={{ expense: ['咖啡'], income: ['工资'] }}
        categoryActions={{ add: () => null, remove: () => null, rename: () => null }}
        currency="EUR"
        onCurrencyChange={() => {}}
        onSubmit={async () => true}
      />,
    )
    expect(html).toContain('EUR')
    expect(html).toContain('管理类别')
    expect(html).toContain('正在保存')
    expect(html).toMatch(/type="submit"[^>]*disabled=""/)
  })
})
