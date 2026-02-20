interface Props {
  label: string
  selected: boolean
  onClick: () => void
}

export function FilterChip({ label, selected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150
        ${
          selected
            ? 'bg-[#FFF7ED] dark:bg-[#431407] text-[#F97316] border border-[#F97316]'
            : 'bg-[#F5F5F4] dark:bg-[#292524] text-[#78716C] dark:text-[#A8A29E] border border-transparent'
        }
      `}
    >
      {label}
    </button>
  )
}
