'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { clearLocalWorkspace, getWorkspaceMode, setWorkspaceMode, type WorkspaceMode } from '@/lib/portfolio';
import { seedDemoData } from '@/lib/db/seed';

export function WorkspaceSelector() {
  const [mode, setMode] = useState<WorkspaceMode>(getWorkspaceMode);

  async function handleStartEmpty() {
    await clearLocalWorkspace();
    setWorkspaceMode('blank');
    window.location.href = '/';
  }

  async function handleLoadSample() {
    await clearLocalWorkspace();
    setWorkspaceMode('sample');
    await seedDemoData();
    window.location.href = '/';
  }

  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-semibold text-foreground">Workspace</h2>
          <Badge variant={mode === 'sample' ? 'secondary' : 'outline'}>
            {mode === 'sample' ? 'Sample Mode' : 'Local Mode'}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-5">
          {mode === 'sample'
            ? 'You are exploring pre-loaded sample data. Switch to an empty workspace to add your own businesses and API keys.'
            : 'You are using a local workspace with your own data. Switch back to sample mode to explore the demo.'}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {mode === 'sample' ? (
            <>
              <Button asChild>
                <Link href="/">
                  Open Sample Workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="secondary" onClick={handleStartEmpty}>
                Start Empty Workspace
              </Button>
            </>
          ) : (
            <>
              <Button asChild>
                <Link href="/">
                  Open Local Workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="secondary" onClick={handleLoadSample}>
                Reload Sample Data
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
