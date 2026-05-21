import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'block w-full rounded-lg border bg-zinc-800/60 px-3 py-2.5 text-sm',
            'border-white/[0.1] text-zinc-100 placeholder:text-zinc-600',
            'focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors duration-150',
            error && 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50',
            className
          )}
          {...props}
        />
        {hint && !error && <p className="mt-1.5 text-xs text-zinc-600">{hint}</p>}
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
