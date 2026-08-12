// src/components/ReviewCard.tsx
import RatingStars from './RatingStars'

interface ReviewCardProps {
  reviewerName: string
  rating: number
  comment: string | null
  isVerified: boolean
  createdAt: string
}

export default function ReviewCard({
  reviewerName,
  rating,
  comment,
  isVerified,
  createdAt,
}: ReviewCardProps) {
  const date = new Date(createdAt).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const initials = reviewerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <article className="bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/80 rounded-2xl p-4 flex flex-col gap-3 transition duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-xs flex-shrink-0">
            {initials}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-slate-200">{reviewerName}</span>
            <span className="text-[10px] text-slate-500">{date}</span>
          </div>
        </div>
        {isVerified && (
          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex-shrink-0">
            Verified
          </span>
        )}
      </div>

      {/* Stars */}
      <RatingStars rating={rating} size="sm" />

      {/* Comment */}
      {comment && (
        <p className="text-xs text-slate-400 leading-relaxed">
          &ldquo;{comment}&rdquo;
        </p>
      )}
    </article>
  )
}
