import { useRef, useState, type FormEvent } from 'react'
import { Check, FolderOpen, LoaderCircle, Sun, Moon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { FieldError, FieldLabel } from '@/components/ui/field'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { CurrencyCode } from '@/domain/currency/currencies'
import { CurrencyPicker } from '@/features/currency/currency-picker'
import { THEME_COLORS, type Theme, type ThemeColor } from '@/features/theme/use-theme'
import type { LedgerDirectoryHandle } from '@/infrastructure/storage/file-system'
import { cn } from '@/lib/utils'

export interface SettingsValues {
  currency: CurrencyCode
  theme: Theme
  themeColor: ThemeColor
  defaultDirectory: LedgerDirectoryHandle | null
}

interface SettingsDialogProps extends SettingsValues {
  open: boolean
  onOpenChange(open: boolean): void
  directoryPickerSupported: boolean
  onChooseDirectory(): Promise<LedgerDirectoryHandle | null>
  onSave(values: SettingsValues): boolean
}

export function SettingsDialog({
  open,
  onOpenChange,
  currency,
  theme,
  themeColor,
  defaultDirectory,
  directoryPickerSupported,
  onChooseDirectory,
  onSave,
}: SettingsDialogProps) {
  const [draft, setDraft] = useState<SettingsValues>({
    currency,
    theme,
    themeColor,
    defaultDirectory,
  })
  const [choosingDirectory, setChoosingDirectory] = useState(false)
  const directoryPending = useRef(false)
  const [error, setError] = useState('')

  function close() {
    if (directoryPending.current) return
    setError('')
    onOpenChange(false)
  }

  async function chooseDirectory() {
    if (directoryPending.current) return
    directoryPending.current = true
    setChoosingDirectory(true)
    setError('')
    try {
      const directory = await onChooseDirectory()
      if (directory) setDraft((current) => ({ ...current, defaultDirectory: directory }))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '无法选择默认保存目录。')
    } finally {
      directoryPending.current = false
      setChoosingDirectory(false)
    }
  }

  function save(event: FormEvent) {
    event.preventDefault()
    if (directoryPending.current) return
    if (onSave(draft)) close()
    else setError('设置未保存，请检查币种换算范围后重试。')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close()
        else onOpenChange(true)
      }}
    >
      <DialogContent
        className="max-h-[calc(100svh-32px)] w-[560px] max-w-[calc(100vw-32px)] gap-0 overflow-y-auto rounded-2xl border-0 bg-transparent p-0 shadow-none"
        showCloseButton={false}
        onInteractOutside={(event) => {
          if (choosingDirectory) event.preventDefault()
        }}
        onEscapeKeyDown={(event) => {
          if (choosingDirectory) event.preventDefault()
        }}
      >
        <DialogTitle className="sr-only">全局设置</DialogTitle>
        <DialogDescription className="sr-only">
          设置全局币种、主题色、深浅模式和默认保存目录。
        </DialogDescription>
        <form onSubmit={save}>
          <Card className="gap-(--panel-gap) rounded-2xl py-(--panel-padding) shadow-xl">
            <CardHeader className="grid-cols-[36px_1fr_36px] grid-rows-1 items-center gap-3 px-(--panel-padding)">
              <Button
                type="submit"
                size="icon"
                aria-label="保存设置"
                title="保存设置"
                disabled={choosingDirectory}
                className="rounded-full bg-primary text-white hover:bg-primary/90"
              >
                <Check className="size-5" strokeWidth={2.5} />
              </Button>
              <p className="text-center text-lg font-semibold">全局设置</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={close}
                disabled={choosingDirectory}
                aria-label="关闭设置"
                title="关闭"
                className="rounded-full border-0 bg-transparent text-destructive shadow-none hover:bg-transparent hover:text-destructive/70 dark:hover:bg-transparent"
              >
                <X className="size-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-5 px-(--panel-padding)">
              <section className="flex items-center justify-between gap-3">
                <FieldLabel>展示币种</FieldLabel>
                <CurrencyPicker
                  currency={draft.currency}
                  onChange={(next) => setDraft((current) => ({ ...current, currency: next }))}
                  disabled={choosingDirectory}
                />
              </section>

              <section className="space-y-2">
                <FieldLabel>主题色</FieldLabel>
                <div className="grid grid-cols-3 gap-2" role="group" aria-label="选择主题色">
                  {THEME_COLORS.map((color) => {
                    const active = color.id === draft.themeColor
                    return (
                      <Button
                        variant="outline"
                        key={color.id}
                        type="button"
                        disabled={choosingDirectory}
                        aria-pressed={active}
                        aria-label={`${color.label}主题`}
                        onClick={() =>
                          setDraft((current) => ({ ...current, themeColor: color.id }))
                        }
                        className={cn(
                          'h-10 justify-start gap-2 rounded-lg px-3 font-normal',
                          active
                            ? 'border-primary bg-accent text-accent-foreground dark:border-primary dark:bg-accent dark:hover:bg-accent'
                            : 'bg-background text-muted-foreground hover:bg-muted',
                        )}
                      >
                        <span
                          className="size-4 rounded-full border border-border"
                          style={{ backgroundColor: color.swatch }}
                          aria-hidden="true"
                        />
                        {color.label}
                        {active && <Check className="ml-auto size-4" aria-hidden="true" />}
                      </Button>
                    )
                  })}
                </div>
              </section>

              <section className="space-y-2">
                <FieldLabel>深浅模式</FieldLabel>
                <Tabs
                  value={draft.theme}
                  onValueChange={(value) =>
                    setDraft((current) => ({ ...current, theme: value as Theme }))
                  }
                >
                  <TabsList className="grid h-10 w-full grid-cols-2">
                    <TabsTrigger value="light" className="gap-2" disabled={choosingDirectory}>
                      <Sun className="size-4" />
                      浅色
                    </TabsTrigger>
                    <TabsTrigger value="dark" className="gap-2" disabled={choosingDirectory}>
                      <Moon className="size-4" />
                      深色
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </section>

              <section className="space-y-2">
                <FieldLabel>默认保存目录</FieldLabel>
                <div className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2.5">
                  <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {draft.defaultDirectory?.name ?? '未设置'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!directoryPickerSupported || choosingDirectory}
                    onClick={() => void chooseDirectory()}
                  >
                    {choosingDirectory ? <LoaderCircle className="animate-spin" /> : null}
                    选择
                  </Button>
                  {draft.defaultDirectory && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={choosingDirectory}
                      onClick={() =>
                        setDraft((current) => ({ ...current, defaultDirectory: null }))
                      }
                    >
                      清除
                    </Button>
                  )}
                </div>
                {!directoryPickerSupported && (
                  <FieldError>当前浏览器不支持目录选择，请使用桌面版 Chrome 或 Edge。</FieldError>
                )}
              </section>

              {error && <FieldError>{error}</FieldError>}

              <footer className="border-t pt-4 text-center text-xs text-muted-foreground">
                © 2026 AccountingHelper · 福州大学软件工程现场编程作业
              </footer>
            </CardContent>
          </Card>
        </form>
      </DialogContent>
    </Dialog>
  )
}
