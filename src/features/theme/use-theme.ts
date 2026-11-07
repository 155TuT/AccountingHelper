import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

export const THEME_COLORS = [
  { id: 'violet', label: '紫色', swatch: '#4f46b8' },
  { id: 'teal', label: '青色', swatch: '#0f766e' },
  { id: 'blue', label: '蓝色', swatch: '#1d5fa8' },
  { id: 'rose', label: '玫红', swatch: '#b03546' },
  { id: 'amber', label: '琥珀', swatch: '#a16207' },
  { id: 'green', label: '绿色', swatch: '#2f6b40' },
] as const

export type ThemeColor = (typeof THEME_COLORS)[number]['id']

export const DEFAULT_THEME_COLOR: ThemeColor = 'violet'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )
  const [themeColor, setThemeColor] = useState<ThemeColor>(DEFAULT_THEME_COLOR)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
    document.documentElement.dataset.themeColor = themeColor
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute(
        'content',
        getComputedStyle(document.documentElement).getPropertyValue('--background').trim(),
      )
  }, [theme, themeColor])

  return {
    theme,
    setTheme,
    themeColor,
    setThemeColor,
    toggleTheme: () => setTheme((value) => (value === 'dark' ? 'light' : 'dark')),
  }
}
