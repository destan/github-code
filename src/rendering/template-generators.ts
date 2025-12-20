import { escapeHtml } from './html-generators';

/**
 * Generates the outer HTML structure for a single file display.
 *
 * @param filename - The filename to show in the header
 * @param content - The inner content HTML (skeleton, code, or error)
 * @param themeStylesheetUrl - URL for the highlight.js theme CSS
 * @returns Complete HTML string for single file layout
 */
export function generateSingleFileTemplate(filename: string, content: string, themeStylesheetUrl: string): string {
  return `<link rel="stylesheet" href="${themeStylesheetUrl}">
<article>
    <header>${escapeHtml(filename)}</header>
    ${content}
</article>`;
}

/**
 * Generates the article content for a single file (header + content).
 * Used when updating only the article innards, not the full template.
 *
 * @param filename - The filename to show in the header
 * @param content - The inner content HTML
 * @returns HTML string for article content
 */
export function generateArticleContent(filename: string, content: string): string {
  return `<header>${escapeHtml(filename)}</header>
    ${content}`;
}

/**
 * Generates the outer HTML structure for tabbed file display.
 *
 * @param tabsHtml - Pre-generated HTML for tab buttons
 * @param activeIndex - Index of the currently active tab
 * @param panelContent - Content HTML for the active panel
 * @param themeStylesheetUrl - URL for the highlight.js theme CSS
 * @returns Complete HTML string for tabbed layout
 */
export function generateTabbedTemplate(
  tabsHtml: string,
  activeIndex: number,
  panelContent: string,
  themeStylesheetUrl: string
): string {
  return `<link rel="stylesheet" href="${themeStylesheetUrl}">
<article>
    <nav role="tablist" aria-label="Code files">${tabsHtml}</nav>
    <section role="tabpanel"
             id="panel-${activeIndex}"
             aria-labelledby="tab-${activeIndex}"
             data-index="${activeIndex}">
        ${panelContent}
    </section>
</article>`;
}
