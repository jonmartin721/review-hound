import { expect, test, type Page } from '@playwright/test';

async function blockBackendApi(page: Page): Promise<string[]> {
  const blockedRequests: string[] = [];

  await page.route('**/api/**', async (route) => {
    blockedRequests.push(route.request().url());
    await route.abort();
  });

  return blockedRequests;
}

test('sample mode can add and initially scrape a business with the backend offline', async ({ page }) => {
  const blockedRequests = await blockBackendApi(page);

  await page.goto('/');

  await page.getByRole('button', { name: 'Add Business' }).first().click();
  await page.getByLabel('Business Name *').fill('Riverstone Home Services');
  await page.getByLabel('Location (optional)').fill('Phoenix, AZ');
  await page.getByRole('button', { name: 'Next: Find Sources' }).click();

  await expect(page.getByText('Riverstone Home Services').first()).toBeVisible();
  await page.locator('input[name="trustpilotSource"]').first().check();
  await page.locator('input[name="bbbSource"]').first().check();
  await page.getByRole('button', { name: 'Save Business' }).click();

  await expect(page).toHaveURL(/\/business\/\d+$/);
  await expect(page.getByRole('heading', { name: 'Riverstone Home Services' })).toBeVisible();
  await expect(page.getByText('Mina D.')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'trustpilot' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'bbb' })).toBeVisible();

  expect(blockedRequests).toEqual([]);
});

test('sample mode can scrape seeded mixed-source businesses with the backend offline', async ({ page }) => {
  const blockedRequests = await blockBackendApi(page);

  await page.goto('/');

  const riverstoneCard = page.locator('[data-testid="business-card"]', {
    has: page.getByRole('heading', { name: 'Riverstone Home Services' }),
  }).first();
  await riverstoneCard.getByRole('link', { name: 'View Details' }).click();

  await expect(page).toHaveURL(/\/business\/\d+$/);
  await expect(page.getByRole('heading', { name: 'Riverstone Home Services' })).toBeVisible();

  await page.getByRole('button', { name: 'Scrape Now' }).click();
  await expect(page.getByRole('button', { name: 'Done!' })).toBeVisible();
  await expect(page.getByText('Dana K.')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'yelp_api' }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: 'google_places' }).first()).toBeVisible();

  expect(blockedRequests).toEqual([]);
});
