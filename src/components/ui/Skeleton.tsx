import type { HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-[10px] bg-[hsl(var(--muted))]', className)} {...props} />
}
