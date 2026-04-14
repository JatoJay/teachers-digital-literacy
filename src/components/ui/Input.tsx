import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helpText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helpText, className = '', id, type = 'text', ...props }, ref) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s/g, '-')}`

    return (
      <div className="w-full">
        <label htmlFor={inputId} className="block text-sm font-semibold text-slate-700 mb-2">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`w-full px-4 py-3 text-base bg-white border-2 rounded-2xl transition-all
            ${error
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
              : 'border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100'
            }
            text-slate-700 placeholder:text-slate-400
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

Input.displayName = 'Input'

export default Input
