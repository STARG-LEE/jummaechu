import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  return (
    <header className="sticky top-0 z-50 h-[56px] flex items-center justify-between px-4 bg-[#FAFAF9]/90 dark:bg-[#0C0A09]/90 backdrop-blur-sm border-b border-[#E7E5E4] dark:border-[#44403C]">
      <Link
        href="/recommend"
        className="text-[17px] font-extrabold text-[#1C1917] dark:text-[#FAFAF9]"
      >
        점메추 🍱
      </Link>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        {/* TODO: Phase 1 — 로그인/프로필 버튼 */}
      </div>
    </header>
  )
}
