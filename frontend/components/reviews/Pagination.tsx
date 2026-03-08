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
          className={`px-3 py-1 rounded transition ${
            p === page
              ? 'bg-indigo-600 text-white'
              : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
