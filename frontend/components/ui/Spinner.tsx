export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-8 h-8' };
  return (
    <div className={`animate-spin inline-block ${sizeClasses[size]} border-2 border-[var(--accent)] border-t-transparent rounded-full`} />
  );
}
