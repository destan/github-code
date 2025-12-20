import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StylesheetManager } from '@/styles/stylesheet-manager';

// Mock CSSStyleSheet
class MockCSSStyleSheet {
  private cssText = '';
  replaceSync(text: string) {
    this.cssText = text;
  }
  getCssText() {
    return this.cssText;
  }
}

describe('stylesheet-manager', () => {
  beforeEach(() => {
    // Reset static fields before each test by accessing private fields
    (StylesheetManager as any).baseStylesLight = null;
    (StylesheetManager as any).baseStylesDark = null;
    (StylesheetManager as any).tabStyles = null;

    // Mock CSSStyleSheet constructor
    global.CSSStyleSheet = MockCSSStyleSheet as any;
  });

  describe('StylesheetManager', () => {
    describe('getBaseStyleSheet', () => {
      it('should create and cache light theme stylesheet on first call', () => {
        const sheet1 = StylesheetManager.getBaseStyleSheet('light');
        const sheet2 = StylesheetManager.getBaseStyleSheet('light');

        // Both calls should return the same instance (cached)
        expect(sheet1).toBe(sheet2);

        // Should contain CSS content (from mocked import in setup.ts)
        expect((sheet1 as any).getCssText()).toBe(':host { display: block; }');
      });

      it('should create and cache dark theme stylesheet on first call', () => {
        const sheet1 = StylesheetManager.getBaseStyleSheet('dark');
        const sheet2 = StylesheetManager.getBaseStyleSheet('dark');

        // Both calls should return the same instance (cached)
        expect(sheet1).toBe(sheet2);

        // Should contain CSS content
        expect((sheet1 as any).getCssText()).toBe(':host { display: block; }');
      });

      it('should maintain separate caches for light and dark themes', () => {
        const lightSheet = StylesheetManager.getBaseStyleSheet('light');
        const darkSheet = StylesheetManager.getBaseStyleSheet('dark');

        // Different instances for different themes
        expect(lightSheet).not.toBe(darkSheet);
      });

      it('should lazy-load light stylesheet only when requested', () => {
        // Before any call, the cache should be null
        expect((StylesheetManager as any).baseStylesLight).toBeNull();

        StylesheetManager.getBaseStyleSheet('light');

        // After call, the cache should be populated
        expect((StylesheetManager as any).baseStylesLight).not.toBeNull();
      });

      it('should lazy-load dark stylesheet only when requested', () => {
        // Before any call, the cache should be null
        expect((StylesheetManager as any).baseStylesDark).toBeNull();

        StylesheetManager.getBaseStyleSheet('dark');

        // After call, the cache should be populated
        expect((StylesheetManager as any).baseStylesDark).not.toBeNull();
      });

      it('should not create dark stylesheet when only light is requested', () => {
        StylesheetManager.getBaseStyleSheet('light');

        expect((StylesheetManager as any).baseStylesLight).not.toBeNull();
        expect((StylesheetManager as any).baseStylesDark).toBeNull();
      });

      it('should not create light stylesheet when only dark is requested', () => {
        StylesheetManager.getBaseStyleSheet('dark');

        expect((StylesheetManager as any).baseStylesDark).not.toBeNull();
        expect((StylesheetManager as any).baseStylesLight).toBeNull();
      });

      it('should return CSSStyleSheet instance', () => {
        const sheet = StylesheetManager.getBaseStyleSheet('light');

        expect(sheet).toBeInstanceOf(MockCSSStyleSheet);
        expect(sheet).toHaveProperty('replaceSync');
      });

      it('should call replaceSync with CSS content on first load', () => {
        const sheet = StylesheetManager.getBaseStyleSheet('light');

        // Verify replaceSync was called (CSS content was loaded)
        expect((sheet as any).getCssText()).toBeTruthy();
        expect((sheet as any).getCssText().length).toBeGreaterThan(0);
      });

      it('should handle multiple alternating theme requests', () => {
        const light1 = StylesheetManager.getBaseStyleSheet('light');
        const dark1 = StylesheetManager.getBaseStyleSheet('dark');
        const light2 = StylesheetManager.getBaseStyleSheet('light');
        const dark2 = StylesheetManager.getBaseStyleSheet('dark');

        // Same theme calls return same instance
        expect(light1).toBe(light2);
        expect(dark1).toBe(dark2);

        // Different themes return different instances
        expect(light1).not.toBe(dark1);
      });
    });

    describe('getTabStyleSheet', () => {
      it('should create and cache tab stylesheet on first call', () => {
        const sheet1 = StylesheetManager.getTabStyleSheet();
        const sheet2 = StylesheetManager.getTabStyleSheet();

        // Both calls should return the same instance (cached)
        expect(sheet1).toBe(sheet2);
      });

      it('should lazy-load tab stylesheet only when requested', () => {
        // Before any call, the cache should be null
        expect((StylesheetManager as any).tabStyles).toBeNull();

        StylesheetManager.getTabStyleSheet();

        // After call, the cache should be populated
        expect((StylesheetManager as any).tabStyles).not.toBeNull();
      });

      it('should return CSSStyleSheet instance', () => {
        const sheet = StylesheetManager.getTabStyleSheet();

        expect(sheet).toBeInstanceOf(MockCSSStyleSheet);
        expect(sheet).toHaveProperty('replaceSync');
      });

      it('should load CSS content via replaceSync', () => {
        const sheet = StylesheetManager.getTabStyleSheet();

        // Verify CSS content was loaded
        expect((sheet as any).getCssText()).toBe('nav { display: flex; }');
      });

      it('should maintain separate cache from base stylesheets', () => {
        const tabSheet = StylesheetManager.getTabStyleSheet();
        const lightSheet = StylesheetManager.getBaseStyleSheet('light');
        const darkSheet = StylesheetManager.getBaseStyleSheet('dark');

        // All different instances
        expect(tabSheet).not.toBe(lightSheet);
        expect(tabSheet).not.toBe(darkSheet);
      });

      it('should handle multiple consecutive calls efficiently', () => {
        // Create spy on CSSStyleSheet constructor
        const constructorSpy = vi.fn();
        const OriginalCSSStyleSheet = global.CSSStyleSheet;
        global.CSSStyleSheet = class extends MockCSSStyleSheet {
          constructor() {
            super();
            constructorSpy();
          }
        } as any;

        // Reset cache
        (StylesheetManager as any).tabStyles = null;

        // First call creates stylesheet
        StylesheetManager.getTabStyleSheet();
        expect(constructorSpy).toHaveBeenCalledTimes(1);

        // Subsequent calls reuse cached instance
        StylesheetManager.getTabStyleSheet();
        StylesheetManager.getTabStyleSheet();
        StylesheetManager.getTabStyleSheet();

        expect(constructorSpy).toHaveBeenCalledTimes(1); // Still only 1 creation

        // Restore
        global.CSSStyleSheet = OriginalCSSStyleSheet;
      });
    });

    describe('getHighlightJSThemeUrl', () => {
      it('should return light theme URL for light theme', () => {
        const url = StylesheetManager.getHighlightJSThemeUrl('light');

        expect(url).toBe('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github.min.css');
      });

      it('should return dark theme URL for dark theme', () => {
        const url = StylesheetManager.getHighlightJSThemeUrl('dark');

        expect(url).toBe('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github-dark.min.css');
      });

      it('should return different URLs for different themes', () => {
        const lightUrl = StylesheetManager.getHighlightJSThemeUrl('light');
        const darkUrl = StylesheetManager.getHighlightJSThemeUrl('dark');

        expect(lightUrl).not.toBe(darkUrl);
      });

      it('should use HTTPS CDN URL', () => {
        const url = StylesheetManager.getHighlightJSThemeUrl('light');

        expect(url).toMatch(/^https:\/\//);
        expect(url).toContain('cdnjs.cloudflare.com');
      });

      it('should reference highlight.js version 11.11.1', () => {
        const lightUrl = StylesheetManager.getHighlightJSThemeUrl('light');
        const darkUrl = StylesheetManager.getHighlightJSThemeUrl('dark');

        expect(lightUrl).toContain('11.11.1');
        expect(darkUrl).toContain('11.11.1');
      });

      it('should use minified CSS files', () => {
        const lightUrl = StylesheetManager.getHighlightJSThemeUrl('light');
        const darkUrl = StylesheetManager.getHighlightJSThemeUrl('dark');

        expect(lightUrl).toContain('.min.css');
        expect(darkUrl).toContain('.min.css');
      });

      it('should be a pure function (no side effects)', () => {
        // Multiple calls should return same value
        const url1 = StylesheetManager.getHighlightJSThemeUrl('light');
        const url2 = StylesheetManager.getHighlightJSThemeUrl('light');
        const url3 = StylesheetManager.getHighlightJSThemeUrl('light');

        expect(url1).toBe(url2);
        expect(url2).toBe(url3);
      });

      it('should not create or cache any stylesheets', () => {
        // Ensure caches are null
        expect((StylesheetManager as any).baseStylesLight).toBeNull();
        expect((StylesheetManager as any).baseStylesDark).toBeNull();
        expect((StylesheetManager as any).tabStyles).toBeNull();

        // Call the method
        StylesheetManager.getHighlightJSThemeUrl('light');
        StylesheetManager.getHighlightJSThemeUrl('dark');

        // Caches should still be null (method doesn't create stylesheets)
        expect((StylesheetManager as any).baseStylesLight).toBeNull();
        expect((StylesheetManager as any).baseStylesDark).toBeNull();
        expect((StylesheetManager as any).tabStyles).toBeNull();
      });
    });

    describe('integration - full stylesheet workflow', () => {
      it('should support complete light theme workflow', () => {
        const baseSheet = StylesheetManager.getBaseStyleSheet('light');
        const tabSheet = StylesheetManager.getTabStyleSheet();
        const themeUrl = StylesheetManager.getHighlightJSThemeUrl('light');

        expect(baseSheet).toBeInstanceOf(MockCSSStyleSheet);
        expect(tabSheet).toBeInstanceOf(MockCSSStyleSheet);
        expect(themeUrl).toContain('github.min.css');
      });

      it('should support complete dark theme workflow', () => {
        const baseSheet = StylesheetManager.getBaseStyleSheet('dark');
        const tabSheet = StylesheetManager.getTabStyleSheet();
        const themeUrl = StylesheetManager.getHighlightJSThemeUrl('dark');

        expect(baseSheet).toBeInstanceOf(MockCSSStyleSheet);
        expect(tabSheet).toBeInstanceOf(MockCSSStyleSheet);
        expect(themeUrl).toContain('github-dark.min.css');
      });

      it('should efficiently handle theme switching', () => {
        // Load light theme
        const light1 = StylesheetManager.getBaseStyleSheet('light');
        const lightUrl1 = StylesheetManager.getHighlightJSThemeUrl('light');

        // Switch to dark theme
        const dark1 = StylesheetManager.getBaseStyleSheet('dark');
        const darkUrl1 = StylesheetManager.getHighlightJSThemeUrl('dark');

        // Switch back to light theme (should reuse cache)
        const light2 = StylesheetManager.getBaseStyleSheet('light');
        const lightUrl2 = StylesheetManager.getHighlightJSThemeUrl('light');

        // Verify caching worked
        expect(light1).toBe(light2);
        expect(lightUrl1).toBe(lightUrl2);

        // Verify different themes have different resources
        expect(light1).not.toBe(dark1);
        expect(lightUrl1).not.toBe(darkUrl1);
      });
    });
  });
});
