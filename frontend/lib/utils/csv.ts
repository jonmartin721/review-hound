import type { Review } from '../storage/types';

export function generateReviewsCsv(reviews: Review[]): string {
  const headers = ['source', 'author', 'rating', 'text', 'date', 'sentiment_score', 'sentiment_label'];
  const rows = reviews.map(r => [
    r.source,
    r.author_name || '',
    r.rating?.toString() || '',
    // Escape quotes in CSV
    r.text ? `"${r.text.replace(/"/g, '""')}"` : '',
    r.review_date || '',
    r.sentiment_score?.toString() || '',
    r.sentiment_label || '',
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
