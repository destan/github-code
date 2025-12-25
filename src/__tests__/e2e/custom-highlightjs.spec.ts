import { test, expect } from '@playwright/test';

test.describe('GitHubCode.info', () => {
  test('should expose runtime information', async ({ page }) => {
    await page.goto('/github-code/src/__tests__/e2e/fixtures/test.html');
    await page.waitForTimeout(2000);

    const info = await page.evaluate(() => {
      const GitHubCode = customElements.get('github-code');
      return (GitHubCode as any).info;
    });

    expect(info).toHaveProperty('version');
    expect(info).toHaveProperty('highlightjsUrl');
    expect(info).toHaveProperty('highlightjsSource');
    expect(typeof info.version).toBe('string');
    expect(info.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  test('should report highlightjsSource correctly', async ({ page }) => {
    await page.goto('/github-code/src/__tests__/e2e/fixtures/test.html');
    await page.waitForTimeout(2000);

    const info = await page.evaluate(() => {
      const GitHubCode = customElements.get('github-code');
      return (GitHubCode as any).info;
    });

    expect(['user-provided', 'cdn-default', 'global']).toContain(info.highlightjsSource);
  });
});
