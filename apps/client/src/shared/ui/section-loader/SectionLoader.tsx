import { cn } from '@/shared/lib/utils'

import { Spinner } from '../spinner/Spinner'

type SectionLoaderProps = {
  label: string
  className?: string
}

/** Плашка-заглушка на месте секции страницы, пока грузятся её данные. */
export function SectionLoader({ label, className }: SectionLoaderProps) {
  return (
    <div
      className={cn(
        'flex min-h-24 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white/60',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner className="size-6 text-zinc-400" aria-label={label} />
    </div>
  )
}
