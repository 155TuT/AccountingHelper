import { describe, expect, it, vi } from 'vitest'
import { createDefaultCategoryCatalog } from '@/domain/ledger/categories'
import { CATEGORY_STORAGE_KEY, loadCategoryCatalog, saveCategoryCatalog } from './category-storage'

function fakeStorage(initial: string | null = null) {
  let value = initial
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_key: string, next: string) => {
      value = next
    }),
    read: () => value,
  }
}

describe('类别本地存储', () => {
  it('首次使用时返回默认目录，并能往返保存自定义目录', () => {
    const storage = fakeStorage()
    expect(loadCategoryCatalog(storage)).toEqual(createDefaultCategoryCatalog())

    const catalog = { expense: ['咖啡'], income: ['稿费'] }
    saveCategoryCatalog(catalog, storage)
    expect(storage.read()).toBe(JSON.stringify(catalog))
    expect(loadCategoryCatalog(storage)).toEqual(catalog)
  })

  it('损坏的 JSON 回退到默认目录', () => {
    expect(loadCategoryCatalog(fakeStorage('{broken'))).toEqual(createDefaultCategoryCatalog())
  })

  it('保存失败时返回可展示的错误', () => {
    const storage = fakeStorage()
    storage.setItem.mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    expect(() => saveCategoryCatalog(createDefaultCategoryCatalog(), storage)).toThrow('未能保存')
    expect(storage.getItem).not.toHaveBeenCalled()
    expect(CATEGORY_STORAGE_KEY).toContain('categories')
  })
})
