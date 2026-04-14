import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: SelectOption[]
  error?: string
  helpText?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helpText, className = '', id, ...props }, ref) => {
    const selectId = id || `select-${label.toLowerCase().replace(/\s/g, '-')}`

    return (
      <div className="w-full">
        <label htmlFor={selectId} className="block text-sm font-semibold text-slate-700 mb-2">
          {label}
        </label>
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`w-full px-4 py-3 text-base bg-white border-2 rounded-2xl transition-all appearance-none pr-10
              ${error
                ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100'
              }
              text-slate-700
              focus:outline-none
              ${className}`}
            {...props}
          >
            <option value="" disabled>
              Select {label.toLowerCase()}
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={20}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>
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

Select.displayName = 'Select'

export default Select
