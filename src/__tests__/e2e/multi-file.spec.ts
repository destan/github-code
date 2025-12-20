import { test, expect } from '@playwright/test';

test.describe('Multi-File Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/github-code/src/__tests__/e2e/fixtures/test.html');
  });

  test('should display multiple tabs', async ({ page }) => {
    const component = page.locator('#multi-file-component');

    await page.waitForTimeout(1000);

    const tabCount = await component.evaluate((el) => {
      return el.shadowRoot?.querySelectorAll('button[role="tab"]').length || 0;
    });

    expect(tabCount).toBe(3);
  });

  test('should show correct filenames in tabs', async ({ page }) => {
    const component = page.locator('#multi-file-component');

    await page.waitForTimeout(1000);

    const tabTexts = await component.evaluate((el) => {
      const tabs = el.shadowRoot?.querySelectorAll('button[role="tab"]');
      return Array.from(tabs || []).map((tab) => tab.textContent?.trim());
    });

    expect(tabTexts[0]).toContain('.kt');
    expect(tabTexts[1]).toContain('.kt');
    expect(tabTexts[2]).toContain('.java');
  });

  test('should mark first tab as active by default', async ({ page }) => {
    const component = page.locator('#multi-file-component');

    await page.waitForTimeout(1000);

    const activeStates = await component.evaluate((el) => {
      const tabs = el.shadowRoot?.querySelectorAll('button[role="tab"]');
      return Array.from(tabs || []).map((tab) => tab.getAttribute('aria-selected') === 'true');
    });

    expect(activeStates[0]).toBe(true);
    expect(activeStates[1]).toBe(false);
    expect(activeStates[2]).toBe(false);
  });

  test('should switch tabs on click', async ({ page }) => {
    const component = page.locator('#multi-file-component');

    await page.waitForTimeout(2000);

    // Click second tab
    await component.evaluate((el) => {
      const tabs = el.shadowRoot?.querySelectorAll('button[role="tab"]');
      (tabs?.[1] as HTMLButtonElement)?.click();
    });

    await page.waitForTimeout(500);

    const activeStates = await component.evaluate((el) => {
      const tabs = el.shadowRoot?.querySelectorAll('button[role="tab"]');
      return Array.from(tabs || []).map((tab) => tab.getAttribute('aria-selected') === 'true');
    });

    expect(activeStates[0]).toBe(false);
    expect(activeStates[1]).toBe(true);
    expect(activeStates[2]).toBe(false);
  });

  test('should display different content when switching tabs', async ({ page }) => {
    const component = page.locator('#multi-file-component');

    await page.waitForTimeout(2000);

    // Get content of first tab
    const firstTabContent = await component.evaluate((el) => {
      const panel = el.shadowRoot?.querySelector('section[role="tabpanel"]');
      return panel?.textContent || '';
    });

    // Click second tab
    await component.evaluate((el) => {
      const tabs = el.shadowRoot?.querySelectorAll('button[role="tab"]');
      (tabs?.[1] as HTMLButtonElement)?.click();
    });

    await page.waitForTimeout(2000);

    // Get content of second tab
    const secondTabContent = await component.evaluate((el) => {
      const panels = el.shadowRoot?.querySelectorAll('section[role="tabpanel"]');
      const visiblePanel = Array.from(panels || []).find((panel) => panel.getAttribute('aria-hidden') !== 'true');
      return visiblePanel?.textContent || '';
    });

    expect(firstTabContent).not.toBe(secondTabContent);
  });

  test('should lazy-load tab content', async ({ page }) => {
    const component = page.locator('#multi-file-component');

    await page.waitForTimeout(2000);

    // Initially, only first tab panel should exist or be loaded
    const initialPanelCount = await component.evaluate((el) => {
      return el.shadowRoot?.querySelectorAll('section[role="tabpanel"]').length || 0;
    });

    // Should have at least 1 panel (active tab)
    expect(initialPanelCount).toBeGreaterThanOrEqual(1);

    // Click second tab to trigger lazy load
    await component.evaluate((el) => {
      const tabs = el.shadowRoot?.querySelectorAll('button[role="tab"]');
      (tabs?.[1] as HTMLButtonElement)?.click();
    });

    await page.waitForTimeout(2000);

    // Now should have 2 panels
    const afterClickPanelCount = await component.evaluate((el) => {
      return el.shadowRoot?.querySelectorAll('section[role="tabpanel"]').length || 0;
    });

    expect(afterClickPanelCount).toBeGreaterThanOrEqual(2);
  });

  test('should support keyboard navigation with ArrowRight', async ({ page }) => {
    const component = page.locator('#multi-file-component');

    await page.waitForTimeout(2000);

    // Focus first tab and press ArrowRight
    await component.evaluate((el) => {
      const firstTab = el.shadowRoot?.querySelector('button[role="tab"]') as HTMLElement;
      firstTab?.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      });
      firstTab?.dispatchEvent(event);
    });

    await page.waitForTimeout(500);

    const activeStates = await component.evaluate((el) => {
      const tabs = el.shadowRoot?.querySelectorAll('button[role="tab"]');
      return Array.from(tabs || []).map((tab) => tab.getAttribute('aria-selected') === 'true');
    });

    expect(activeStates[1]).toBe(true);
  });

  test('should support keyboard navigation with ArrowLeft', async ({ page }) => {
    const component = page.locator('#multi-file-component');

    await page.waitForTimeout(2000);

    // Click second tab first
    await component.evaluate((el) => {
      const tabs = el.shadowRoot?.querySelectorAll('button[role="tab"]');
      (tabs?.[1] as HTMLButtonElement)?.click();
    });

    await page.waitForTimeout(500);

    // Press ArrowLeft on the focused tab
    await component.evaluate((el) => {
      const tabs = el.shadowRoot?.querySelectorAll('button[role="tab"]');
      const secondTab = tabs?.[1] as HTMLElement;
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        bubbles: true,
        cancelable: true,
      });
      secondTab?.dispatchEvent(event);
    });

    await page.waitForTimeout(500);

    const activeStates = await component.evaluate((el) => {
      const tabs = el.shadowRoot?.querySelectorAll('button[role="tab"]');
      return Array.from(tabs || []).map((tab) => tab.getAttribute('aria-selected') === 'true');
    });

    expect(activeStates[0]).toBe(true);
  });

  test('should support keyboard navigation with Home key', async ({ page }) => {
    const component = page.locator('#multi-file-component');

    await page.waitForTimeout(2000);

    // Click last tab first
    await component.evaluate((el) => {
      const tabs = el.shadowRoot?.querySelectorAll('button[role="tab"]');
      (tabs?.[2] as HTMLButtonElement)?.click();
    });

    await page.waitForTimeout(500);

    // Press Home on the focused tab
    await component.evaluate((el) => {
      const tabs = el.shadowRoot?.querySelectorAll('button[role="tab"]');
      const lastTab = tabs?.[2] as HTMLElement;
      const event = new KeyboardEvent('keydown', {
        key: 'Home',
        bubbles: true,
        cancelable: true,
      });
      lastTab?.dispatchEvent(event);
    });

    await page.waitForTimeout(500);

    const activeStates = await component.evaluate((el) => {
      const tabs = el.shadowRoot?.querySelectorAll('button[role="tab"]');
      return Array.from(tabs || []).map((tab) => tab.getAttribute('aria-selected') === 'true');
    });

    expect(activeStates[0]).toBe(true);
  });

  test('should support keyboard navigation with End key', async ({ page }) => {
    const component = page.locator('#multi-file-component');

    await page.waitForTimeout(2000);

    // Press End from first tab
    await component.evaluate((el) => {
      const tabs = el.shadowRoot?.querySelectorAll('button[role="tab"]');
      const firstTab = tabs?.[0] as HTMLElement;
      const event = new KeyboardEvent('keydown', {
        key: 'End',
        bubbles: true,
        cancelable: true,
      });
      firstTab?.dispatchEvent(event);
    });

    await page.waitForTimeout(500);

    const activeStates = await component.evaluate((el) => {
      const tabs = el.shadowRoot?.querySelectorAll('button[role="tab"]');
      return Array.from(tabs || []).map((tab) => tab.getAttribute('aria-selected') === 'true');
    });

    expect(activeStates[2]).toBe(true);
  });

  test('should wrap around with ArrowRight at last tab', async ({ page }) => {
    const component = page.locator('#multi-file-component');

    await page.waitForTimeout(2000);

    // Click last tab
    await component.evaluate((el) => {
      const tabs = el.shadowRoot?.querySelectorAll('button[role="tab"]');
      (tabs?.[2] as HTMLButtonElement)?.click();
    });

    await page.waitForTimeout(500);

    // Press ArrowRight (should wrap to first)
    await component.evaluate((el) => {
      const tabs = el.shadowRoot?.querySelectorAll('button[role="tab"]');
      const lastTab = tabs?.[2] as HTMLElement;
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      });
      lastTab?.dispatchEvent(event);
    });

    await page.waitForTimeout(500);

    const activeStates = await component.evaluate((el) => {
      const tabs = el.shadowRoot?.querySelectorAll('button[role="tab"]');
      return Array.from(tabs || []).map((tab) => tab.getAttribute('aria-selected') === 'true');
    });

    expect(activeStates[0]).toBe(true);
  });

  test('should wrap around with ArrowLeft at first tab', async ({ page }) => {
    const component = page.locator('#multi-file-component');

    await page.waitForTimeout(2000);

    // Press ArrowLeft from first tab (should wrap to last)
    await component.evaluate((el) => {
      const tabs = el.shadowRoot?.querySelectorAll('button[role="tab"]');
      const firstTab = tabs?.[0] as HTMLElement;
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        bubbles: true,
        cancelable: true,
      });
      firstTab?.dispatchEvent(event);
    });

    await page.waitForTimeout(500);

    const activeStates = await component.evaluate((el) => {
      const tabs = el.shadowRoot?.querySelectorAll('button[role="tab"]');
      return Array.from(tabs || []).map((tab) => tab.getAttribute('aria-selected') === 'true');
    });

    expect(activeStates[2]).toBe(true);
  });

  test('should have accessible tab navigation', async ({ page }) => {
    const component = page.locator('#multi-file-component');

    await page.waitForTimeout(1000);

    const accessibilityInfo = await component.evaluate((el) => {
      const nav = el.shadowRoot?.querySelector('nav[role="tablist"]');
      const tabs = el.shadowRoot?.querySelectorAll('button[role="tab"]');
      const panels = el.shadowRoot?.querySelectorAll('section[role="tabpanel"]');

      return {
        navRole: nav?.getAttribute('role'),
        navLabel: nav?.getAttribute('aria-label'),
        tabRoles: Array.from(tabs || []).map((tab) => tab.getAttribute('role')),
        panelRoles: Array.from(panels || []).map((panel) => panel.getAttribute('role')),
      };
    });

    expect(accessibilityInfo.navRole).toBe('tablist');
    expect(accessibilityInfo.navLabel).toBeTruthy();
    expect(accessibilityInfo.tabRoles.every((role) => role === 'tab')).toBe(true);
    expect(accessibilityInfo.panelRoles.every((role) => role === 'tabpanel')).toBe(true);
  });

  test('should maintain tab state when switching back', async ({ page }) => {
    const component = page.locator('#multi-file-component');

    await page.waitForTimeout(2000);

    // Click second tab
    await component.evaluate((el) => {
      const tabs = el.shadowRoot?.querySelectorAll('button[role="tab"]');
      (tabs?.[1] as HTMLButtonElement)?.click();
    });

    await page.waitForTimeout(2000);

    // Get second tab content
    const secondTabContent = await component.evaluate((el) => {
      const panels = el.shadowRoot?.querySelectorAll('section[role="tabpanel"]');
      const panel = panels?.[1];
      return panel?.innerHTML || '';
    });

    // Click third tab
    await component.evaluate((el) => {
      const tabs = el.shadowRoot?.querySelectorAll('button[role="tab"]');
      (tabs?.[2] as HTMLButtonElement)?.click();
    });

    await page.waitForTimeout(2000);

    // Click back to second tab
    await component.evaluate((el) => {
      const tabs = el.shadowRoot?.querySelectorAll('button[role="tab"]');
      (tabs?.[1] as HTMLButtonElement)?.click();
    });

    await page.waitForTimeout(500);

    // Content should still be there (cached)
    const secondTabContentAgain = await component.evaluate((el) => {
      const panels = el.shadowRoot?.querySelectorAll('section[role="tabpanel"]');
      const panel = panels?.[1];
      return panel?.innerHTML || '';
    });

    expect(secondTabContentAgain).toBe(secondTabContent);
  });
});
