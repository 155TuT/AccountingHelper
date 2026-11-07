import { useState, type FormEvent } from 'react'
import { Check, Pencil, Plus, Settings2, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { CategoryActions, CategoryCatalog, EntryType } from '@/domain/ledger/types'

const TYPE_LABELS: Record<EntryType, string> = {
  expense: '支出',
  income: '收入',
}

export function CategoryManagerDialog({
  categories,
  actions,
}: {
  categories: CategoryCatalog
  actions: CategoryActions
}) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<EntryType>('expense')
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)
  const [error, setError] = useState('')

  const list = categories[type]

  function clearTransient() {
    setEditing(null)
    setEditName('')
    setConfirmingDelete(null)
    setError('')
  }

  function changeType(next: EntryType) {
    setType(next)
    setName('')
    clearTransient()
  }

  function add(event: FormEvent) {
    event.preventDefault()
    const message = actions.add(type, name)
    if (message) {
      setError(message)
      return
    }
    setName('')
    setError('')
    toast.success(`已新增${TYPE_LABELS[type]}类别`)
  }

  function startEditing(category: string) {
    setEditing(category)
    setEditName(category)
    setConfirmingDelete(null)
    setError('')
  }

  function rename(category: string) {
    const message = actions.rename(type, category, editName)
    if (message) {
      setError(message)
      return
    }
    clearTransient()
    toast.success('类别名称已更新')
  }

  function remove(category: string) {
    const message = actions.remove(type, category)
    if (message) {
      setError(message)
      return
    }
    clearTransient()
    toast.success('类别已删除，历史账目保持不变')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          setName('')
          clearTransient()
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className="gap-1.5 px-2 text-muted-foreground"
        >
          <Settings2 className="size-3.5" />
          管理类别
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85svh] sm:max-w-xl" showCloseButton>
        <DialogHeader>
          <DialogTitle>管理类别</DialogTitle>
          <DialogDescription>
            类别保存在当前浏览器。重命名或删除不会修改历史账目。
          </DialogDescription>
        </DialogHeader>
        <Tabs value={type} onValueChange={(value) => changeType(value as EntryType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expense">支出类别 · {categories.expense.length}</TabsTrigger>
            <TabsTrigger value="income">收入类别 · {categories.income.length}</TabsTrigger>
          </TabsList>
        </Tabs>
        <form onSubmit={add} noValidate className="flex items-center gap-2">
          <Input
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setError('')
            }}
            placeholder={`新增${TYPE_LABELS[type]}类别`}
            aria-label={`新增${TYPE_LABELS[type]}类别`}
            className="h-9"
          />
          <Button type="submit" size="sm" className="shrink-0 gap-1.5">
            <Plus className="size-4" />
            新增
          </Button>
        </form>
        {error && <FieldError>{error}</FieldError>}
        <div className="grid max-h-[320px] gap-2 overflow-y-auto pr-1" aria-label="类别列表">
          {list.map((category) => (
            <div
              key={category}
              className="flex min-h-11 items-center gap-2 rounded-md border bg-muted/30 px-3 py-2"
            >
              {editing === category ? (
                <>
                  <Input
                    value={editName}
                    onChange={(event) => {
                      setEditName(event.target.value)
                      setError('')
                    }}
                    aria-label={`重命名${category}`}
                    className="h-8 flex-1"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        rename(category)
                      }
                      if (event.key === 'Escape') clearTransient()
                    }}
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="icon-sm"
                    aria-label="保存类别名称"
                    onClick={() => rename(category)}
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="取消重命名"
                    onClick={clearTransient}
                  >
                    <X className="size-4" />
                  </Button>
                </>
              ) : confirmingDelete === category ? (
                <>
                  <span className="min-w-0 flex-1 text-sm">删除“{category}”？历史账目会保留。</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => remove(category)}
                  >
                    删除
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmingDelete(null)}
                  >
                    取消
                  </Button>
                </>
              ) : (
                <>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{category}</span>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`重命名${category}`}
                    onClick={() => startEditing(category)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`删除${category}`}
                    title={list.length === 1 ? '每种收支至少保留一个类别' : undefined}
                    disabled={list.length === 1}
                    onClick={() => {
                      setConfirmingDelete(category)
                      setError('')
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              完成
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
