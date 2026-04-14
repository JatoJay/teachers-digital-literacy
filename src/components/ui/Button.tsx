import { forwardRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  children: ReactNode
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      children,
      className = '',
      disabled,
      type = 'button',
      onClick,
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-semibold rounded-full transition-all touch-target gap-2'

    const variantClasses = {
      primary: 'bg-teal-500 text-white hover:bg-teal-600 shadow-lg hover:shadow-xl',
      secondary: 'bg-pink-500 text-white hover:bg-pink-600 shadow-lg hover:shadow-xl',
      outline: 'bg-white text-slate-700 border-2 border-slate-200 hover:border-teal-500 hover:text-teal-600',
      ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
    }

    const sizeClasses = {
      sm: 'px-4 py-2 text-sm min-h-10',
      md: 'px-6 py-3 text-base min-h-12',
      lg: 'px-8 py-4 text-lg min-h-14',
    }

    const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : ''

    return (
      <motion.button
        ref={ref}
        type={type}
        onClick={onClick}
        whileHover={!disabled && !loading ? { scale: 1.02, y: -2 } : {}}
        whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
        disabled={disabled || loading}
      >
        {loading ? (
          <span className="loading loading-spinner loading-sm" />
        ) : icon ? (
          <span className="flex-shrink-0">{icon}</span>
        ) : null}
        {children}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export default Button
