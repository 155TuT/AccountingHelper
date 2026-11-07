import { useState } from 'react'

export function useExclusivePopup<Name extends string>() {
  const [active, setActive] = useState<Name | null>(null)

  function popupProps(name: Name) {
    return {
      open: active === name,
      onOpenChange(open: boolean) {
        setActive((current) => (open ? name : current === name ? null : current))
      },
    }
  }

  return { popupProps, closePopups: () => setActive(null) }
}
