import { describe, it, expect } from 'vitest';
import {
  generateSingleFileTemplate,
  generateArticleContent,
  generateTabbedTemplate,
} from '@/rendering/template-generators';

describe('template-generators', () => {
  describe('generateSingleFileTemplate', () => {
    it('generates correct HTML structure', () => {
      const result = generateSingleFileTemplate('test.ts', '<div>content</div>', 'https://example.com/theme.css');

      expect(result).toContain('<link rel="stylesheet" href="https://example.com/theme.css">');
      expect(result).toContain('<article>');
      expect(result).toContain('<header>test.ts</header>');
      expect(result).toContain('<div>content</div>');
      expect(result).toContain('</article>');
    });

    it('escapes HTML in filename', () => {
      const result = generateSingleFileTemplate('<script>alert("xss")</script>', 'content', 'theme.css');

      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('preserves content HTML', () => {
      const content = '<table><tr><td>code</td></tr></table>';
      const result = generateSingleFileTemplate('file.ts', content, 'theme.css');

      expect(result).toContain(content);
    });
  });

  describe('generateArticleContent', () => {
    it('generates header and content', () => {
      const result = generateArticleContent('index.js', '<code>let x = 1;</code>');

      expect(result).toContain('<header>index.js</header>');
      expect(result).toContain('<code>let x = 1;</code>');
    });

    it('escapes HTML in filename', () => {
      const result = generateArticleContent('<img src=x onerror=alert(1)>', 'content');

      expect(result).not.toContain('<img');
      expect(result).toContain('&lt;img');
    });

    it('preserves content structure', () => {
      const content = '<div class="error"><span>Error message</span></div>';
      const result = generateArticleContent('file.ts', content);

      expect(result).toContain(content);
    });
  });

  describe('generateTabbedTemplate', () => {
    it('generates correct tabbed structure', () => {
      const tabsHtml = '<button role="tab">Tab 1</button>';
      const result = generateTabbedTemplate(tabsHtml, 0, '<code>content</code>', 'theme.css');

      expect(result).toContain('<link rel="stylesheet" href="theme.css">');
      expect(result).toContain('<article>');
      expect(result).toContain('<nav role="tablist" aria-label="Code files">');
      expect(result).toContain(tabsHtml);
      expect(result).toContain('</nav>');
      expect(result).toContain('<section role="tabpanel"');
      expect(result).toContain('<code>content</code>');
    });

    it('sets correct aria attributes for panel', () => {
      const result = generateTabbedTemplate('<button>Tab</button>', 2, 'content', 'theme.css');

      expect(result).toContain('id="panel-2"');
      expect(result).toContain('aria-labelledby="tab-2"');
      expect(result).toContain('data-index="2"');
    });

    it('handles different active indices', () => {
      for (const index of [0, 1, 5, 10]) {
        const result = generateTabbedTemplate('<button>Tab</button>', index, 'content', 'theme.css');

        expect(result).toContain(`id="panel-${index}"`);
        expect(result).toContain(`aria-labelledby="tab-${index}"`);
        expect(result).toContain(`data-index="${index}"`);
      }
    });

    it('preserves tabs HTML structure', () => {
      const complexTabsHtml = `
        <button role="tab" aria-selected="true" data-index="0">file1.ts</button>
        <button role="tab" aria-selected="false" data-index="1">file2.ts</button>
      `;
      const result = generateTabbedTemplate(complexTabsHtml, 0, 'content', 'theme.css');

      expect(result).toContain('aria-selected="true"');
      expect(result).toContain('aria-selected="false"');
      expect(result).toContain('data-index="0"');
      expect(result).toContain('data-index="1"');
    });

    it('preserves panel content', () => {
      const panelContent = '<table class="code-table"><tr><td>1</td><td>code</td></tr></table>';
      const result = generateTabbedTemplate('<button>Tab</button>', 0, panelContent, 'theme.css');

      expect(result).toContain(panelContent);
    });
  });
});
