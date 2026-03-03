interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center gap-2 mt-6">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`px-3 py-1 rounded-none transition font-[family-name:var(--font-mono)] ${
            p === page
              ? 'bg-[var(--accent)] text-[#0F0F0F]'
              : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
