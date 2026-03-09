import path from 'node:path';
import fs from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const screenshotsDir = path.resolve(process.cwd(), '../docs/screenshots');

async function prepareForScreenshot(page: import('@playwright/test').Page) {
  await page.addStyleTag({
    content: `
      .panel-shell-info {
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

  test('captures current frontend pages for the root README', async ({ page }) => {
    await fs.mkdir(screenshotsDir, { recursive: true });

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Business Dashboard' })).toBeVisible();
    await expect(page.getByText('Acme Coffee Co.')).toBeVisible();
    await prepareForScreenshot(page);
    await page.screenshot({ path: path.join(screenshotsDir, 'dashboard.png') });

    const acmeCard = page.locator('div.panel-shell', {
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
    await page.screenshot({ path: path.join(screenshotsDir, 'business_detail.png') });

    await page.getByRole('link', { name: 'View All →' }).click();
    await expect(page).toHaveURL(/\/business\/\d+\/reviews$/);
    await expect(page.getByRole('heading', { name: 'Reviews for Acme Coffee Co.' })).toBeVisible();
    await page.getByLabel('Sentiment').selectOption('negative');
    await page.getByRole('button', { name: 'Filter' }).click();
    await expect(page.getByText('Phil D.')).toBeVisible();
    await page.locator('body').evaluate((body) => {
      (body as HTMLBodyElement).style.zoom = '0.95';
      window.scrollTo(0, 0);
    });
    await prepareForScreenshot(page);
    await page.screenshot({ path: path.join(screenshotsDir, 'reviews.png') });

    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'API Keys' })).toBeVisible();
    await page.locator('body').evaluate((body) => {
      (body as HTMLBodyElement).style.zoom = '0.9';
      window.scrollTo(0, 0);
    });
    await prepareForScreenshot(page);
    await page.screenshot({ path: path.join(screenshotsDir, 'settings.png') });
  });
});
