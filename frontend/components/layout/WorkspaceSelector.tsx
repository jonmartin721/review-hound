'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { clearLocalWorkspace, getWorkspaceMode, setWorkspaceMode, type WorkspaceMode } from '@/lib/portfolio';
import { seedDemoData } from '@/lib/db/seed';

export function WorkspaceSelector() {
  const [mode, setMode] = useState<WorkspaceMode>(getWorkspaceMode);

  async function handleStartEmpty() {
    try {
      await clearLocalWorkspace();
      setWorkspaceMode('blank');
      window.location.href = '/';
    } catch (err) {
      console.error('Failed to switch to local mode:', err);
    }
  }

  async function handleLoadSample() {
    try {
      await clearLocalWorkspace();
      setWorkspaceMode('sample');
      await seedDemoData();
      window.location.href = '/';
    } catch (err) {
      console.error('Failed to switch to demo mode:', err);
    }
  }

  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-semibold text-foreground">Workspace</h2>
          <Badge variant={mode === 'sample' ? 'secondary' : 'outline'}>
            {mode === 'sample' ? 'Demo Mode' : 'Local Mode'}
          </Badge>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <div className={cn(
            "rounded-lg border p-4",
            mode === 'sample' ? "border-primary/30 bg-primary/5" : "border-border"
          )}>
            <p className="text-sm font-medium text-foreground mb-1">Demo Mode</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Pre-loaded businesses and reviews so you can explore the dashboard, charts, filters, and alerts without setting anything up.
            </p>
          </div>
          <div className={cn(
            "rounded-lg border p-4",
            mode === 'blank' ? "border-primary/30 bg-primary/5" : "border-border"
          )}>
            <p className="text-sm font-medium text-foreground mb-1">Local Mode</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Empty workspace where you add your own businesses, connect API keys, and run real scrapes. Data stays in your browser.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {mode === 'sample' ? (
            <>
              <Button asChild>
                <Link href="/">
                  Continue with Demo Data
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="secondary" onClick={handleStartEmpty}>
                Switch to Local Mode
              </Button>
            </>
          ) : (
            <>
              <Button asChild>
                <Link href="/">
                  Continue with Local Data
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="secondary" onClick={handleLoadSample}>
                Switch to Demo Mode
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
