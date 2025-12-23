import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GitHubCode } from '@/github-code';

// Mock CSSStyleSheet
class MockCSSStyleSheet {
  replaceSync() {}
}
global.CSSStyleSheet = MockCSSStyleSheet as any;

describe('GitHubCode Integration Tests', () => {
  let element: GitHubCode;

  beforeEach(() => {
    // Define custom element if not already defined
    if (!customElements.get('github-code')) {
      customElements.define('github-code', GitHubCode);
    }

    // Create fresh element
    element = document.createElement('github-code') as GitHubCode;

    // Mock fetch
    global.fetch = vi.fn();

    // Mock window.hljs
    (window as any).hljs = {
      highlightAuto: vi.fn((code: string) => ({
        value: code
          .split('\n')
          .map((line) => `<span class="hljs">${line}</span>`)
          .join('\n'),
      })),
    };

    // Mock matchMedia for theme detection
    window.matchMedia = vi.fn((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)' ? false : true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })) as any;
  });

  afterEach(() => {
    element.remove();
    vi.clearAllMocks();
    delete (window as any).hljs;
  });

  describe('Component Initialization', () => {
    it('should create shadow root on construction', () => {
      expect(element.shadowRoot).toBeTruthy();
      expect(element.shadowRoot!.mode).toBe('open');
    });

    it('should observe "file" and "theme" attributes', () => {
      const observed = (GitHubCode as any).observedAttributes;
      expect(observed).toEqual(['file', 'theme']);
    });

    it('should set up theme listener on connectedCallback', () => {
      const addEventListenerSpy = vi.fn();
      window.matchMedia = vi.fn(() => ({
        matches: false,
        media: '',
        addEventListener: addEventListenerSpy,
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null,
      })) as any;

      document.body.appendChild(element);

      expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
      element.remove();
    });

    it('should clean up theme listener on disconnectedCallback', () => {
      const removeEventListenerSpy = vi.fn();
      const mediaQueryList = {
        matches: false,
        media: '',
        addEventListener: vi.fn(),
        removeEventListener: removeEventListenerSpy,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null,
      };
      window.matchMedia = vi.fn(() => mediaQueryList) as any;

      element.setAttribute('file', 'https://github.com/owner/repo/blob/main/file.ts');
      document.body.appendChild(element);

      element.remove();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });

  describe('Error Handling', () => {
    it('should show error when file attribute is missing', () => {
      document.body.appendChild(element);

      const errorDiv = element.shadowRoot!.querySelector('.error');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv!.textContent).toContain('"file" attribute is required');

      element.remove();
    });

    it('should show error when file attribute is empty', () => {
      element.setAttribute('file', '');
      document.body.appendChild(element);

      const errorDiv = element.shadowRoot!.querySelector('.error');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv!.textContent).toContain('"file" attribute is required');

      element.remove();
    });

    it('should show error for invalid GitHub URL', () => {
      element.setAttribute('file', 'https://invalid.com/not-github');
      document.body.appendChild(element);

      const errorDiv = element.shadowRoot!.querySelector('.error');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv!.textContent).toContain('Invalid GitHub URL format');

      element.remove();
    });

    it('should sanitize invalid URL in error message to prevent XSS', () => {
      element.setAttribute('file', '<script>alert("xss")</script>');
      document.body.appendChild(element);

      const errorDiv = element.shadowRoot!.querySelector('.error');
      const html = errorDiv!.innerHTML;

      // Should not contain executable script tag
      expect(html).not.toContain('<script>alert');
      // Should contain escaped version (either &lt; or &amp;lt; depending on DOM implementation)
      expect(html.includes('&lt;script&gt;') || html.includes('&amp;lt;script&amp;gt;')).toBe(true);

      element.remove();
    });

    it('should show error when highlight.js fails to load', async () => {
      delete (window as any).hljs;

      // Mock document.createElement to simulate script load failure
      const originalCreateElement = document.createElement.bind(document);
      document.createElement = vi.fn((tag: string) => {
        const el = originalCreateElement(tag);
        if (tag === 'script') {
          setTimeout(() => {
            if (el.onerror) {
              el.onerror(new Event('error'));
            }
          }, 0);
        }
        return el;
      }) as any;

      element.setAttribute('file', 'https://github.com/owner/repo/blob/main/file.ts');
      document.body.appendChild(element);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const errorDiv = element.shadowRoot!.querySelector('.error');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv!.textContent).toContain('Failed to load highlight.js');

      document.createElement = originalCreateElement;
      element.remove();
    });
  });

  describe('Single File Display', () => {
    beforeEach(() => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => 'const x = 1;\nconst y = 2;',
      });
    });

    it('should display single file with syntax highlighting', async () => {
      element.setAttribute('file', 'https://github.com/owner/repo/blob/main/test.ts');
      document.body.appendChild(element);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const header = element.shadowRoot!.querySelector('header');
      expect(header!.textContent).toBe('test.ts');

      const codeCells = element.shadowRoot!.querySelectorAll('.code-cell');
      expect(codeCells.length).toBeGreaterThan(0);

      element.remove();
    });

    it('should show skeleton before content loads', () => {
      element.setAttribute('file', 'https://github.com/owner/repo/blob/main/test.ts');
      document.body.appendChild(element);

      // Immediately check for skeleton
      const skeleton = element.shadowRoot!.querySelector('.skeleton-loading');
      expect(skeleton).toBeTruthy();

      element.remove();
    });

    it('should fetch code from raw.githubusercontent.com', async () => {
      element.setAttribute('file', 'https://github.com/owner/repo/blob/main/path/file.ts');
      document.body.appendChild(element);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(global.fetch).toHaveBeenCalledWith('https://raw.githubusercontent.com/owner/repo/main/path/file.ts');

      element.remove();
    });

    it('should handle fetch error with retry button', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      element.setAttribute('file', 'https://github.com/owner/repo/blob/main/test.ts');
      document.body.appendChild(element);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const errorDiv = element.shadowRoot!.querySelector('.error');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv!.textContent).toContain('Network error');

      const retryButton = element.shadowRoot!.querySelector('.retry-button');
      expect(retryButton).toBeTruthy();

      element.remove();
    });

    it('should retry fetch when retry button is clicked', async () => {
      // First fetch fails
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      element.setAttribute('file', 'https://github.com/owner/repo/blob/main/test.ts');
      document.body.appendChild(element);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Second fetch succeeds
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'const x = 1;',
      });

      const retryButton = element.shadowRoot!.querySelector('.retry-button') as HTMLButtonElement;
      retryButton.click();

      await new Promise((resolve) => setTimeout(resolve, 50));

      const codeCells = element.shadowRoot!.querySelectorAll('.code-cell');
      expect(codeCells.length).toBeGreaterThan(0);

      element.remove();
    });
  });

  describe('Multi-File Tabs Display', () => {
    beforeEach(() => {
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('file1')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: async () => 'const a = 1;',
          });
        } else if (url.includes('file2')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: async () => 'const b = 2;',
          });
        }
        return Promise.reject(new Error('Not found'));
      });
    });

    it('should display tabs for multiple files', async () => {
      element.setAttribute(
        'file',
        'https://github.com/owner/repo/blob/main/file1.ts,https://github.com/owner/repo/blob/main/file2.ts'
      );
      document.body.appendChild(element);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const tabs = element.shadowRoot!.querySelectorAll('button[role="tab"]');
      expect(tabs.length).toBe(2);
      expect(tabs[0]!.textContent).toContain('file1.ts');
      expect(tabs[1]!.textContent).toContain('file2.ts');

      element.remove();
    });

    it('should mark first tab as active by default', async () => {
      element.setAttribute(
        'file',
        'https://github.com/owner/repo/blob/main/file1.ts,https://github.com/owner/repo/blob/main/file2.ts'
      );
      document.body.appendChild(element);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const tabs = element.shadowRoot!.querySelectorAll('button[role="tab"]');
      expect(tabs[0]!.getAttribute('aria-selected')).toBe('true');
      expect(tabs[1]!.getAttribute('aria-selected')).toBe('false');

      element.remove();
    });

    it('should switch tabs on click', async () => {
      element.setAttribute(
        'file',
        'https://github.com/owner/repo/blob/main/file1.ts,https://github.com/owner/repo/blob/main/file2.ts'
      );
      document.body.appendChild(element);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const tabs = element.shadowRoot!.querySelectorAll('button[role="tab"]');
      (tabs[1] as HTMLButtonElement).click();

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(tabs[0]!.getAttribute('aria-selected')).toBe('false');
      expect(tabs[1]!.getAttribute('aria-selected')).toBe('true');

      element.remove();
    });

    it('should lazy-load tab content on switch', async () => {
      element.setAttribute(
        'file',
        'https://github.com/owner/repo/blob/main/file1.ts,https://github.com/owner/repo/blob/main/file2.ts'
      );
      document.body.appendChild(element);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Only first file should be fetched initially
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const tabs = element.shadowRoot!.querySelectorAll('button[role="tab"]');
      (tabs[1] as HTMLButtonElement).click();

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Second file should be fetched after tab switch
      expect(global.fetch).toHaveBeenCalledTimes(2);

      element.remove();
    });

    it('should support keyboard navigation with ArrowLeft/ArrowRight', async () => {
      element.setAttribute(
        'file',
        'https://github.com/owner/repo/blob/main/file1.ts,https://github.com/owner/repo/blob/main/file2.ts,https://github.com/owner/repo/blob/main/file3.ts'
      );
      document.body.appendChild(element);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const nav = element.shadowRoot!.querySelector('nav[role="tablist"]') as HTMLElement;
      const firstTab = element.shadowRoot!.querySelector('button[role="tab"]') as HTMLElement;

      // Set target to the button and dispatch from nav (bubbles up from button)
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      });

      Object.defineProperty(event, 'target', { value: firstTab, enumerable: true });
      nav.dispatchEvent(event);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const tabs = element.shadowRoot!.querySelectorAll('button[role="tab"]');
      expect(tabs[1]!.getAttribute('aria-selected')).toBe('true');

      element.remove();
    });

    it('should support keyboard navigation with Home/End keys', async () => {
      element.setAttribute(
        'file',
        'https://github.com/owner/repo/blob/main/file1.ts,https://github.com/owner/repo/blob/main/file2.ts,https://github.com/owner/repo/blob/main/file3.ts'
      );
      document.body.appendChild(element);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const nav = element.shadowRoot!.querySelector('nav[role="tablist"]') as HTMLElement;
      const firstTab = element.shadowRoot!.querySelector('button[role="tab"]') as HTMLElement;

      // Press End to go to last tab
      const event = new KeyboardEvent('keydown', {
        key: 'End',
        bubbles: true,
        cancelable: true,
      });

      Object.defineProperty(event, 'target', { value: firstTab, enumerable: true });
      nav.dispatchEvent(event);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const tabs = element.shadowRoot!.querySelectorAll('button[role="tab"]');
      expect(tabs[2]!.getAttribute('aria-selected')).toBe('true');

      element.remove();
    });
  });

  describe('Theme Handling', () => {
    it('should use light theme when theme="light"', () => {
      element.setAttribute('theme', 'light');
      element.setAttribute('file', 'https://github.com/owner/repo/blob/main/file.ts');
      document.body.appendChild(element);

      const link = element.shadowRoot!.querySelector('link[rel="stylesheet"]');
      expect(link!.getAttribute('href')).toContain('github.min.css');
      expect(link!.getAttribute('href')).not.toContain('github-dark');

      element.remove();
    });

    it('should use dark theme when theme="dark"', () => {
      element.setAttribute('theme', 'dark');
      element.setAttribute('file', 'https://github.com/owner/repo/blob/main/file.ts');
      document.body.appendChild(element);

      const link = element.shadowRoot!.querySelector('link[rel="stylesheet"]');
      expect(link!.getAttribute('href')).toContain('github-dark.min.css');

      element.remove();
    });

    it('should auto-detect theme when theme="auto"', () => {
      window.matchMedia = vi.fn((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null,
      })) as any;

      element.setAttribute('theme', 'auto');
      element.setAttribute('file', 'https://github.com/owner/repo/blob/main/file.ts');
      document.body.appendChild(element);

      const link = element.shadowRoot!.querySelector('link[rel="stylesheet"]');
      expect(link!.getAttribute('href')).toContain('github-dark.min.css');

      element.remove();
    });

    it('should apply constructable stylesheets to shadow root', () => {
      element.setAttribute('file', 'https://github.com/owner/repo/blob/main/file.ts');
      document.body.appendChild(element);

      expect(element.shadowRoot!.adoptedStyleSheets.length).toBeGreaterThan(0);

      element.remove();
    });
  });

  describe('Attribute Changes', () => {
    it('should re-render when file attribute changes', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => 'const x = 1;',
      });

      element.setAttribute('file', 'https://github.com/owner/repo/blob/main/file1.ts');
      document.body.appendChild(element);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const header1 = element.shadowRoot!.querySelector('header');
      expect(header1!.textContent).toBe('file1.ts');

      // Change file attribute
      element.setAttribute('file', 'https://github.com/owner/repo/blob/main/file2.ts');

      await new Promise((resolve) => setTimeout(resolve, 50));

      const header2 = element.shadowRoot!.querySelector('header');
      expect(header2!.textContent).toBe('file2.ts');

      element.remove();
    });

    it('should preserve tab index when file list changes', async () => {
      element.setAttribute(
        'file',
        'https://github.com/owner/repo/blob/main/a.ts,https://github.com/owner/repo/blob/main/b.ts,https://github.com/owner/repo/blob/main/c.ts'
      );
      document.body.appendChild(element);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Switch to second tab
      const tabs1 = element.shadowRoot!.querySelectorAll('button[role="tab"]');
      (tabs1[1] as HTMLButtonElement).click();

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Change files but keep same count
      element.setAttribute(
        'file',
        'https://github.com/owner/repo/blob/main/x.ts,https://github.com/owner/repo/blob/main/y.ts,https://github.com/owner/repo/blob/main/z.ts'
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should still be on second tab
      const tabs2 = element.shadowRoot!.querySelectorAll('button[role="tab"]');
      expect(tabs2[1]!.getAttribute('aria-selected')).toBe('true');

      element.remove();
    });

    it('should reset to first tab when previous index becomes invalid', async () => {
      element.setAttribute(
        'file',
        'https://github.com/owner/repo/blob/main/a.ts,https://github.com/owner/repo/blob/main/b.ts,https://github.com/owner/repo/blob/main/c.ts'
      );
      document.body.appendChild(element);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Switch to third tab
      const tabs1 = element.shadowRoot!.querySelectorAll('button[role="tab"]');
      (tabs1[2] as HTMLButtonElement).click();

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Change to only 2 files (index 2 no longer exists)
      element.setAttribute(
        'file',
        'https://github.com/owner/repo/blob/main/x.ts,https://github.com/owner/repo/blob/main/y.ts'
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should reset to first tab
      const tabs2 = element.shadowRoot!.querySelectorAll('button[role="tab"]');
      expect(tabs2[0]!.getAttribute('aria-selected')).toBe('true');

      element.remove();
    });
  });
});
