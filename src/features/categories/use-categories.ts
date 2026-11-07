import { useRef, useState } from 'react'
import { addCategory, removeCategory, renameCategory } from '@/domain/ledger/categories'
import type { CategoryActions, CategoryCatalog } from '@/domain/ledger/types'
import { loadCategoryCatalog, saveCategoryCatalog } from '@/infrastructure/storage/category-storage'

export function useCategories() {
  const [categories, setCategories] = useState<CategoryCatalog>(() => loadCategoryCatalog())
  const current = useRef(categories)

  function mutate(action: (catalog: CategoryCatalog) => CategoryCatalog): string | null {
    try {
      const next = action(current.current)
      saveCategoryCatalog(next)
      current.current = next
      setCategories(next)
      return null
    } catch (cause) {
      return cause instanceof Error ? cause.message : '类别列表未能保存。'
    }
  }

  const actions: CategoryActions = {
    add: (type, name) => mutate((catalog) => addCategory(catalog, type, name)),
    rename: (type, currentName, nextName) =>
      mutate((catalog) => renameCategory(catalog, type, currentName, nextName)),
    remove: (type, name) => mutate((catalog) => removeCategory(catalog, type, name)),
  }

  return { categories, actions }
}
