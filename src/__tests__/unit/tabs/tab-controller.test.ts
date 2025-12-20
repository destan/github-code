import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateTabsHtml,
  updateTabButtonStates,
  updateTabPanelStates,
  createTabPanel,
  handleTabKeyNavigation,
} from '@/tabs/tab-controller';
import type { FileMetadata } from '@/types';

describe('tab-controller', () => {
  describe('generateTabsHtml', () => {
    it('should generate HTML for single tab', () => {
      const files: FileMetadata[] = [
        {
          filename: 'test.ts',
          rawUrl: 'https://example.com/test.ts',
          url: 'https://github.com/owner/repo/blob/main/test.ts',
          code: null,
          error: null,
          loaded: false,
        },
      ];

      const html = generateTabsHtml(files, 0);

      expect(html).toContain('role="tab"');
      expect(html).toContain('id="tab-0"');
      expect(html).toContain('aria-selected="true"');
      expect(html).toContain('tabindex="0"');
      expect(html).toContain('test.ts');
    });

    it('should generate HTML for multiple tabs', () => {
      const files: FileMetadata[] = [
        {
          filename: 'file1.ts',
          rawUrl: 'https://example.com/file1.ts',
          url: 'https://github.com/owner/repo/blob/main/file1.ts',
          code: null,
          error: null,
          loaded: false,
        },
        {
          filename: 'file2.ts',
          rawUrl: 'https://example.com/file2.ts',
          url: 'https://github.com/owner/repo/blob/main/file2.ts',
          code: null,
          error: null,
          loaded: false,
        },
        {
          filename: 'file3.ts',
          rawUrl: 'https://example.com/file3.ts',
          url: 'https://github.com/owner/repo/blob/main/file3.ts',
          code: null,
          error: null,
          loaded: false,
        },
      ];

      const html = generateTabsHtml(files, 1);

      expect(html).toContain('id="tab-0"');
      expect(html).toContain('id="tab-1"');
      expect(html).toContain('id="tab-2"');
      expect(html).toContain('file1.ts');
      expect(html).toContain('file2.ts');
      expect(html).toContain('file3.ts');
    });

    it('should mark correct tab as active', () => {
      const files: FileMetadata[] = [
        {
          filename: 'file1.ts',
          rawUrl: 'https://example.com/file1.ts',
          url: 'https://github.com/owner/repo/blob/main/file1.ts',
          code: null,
          error: null,
          loaded: false,
        },
        {
          filename: 'file2.ts',
          rawUrl: 'https://example.com/file2.ts',
          url: 'https://github.com/owner/repo/blob/main/file2.ts',
          code: null,
          error: null,
          loaded: false,
        },
      ];

      const html = generateTabsHtml(files, 1);

      // Check tab 0 is not selected
      expect(html).toMatch(/id="tab-0"[\s\S]*?aria-selected="false"/);
      expect(html).toMatch(/id="tab-0"[\s\S]*?tabindex="-1"/);

      // Check tab 1 is selected
      expect(html).toMatch(/id="tab-1"[\s\S]*?aria-selected="true"/);
      expect(html).toMatch(/id="tab-1"[\s\S]*?tabindex="0"/);
    });

    it('should escape HTML in filenames', () => {
      const files: FileMetadata[] = [
        {
          filename: '<script>alert("XSS")</script>',
          rawUrl: 'https://example.com/test.ts',
          url: 'https://github.com/owner/repo/blob/main/test.ts',
          code: null,
          error: null,
          loaded: false,
        },
      ];

      const html = generateTabsHtml(files, 0);

      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<script>alert');
    });
  });

  describe('updateTabButtonStates', () => {
    let shadowRoot: ShadowRoot;

    beforeEach(() => {
      const container = document.createElement('div');
      shadowRoot = container.attachShadow({ mode: 'open' });
      shadowRoot.innerHTML = `
        <nav>
          <button data-index="0" aria-selected="true" tabindex="0"></button>
          <button data-index="1" aria-selected="false" tabindex="-1"></button>
          <button data-index="2" aria-selected="false" tabindex="-1"></button>
        </nav>
      `;
    });

    it('should update tab states when switching tabs', () => {
      updateTabButtonStates(shadowRoot, 1);

      const tabs = shadowRoot.querySelectorAll('nav > button');
      expect(tabs[0]!.getAttribute('aria-selected')).toBe('false');
      expect(tabs[0]!.getAttribute('tabindex')).toBe('-1');
      expect(tabs[1]!.getAttribute('aria-selected')).toBe('true');
      expect(tabs[1]!.getAttribute('tabindex')).toBe('0');
      expect(tabs[2]!.getAttribute('aria-selected')).toBe('false');
      expect(tabs[2]!.getAttribute('tabindex')).toBe('-1');
    });

    it('should handle switching to first tab', () => {
      updateTabButtonStates(shadowRoot, 0);

      const tabs = shadowRoot.querySelectorAll('nav > button');
      expect(tabs[0]!.getAttribute('aria-selected')).toBe('true');
      expect(tabs[0]!.getAttribute('tabindex')).toBe('0');
      expect(tabs[1]!.getAttribute('aria-selected')).toBe('false');
      expect(tabs[2]!.getAttribute('aria-selected')).toBe('false');
    });

    it('should handle switching to last tab', () => {
      updateTabButtonStates(shadowRoot, 2);

      const tabs = shadowRoot.querySelectorAll('nav > button');
      expect(tabs[0]!.getAttribute('aria-selected')).toBe('false');
      expect(tabs[1]!.getAttribute('aria-selected')).toBe('false');
      expect(tabs[2]!.getAttribute('aria-selected')).toBe('true');
      expect(tabs[2]!.getAttribute('tabindex')).toBe('0');
    });

    it('should handle missing data-index attribute', () => {
      shadowRoot.innerHTML = `
        <nav>
          <button aria-selected="true" tabindex="0"></button>
        </nav>
      `;

      // Should not throw
      expect(() => updateTabButtonStates(shadowRoot, 0)).not.toThrow();
    });
  });

  describe('updateTabPanelStates', () => {
    let shadowRoot: ShadowRoot;

    beforeEach(() => {
      const container = document.createElement('div');
      shadowRoot = container.attachShadow({ mode: 'open' });
      shadowRoot.innerHTML = `
        <section role="tabpanel" data-index="0" aria-hidden="false"></section>
        <section role="tabpanel" data-index="1" aria-hidden="true"></section>
        <section role="tabpanel" data-index="2" aria-hidden="true"></section>
      `;
    });

    it('should update panel visibility when switching tabs', () => {
      updateTabPanelStates(shadowRoot, 1);

      const panels = shadowRoot.querySelectorAll('section[role="tabpanel"]');
      expect(panels[0]!.getAttribute('aria-hidden')).toBe('true');
      expect(panels[1]!.getAttribute('aria-hidden')).toBe('false');
      expect(panels[2]!.getAttribute('aria-hidden')).toBe('true');
    });

    it('should handle switching to first panel', () => {
      updateTabPanelStates(shadowRoot, 0);

      const panels = shadowRoot.querySelectorAll('section[role="tabpanel"]');
      expect(panels[0]!.getAttribute('aria-hidden')).toBe('false');
      expect(panels[1]!.getAttribute('aria-hidden')).toBe('true');
      expect(panels[2]!.getAttribute('aria-hidden')).toBe('true');
    });

    it('should handle switching to last panel', () => {
      updateTabPanelStates(shadowRoot, 2);

      const panels = shadowRoot.querySelectorAll('section[role="tabpanel"]');
      expect(panels[0]!.getAttribute('aria-hidden')).toBe('true');
      expect(panels[1]!.getAttribute('aria-hidden')).toBe('true');
      expect(panels[2]!.getAttribute('aria-hidden')).toBe('false');
    });

    it('should handle missing data-index attribute', () => {
      shadowRoot.innerHTML = `
        <section role="tabpanel" aria-hidden="false"></section>
      `;

      // Should not throw
      expect(() => updateTabPanelStates(shadowRoot, 0)).not.toThrow();
    });
  });

  describe('createTabPanel', () => {
    it('should create tab panel with correct attributes', () => {
      const skeletonHtml = '<div>Loading...</div>';
      const panel = createTabPanel(0, skeletonHtml);

      expect(panel.tagName).toBe('SECTION');
      expect(panel.getAttribute('role')).toBe('tabpanel');
      expect(panel.getAttribute('id')).toBe('panel-0');
      expect(panel.getAttribute('aria-labelledby')).toBe('tab-0');
      expect(panel.dataset.index).toBe('0');
      expect(panel.innerHTML).toBe(skeletonHtml);
    });

    it('should create panel with different index', () => {
      const skeletonHtml = '<div>Skeleton</div>';
      const panel = createTabPanel(5, skeletonHtml);

      expect(panel.getAttribute('id')).toBe('panel-5');
      expect(panel.getAttribute('aria-labelledby')).toBe('tab-5');
      expect(panel.dataset.index).toBe('5');
    });

    it('should preserve skeleton HTML content', () => {
      const complexHtml = '<div class="test"><span>Complex</span></div>';
      const panel = createTabPanel(1, complexHtml);

      expect(panel.innerHTML).toBe(complexHtml);
    });
  });

  describe('handleTabKeyNavigation', () => {
    it('should handle ArrowLeft from middle position', () => {
      const result = handleTabKeyNavigation('ArrowLeft', 2, 4);
      expect(result).toBe(1);
    });

    it('should wrap ArrowLeft from first position to last', () => {
      const result = handleTabKeyNavigation('ArrowLeft', 0, 4);
      expect(result).toBe(4);
    });

    it('should handle ArrowRight from middle position', () => {
      const result = handleTabKeyNavigation('ArrowRight', 2, 4);
      expect(result).toBe(3);
    });

    it('should wrap ArrowRight from last position to first', () => {
      const result = handleTabKeyNavigation('ArrowRight', 4, 4);
      expect(result).toBe(0);
    });

    it('should handle Home key', () => {
      const result = handleTabKeyNavigation('Home', 3, 5);
      expect(result).toBe(0);
    });

    it('should handle End key', () => {
      const result = handleTabKeyNavigation('End', 1, 5);
      expect(result).toBe(5);
    });

    it('should return null for unrecognized keys', () => {
      expect(handleTabKeyNavigation('Enter', 1, 3)).toBeNull();
      expect(handleTabKeyNavigation('Space', 1, 3)).toBeNull();
      expect(handleTabKeyNavigation('Tab', 1, 3)).toBeNull();
      expect(handleTabKeyNavigation('a', 1, 3)).toBeNull();
      expect(handleTabKeyNavigation('Escape', 1, 3)).toBeNull();
    });

    it('should handle single tab scenario', () => {
      expect(handleTabKeyNavigation('ArrowLeft', 0, 0)).toBe(0);
      expect(handleTabKeyNavigation('ArrowRight', 0, 0)).toBe(0);
      expect(handleTabKeyNavigation('Home', 0, 0)).toBe(0);
      expect(handleTabKeyNavigation('End', 0, 0)).toBe(0);
    });

    it('should handle two tabs scenario', () => {
      expect(handleTabKeyNavigation('ArrowLeft', 1, 1)).toBe(0);
      expect(handleTabKeyNavigation('ArrowLeft', 0, 1)).toBe(1);
      expect(handleTabKeyNavigation('ArrowRight', 0, 1)).toBe(1);
      expect(handleTabKeyNavigation('ArrowRight', 1, 1)).toBe(0);
    });
  });
});
