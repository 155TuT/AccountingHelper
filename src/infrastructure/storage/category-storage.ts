import { createDefaultCategoryCatalog, sanitizeCategoryCatalog } from '@/domain/ledger/categories'
import type { CategoryCatalog } from '@/domain/ledger/types'

export const CATEGORY_STORAGE_KEY = 'accounting-helper.categories.v1'

type CategoryStorage = Pick<Storage, 'getItem' | 'setItem'>

function browserStorage(): CategoryStorage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function loadCategoryCatalog(storage = browserStorage()): CategoryCatalog {
  if (!storage) return createDefaultCategoryCatalog()
  try {
    const saved = storage.getItem(CATEGORY_STORAGE_KEY)
    return saved ? sanitizeCategoryCatalog(JSON.parse(saved)) : createDefaultCategoryCatalog()
  } catch {
    return createDefaultCategoryCatalog()
  }
}

export function saveCategoryCatalog(catalog: CategoryCatalog, storage = browserStorage()): void {
  if (!storage) throw new Error('当前浏览器无法保存类别列表。')
  try {
    storage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(catalog))
  } catch {
    throw new Error('类别列表未能保存，请检查浏览器存储权限或空间。')
  }
}
