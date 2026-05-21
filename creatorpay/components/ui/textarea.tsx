import { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900',
        'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent',
        'disabled:opacity-50 disabled:cursor-not-allowed resize-none',
        className
      )}
      {...props}
    />
  )
}
