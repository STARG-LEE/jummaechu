interface Props {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
}

export function PrimaryButton({ children, onClick, disabled, className = '', type = 'button' }: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        h-[52px] w-full rounded-[12px] text-[15px] font-semibold text-white
        transition-all duration-100 active:scale-[0.97]
        ${
          disabled
            ? 'bg-[#D6D3D1] dark:bg-[#44403C] dark:text-[#78716C] cursor-not-allowed'
            : 'bg-[#F97316] hover:bg-[#EA580C] cursor-pointer'
        }
        ${className}
      `}
    >
      {children}
    </button>
  )
}
