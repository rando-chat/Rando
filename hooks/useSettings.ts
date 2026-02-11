import { useState, useEffect } from 'react'
export function useSettings() {
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system')
  useEffect(() => {
    const saved = localStorage.getItem('theme') as any
    if (saved) setThemeState(saved)
  }, [])
  const setTheme = (newTheme: typeof theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
  }
  return { theme, setTheme }
}
