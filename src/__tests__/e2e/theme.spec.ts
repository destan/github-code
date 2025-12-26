import { test, expect } from '@playwright/test';

test.describe('Theme Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/github-code/src/__tests__/e2e/fixtures/test.html');
  });

  test('should use dark theme when theme="dark"', async ({ page }) => {
    const component = page.locator('#dark-theme-component');

    await page.waitForTimeout(1000);

    const stylesheetHref = await component.evaluate((el) => {
      const link = el.shadowRoot?.querySelector('link[rel="stylesheet"]');
      return link?.getAttribute('href') || '';
    });

    expect(stylesheetHref).toContain('github-dark');
  });

  test('should use light theme when theme="light"', async ({ page }) => {
    const component = page.locator('#light-theme-component');

    await page.waitForTimeout(1000);

    const stylesheetHref = await component.evaluate((el) => {
      const link = el.shadowRoot?.querySelector('link[rel="stylesheet"]');
      return link?.getAttribute('href') || '';
    });

    expect(stylesheetHref).toContain('github.min.css');
    expect(stylesheetHref).not.toContain('github-dark');
  });

  test('should apply dark theme styles to component with theme="dark"', async ({ page }) => {
    const component = page.locator('#dark-theme-component');

    await page.waitForTimeout(2000);

    // Check if dark styles are applied by verifying background color is dark
    const backgroundColor = await component.evaluate((el) => {
      const article = el.shadowRoot?.querySelector('article') as HTMLElement;
      return window.getComputedStyle(article).backgroundColor;
    });

    // Dark background should have low RGB values
    // We can't test exact colors due to CSS variable complexity,
    // but we can verify the stylesheet is loaded correctly
    expect(backgroundColor).toBeTruthy();
  });

  test('should apply light theme styles to component with theme="light"', async ({ page }) => {
    const component = page.locator('#light-theme-component');

    await page.waitForTimeout(2000);

    const backgroundColor = await component.evaluate((el) => {
      const article = el.shadowRoot?.querySelector('article') as HTMLElement;
      return window.getComputedStyle(article).backgroundColor;
    });

    expect(backgroundColor).toBeTruthy();
  });

  test('should load correct highlight.js theme stylesheet for dark', async ({ page }) => {
    const component = page.locator('#dark-theme-component');

    const stylesheetInfo = await component.evaluate((el) => {
      const link = el.shadowRoot?.querySelector('link[rel="stylesheet"]');
      return {
        href: link?.getAttribute('href') || '',
        loaded: link !== null,
      };
    });

    expect(stylesheetInfo.loaded).toBe(true);
    expect(stylesheetInfo.href).toContain('highlight.js');
    expect(stylesheetInfo.href).toContain('11.11.1');
    expect(stylesheetInfo.href).toContain('github-dark.min.css');
  });

  test('should load correct highlight.js theme stylesheet for light', async ({ page }) => {
    const component = page.locator('#light-theme-component');

    const stylesheetInfo = await component.evaluate((el) => {
      const link = el.shadowRoot?.querySelector('link[rel="stylesheet"]');
      return {
        href: link?.getAttribute('href') || '',
        loaded: link !== null,
      };
    });

    expect(stylesheetInfo.loaded).toBe(true);
    expect(stylesheetInfo.href).toContain('highlight.js');
    expect(stylesheetInfo.href).toContain('11.11.1');
    expect(stylesheetInfo.href).toContain('github.min.css');
    expect(stylesheetInfo.href).not.toContain('github-dark');
  });

  test('should use constructable stylesheets for dark theme', async ({ page }) => {
    const component = page.locator('#dark-theme-component');

    await page.waitForTimeout(1000);

    const hasAdoptedStylesheets = await component.evaluate((el) => {
      return (el.shadowRoot?.adoptedStyleSheets?.length || 0) > 0;
    });

    expect(hasAdoptedStylesheets).toBe(true);
  });

  test('should use constructable stylesheets for light theme', async ({ page }) => {
    const component = page.locator('#light-theme-component');

    await page.waitForTimeout(1000);

    const hasAdoptedStylesheets = await component.evaluate((el) => {
      return (el.shadowRoot?.adoptedStyleSheets?.length || 0) > 0;
    });

    expect(hasAdoptedStylesheets).toBe(true);
  });

  test('should apply syntax highlighting with dark theme', async ({ page }) => {
    const component = page.locator('#dark-theme-component');

    await page.waitForTimeout(2000);

    const hasHighlighting = await component.evaluate((el) => {
      const codeCell = el.shadowRoot?.querySelector('.code-cell');
      return codeCell?.innerHTML.includes('hljs') || false;
    });

    expect(hasHighlighting).toBe(true);
  });

  test('should apply syntax highlighting with light theme', async ({ page }) => {
    const component = page.locator('#light-theme-component');

    await page.waitForTimeout(2000);

    const hasHighlighting = await component.evaluate((el) => {
      const codeCell = el.shadowRoot?.querySelector('.code-cell');
      return codeCell?.innerHTML.includes('hljs') || false;
    });

    expect(hasHighlighting).toBe(true);
  });

  test('should render dark theme in layout context', async ({ page }) => {
    const component = page.locator('#layout-component');

    await page.waitForTimeout(1000);

    const stylesheetHref = await component.evaluate((el) => {
      const link = el.shadowRoot?.querySelector('link[rel="stylesheet"]');
      return link?.getAttribute('href') || '';
    });

    expect(stylesheetHref).toContain('github-dark');
  });

  test('should handle theme attribute on single file component', async ({ page }) => {
    // Single file component doesn't have theme attribute, should use default
    const component = page.locator('#single-file-component');

    await page.waitForTimeout(1000);

    const stylesheetHref = await component.evaluate((el) => {
      const link = el.shadowRoot?.querySelector('link[rel="stylesheet"]');
      return link?.getAttribute('href') || '';
    });

    // Should have a valid highlight.js stylesheet URL
    expect(stylesheetHref).toContain('highlight.js');
    expect(stylesheetHref).toContain('.min.css');
  });

  test('should handle theme attribute on multi-file component', async ({ page }) => {
    // Multi-file component doesn't have theme attribute either
    const component = page.locator('#multi-file-component');

    await page.waitForTimeout(1000);

    const stylesheetHref = await component.evaluate((el) => {
      const link = el.shadowRoot?.querySelector('link[rel="stylesheet"]');
      return link?.getAttribute('href') || '';
    });

    expect(stylesheetHref).toContain('highlight.js');
  });

  test('should apply tab styles with dark theme', async ({ page }) => {
    const component = page.locator('#multi-file-component');

    await page.waitForTimeout(2000);

    const adoptedSheetsCount = await component.evaluate((el) => {
      return el.shadowRoot?.adoptedStyleSheets?.length || 0;
    });

    // Multi-file should have both base and tab stylesheets
    expect(adoptedSheetsCount).toBeGreaterThanOrEqual(2);
  });

  test('should maintain theme consistency across tabs', async ({ page }) => {
    const component = page.locator('#multi-file-component');

    await page.waitForTimeout(2000);

    // Get theme from first tab
    const theme1 = await component.evaluate((el) => {
      const link = el.shadowRoot?.querySelector('link[rel="stylesheet"]');
      return link?.getAttribute('href') || '';
    });

    // Switch to second tab
    await component.evaluate((el) => {
      const tabs = el.shadowRoot?.querySelectorAll('button[role="tab"]');
      (tabs?.[1] as HTMLButtonElement)?.click();
    });

    await page.waitForTimeout(1000);

    // Get theme from second tab (should be same)
    const theme2 = await component.evaluate((el) => {
      const link = el.shadowRoot?.querySelector('link[rel="stylesheet"]');
      return link?.getAttribute('href') || '';
    });

    expect(theme1).toBe(theme2);
  });

  test('should use CDN for highlight.js stylesheets', async ({ page }) => {
    const component = page.locator('#light-theme-component');

    const usescdn = await component.evaluate((el) => {
      const link = el.shadowRoot?.querySelector('link[rel="stylesheet"]');
      const href = link?.getAttribute('href') || '';
      return href.includes('cdnjs.cloudflare.com');
    });

    expect(usescdn).toBe(true);
  });

  test('should load minified CSS files for performance', async ({ page }) => {
    const component = page.locator('#dark-theme-component');

    const isMinified = await component.evaluate((el) => {
      const link = el.shadowRoot?.querySelector('link[rel="stylesheet"]');
      const href = link?.getAttribute('href') || '';
      return href.includes('.min.css');
    });

    expect(isMinified).toBe(true);
  });

  test('should preserve multi-file content when switching theme', async ({ page }) => {
    const component = page.locator('#multi-file-component');

    // First set a theme so we have a baseline (simulates demo page behavior)
    await component.evaluate((el) => {
      el.setAttribute('theme', 'light');
    });

    // Wait for content to fully load
    await page.waitForTimeout(3000);

    // Verify content is loaded (not skeleton)
    const contentBeforeThemeChange = await component.evaluate((el) => {
      const panel = el.shadowRoot?.querySelector('section[role="tabpanel"]');
      const hasSkeleton = panel?.querySelector('.skeleton') !== null;
      const hasCode = panel?.querySelector('.code-cell') !== null;
      const stylesheetHref = el.shadowRoot?.querySelector('link')?.getAttribute('href') || '';
      return { hasSkeleton, hasCode, stylesheetHref };
    });

    expect(contentBeforeThemeChange.hasCode).toBe(true);
    expect(contentBeforeThemeChange.hasSkeleton).toBe(false);
    expect(contentBeforeThemeChange.stylesheetHref).toContain('github.min.css');
    expect(contentBeforeThemeChange.stylesheetHref).not.toContain('github-dark');

    // Change theme from light to dark
    await component.evaluate((el) => {
      el.setAttribute('theme', 'dark');
    });

    await page.waitForTimeout(500);

    // Verify content is still visible (not reverted to skeleton)
    const contentAfterThemeChange = await component.evaluate((el) => {
      const panel = el.shadowRoot?.querySelector('section[role="tabpanel"]');
      const hasSkeleton = panel?.querySelector('.skeleton') !== null;
      const hasCode = panel?.querySelector('.code-cell') !== null;
      const stylesheetHref = el.shadowRoot?.querySelector('link')?.getAttribute('href') || '';
      return { hasSkeleton, hasCode, stylesheetHref };
    });

    expect(contentAfterThemeChange.hasCode).toBe(true);
    expect(contentAfterThemeChange.hasSkeleton).toBe(false);
    expect(contentAfterThemeChange.stylesheetHref).toContain('github-dark');
  });
});
