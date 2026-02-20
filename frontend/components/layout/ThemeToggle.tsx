'use client'

import { useTheme } from '@/components/providers/ThemeProvider'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label="다크모드 토글"
      className="w-9 h-9 flex items-center justify-center rounded-full text-[18px] hover:bg-[#F5F5F4] dark:hover:bg-[#292524] transition-colors"
    >
      <span
        className="transition-transform duration-300 inline-block"
        style={{ transform: theme === 'dark' ? 'rotate(180deg)' : 'rotate(0deg)' }}
      >
        {theme === 'dark' ? '🌙' : '☀️'}
      </span>
    </button>
  )
}
