interface Option<T> {
  label: string
  value: T
}

interface Props<T> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <div className="flex gap-1 p-1 bg-[#F5F5F4] dark:bg-[#292524] rounded-[10px]">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          onClick={() => onChange(opt.value)}
          className={`
            flex-1 py-2 rounded-[8px] text-[14px] font-medium transition-all duration-150
            ${
              opt.value === value
                ? 'bg-[#F97316] text-white shadow-sm'
                : 'text-[#78716C] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#FAFAF9]'
            }
          `}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
