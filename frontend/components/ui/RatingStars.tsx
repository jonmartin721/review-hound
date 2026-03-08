interface RatingStarsProps {
  rating: number | null | undefined;
  size?: 'sm' | 'md' | 'lg';
}

export function RatingStars({ rating, size = 'md' }: RatingStarsProps) {
  if (rating == null) return null;
  const filled = Math.round(rating);
  const sizeClasses = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' };

  return (
    <span className={`rating-stars ${sizeClasses[size]}`}>
      {'★'.repeat(filled)}{'☆'.repeat(Math.max(0, 5 - filled))}
    </span>
  );
}
