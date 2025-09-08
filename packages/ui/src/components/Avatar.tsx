import React from 'react'
import clsx from 'clsx'

interface AvatarProps {
  src?: string
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fallback?: string
  className?: string
  online?: boolean
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg'
}

export function Avatar({ 
  src, 
  alt, 
  size = 'md', 
  fallback, 
  className, 
  online 
}: AvatarProps) {
  const initials = fallback || alt?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'

  return (
    <div className={clsx('relative inline-block', className)}>
      <div className={clsx(
        'rounded-full bg-gray-300 flex items-center justify-center overflow-hidden',
        sizeClasses[size]
      )}>
        {src ? (
          <img 
            src={src} 
            alt={alt} 
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
        ) : (
          <span className="font-medium text-gray-600">
            {initials}
          </span>
        )}
      </div>
      
      {online && (
        <div className={clsx(
          'absolute bottom-0 right-0 bg-green-500 rounded-full border-2 border-white',
          size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'
        )} />
      )}
    </div>
  )
}

