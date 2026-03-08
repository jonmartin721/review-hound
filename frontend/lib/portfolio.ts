import { db } from './db/schema';

export const IS_PORTFOLIO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
export const GITHUB_REPO_URL = 'https://github.com/jonmartin721/review-hound';
export const WORKSPACE_MODE_KEY = 'workspace_mode';

export type WorkspaceMode = 'sample' | 'blank';

export function getWorkspaceMode(): WorkspaceMode {
  if (typeof window === 'undefined') return 'sample';
  return window.localStorage.getItem(WORKSPACE_MODE_KEY) === 'blank' ? 'blank' : 'sample';
}

export function setWorkspaceMode(mode: WorkspaceMode): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(WORKSPACE_MODE_KEY, mode);
}

export async function clearLocalWorkspace(): Promise<void> {
  await Promise.all([
    db.businesses.clear(),
    db.reviews.clear(),
    db.scrapeLogs.clear(),
    db.alertConfigs.clear(),
    db.apiConfigs.clear(),
    db.sentimentConfig.clear(),
    db.schedulerConfig.clear(),
  ]);
}
