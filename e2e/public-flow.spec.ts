import { expect, test } from '@playwright/test';

test.describe('public flow guardrails', () => {
  test('Concept Tree preview stays on the landing page', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Concept Tree' })).toHaveAttribute('href', '#concept-tree');

    await page.getByRole('link', { name: 'Concept Tree' }).click();
    await expect(page).toHaveURL(/#concept-tree$/);
    await expect(page.getByText('Concept Tree Preview').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Frequency Heat Map' })).toBeVisible();
    await expect(page.getByRole('button', { name: /MPCE-021/ })).toBeVisible();
    await expect(page.getByText('Showing all 18 public topic clusters for this paper.')).toBeVisible();
    await expect(page.getByText('Depression: Causes, Symptoms, and Treatment')).toBeVisible();
    await expect(page.getByText('HIV/AIDS Counselling and Special Populations')).toBeVisible();
    await expect(page.getByText('Sign up to see the important questions for June 2026 TEE for each topic.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Unlock questions' })).toHaveAttribute('href', '/signup?next=%2Fdashboard');

    await expect(page.getByRole('button', { name: /MPC-005/ })).toBeVisible();
  });

  test('signup CTAs preserve their intended destination', async ({ page }) => {
    await page.goto('/');

    const startFreeLinks = page.getByRole('link', { name: /Start Free/ });
    const startFreeCount = await startFreeLinks.count();
    expect(startFreeCount).toBeGreaterThan(0);

    for (let index = 0; index < startFreeCount; index += 1) {
      await expect(startFreeLinks.nth(index)).toHaveAttribute('href', '/signup?next=%2Fdashboard');
    }

    const pricingSection = page.locator('#pricing');
    await expect(pricingSection.getByRole('link', { name: 'Get Started' }).nth(0)).toHaveAttribute('href', '/signup?next=%2Fdashboard');
    await expect(pricingSection.getByRole('link', { name: 'Get Started' }).nth(1)).toHaveAttribute('href', '/signup?next=%2Fpricing');
    await expect(pricingSection.getByRole('link', { name: 'Get Started' }).nth(2)).toHaveAttribute('href', '/signup?next=%2Fpricing');
  });

  test('protected routes redirect to login with next preserved', async ({ page }) => {
    await page.goto('/pricing');

    await expect(page).toHaveURL(/\/login\?next=%2Fpricing$/);
    await expect(page.locator('input[name="redirectTo"][value="/pricing"]')).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Sign up now' })).toHaveAttribute('href', '/signup?next=%2Fpricing');
  });
});
