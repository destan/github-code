import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { loadHighlightJS, getLoadedHighlightJSUrl, getHighlightJSSource } from '@/fetching/highlightjs-loader';

describe('highlightjs-loader', () => {
  let mockScript: HTMLScriptElement;
  let appendChildSpy: any;

  beforeEach(() => {
    // Clean up window.hljs to ensure clean state
    delete (window as any).hljs;

    // Create a mock script element
    mockScript = {
      src: '',
      integrity: '',
      crossOrigin: '',
      onload: null,
      onerror: null,
    } as any;

    // Mock document.createElement
    vi.spyOn(document, 'createElement').mockReturnValue(mockScript);

    // Mock document.head.appendChild
    appendChildSpy = vi.spyOn(document.head, 'appendChild').mockReturnValue(mockScript);
  });

  afterEach(() => {
    // Trigger any pending script onload to clear singleton state
    if (mockScript && mockScript.onload && !window.hljs) {
      try {
        // Set window.hljs for validation to pass
        (window as any).hljs = { highlightAuto: vi.fn() };
        mockScript.onload(new Event('load'));
      } catch {
        // Ignore errors during cleanup
      }
    }

    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  describe('loadHighlightJS', () => {
    it('should return immediately if hljs already loaded', async () => {
      // Set window.hljs
      (window as any).hljs = { highlightAuto: vi.fn() };

      await loadHighlightJS();

      expect(document.createElement).not.toHaveBeenCalled();
      expect(appendChildSpy).not.toHaveBeenCalled();
    });

    it('should load highlight.js script successfully', async () => {
      const loadPromise = loadHighlightJS();

      // Verify script was created and configured correctly
      expect(document.createElement).toHaveBeenCalledWith('script');
      expect(mockScript.src).toBe('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js');
      expect(mockScript.integrity).toBe('sha384-RH2xi4eIQ/gjtbs9fUXM68sLSi99C7ZWBRX1vDrVv6GQXRibxXLbwO2NGZB74MbU');
      expect(mockScript.crossOrigin).toBe('anonymous');
      expect(appendChildSpy).toHaveBeenCalledWith(mockScript);

      // Set window.hljs before simulating successful load
      (window as any).hljs = { highlightAuto: vi.fn() };

      // Simulate successful load
      mockScript.onload?.(new Event('load'));

      await expect(loadPromise).resolves.toBeUndefined();
    });

    it('should reject on script load error with CSP message', async () => {
      const loadPromise = loadHighlightJS();

      // Simulate script error
      mockScript.onerror?.(new Event('error'));

      await expect(loadPromise).rejects.toThrow('Failed to load highlight.js library');
      await expect(loadPromise).rejects.toThrow('Content Security Policy (CSP)');
      await expect(loadPromise).rejects.toThrow('script-src https://cdnjs.cloudflare.com');
      await expect(loadPromise).rejects.toThrow('style-src https://cdnjs.cloudflare.com');
    });

    it('should implement singleton pattern - multiple calls return same promise', async () => {
      const promise1 = loadHighlightJS();
      const promise2 = loadHighlightJS();
      const promise3 = loadHighlightJS();

      // Verify singleton behavior: only one script should be created
      expect(document.createElement).toHaveBeenCalledTimes(1);
      expect(appendChildSpy).toHaveBeenCalledTimes(1);

      // Set window.hljs before completing the load
      (window as any).hljs = { highlightAuto: vi.fn() };

      // Complete the load
      mockScript.onload?.(new Event('load'));

      // All promises should resolve successfully (verifies they're linked to same load)
      await expect(Promise.all([promise1, promise2, promise3])).resolves.toEqual([undefined, undefined, undefined]);
    });

    it('should clear loading promise on successful load', async () => {
      const firstLoad = loadHighlightJS();

      // Set window.hljs and simulate successful load
      (window as any).hljs = { highlightAuto: vi.fn() };
      mockScript.onload?.(new Event('load'));
      await firstLoad;

      // Set window.hljs to prevent immediate return
      (window as any).hljs = { highlightAuto: vi.fn() };

      // Delete it to test new load
      delete (window as any).hljs;

      // Reset mocks for second load
      vi.clearAllMocks();
      mockScript = {
        src: '',
        integrity: '',
        crossOrigin: '',
        onload: null,
        onerror: null,
      } as any;
      vi.spyOn(document, 'createElement').mockReturnValue(mockScript);
      appendChildSpy = vi.spyOn(document.head, 'appendChild').mockReturnValue(mockScript);

      // Second load should create a new script (promise was cleared)
      const secondLoad = loadHighlightJS();
      expect(document.createElement).toHaveBeenCalledTimes(1);

      // Set window.hljs before triggering onload
      (window as any).hljs = { highlightAuto: vi.fn() };
      mockScript.onload?.(new Event('load'));
      await secondLoad;
    });

    it('should clear loading promise on error to allow retry', async () => {
      const firstLoad = loadHighlightJS();

      // Simulate error
      mockScript.onerror?.(new Event('error'));

      await expect(firstLoad).rejects.toThrow();

      // Reset mocks for retry
      vi.clearAllMocks();
      mockScript = {
        src: '',
        integrity: '',
        crossOrigin: '',
        onload: null,
        onerror: null,
      } as any;
      vi.spyOn(document, 'createElement').mockReturnValue(mockScript);
      appendChildSpy = vi.spyOn(document.head, 'appendChild').mockReturnValue(mockScript);

      // Retry should create a new script (promise was cleared on error)
      const retryLoad = loadHighlightJS();
      expect(document.createElement).toHaveBeenCalledTimes(1);

      // This time succeed - set window.hljs first
      (window as any).hljs = { highlightAuto: vi.fn() };
      mockScript.onload?.(new Event('load'));
      await expect(retryLoad).resolves.toBeUndefined();
    });

    it('should append script to document.head', async () => {
      const loadPromise = loadHighlightJS();

      expect(appendChildSpy).toHaveBeenCalledTimes(1);
      expect(appendChildSpy).toHaveBeenCalledWith(mockScript);

      (window as any).hljs = { highlightAuto: vi.fn() };
      mockScript.onload?.(new Event('load'));
      await loadPromise;
    });

    it('should handle multiple concurrent calls during loading', async () => {
      // Start first load
      const promise1 = loadHighlightJS();

      // Before it completes, start more loads
      const promise2 = loadHighlightJS();
      const promise3 = loadHighlightJS();

      // Verify singleton behavior: only one script created
      expect(document.createElement).toHaveBeenCalledTimes(1);

      // Set window.hljs and complete the load
      (window as any).hljs = { highlightAuto: vi.fn() };
      mockScript.onload?.(new Event('load'));

      // All promises should resolve (verifies they're all waiting on same load)
      await expect(Promise.all([promise1, promise2, promise3])).resolves.toEqual([undefined, undefined, undefined]);
    });

    it('should configure script with correct CDN URL', async () => {
      loadHighlightJS();

      expect(mockScript.src).toBe('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js');
    });

    it('should configure script with integrity hash', async () => {
      loadHighlightJS();

      expect(mockScript.integrity).toBe('sha384-RH2xi4eIQ/gjtbs9fUXM68sLSi99C7ZWBRX1vDrVv6GQXRibxXLbwO2NGZB74MbU');
    });

    it('should configure script with anonymous crossOrigin', async () => {
      loadHighlightJS();

      expect(mockScript.crossOrigin).toBe('anonymous');
    });

    it('should handle race condition - load completes before second call', async () => {
      const firstLoad = loadHighlightJS();

      // Set window.hljs before completing the load
      (window as any).hljs = { highlightAuto: vi.fn() };

      // Complete the load immediately
      mockScript.onload?.(new Event('load'));
      await firstLoad;

      // Reset mocks
      vi.clearAllMocks();

      // Second call should return immediately without creating script
      await loadHighlightJS();

      expect(document.createElement).not.toHaveBeenCalled();
      expect(appendChildSpy).not.toHaveBeenCalled();
    });

    it('should propagate error to all waiting promises', async () => {
      const promise1 = loadHighlightJS();
      const promise2 = loadHighlightJS();
      const promise3 = loadHighlightJS();

      // Trigger error
      mockScript.onerror?.(new Event('error'));

      // All promises should reject with same error
      await expect(promise1).rejects.toThrow('Failed to load highlight.js library');
      await expect(promise2).rejects.toThrow('Failed to load highlight.js library');
      await expect(promise3).rejects.toThrow('Failed to load highlight.js library');
    });
  });

  describe('loadHighlightJS with custom URL', () => {
    it('should load from custom URL when provided', async () => {
      const customUrl = 'https://custom.com/highlight.js';
      loadHighlightJS(customUrl);

      expect(mockScript.src).toBe(customUrl);
      expect(mockScript.integrity).toBe('');
      expect(mockScript.crossOrigin).toBe('');
    });

    it('should track custom URL as user-provided', async () => {
      const customUrl = 'https://custom.com/highlight.js';
      const loadPromise = loadHighlightJS(customUrl);

      // Set window.hljs before triggering onload
      (window as any).hljs = { highlightAuto: vi.fn() };
      mockScript.onload?.(new Event('load'));
      await loadPromise;

      expect(getHighlightJSSource()).toBe('user-provided');
      expect(getLoadedHighlightJSUrl()).toBe(customUrl);
    });

    it('should warn when different URLs are specified', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      loadHighlightJS('https://first.com/hljs.js');
      loadHighlightJS('https://second.com/hljs.js');

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Different highlight.js URLs detected')
      );

      warnSpy.mockRestore();
    });

    it('should reject if custom URL does not define window.hljs', async () => {
      const customUrl = 'https://invalid.com/not-hljs.js';
      const loadPromise = loadHighlightJS(customUrl);

      // Load without setting window.hljs
      mockScript.onload?.(new Event('load'));

      await expect(loadPromise).rejects.toThrow('did not define window.hljs');
      expect(getLoadedHighlightJSUrl()).toBe('auto');
      expect(getHighlightJSSource()).toBe('global');
    });

    it('should track global hljs as "global" source', async () => {
      (window as any).hljs = { highlightAuto: vi.fn() };

      await loadHighlightJS();

      expect(getHighlightJSSource()).toBe('global');
      expect(getLoadedHighlightJSUrl()).toBe('auto');
    });

    it('should use default URL when customUrl is undefined', async () => {
      loadHighlightJS(undefined);

      expect(mockScript.src).toBe('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js');
      expect(mockScript.integrity).toBe('sha384-RH2xi4eIQ/gjtbs9fUXM68sLSi99C7ZWBRX1vDrVv6GQXRibxXLbwO2NGZB74MbU');
      expect(mockScript.crossOrigin).toBe('anonymous');
    });

    it('should reset state on error for custom URL', async () => {
      const customUrl = 'https://custom.com/highlight.js';
      const loadPromise = loadHighlightJS(customUrl);

      // Verify state is set
      expect(getLoadedHighlightJSUrl()).toBe(customUrl);
      expect(getHighlightJSSource()).toBe('user-provided');

      // Trigger error
      mockScript.onerror?.(new Event('error'));

      await expect(loadPromise).rejects.toThrow();

      // Verify state is reset
      expect(getLoadedHighlightJSUrl()).toBe('auto');
      expect(getHighlightJSSource()).toBe('global');
    });
  });

  describe('getLoadedHighlightJSUrl', () => {
    it('should return "auto" when nothing loaded', () => {
      expect(getLoadedHighlightJSUrl()).toBe('auto');
    });

    it('should return loaded URL after successful load', async () => {
      const customUrl = 'https://example.com/hljs.js';
      const loadPromise = loadHighlightJS(customUrl);

      (window as any).hljs = { highlightAuto: vi.fn() };
      mockScript.onload?.(new Event('load'));
      await loadPromise;

      expect(getLoadedHighlightJSUrl()).toBe(customUrl);
    });
  });

  describe('getHighlightJSSource', () => {
    it('should return a valid source type', () => {
      expect(['user-provided', 'cdn-default', 'global']).toContain(getHighlightJSSource());
    });

    it('should return "cdn-default" after loading default URL', async () => {
      const loadPromise = loadHighlightJS();

      (window as any).hljs = { highlightAuto: vi.fn() };
      mockScript.onload?.(new Event('load'));
      await loadPromise;

      expect(getHighlightJSSource()).toBe('cdn-default');
    });
  });
});
