import { forwardRef, type TextareaHTMLAttributes } from 'react'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  helpText?: string
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helpText, className = '', id, ...props }, ref) => {
    const textareaId = id || `textarea-${label.toLowerCase().replace(/\s/g, '-')}`

    return (
      <div className="w-full">
        <label htmlFor={textareaId} className="block text-sm font-semibold text-slate-700 mb-2">
          {label}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          className={`w-full px-4 py-3 text-base bg-white border-2 rounded-2xl transition-all resize-none
            ${error
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
              : 'border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100'
            }
            text-slate-700 placeholder:text-slate-400 leading-relaxed
            focus:outline-none
            ${className}`}
          {...props}
        />
        {helpText && !error && (
          <p className="mt-2 text-sm text-slate-500">{helpText}</p>
        )}
        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

TextArea.displayName = 'TextArea'

export default TextArea
