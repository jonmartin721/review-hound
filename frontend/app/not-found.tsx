import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-6xl font-bold font-mono text-muted-foreground">404</h1>
      <p className="text-lg text-foreground mt-4">Page not found</p>
      <Button asChild className="mt-6">
        <Link href="/">Back to Dashboard</Link>
      </Button>
    </div>
  );
}
