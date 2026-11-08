import { describe, expect, it } from 'vitest'
import {
  addCategory,
  categoryNames,
  createDefaultCategoryCatalog,
  DEFAULT_CATEGORY_CATALOG,
  filterCategoryCatalog,
  removeCategory,
  renameCategory,
  sanitizeCategoryCatalog,
} from './categories'
import type { CategoryCatalog } from './types'

describe('本地类别目录', () => {
  it('保留原类别并扩充常用类别', () => {
    expect(DEFAULT_CATEGORY_CATALOG.expense).toEqual(
      expect.arrayContaining(['饮食', '交通', '购物', '医疗', '教育', '其他支出']),
    )
    expect(DEFAULT_CATEGORY_CATALOG.income).toEqual(
      expect.arrayContaining(['工资', '生活费', '奖金', '投资收益', '其他收入']),
    )
  })

  it('新增时去除首尾空格并拒绝空值、超长和重名', () => {
    const catalog = createDefaultCategoryCatalog()
    const added = addCategory(catalog, 'expense', ' 咖啡 ')
    expect(added.expense.at(-1)).toBe('咖啡')
    expect(() => addCategory(catalog, 'expense', '   ')).toThrow('不能为空')
    expect(() => addCategory(catalog, 'expense', '字'.repeat(21))).toThrow('20')
    expect(() => addCategory(added, 'income', '咖啡')).toThrow('已存在')
  })

  it('重命名只更新目录，并保持类别顺序', () => {
    const catalog: CategoryCatalog = {
      expense: ['饮食', '咖啡', '交通'],
      income: ['工资'],
    }
    const renamed = renameCategory(catalog, 'expense', '咖啡', '饮品')
    expect(renamed.expense).toEqual(['饮食', '饮品', '交通'])
    expect(catalog.expense[1]).toBe('咖啡')
    expect(() => renameCategory(renamed, 'expense', '饮品', '工资')).toThrow('已存在')
  })

  it('删除类别时保护每种收支的最后一个类别', () => {
    const catalog: CategoryCatalog = { expense: ['饮食', '咖啡'], income: ['工资'] }
    expect(removeCategory(catalog, 'expense', '咖啡').expense).toEqual(['饮食'])
    expect(() => removeCategory(catalog, 'income', '工资')).toThrow('至少')
  })

  it('筛选选项合并本地目录与历史账目中的类别', () => {
    const catalog: CategoryCatalog = { expense: ['饮食'], income: ['工资'] }
    expect(categoryNames(catalog, [{ category: '旧类别' }, { category: '饮食' }])).toEqual([
      '饮食',
      '工资',
      '旧类别',
    ])
  })

  it('修复本地存储中的无效数据，并保证每类至少一个可用类别', () => {
    expect(sanitizeCategoryCatalog(null)).toEqual(createDefaultCategoryCatalog())
    const sanitized = sanitizeCategoryCatalog({
      expense: [' 自定义 ', '', '自定义'],
      income: [],
    })
    expect(sanitized.expense).toEqual(['自定义'])
    expect(sanitized.income.length).toBeGreaterThan(0)
    expect(sanitized.income).toContain('工资')
  })
  it('按收支类型合并历史类别，同名类别可分别出现在两组', () => {
    const catalog: CategoryCatalog = { income: ['工资'], expense: ['饮食'] }
    expect(
      filterCategoryCatalog(catalog, [
        { type: 'income', category: '其他' },
        { type: 'expense', category: '其他' },
        { type: 'expense', category: '饮食' },
        { type: 'expense', category: '旧类别' },
        { type: 'expense', category: '旧类别' },
      ]),
    ).toEqual({ income: ['工资', '其他'], expense: ['饮食', '其他', '旧类别'] })
    expect(catalog).toEqual({ income: ['工资'], expense: ['饮食'] })
  })
})
