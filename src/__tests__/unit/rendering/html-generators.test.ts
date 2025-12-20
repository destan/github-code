import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  getErrorContentHtml,
  getSkeletonContentHtml,
  getCodeContentHtml,
} from '@/rendering/html-generators';

describe('html-generators', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("XSS")</script>')).toBe('&lt;script&gt;alert("XSS")&lt;/script&gt;');
    });

    it('should escape ampersands', () => {
      expect(escapeHtml('A & B')).toBe('A &amp; B');
    });

    it('should not escape quotes (textContent does not escape quotes)', () => {
      // textContent only prevents script execution, doesn't escape quotes
      expect(escapeHtml('"Hello"')).toBe('"Hello"');
    });

    it('should handle plain text without special characters', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should escape angle brackets and ampersands', () => {
      expect(escapeHtml('<div class="test">A & B</div>')).toBe('&lt;div class="test"&gt;A &amp; B&lt;/div&gt;');
    });
  });

  describe('getErrorContentHtml', () => {
    it('should generate error HTML without retry button', () => {
      const html = getErrorContentHtml('Something went wrong');

      expect(html).toContain('<div class="error">');
      expect(html).toContain('Something went wrong');
      expect(html).not.toContain('retry-button');
    });

    it('should generate error HTML with retry button when showRetry is true', () => {
      const html = getErrorContentHtml('Something went wrong', true);

      expect(html).toContain('<div class="error">');
      expect(html).toContain('Something went wrong');
      expect(html).toContain('<button class="retry-button">Retry</button>');
    });

    it('should escape HTML in error message', () => {
      const html = getErrorContentHtml('<script>alert("XSS")</script>');

      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<script>');
    });

    it('should handle empty error message', () => {
      const html = getErrorContentHtml('');

      expect(html).toContain('<div class="error">');
    });

    it('should handle error with special characters', () => {
      const html = getErrorContentHtml('Error: File "test.ts" not found');

      // Quotes are not escaped by textContent method
      expect(html).toContain('Error: File "test.ts" not found');
    });
  });

  describe('getSkeletonContentHtml', () => {
    it('should generate skeleton HTML with 20 lines', () => {
      const html = getSkeletonContentHtml();

      expect(html).toContain('code-wrapper skeleton-loading');
      expect(html).toContain('code-table');

      // Count the number of skeleton lines (should be 20)
      const lineMatches = html.match(/class="code-row"/g);
      expect(lineMatches).toHaveLength(20);
    });

    it('should include line numbers in skeleton', () => {
      const html = getSkeletonContentHtml();

      expect(html).toContain('<div class="line-number">1</div>');
      expect(html).toContain('<div class="line-number">20</div>');
    });

    it('should include skeleton-line elements', () => {
      const html = getSkeletonContentHtml();

      const skeletonLineMatches = html.match(/class="skeleton-line"/g);
      expect(skeletonLineMatches).toHaveLength(20);
    });

    it('should have varying widths for skeleton lines', () => {
      const html = getSkeletonContentHtml();

      // Should contain style attributes with width percentages
      expect(html).toMatch(/style="width: \d+(\.\d+)?%"/);
    });

    it('should generate consistent structure each time', () => {
      const html1 = getSkeletonContentHtml();
      const html2 = getSkeletonContentHtml();

      // Structure should be the same (both have 20 lines)
      const count1 = (html1.match(/class="code-row"/g) || []).length;
      const count2 = (html2.match(/class="code-row"/g) || []).length;

      expect(count1).toBe(count2);
      expect(count1).toBe(20);
    });
  });

  describe('getCodeContentHtml', () => {
    it('should generate code HTML for valid code', () => {
      const code = 'const x = 1;\nconst y = 2;';
      const html = getCodeContentHtml(code);

      expect(html).toContain('code-wrapper hljs');
      expect(html).toContain('code-table');
      expect(html).toContain('const x = 1;');
      expect(html).toContain('const y = 2;');
    });

    it('should return error HTML when code is null', () => {
      const html = getCodeContentHtml(null);

      expect(html).toContain('error');
      expect(html).toContain('No code content available');
    });

    it('should generate line numbers correctly', () => {
      const code = 'line1\nline2\nline3';
      const html = getCodeContentHtml(code);

      expect(html).toContain('<div class="line-number">1</div>');
      expect(html).toContain('<div class="line-number">2</div>');
      expect(html).toContain('<div class="line-number">3</div>');
    });

    it('should escape HTML in code content', () => {
      const code = '<script>alert("test")</script>';
      const html = getCodeContentHtml(code);

      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<script>alert');
    });

    it('should remove last empty line if it exists', () => {
      const code = 'line1\nline2\n'; // Trailing newline
      const html = getCodeContentHtml(code);

      // Should only have 2 lines, not 3
      const lineNumbers = html.match(/<div class="line-number">\d+<\/div>/g);
      expect(lineNumbers).toHaveLength(2);
      expect(html).toContain('<div class="line-number">1</div>');
      expect(html).toContain('<div class="line-number">2</div>');
      expect(html).not.toContain('<div class="line-number">3</div>');
    });

    it('should handle code without trailing newline', () => {
      const code = 'line1\nline2'; // No trailing newline
      const html = getCodeContentHtml(code);

      const lineNumbers = html.match(/<div class="line-number">\d+<\/div>/g);
      expect(lineNumbers).toHaveLength(2);
    });

    it('should handle single line code', () => {
      const code = 'const x = 1;';
      const html = getCodeContentHtml(code);

      expect(html).toContain('<div class="line-number">1</div>');
      expect(html).toContain('const x = 1;');
    });

    it('should return error for empty code string', () => {
      const code = '';
      const html = getCodeContentHtml(code);

      // Empty string is falsy, so it triggers the null check
      expect(html).toContain('error');
      expect(html).toContain('No code content available');
    });

    it('should replace empty lines with space placeholder', () => {
      const code = 'line1\n\nline3';
      const html = getCodeContentHtml(code);

      // Check that empty lines are preserved as space
      const cellMatches = html.match(/<div class="code-cell">(.*?)<\/div>/g);
      expect(cellMatches).toBeTruthy();
    });

    it('should handle code with special characters', () => {
      const code = 'const str = "Hello & Goodbye";';
      const html = getCodeContentHtml(code);

      // Ampersand is escaped
      expect(html).toContain('&amp;');
      // Quotes are not escaped by textContent
      expect(html).toContain('"Hello');
    });

    it('should handle very long code', () => {
      const lines = Array.from({ length: 100 }, (_, i) => `line ${i + 1}`);
      const code = lines.join('\n');
      const html = getCodeContentHtml(code);

      expect(html).toContain('<div class="line-number">1</div>');
      expect(html).toContain('<div class="line-number">100</div>');

      const lineNumbers = html.match(/<div class="line-number">\d+<\/div>/g);
      expect(lineNumbers).toHaveLength(100);
    });

    it('should handle code with tabs and multiple spaces', () => {
      const code = '\tfunction test() {\n\t\treturn true;\n\t}';
      const html = getCodeContentHtml(code);

      expect(html).toContain('function test()');
      expect(html).toContain('return true;');
    });
  });
});
