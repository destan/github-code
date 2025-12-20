import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { resolveTheme, getThemeAttribute, createThemeListener } from '@/theme/theme-resolver';

describe('theme-resolver', () => {
  describe('resolveTheme', () => {
    it('returns "dark" when themeAttr is "dark"', () => {
      expect(resolveTheme('dark')).toBe('dark');
    });

    it('returns "light" when themeAttr is "light"', () => {
      expect(resolveTheme('light')).toBe('light');
    });

    describe('auto theme', () => {
      let originalMatchMedia: typeof window.matchMedia;

      beforeEach(() => {
        originalMatchMedia = window.matchMedia;
      });

      afterEach(() => {
        window.matchMedia = originalMatchMedia;
      });

      it('returns "dark" when system prefers dark', () => {
        window.matchMedia = vi.fn().mockReturnValue({ matches: true });
        expect(resolveTheme('auto')).toBe('dark');
      });

      it('returns "light" when system prefers light', () => {
        window.matchMedia = vi.fn().mockReturnValue({ matches: false });
        expect(resolveTheme('auto')).toBe('light');
      });

      it('returns "light" when matchMedia is not available', () => {
        window.matchMedia = undefined as unknown as typeof window.matchMedia;
        expect(resolveTheme('auto')).toBe('light');
      });
    });
  });

  describe('getThemeAttribute', () => {
    it('returns "dark" when element has theme="dark"', () => {
      const element = document.createElement('div');
      element.setAttribute('theme', 'dark');
      expect(getThemeAttribute(element)).toBe('dark');
    });

    it('returns "light" when element has theme="light"', () => {
      const element = document.createElement('div');
      element.setAttribute('theme', 'light');
      expect(getThemeAttribute(element)).toBe('light');
    });

    it('returns "auto" when element has theme="auto"', () => {
      const element = document.createElement('div');
      element.setAttribute('theme', 'auto');
      expect(getThemeAttribute(element)).toBe('auto');
    });

    it('returns "auto" when element has no theme attribute', () => {
      const element = document.createElement('div');
      expect(getThemeAttribute(element)).toBe('auto');
    });

    it('returns "auto" for invalid theme values', () => {
      const element = document.createElement('div');
      element.setAttribute('theme', 'invalid');
      expect(getThemeAttribute(element)).toBe('auto');
    });
  });

  describe('createThemeListener', () => {
    let originalMatchMedia: typeof window.matchMedia;

    beforeEach(() => {
      originalMatchMedia = window.matchMedia;
    });

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });

    it('returns setup, cleanup and handler functions', () => {
      const callback = vi.fn();
      const listener = createThemeListener(callback);

      expect(listener.setup).toBeInstanceOf(Function);
      expect(listener.cleanup).toBeInstanceOf(Function);
      expect(listener.handler).toBeInstanceOf(Function);
    });

    it('setup creates media query listener when matchMedia available', () => {
      const mockAddEventListener = vi.fn();
      const mockMediaQuery = {
        matches: false,
        addEventListener: mockAddEventListener,
      };
      window.matchMedia = vi.fn().mockReturnValue(mockMediaQuery);

      const callback = vi.fn();
      const listener = createThemeListener(callback);
      const result = listener.setup();

      expect(result).toBe(mockMediaQuery);
      expect(mockAddEventListener).toHaveBeenCalledWith('change', callback);
    });

    it('setup returns null when matchMedia not available', () => {
      window.matchMedia = undefined as unknown as typeof window.matchMedia;

      const callback = vi.fn();
      const listener = createThemeListener(callback);
      const result = listener.setup();

      expect(result).toBeNull();
    });

    it('cleanup removes event listener', () => {
      const mockRemoveEventListener = vi.fn();
      const mockMediaQuery = {
        matches: false,
        removeEventListener: mockRemoveEventListener,
      } as unknown as MediaQueryList;

      const callback = vi.fn();
      const listener = createThemeListener(callback);
      listener.cleanup(mockMediaQuery);

      expect(mockRemoveEventListener).toHaveBeenCalledWith('change', callback);
    });

    it('cleanup handles null mediaQuery', () => {
      const callback = vi.fn();
      const listener = createThemeListener(callback);

      // Should not throw
      expect(() => listener.cleanup(null)).not.toThrow();
    });

    it('handler invokes the callback', () => {
      const callback = vi.fn();
      const listener = createThemeListener(callback);

      listener.handler();

      expect(callback).toHaveBeenCalled();
    });
  });
});
