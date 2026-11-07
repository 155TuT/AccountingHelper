import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { EntryForm, type EntryFormProps } from './entry-form'

interface EntryComposerProps extends Omit<EntryFormProps, 'autoFocus' | 'onCancel'> {
  open: boolean
  onOpenChange(open: boolean): void
}

export function EntryComposer({ open, onOpenChange, ...form }: EntryComposerProps) {
  function changeOpen(next: boolean) {
    if (!form.isBusy) onOpenChange(next)
  }

  return (
    <Popover open={open} onOpenChange={changeOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          disabled={form.isBusy || form.disabled}
          aria-label="新建账目"
          className="fixed right-6 bottom-6 z-40 size-14 rounded-full shadow-lg data-[state=open]:pointer-events-none data-[state=open]:opacity-0"
        >
          <Plus className="size-6" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={-56}
        collisionPadding={24}
        aria-label="新建账目"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          if (form.isBusy) event.preventDefault()
        }}
        onEscapeKeyDown={(event) => {
          if (form.isBusy) event.preventDefault()
        }}
        className="max-h-[calc(100svh-48px)] w-[400px] max-w-[calc(100vw-48px)] overflow-y-auto rounded-2xl border-0 bg-transparent p-0 shadow-xl"
      >
        <EntryForm {...form} autoFocus onCancel={() => changeOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}
