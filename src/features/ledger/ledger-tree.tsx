import { useEffect, useState, type ReactNode } from 'react'
import { ChevronRight, Copy, FilePlus2, FileText, FolderOpen, Save, X } from 'lucide-react'
import { formatCurrency } from '@/domain/ledger/money'
import { sortEntries } from '@/domain/ledger/selectors'
import type { LedgerApi } from '@/features/ledger/use-ledger'
import { cn } from '@/lib/utils'

interface LedgerTreeProps {
  onSelectDate(id: string, date: string): void
  ledger: LedgerApi
}

function TreeAction({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick(): void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 [&>svg]:size-3.5"
    >
      {children}
    </button>
  )
}

export function LedgerTree({ ledger, onSelectDate }: LedgerTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set([ledger.selectedLedgerId]))

  useEffect(() => {
    setExpanded((previous) => {
      if (previous.has(ledger.selectedLedgerId)) return previous
      return new Set(previous).add(ledger.selectedLedgerId)
    })
  }, [ledger.selectedLedgerId])

  function toggle(id: string) {
    setExpanded((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectLedger(id: string) {
    ledger.selectLedger(id)
    setExpanded((previous) => new Set(previous).add(id))
  }

  const fileActionsDisabled = ledger.isBusy || !ledger.fileSystemSupported

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1">
      <div className="group/header flex h-9 shrink-0 items-center justify-between px-3">
        <span className="text-xs font-medium tracking-wide text-muted-foreground">工作区</span>
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover/header:opacity-100">
          <TreeAction
            label="打开账本"
            disabled={ledger.isBusy || !ledger.fileSystemSupported}
            onClick={() => void ledger.open()}
          >
            <FolderOpen />
          </TreeAction>
          <TreeAction
            label="新建账本"
            disabled={ledger.isBusy}
            onClick={() => void ledger.create()}
          >
            <FilePlus2 />
          </TreeAction>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        <ul className="flex flex-col gap-0.5">
          {ledger.ledgers.map((item) => {
            const isSelected = item.id === ledger.selectedLedgerId
            const isExpanded = expanded.has(item.id)
            const sorted = sortEntries(item.entries)
            return (
              <li key={item.id}>
                <div
                  data-selected={isSelected ? 'true' : undefined}
                  className="group/row relative flex items-center gap-0.5 rounded-md pr-1 hover:bg-sidebar-accent data-[selected=true]:bg-sidebar-accent"
                >
                  <button
                    type="button"
                    aria-label={isExpanded ? '折叠账本' : '展开账本'}
                    aria-expanded={isExpanded}
                    onClick={() => toggle(item.id)}
                    className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                  >
                    <ChevronRight
                      className={cn('size-4 transition-transform', isExpanded && 'rotate-90')}
                    />
                  </button>
                  <button
                    type="button"
                    aria-current={isSelected ? 'true' : undefined}
                    disabled={ledger.isBusy}
                    onClick={() => selectLedger(item.id)}
                    className="group-hover/row:pr-20 group-focus-within/row:pr-20 flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md px-1 text-left text-sm text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                  >
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                    {!item.session && (
                      <span
                        className="size-1.5 shrink-0 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                    )}
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {item.entries.length}
                    </span>
                  </button>
                  <div className="pointer-events-none absolute right-1 flex items-center gap-0.5 rounded bg-sidebar-accent opacity-0 transition-opacity focus-within:pointer-events-auto focus-within:opacity-100 group-hover/row:pointer-events-auto group-hover/row:opacity-100 group-focus-within/row:pointer-events-auto group-focus-within/row:opacity-100">
                    <TreeAction
                      label="保存账本"
                      disabled={fileActionsDisabled}
                      onClick={() => void ledger.save(item.id)}
                    >
                      <Save />
                    </TreeAction>
                    <TreeAction
                      label="另存为"
                      disabled={fileActionsDisabled}
                      onClick={() => void ledger.saveAs(item.id)}
                    >
                      <Copy />
                    </TreeAction>
                    <TreeAction
                      label="关闭账本"
                      disabled={ledger.isBusy}
                      onClick={() => ledger.remove(item.id)}
                    >
                      <X />
                    </TreeAction>
                  </div>
                </div>
                {isExpanded && (
                  <ul className="ml-4 flex flex-col gap-0.5 border-l border-sidebar-border pl-2">
                    {sorted.length ? (
                      sorted.map((entry, index) => (
                        <li key={entry.id}>
                          {(index === 0 || sorted[index - 1]!.date !== entry.date) && (
                            <button
                              type="button"
                              disabled={ledger.isBusy}
                              onClick={() => onSelectDate(item.id, entry.date)}
                              className="w-full rounded px-2 pt-2 pb-1 text-left text-xs text-muted-foreground hover:bg-sidebar-accent"
                              aria-label={`查看 ${item.name} ${entry.date} 的账目`}
                            >
                              {entry.date}
                            </button>
                          )}
                          <button
                            type="button"
                            aria-current={
                              isSelected && entry.id === ledger.selectedEntryId ? 'true' : undefined
                            }
                            data-selected={
                              isSelected && entry.id === ledger.selectedEntryId ? 'true' : undefined
                            }
                            disabled={ledger.isBusy}
                            onClick={() => ledger.selectEntry(item.id, entry.id)}
                            className="flex h-7 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-sidebar-foreground hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden data-[selected=true]:bg-sidebar-accent data-[selected=true]:text-sidebar-accent-foreground"
                          >
                            <span className="min-w-0 flex-1 truncate">{entry.category}</span>
                            <span
                              className={cn(
                                'shrink-0 font-mono text-xs tabular-nums',
                                entry.type === 'income' ? 'text-income' : 'text-expense',
                              )}
                            >
                              {entry.type === 'income' ? '+' : '−'}
                              {formatCurrency(entry.amountCents, entry.currency)}
                            </span>
                          </button>
                        </li>
                      ))
                    ) : (
                      <li className="px-2 py-1 text-xs text-muted-foreground">暂无账目</li>
                    )}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
