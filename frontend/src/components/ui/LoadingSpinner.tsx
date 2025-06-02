import React from 'react'
import { cn } from '../../lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  variant?: 'primary' | 'secondary' | 'white' | 'gradient'
  text?: string
  fullScreen?: boolean
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className,
  variant = 'primary',
  text,
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }
  const variantClasses = {
    primary: 'border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400',
    secondary: 'border-gray-200 dark:border-gray-700 border-t-gray-600 dark:border-t-gray-400',
    white: 'border-white/30 border-t-white',
    gradient: 'border-transparent bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-500'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  const spinner = (
    <div className={cn('flex flex-col items-center justify-center space-y-3', className)}>
      <div className="relative">        <div
          className={cn(
            'animate-spin rounded-full border-2',
            sizeClasses[size],
            variant === 'gradient' ? '' : variantClasses[variant]
          )}
        />
        {variant === 'gradient' && (
          <div
            className={cn(
              'absolute inset-0 animate-spin rounded-full',
              sizeClasses[size],
              'bg-gradient-to-r from-blue-500 via-blue-600 to-sky-500 opacity-20'
            )}
          />
        )}
        
        {/* Pulsing center dot */}
        <div
          className={cn(
            'absolute inset-0 m-auto rounded-full animate-ping',
            {
              sm: 'w-1 h-1',
              md: 'w-2 h-2',
              lg: 'w-3 h-3',
              xl: 'w-4 h-4'
            }[size],
            variant === 'white' ? 'bg-white' : 'bg-blue-600 dark:bg-blue-400'
          )}
        />
      </div>
      
      {text && (
        <div className={cn(
          'text-center font-medium',
          textSizeClasses[size],
          variant === 'white' ? 'text-white' : 'text-gray-600 dark:text-gray-300'
        )}>
          {text}
          <div className="flex justify-center space-x-1 mt-1">
            <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}
    </div>
  )
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
          {spinner}
        </div>
      </div>
    )
  }

  return spinner
}

// Skeleton loading component
// Skeleton loading component
export const SkeletonLoader: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg', className)} />
)

// Card skeleton
export const CardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
    <div className="space-y-3">
      <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="w-1/2 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  </div>
)
export default LoadingSpinner
