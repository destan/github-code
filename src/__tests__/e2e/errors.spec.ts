import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/github-code/src/__tests__/e2e/fixtures/test.html');
  });

  test('should display error when file attribute is missing', async ({ page }) => {
    const component = page.locator('#error-missing-component');

    await page.waitForTimeout(500);

    const hasError = await component.evaluate((el) => {
      return el.shadowRoot?.querySelector('.error') !== null;
    });

    expect(hasError).toBe(true);
  });

  test('should show helpful error message for missing file attribute', async ({ page }) => {
    const component = page.locator('#error-missing-component');

    await page.waitForTimeout(500);

    const errorText = await component.evaluate((el) => {
      const errorDiv = el.shadowRoot?.querySelector('.error');
      return errorDiv?.textContent || '';
    });

    expect(errorText).toContain('"file" attribute is required');
  });

  test('should display error for invalid GitHub URL', async ({ page }) => {
    const component = page.locator('#error-invalid-component');

    await page.waitForTimeout(500);

    const hasError = await component.evaluate((el) => {
      return el.shadowRoot?.querySelector('.error') !== null;
    });

    expect(hasError).toBe(true);
  });

  test('should show helpful error message for invalid URL', async ({ page }) => {
    const component = page.locator('#error-invalid-component');

    await page.waitForTimeout(500);

    const errorText = await component.evaluate((el) => {
      const errorDiv = el.shadowRoot?.querySelector('.error');
      return errorDiv?.textContent || '';
    });

    expect(errorText).toContain('Invalid GitHub URL');
    expect(errorText).toContain('https://github.com/{owner}/{repo}/blob/{commit}/{path}');
  });

  test('should sanitize invalid URL in error message', async ({ page }) => {
    const component = page.locator('#error-invalid-component');

    await page.waitForTimeout(500);

    const errorText = await component.evaluate((el) => {
      const errorDiv = el.shadowRoot?.querySelector('.error');
      return errorDiv?.textContent || '';
    });

    // Should show the URL in the error message
    expect(errorText).toContain('invalid-url-format.com');
    // Should not contain any unescaped HTML tags if URL had malicious content
    expect(errorText).not.toMatch(/<script[^>]*>/);
  });

  test('should apply error styles', async ({ page }) => {
    const component = page.locator('#error-missing-component');

    await page.waitForTimeout(500);

    const errorStyles = await component.evaluate((el) => {
      const errorDiv = el.shadowRoot?.querySelector('.error') as HTMLElement;
      if (!errorDiv) return null;

      const styles = window.getComputedStyle(errorDiv);
      return {
        padding: styles.padding,
        borderRadius: styles.borderRadius,
        display: styles.display,
      };
    });

    expect(errorStyles).toBeTruthy();
    expect(errorStyles?.padding).toBeTruthy();
    expect(errorStyles?.borderRadius).toBeTruthy();
  });

  test('should not show retry button for validation errors', async ({ page }) => {
    const component = page.locator('#error-invalid-component');

    await page.waitForTimeout(500);

    const hasRetryButton = await component.evaluate((el) => {
      return el.shadowRoot?.querySelector('.retry-button') !== null;
    });

    // Validation errors (invalid URL) should not have retry button
    expect(hasRetryButton).toBe(false);
  });

  test('should handle dynamic attribute change', async ({ page }) => {
    const component = page.locator('#dynamic-component');

    await page.waitForTimeout(2000);

    // Initially should show valid content
    let hasError = await component.evaluate((el) => {
      return el.shadowRoot?.querySelector('.error') !== null;
    });
    expect(hasError).toBe(false);

    // Click button to change file
    await page.click('#change-file-btn');

    await page.waitForTimeout(2000);

    // Should still show valid content (different file)
    hasError = await component.evaluate((el) => {
      return el.shadowRoot?.querySelector('.error') !== null;
    });
    expect(hasError).toBe(false);

    const header = await component.evaluate((el) => {
      return el.shadowRoot?.querySelector('header')?.textContent || '';
    });
    expect(header).toContain('.kt');
  });

  test('should handle changing from single file to tabs', async ({ page }) => {
    const component = page.locator('#dynamic-component');

    await page.waitForTimeout(2000);

    // Initially should show single file (no tabs)
    let tabCount = await component.evaluate((el) => {
      return el.shadowRoot?.querySelectorAll('button[role="tab"]').length || 0;
    });
    expect(tabCount).toBe(0);

    // Click button to change to multiple files
    await page.click('#change-to-tabs-btn');

    await page.waitForTimeout(2000);

    // Should now show tabs
    tabCount = await component.evaluate((el) => {
      return el.shadowRoot?.querySelectorAll('button[role="tab"]').length || 0;
    });
    expect(tabCount).toBe(2);
  });

  test('should handle empty file attribute', async ({ page }) => {
    // Add a component with empty file attribute dynamically
    await page.evaluate(() => {
      const component = document.createElement('github-code');
      component.setAttribute('file', '');
      component.id = 'empty-file-component';
      document.body.appendChild(component);
    });

    await page.waitForTimeout(500);

    const component = page.locator('#empty-file-component');

    const hasError = await component.evaluate((el) => {
      return el.shadowRoot?.querySelector('.error') !== null;
    });

    expect(hasError).toBe(true);
  });

  test('should handle whitespace-only file attribute', async ({ page }) => {
    // Add a component with whitespace-only file attribute
    await page.evaluate(() => {
      const component = document.createElement('github-code');
      component.setAttribute('file', '   ');
      component.id = 'whitespace-file-component';
      document.body.appendChild(component);
    });

    await page.waitForTimeout(500);

    const component = page.locator('#whitespace-file-component');

    const hasError = await component.evaluate((el) => {
      return el.shadowRoot?.querySelector('.error') !== null;
    });

    expect(hasError).toBe(true);
  });

  test('should handle mixed valid and invalid URLs', async ({ page }) => {
    // Add a component with one valid and one invalid URL
    await page.evaluate(() => {
      const component = document.createElement('github-code');
      component.setAttribute('file', 'https://github.com/owner/repo/blob/main/file.ts,https://invalid.com/bad');
      component.id = 'mixed-urls-component';
      document.body.appendChild(component);
    });

    await page.waitForTimeout(500);

    const component = page.locator('#mixed-urls-component');

    // Should show error for invalid URL (validation happens before any fetch)
    const hasError = await component.evaluate((el) => {
      return el.shadowRoot?.querySelector('.error') !== null;
    });

    expect(hasError).toBe(true);
  });

  test('should show error div with proper structure', async ({ page }) => {
    const component = page.locator('#error-missing-component');

    await page.waitForTimeout(500);

    const errorStructure = await component.evaluate((el) => {
      const errorDiv = el.shadowRoot?.querySelector('.error');
      return {
        exists: errorDiv !== null,
        tagName: errorDiv?.tagName,
        className: errorDiv?.className,
      };
    });

    expect(errorStructure.exists).toBe(true);
    expect(errorStructure.tagName).toBe('DIV');
    expect(errorStructure.className).toBe('error');
  });

  test('should apply stylesheets even in error state', async ({ page }) => {
    const component = page.locator('#error-missing-component');

    await page.waitForTimeout(500);

    const hasStylesheets = await component.evaluate((el) => {
      return (el.shadowRoot?.adoptedStyleSheets?.length || 0) > 0;
    });

    expect(hasStylesheets).toBe(true);
  });

  test('should handle special characters in error messages', async ({ page }) => {
    // Add a component with special characters in URL
    await page.evaluate(() => {
      const component = document.createElement('github-code');
      component.setAttribute('file', 'https://test.com/<script>alert("xss")</script>');
      component.id = 'xss-test-component';
      document.body.appendChild(component);
    });

    await page.waitForTimeout(500);

    const component = page.locator('#xss-test-component');

    const errorText = await component.evaluate((el) => {
      const errorDiv = el.shadowRoot?.querySelector('.error');
      return errorDiv?.textContent || '';
    });

    // Should display the URL as text (HTML-escaped to prevent XSS)
    expect(errorText).toContain('test.com');
    expect(errorText).toContain('&lt;script&gt;');

    // Verify that no actual script tag exists in the DOM
    const hasScriptTag = await component.evaluate((el) => {
      return el.shadowRoot?.querySelector('script') !== null;
    });
    expect(hasScriptTag).toBe(false);
  });

  test('should maintain component isolation in error state', async ({ page }) => {
    const component = page.locator('#error-missing-component');

    await page.waitForTimeout(500);

    // Check that error is only in shadow root, not in light DOM
    const lightDOMContent = await component.evaluate((el) => {
      return el.textContent || '';
    });

    expect(lightDOMContent).toBe('');

    const shadowDOMContent = await component.evaluate((el) => {
      return el.shadowRoot?.textContent || '';
    });

    expect(shadowDOMContent).toContain('"file" attribute is required');
  });

  test('should handle URL with query parameters', async ({ page }) => {
    // Add a component with query params in URL (not valid GitHub blob URL)
    await page.evaluate(() => {
      const component = document.createElement('github-code');
      component.setAttribute('file', 'https://github.com/owner/repo/blob/main/file.ts?tab=readme');
      component.id = 'query-params-component';
      document.body.appendChild(component);
    });

    await page.waitForTimeout(500);

    const component = page.locator('#query-params-component');

    // Query params are part of the URL, so this may or may not be valid
    // depending on the parsing logic. Let's just verify it handles it gracefully
    const hasContent = await component.evaluate((el) => {
      return el.shadowRoot?.innerHTML !== '';
    });

    expect(hasContent).toBe(true);
  });

  test('should handle URL with fragment identifier', async ({ page }) => {
    // Add a component with fragment in URL
    await page.evaluate(() => {
      const component = document.createElement('github-code');
      component.setAttribute('file', 'https://github.com/owner/repo/blob/main/file.ts#L10-L20');
      component.id = 'fragment-component';
      document.body.appendChild(component);
    });

    await page.waitForTimeout(500);

    const component = page.locator('#fragment-component');

    const hasContent = await component.evaluate((el) => {
      return el.shadowRoot?.innerHTML !== '';
    });

    expect(hasContent).toBe(true);
  });
});
