import { expect, test } from '@playwright/test';

test('loads the sample workspace and navigates into a seeded business', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Business Dashboard' })).toBeVisible();
  await expect(page.getByText('Sample workspace only')).toBeVisible();
  await expect(page.getByText('Acme Coffee Co.')).toBeVisible();

  const acmeCard = page.locator('[data-testid="business-card"]', {
    has: page.getByRole('heading', { name: 'Acme Coffee Co.' }),
  }).first();
  await acmeCard.getByRole('link', { name: 'View Details' }).click();

  await expect(page).toHaveURL(/\/business\/\d+$/);
  await expect(page.getByRole('heading', { name: 'Acme Coffee Co.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Recent Reviews' })).toBeVisible();

  await page.getByRole('link', { name: 'View All →' }).click();
  await expect(page).toHaveURL(/\/business\/\d+\/reviews$/);
  await expect(page.getByRole('heading', { name: 'Reviews for Acme Coffee Co.' })).toBeVisible();
});

test('can start an empty workspace and add a browser-local business without backend search results', async ({
  page,
}) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Start empty workspace' }).click();
  await expect(page.getByText('No businesses tracked yet')).toBeVisible();

  await page.getByRole('button', { name: 'Add Business' }).first().click();
  await page.getByLabel('Business Name *').fill('Test Bakery');
  await page.getByLabel('Location (optional)').fill('Chicago, IL');
  await page.getByRole('button', { name: 'Next: Find Sources' }).click();

  await expect(
    page.getByText('Could not search for existing profiles. You can enter URLs manually below.')
  ).toBeVisible();

  await page.getByRole('button', { name: 'Skip for now' }).click();

  await expect(page.getByRole('heading', { name: 'Business Dashboard' })).toBeVisible();
  await expect(page.getByText('Test Bakery')).toBeVisible();

  const detailHref = await page
    .locator('[data-testid="business-card"]', {
      has: page.getByRole('heading', { name: 'Test Bakery' }),
    })
    .first()
    .locator('a[href^="/business/"]')
    .last()
    .getAttribute('href');

  expect(detailHref).toBeTruthy();
  await page.goto(detailHref!);

  await expect(page.getByRole('heading', { name: 'Test Bakery' })).toBeVisible();
  await expect(page.getByText('No reviews yet. Click "Scrape Now" to fetch reviews.')).toBeVisible();
});
