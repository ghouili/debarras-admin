import type { SelectHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full appearance-none rounded-[12px] border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 pr-10 text-sm shadow-[0_1px_0_rgba(15,23,42,0.04)] outline-none transition focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))]/30 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.75rem center',
        backgroundSize: '16px 16px',
      }}
      {...props}
    />
  )
}
