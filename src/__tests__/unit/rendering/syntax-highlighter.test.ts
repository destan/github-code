import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getHighlightedLines, applySyntaxHighlighting } from '@/rendering/syntax-highlighter';

describe('syntax-highlighter', () => {
  // Mock window.hljs before each test
  beforeEach(() => {
    // Create a mock highlightAuto function
    (window as any).hljs = {
      highlightAuto: vi.fn((code: string) => ({
        value: code
          .split('\n')
          .map((line) => `<span class="hljs">${line}</span>`)
          .join('\n'),
        language: 'typescript',
        relevance: 5,
      })),
    };
  });

  afterEach(() => {
    // Clean up
    delete (window as any).hljs;
    vi.clearAllTimers();
  });

  describe('getHighlightedLines', () => {
    it('should highlight code and return array of lines', () => {
      const code = 'const x = 1;\nconst y = 2;';
      const result = getHighlightedLines(code);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe('<span class="hljs">const x = 1;</span>');
      expect(result[1]).toBe('<span class="hljs">const y = 2;</span>');
      expect(window.hljs!.highlightAuto).toHaveBeenCalledWith('const x = 1;\nconst y = 2;');
    });

    it('should handle null code by returning empty line array', () => {
      const result = getHighlightedLines(null);

      expect(result).toEqual(['']);
      expect(window.hljs!.highlightAuto).not.toHaveBeenCalled();
    });

    it('should handle empty string', () => {
      const result = getHighlightedLines('');

      expect(result).toEqual(['']);
      expect(window.hljs!.highlightAuto).not.toHaveBeenCalled();
    });

    it('should remove final empty line from code ending with newline', () => {
      const code = 'line1\nline2\n'; // Ends with newline
      const result = getHighlightedLines(code);

      expect(result).toHaveLength(2);
      expect(window.hljs!.highlightAuto).toHaveBeenCalledWith('line1\nline2');
    });

    it('should not remove non-empty final line', () => {
      const code = 'line1\nline2';
      const result = getHighlightedLines(code);

      expect(result).toHaveLength(2);
    });

    it('should handle single line code', () => {
      const code = 'const x = 1;';
      const result = getHighlightedLines(code);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe('<span class="hljs">const x = 1;</span>');
    });

    it('should trim excess highlighted lines to match original line count', () => {
      const code = 'line1\nline2';

      // Mock hljs to return more lines than input
      (window.hljs!.highlightAuto as any).mockReturnValueOnce({
        value: '<span>line1</span>\n<span>line2</span>\n<span>extra</span>\n<span>extra2</span>',
      });

      const result = getHighlightedLines(code);

      // Should trim to match original 2 lines
      expect(result).toHaveLength(2);
    });

    it('should handle code with only newlines', () => {
      const code = '\n\n\n';
      const result = getHighlightedLines(code);

      // Four lines (3 newlines = 4 lines), but last empty line removed
      expect(result).toHaveLength(3);
    });

    it('should call hljs.highlightAuto with joined code', () => {
      const code = 'line1\nline2\nline3';
      getHighlightedLines(code);

      expect(window.hljs!.highlightAuto).toHaveBeenCalledWith('line1\nline2\nline3');
      expect(window.hljs!.highlightAuto).toHaveBeenCalledTimes(1);
    });
  });

  describe('applySyntaxHighlighting', () => {
    let mockShadowRoot: ShadowRoot;
    let mockCodeCells: HTMLElement[];

    beforeEach(() => {
      // Create mock code cells
      mockCodeCells = [document.createElement('div'), document.createElement('div'), document.createElement('div')];
      mockCodeCells.forEach((cell) => cell.classList.add('code-cell'));

      // Create mock shadow root
      mockShadowRoot = {
        querySelectorAll: vi.fn(() => mockCodeCells),
      } as unknown as ShadowRoot;

      // Ensure requestIdleCallback exists (it's polyfilled in setup.ts)
      if (!('requestIdleCallback' in window)) {
        (window as any).requestIdleCallback = (callback: IdleRequestCallback) => {
          return setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 50 }), 0) as unknown as number;
        };
      }
    });

    it('should apply highlighting to code cells using requestIdleCallback', async () => {
      const code = 'line1\nline2\nline3';

      applySyntaxHighlighting(mockShadowRoot, code);

      // Wait for requestIdleCallback to execute
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockShadowRoot.querySelectorAll).toHaveBeenCalledWith('.code-cell');
      expect(mockCodeCells[0]!.innerHTML).toBe('<span class="hljs">line1</span>');
      expect(mockCodeCells[1]!.innerHTML).toBe('<span class="hljs">line2</span>');
      expect(mockCodeCells[2]!.innerHTML).toBe('<span class="hljs">line3</span>');
    });

    it('should use fallback when requestIdleCallback is not available', () => {
      // Remove requestIdleCallback
      const original = (window as any).requestIdleCallback;
      delete (window as any).requestIdleCallback;

      const code = 'line1\nline2\nline3';

      applySyntaxHighlighting(mockShadowRoot, code);

      // Should apply immediately without requestIdleCallback
      expect(mockCodeCells[0]!.innerHTML).toBe('<span class="hljs">line1</span>');
      expect(mockCodeCells[1]!.innerHTML).toBe('<span class="hljs">line2</span>');
      expect(mockCodeCells[2]!.innerHTML).toBe('<span class="hljs">line3</span>');

      // Restore
      (window as any).requestIdleCallback = original;
    });

    it('should handle more code cells than highlighted lines by using space fallback', async () => {
      const code = 'line1';

      applySyntaxHighlighting(mockShadowRoot, code);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockCodeCells[0]!.innerHTML).toBe('<span class="hljs">line1</span>');
      expect(mockCodeCells[1]!.innerHTML).toBe(' '); // Fallback
      expect(mockCodeCells[2]!.innerHTML).toBe(' '); // Fallback
    });

    it('should handle empty code', async () => {
      const code = '';

      applySyntaxHighlighting(mockShadowRoot, code);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Empty code returns [''], and '' || ' ' evaluates to ' ' (fallback)
      expect(mockCodeCells[0]!.innerHTML).toBe(' ');
      expect(mockCodeCells[1]!.innerHTML).toBe(' ');
      expect(mockCodeCells[2]!.innerHTML).toBe(' ');
    });

    it('should not throw if no code cells exist', async () => {
      mockShadowRoot = {
        querySelectorAll: vi.fn(() => []),
      } as unknown as ShadowRoot;

      const code = 'line1';

      expect(() => {
        applySyntaxHighlighting(mockShadowRoot, code);
      }).not.toThrow();

      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  });

  describe('applySyntaxHighlighting with Element container', () => {
    let mockContainer: HTMLElement;
    let mockCodeCells: HTMLElement[];

    beforeEach(() => {
      // Create mock code cells
      mockCodeCells = [document.createElement('div'), document.createElement('div'), document.createElement('div')];
      mockCodeCells.forEach((cell) => cell.classList.add('code-cell'));

      // Create mock container element
      mockContainer = document.createElement('div');
      mockContainer.querySelectorAll = vi.fn(() => mockCodeCells as any);

      // Ensure requestIdleCallback exists
      if (!('requestIdleCallback' in window)) {
        (window as any).requestIdleCallback = (callback: IdleRequestCallback) => {
          return setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 50 }), 0) as unknown as number;
        };
      }
    });

    it('should apply highlighting to code cells within container using requestIdleCallback', async () => {
      const code = 'line1\nline2\nline3';

      applySyntaxHighlighting(mockContainer, code);

      // Wait for requestIdleCallback
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockContainer.querySelectorAll).toHaveBeenCalledWith('.code-cell');
      expect(mockCodeCells[0]!.innerHTML).toBe('<span class="hljs">line1</span>');
      expect(mockCodeCells[1]!.innerHTML).toBe('<span class="hljs">line2</span>');
      expect(mockCodeCells[2]!.innerHTML).toBe('<span class="hljs">line3</span>');
    });

    it('should use fallback when requestIdleCallback is not available', () => {
      // Remove requestIdleCallback
      const original = (window as any).requestIdleCallback;
      delete (window as any).requestIdleCallback;

      const code = 'line1\nline2\nline3';

      applySyntaxHighlighting(mockContainer, code);

      // Should apply immediately
      expect(mockCodeCells[0]!.innerHTML).toBe('<span class="hljs">line1</span>');
      expect(mockCodeCells[1]!.innerHTML).toBe('<span class="hljs">line2</span>');
      expect(mockCodeCells[2]!.innerHTML).toBe('<span class="hljs">line3</span>');

      // Restore
      (window as any).requestIdleCallback = original;
    });

    it('should handle fewer highlighted lines than code cells', async () => {
      const code = 'line1\nline2';

      applySyntaxHighlighting(mockContainer, code);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockCodeCells[0]!.innerHTML).toBe('<span class="hljs">line1</span>');
      expect(mockCodeCells[1]!.innerHTML).toBe('<span class="hljs">line2</span>');
      expect(mockCodeCells[2]!.innerHTML).toBe(' '); // Fallback for missing line
    });

    it('should handle null code gracefully', async () => {
      // getHighlightedLines handles null, returns [''], and '' || ' ' evaluates to ' '
      applySyntaxHighlighting(mockContainer, null as any);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockCodeCells[0]!.innerHTML).toBe(' ');
      expect(mockCodeCells[1]!.innerHTML).toBe(' ');
      expect(mockCodeCells[2]!.innerHTML).toBe(' ');
    });

    it('should work with real DOM elements', async () => {
      // Create real DOM structure
      const container = document.createElement('div');
      const cell1 = document.createElement('div');
      const cell2 = document.createElement('div');
      cell1.className = 'code-cell';
      cell2.className = 'code-cell';
      container.appendChild(cell1);
      container.appendChild(cell2);

      const code = 'const x = 1;\nconst y = 2;';

      applySyntaxHighlighting(container, code);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(cell1.innerHTML).toBe('<span class="hljs">const x = 1;</span>');
      expect(cell2.innerHTML).toBe('<span class="hljs">const y = 2;</span>');
    });

    it('should not throw if container has no code cells', async () => {
      const emptyContainer = document.createElement('div');

      expect(() => {
        applySyntaxHighlighting(emptyContainer, 'code');
      }).not.toThrow();

      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  });
});
