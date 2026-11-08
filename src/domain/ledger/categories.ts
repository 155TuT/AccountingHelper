import type { CategoryCatalog, EntryType, LedgerEntry } from './types'

export const CATEGORY_NAME_MAX_LENGTH = 20

export const DEFAULT_CATEGORY_CATALOG = {
  expense: [
    '饮食',
    '交通',
    '购物',
    '居住',
    '娱乐',
    '医疗',
    '教育',
    '通讯',
    '人情',
    '旅行',
    '宠物',
    '其他支出',
  ],
  income: ['工资', '生活费', '奖金', '兼职', '投资收益', '红包', '退款', '其他收入'],
} as const satisfies Record<EntryType, readonly string[]>

export function createDefaultCategoryCatalog(): CategoryCatalog {
  return {
    expense: [...DEFAULT_CATEGORY_CATALOG.expense],
    income: [...DEFAULT_CATEGORY_CATALOG.income],
  }
}

function categoryKey(name: string): string {
  return name.toLocaleLowerCase('zh-CN')
}

export function normalizeCategoryName(value: string): string {
  const name = value.trim()
  if (!name) throw new Error('类别名称不能为空。')
  if (Array.from(name).length > CATEGORY_NAME_MAX_LENGTH) {
    throw new Error(`类别名称不能超过 ${CATEGORY_NAME_MAX_LENGTH} 个字符。`)
  }
  if (/[\u0000-\u001f\u007f]/.test(name)) {
    throw new Error('类别名称不能包含换行或控制字符。')
  }
  return name
}

export function validateCategoryName(
  value: string,
  catalog: CategoryCatalog,
  currentName?: string,
): string {
  const name = normalizeCategoryName(value)
  const duplicate = [...catalog.expense, ...catalog.income].some(
    (category) => category !== currentName && categoryKey(category) === categoryKey(name),
  )
  if (duplicate) throw new Error('该类别已存在，请使用其他名称。')
  return name
}

export function addCategory(
  catalog: CategoryCatalog,
  type: EntryType,
  value: string,
): CategoryCatalog {
  const name = validateCategoryName(value, catalog)
  return { ...catalog, [type]: [...catalog[type], name] }
}

export function renameCategory(
  catalog: CategoryCatalog,
  type: EntryType,
  currentName: string,
  value: string,
): CategoryCatalog {
  if (!catalog[type].includes(currentName)) throw new Error('类别不存在或已被修改。')
  const name = validateCategoryName(value, catalog, currentName)
  return {
    ...catalog,
    [type]: catalog[type].map((category) => (category === currentName ? name : category)),
  }
}

export function removeCategory(
  catalog: CategoryCatalog,
  type: EntryType,
  name: string,
): CategoryCatalog {
  if (!catalog[type].includes(name)) throw new Error('类别不存在或已被修改。')
  if (catalog[type].length === 1) throw new Error('每种收支至少需要保留一个类别。')
  return { ...catalog, [type]: catalog[type].filter((category) => category !== name) }
}

export function categoryNames(
  catalog: CategoryCatalog,
  entries: readonly Pick<LedgerEntry, 'category'>[] = [],
): string[] {
  const names: string[] = []
  const seen = new Set<string>()
  for (const name of [
    ...catalog.expense,
    ...catalog.income,
    ...entries.map((entry) => entry.category),
  ]) {
    const key = name
    if (seen.has(key)) continue
    seen.add(key)
    names.push(name)
  }
  return names
}

export function filterCategoryCatalog(
  catalog: CategoryCatalog,
  entries: readonly Pick<LedgerEntry, 'type' | 'category'>[] = [],
): CategoryCatalog {
  const groups: CategoryCatalog = { income: [...catalog.income], expense: [...catalog.expense] }
  for (const entry of entries) {
    if (!groups[entry.type].includes(entry.category)) groups[entry.type].push(entry.category)
  }
  return groups
}

function usableStoredName(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const name = value.trim()
  if (!name || Array.from(name).length > CATEGORY_NAME_MAX_LENGTH) return null
  if (/[\u0000-\u001f\u007f]/.test(name)) return null
  return name
}

function sanitizeList(value: unknown, fallback: readonly string[], used: Set<string>): string[] {
  const result: string[] = []
  const append = (candidates: readonly unknown[]) => {
    for (const candidate of candidates) {
      const name = usableStoredName(candidate)
      if (!name) continue
      const key = categoryKey(name)
      if (used.has(key)) continue
      used.add(key)
      result.push(name)
    }
  }

  append(Array.isArray(value) ? value : [])
  if (!result.length) append(fallback)
  return result
}

export function sanitizeCategoryCatalog(value: unknown): CategoryCatalog {
  const source =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}
  const used = new Set<string>()
  const expense = sanitizeList(source.expense, DEFAULT_CATEGORY_CATALOG.expense, used)
  const income = sanitizeList(source.income, DEFAULT_CATEGORY_CATALOG.income, used)
  if (!expense.length || !income.length) return createDefaultCategoryCatalog()
  return { expense, income }
}
