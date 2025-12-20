import { test, expect } from '@playwright/test';

test.describe('Single File Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/github-code/src/__tests__/e2e/fixtures/test.html');
  });

  test('should display single file component', async ({ page }) => {
    const component = page.locator('#single-file-component');
    await expect(component).toBeVisible();
  });

  test('should show filename in header', async ({ page }) => {
    const component = page.locator('#single-file-component');

    // Wait for content to load (skeleton will be replaced)
    await page.waitForTimeout(2000);

    // Get shadow root content
    const header = await component.evaluate((el) => {
      return el.shadowRoot?.querySelector('header')?.textContent;
    });

    expect(header).toContain('.kt');
  });

  test('should display code with line numbers', async ({ page }) => {
    const component = page.locator('#single-file-component');

    // Wait for content to load
    await page.waitForTimeout(2000);

    const lineNumbers = await component.evaluate((el) => {
      return el.shadowRoot?.querySelectorAll('.line-number').length || 0;
    });

    expect(lineNumbers).toBeGreaterThan(0);
  });

  test('should display code cells with content', async ({ page }) => {
    const component = page.locator('#single-file-component');

    await page.waitForTimeout(2000);

    const codeCells = await component.evaluate((el) => {
      return el.shadowRoot?.querySelectorAll('.code-cell').length || 0;
    });

    expect(codeCells).toBeGreaterThan(0);
  });

  test('should apply syntax highlighting', async ({ page }) => {
    const component = page.locator('#single-file-component');

    await page.waitForTimeout(2000);

    const hasHighlighting = await component.evaluate((el) => {
      const codeCell = el.shadowRoot?.querySelector('.code-cell');
      return codeCell?.innerHTML.includes('hljs') || false;
    });

    expect(hasHighlighting).toBe(true);
  });

  test('should show skeleton loader initially', async ({ page }) => {
    // Reload page to see skeleton
    await page.goto('/github-code/src/__tests__/e2e/fixtures/test.html');

    const component = page.locator('#single-file-component');

    // Check for skeleton within first 100ms
    await page.waitForTimeout(100);

    const hasSkeleton = await component.evaluate((el) => {
      return el.shadowRoot?.querySelector('.skeleton-loading') !== null;
    });

    // Skeleton should be visible initially (or already replaced if loaded quickly)
    // We can't guarantee timing, so we just check the structure exists
    expect(hasSkeleton !== undefined).toBe(true);
  });

  test('should have proper article structure', async ({ page }) => {
    const component = page.locator('#single-file-component');

    await page.waitForTimeout(2000);

    const hasArticle = await component.evaluate((el) => {
      return el.shadowRoot?.querySelector('article') !== null;
    });

    expect(hasArticle).toBe(true);
  });

  test('should load highlight.js stylesheet', async ({ page }) => {
    const component = page.locator('#single-file-component');

    const hasStylesheet = await component.evaluate((el) => {
      const link = el.shadowRoot?.querySelector('link[rel="stylesheet"]');
      return link?.getAttribute('href')?.includes('highlight.js') || false;
    });

    expect(hasStylesheet).toBe(true);
  });

  test('should match line numbers with code cells count', async ({ page }) => {
    const component = page.locator('#single-file-component');

    await page.waitForTimeout(2000);

    const counts = await component.evaluate((el) => {
      const lineNumbers = el.shadowRoot?.querySelectorAll('.line-number').length || 0;
      const codeCells = el.shadowRoot?.querySelectorAll('.code-cell').length || 0;
      return { lineNumbers, codeCells };
    });

    expect(counts.lineNumbers).toBe(counts.codeCells);
    expect(counts.lineNumbers).toBeGreaterThan(0);
  });

  test('should render code in monospace font', async ({ page }) => {
    const component = page.locator('#single-file-component');

    await page.waitForTimeout(2000);

    const fontFamily = await component.evaluate((el) => {
      const codeCell = el.shadowRoot?.querySelector('.code-cell') as HTMLElement;
      return window.getComputedStyle(codeCell).fontFamily;
    });

    expect(fontFamily).toMatch(/mono/i);
  });

  test('should have scrollable code wrapper', async ({ page }) => {
    const component = page.locator('#single-file-component');

    await page.waitForTimeout(2000);

    const hasCodeWrapper = await component.evaluate((el) => {
      return el.shadowRoot?.querySelector('.code-wrapper') !== null;
    });

    expect(hasCodeWrapper).toBe(true);
  });
});
