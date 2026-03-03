import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-6xl font-bold font-[family-name:var(--font-mono)] text-[var(--text-muted)]">404</h1>
      <p className="text-lg text-[var(--text-secondary)] mt-4">Page not found</p>
      <Link href="/" className="mt-6 bg-[var(--accent)] text-[#0F0F0F] px-5 py-2.5 rounded-none hover:brightness-110 transition font-medium">
        Back to Dashboard
      </Link>
    </div>
  );
}
