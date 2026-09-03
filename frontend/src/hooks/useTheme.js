import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'aagnishield-theme'

function getInitialTheme() {
  if (typeof document === 'undefined') return 'dark'
  // index.html's inline script already set the class before mount
  // (from localStorage or OS preference), so just read it back.
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch (e) {
        // localStorage unavailable (private mode, etc.) — theme still
        // applies for this session, it just won't persist.
      }
      return next
    })
  }, [])

  return { theme, toggleTheme }
}
