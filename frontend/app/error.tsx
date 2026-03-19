'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 bg-destructive/10 rounded-lg flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
      <p className="text-muted-foreground mt-2">{error.message}</p>
      <Button onClick={reset} className="mt-6">
        Try Again
      </Button>
    </div>
  );
}
