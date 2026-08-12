'use client'
// src/components/RatingStars.tsx
interface RatingStarsProps {
  rating: number          // 0-5 (can be decimal for display)
  max?: number
  interactive?: boolean
  onChange?: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
}

export default function RatingStars({
  rating,
  max = 5,
  interactive = false,
  onChange,
  size = 'md',
}: RatingStarsProps) {
  const sizeClass = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label={`Rating: ${rating} out of ${max}`}>
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1
        const filled = starValue <= Math.floor(rating)
        const halfFilled = !filled && starValue - 0.5 <= rating

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(starValue)}
            aria-label={`${starValue} star${starValue !== 1 ? 's' : ''}`}
            className={`transition-transform ${interactive ? 'hover:scale-125 cursor-pointer' : 'cursor-default'}`}
          >
            <svg
              className={`${sizeClass} transition-colors duration-150 ${
                filled
                  ? 'text-amber-400'
                  : halfFilled
                  ? 'text-amber-300'
                  : 'text-slate-700'
              }`}
              fill={filled ? 'currentColor' : halfFilled ? 'url(#half)' : 'none'}
              stroke="currentColor"
              strokeWidth={filled || halfFilled ? 0 : 1.5}
              viewBox="0 0 24 24"
            >
              <defs>
                <linearGradient id="half">
                  <stop offset="50%" stopColor="currentColor" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
          </button>
        )
      })}
    </div>
  )
}
