import { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ className, label, error, id, ...props }: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          'block w-full rounded-lg border bg-zinc-800/60 px-3 py-2.5 text-sm',
          'border-white/[0.1] text-zinc-100 placeholder:text-zinc-600',
          'focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50',
          'disabled:opacity-50 disabled:cursor-not-allowed resize-none',
          'transition-colors duration-150',
          error && 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  )
}
