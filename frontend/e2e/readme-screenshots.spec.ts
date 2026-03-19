import path from 'node:path';
import fs from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const docsDir = path.resolve(process.cwd(), '../docs/screenshots');
const publicDir = path.resolve(process.cwd(), 'public/screenshots');

async function prepareForScreenshot(page: import('@playwright/test').Page) {
  await page.addStyleTag({
    content: `
      [data-testid="workspace-info-banner"] {
        display: none !important;
      }

      * {
        scrollbar-width: none !important;
      }

      *::-webkit-scrollbar {
        display: none !important;
      }
    `,
  });
}

test.describe('README screenshots', () => {
  test.use({ viewport: { width: 1440, height: 960 } });

  test('captures current frontend pages for README and welcome page', async ({ page }) => {
    await fs.mkdir(docsDir, { recursive: true });
    await fs.mkdir(publicDir, { recursive: true });

    // Dashboard
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Business Dashboard' })).toBeVisible();
    await expect(page.getByText('Acme Coffee Co.')).toBeVisible();
    await prepareForScreenshot(page);
    await page.screenshot({ path: path.join(docsDir, 'dashboard.png') });
    await page.screenshot({ path: path.join(publicDir, 'dashboard.png') });

    // Add Business modal
    await page.getByRole('button', { name: 'Add Business' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.screenshot({ path: path.join(publicDir, 'add-business.png') });
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Navigate to Acme Coffee Co. business detail
    const acmeCard = page.locator('[data-testid="business-card"]', {
      has: page.getByRole('heading', { name: 'Acme Coffee Co.' }),
    }).first();
    await acmeCard.getByRole('link', { name: 'View Details' }).click();

    await expect(page).toHaveURL(/\/business\/\d+$/);
    await expect(page.getByRole('heading', { name: 'Acme Coffee Co.' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Rating Trend' })).toBeVisible();
    await page.locator('body').evaluate((body) => {
      (body as HTMLBodyElement).style.zoom = '0.9';
      window.scrollTo(0, 0);
    });
    await prepareForScreenshot(page);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(docsDir, 'business_detail.png') });
    await page.screenshot({ path: path.join(publicDir, 'business-detail.png') });

    // Alerts section
    await page.screenshot({ path: path.join(publicDir, 'alerts.png') });

    // Reviews page with negative filter
    await page.getByRole('link', { name: 'View All →' }).click();
    await expect(page).toHaveURL(/\/business\/\d+\/reviews$/);
    await expect(page.getByRole('heading', { name: 'Reviews for Acme Coffee Co.' })).toBeVisible();
    await page.locator('text=Sentiment').locator('..').getByRole('combobox').click();
    await page.getByRole('option', { name: 'Negative' }).click();
    await page.getByRole('button', { name: 'Filter' }).click();
    await expect(page.getByText('Phil D.')).toBeVisible();
    await page.locator('body').evaluate((body) => {
      (body as HTMLBodyElement).style.zoom = '0.95';
      window.scrollTo(0, 0);
    });
    await prepareForScreenshot(page);
    await page.screenshot({ path: path.join(docsDir, 'reviews.png') });

    // Settings
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await page.getByRole('button', { name: 'API Keys' }).click();
    await expect(page.getByRole('heading', { name: 'API Keys' })).toBeVisible();
    await page.locator('body').evaluate((body) => {
      (body as HTMLBodyElement).style.zoom = '0.9';
      window.scrollTo(0, 0);
    });
    await prepareForScreenshot(page);
    await page.screenshot({ path: path.join(docsDir, 'settings.png') });
    await page.screenshot({ path: path.join(publicDir, 'settings.png') });
  });
});
