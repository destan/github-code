import type { FileMetadata, ResolvedTheme } from './types';
import { parseFileAttribute } from './parsers/file-parser';
import { isValidGitHubUrl, parseGitHubUrl, extractFilenameFromUrl } from './parsers/url-parser';
import { ensureFileLoaded } from './fetching/code-fetcher';
import { loadHighlightJS } from './fetching/highlightjs-loader';
import { StylesheetManager } from './styles/stylesheet-manager';
import {
  escapeHtml,
  getErrorContentHtml,
  getSkeletonContentHtml,
  getCodeContentHtml,
} from './rendering/html-generators';
import {
  generateSingleFileTemplate,
  generateArticleContent,
  generateTabbedTemplate,
} from './rendering/template-generators';
import { applySyntaxHighlighting } from './rendering/syntax-highlighter';
import { resolveTheme, getThemeAttribute } from './theme/theme-resolver';
import { TabState } from './tabs/tab-state';
import {
  generateTabsHtml,
  updateTabButtonStates,
  updateTabPanelStates,
  createTabPanel,
  handleTabKeyNavigation,
} from './tabs/tab-controller';

/**
 * GitHub Code Web Component
 * Displays GitHub file URLs with syntax highlighting
 */
export class GitHubCode extends HTMLElement {
  // Private fields
  #files: FileMetadata[] = [];
  #tabState = new TabState();
  #resolvedTheme: ResolvedTheme | null = null;
  #themeMediaQuery: MediaQueryList | null = null;
  #themeChangeHandler: (() => void) | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  /**
   * Safely gets a file by index, throwing if out of bounds.
   * This provides type-safe array access with noUncheckedIndexedAccess.
   */
  #getFile(index: number): FileMetadata {
    const file = this.#files[index];
    if (!file) {
      throw new Error(`File at index ${index} not found`);
    }
    return file;
  }

  static get observedAttributes(): string[] {
    return ['file', 'theme'];
  }

  connectedCallback(): void {
    // Set up theme change listener for reactive theme updates
    this.#setupThemeListener();

    // Initial render (will parse files and display)
    void this.#render();
  }

  disconnectedCallback(): void {
    // Clean up theme change listener to prevent memory leaks
    if (this.#themeMediaQuery && this.#themeChangeHandler) {
      this.#themeMediaQuery.removeEventListener('change', this.#themeChangeHandler);
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    // Skip initial attribute set (oldValue is null) - connectedCallback handles initial render
    if (oldValue === null || oldValue === newValue) {
      return;
    }

    if (name === 'file') {
      // Store current active tab index before re-parsing files
      const previousIndex = this.#tabState.getActiveTabIndex();

      // Re-parse files (clear renderedTabs since structure will be rebuilt)
      this.#tabState.reset();

      // Re-render with new file URLs
      void this.#render();

      // Try to preserve tab index if it still exists
      if (previousIndex < this.#files.length) {
        this.#tabState.setActiveTabIndex(previousIndex);
      } else {
        // Reset to first tab if previous index no longer exists
        this.#tabState.setActiveTabIndex(0);
      }
    } else if (name === 'theme') {
      this.#resolvedTheme = null; // Clear cached theme
      void this.#render();
    }
  }

  // Private methods - theming
  #setupThemeListener(): void {
    if (window.matchMedia) {
      this.#themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.#themeChangeHandler = () => {
        this.#resolvedTheme = null; // Clear cached theme
        void this.#render(); // Re-render with new theme
      };
      this.#themeMediaQuery.addEventListener('change', this.#themeChangeHandler);
    }
  }

  #getResolvedTheme(): ResolvedTheme {
    if (this.#resolvedTheme) {
      return this.#resolvedTheme;
    }

    this.#resolvedTheme = resolveTheme(getThemeAttribute(this));
    return this.#resolvedTheme;
  }

  // Apply constructable stylesheets to shadow root (CSP-compliant, no 'unsafe-inline' needed)
  #applyStyleSheets(includeTabStyles = false): void {
    const theme = this.#getResolvedTheme();
    const baseSheet = StylesheetManager.getBaseStyleSheet(theme);

    if (includeTabStyles) {
      const tabSheet = StylesheetManager.getTabStyleSheet();
      this.shadowRoot!.adoptedStyleSheets = [baseSheet, tabSheet];
    } else {
      this.shadowRoot!.adoptedStyleSheets = [baseSheet];
    }
  }

  // Private methods - rendering
  async #render(): Promise<void> {
    const fileAttr = this.getAttribute('file');

    if (!fileAttr) {
      this.#showError('Error: "file" attribute is required. Please provide a GitHub file URL.');
      return;
    }

    const fileUrls = parseFileAttribute(fileAttr);

    if (fileUrls.length === 0) {
      this.#showError('Error: "file" attribute is required. Please provide a GitHub file URL.');
      return;
    }

    // Validate all URLs
    const invalidUrl = fileUrls.find((url) => !isValidGitHubUrl(url));
    if (invalidUrl) {
      // Sanitize URL before using in error message to prevent XSS
      const sanitizedUrl = escapeHtml(invalidUrl);
      this.#showError(
        `Error: Invalid GitHub URL format: ${sanitizedUrl}. Expected format: https://github.com/{owner}/{repo}/blob/{commit}/{path}`
      );
      return;
    }

    // Parse URLs to get file metadata first (don't fetch content yet - lazy load on demand)
    this.#files = fileUrls.map((url) => {
      try {
        const { rawUrl, filename } = parseGitHubUrl(url);
        return {
          filename,
          rawUrl,
          url,
          code: null,
          error: null,
          loaded: false,
        };
      } catch (error) {
        const filename = extractFilenameFromUrl(url);
        return {
          filename,
          rawUrl: url,
          url,
          code: null,
          error: error instanceof Error ? error.message : String(error),
          loaded: true, // Parse error - no point retrying
        };
      }
    });

    // Render skeleton UI immediately (tabs or single file structure)
    if (fileUrls.length === 1) {
      // Single file: show header + skeleton
      const file = this.#getFile(0);
      if (file.error) {
        this.#showError(`Error loading code: ${file.error}`);
        return;
      }
      // Show skeleton immediately
      this.shadowRoot!.innerHTML = generateSingleFileTemplate(
        file.filename,
        getSkeletonContentHtml(),
        StylesheetManager.getHighlightJSThemeUrl(this.#getResolvedTheme())
      );
      this.#applyStyleSheets(false);
    } else {
      // Multiple files: show tabs + skeleton immediately
      this.#renderTabsSkeletonStructure();
    }

    // Load highlight.js in background (UI already visible)
    try {
      await loadHighlightJS();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.#showError(`Error loading highlight.js: ${errorMsg}`);
      return;
    }

    // Now load actual content
    if (fileUrls.length === 1) {
      await this.#displayCode(0);
    } else {
      await this.#displayWithTabs();
    }
  }

  async #displayCode(index: number): Promise<void> {
    const file = this.#getFile(index);
    const themeUrl = StylesheetManager.getHighlightJSThemeUrl(this.#getResolvedTheme());

    // Render skeleton immediately
    this.shadowRoot!.innerHTML = generateSingleFileTemplate(file.filename, getSkeletonContentHtml(), themeUrl);
    this.#applyStyleSheets(false);

    // Load content in background and update when ready
    await ensureFileLoaded(file, false);

    const contentArea = this.shadowRoot!.querySelector('article');
    if (file.error) {
      contentArea!.innerHTML = generateArticleContent(file.filename, getErrorContentHtml(file.error, true));
      // Add retry button event listener
      const retryButton = contentArea!.querySelector('.retry-button');
      if (retryButton) {
        retryButton.addEventListener('click', () => {
          void (async () => {
            // Show skeleton during retry
            contentArea!.innerHTML = generateArticleContent(file.filename, getSkeletonContentHtml());
            await ensureFileLoaded(file, true);
            await this.#displayCode(index);
          })();
        });
      }
    } else {
      contentArea!.innerHTML = generateArticleContent(file.filename, getCodeContentHtml(file.code));
      if (window.hljs) {
        applySyntaxHighlighting(this.shadowRoot!, file.code!);
      }
    }
  }

  async #displayWithTabs(): Promise<void> {
    if (!this.#tabState.areTabsFullyRendered()) {
      // First full render - build entire structure with event listeners
      await this.#renderTabsStructure();
      this.#tabState.setTabsFullyRendered(true);
    } else {
      // Tab switching - update only what's needed
      this.#switchToTab(this.#tabState.getActiveTabIndex());
    }
  }

  #renderTabsSkeletonStructure(): void {
    const activeIndex = this.#tabState.getActiveTabIndex();
    const tabsHtml = generateTabsHtml(this.#files, activeIndex);
    const themeUrl = StylesheetManager.getHighlightJSThemeUrl(this.#getResolvedTheme());

    this.shadowRoot!.innerHTML = generateTabbedTemplate(tabsHtml, activeIndex, getSkeletonContentHtml(), themeUrl);
    this.#applyStyleSheets(true);
  }

  async #renderTabsStructure(): Promise<void> {
    const activeIndex = this.#tabState.getActiveTabIndex();
    const tabsHtml = generateTabsHtml(this.#files, activeIndex);
    const themeUrl = StylesheetManager.getHighlightJSThemeUrl(this.#getResolvedTheme());

    // Render tabs and skeleton immediately
    this.shadowRoot!.innerHTML = generateTabbedTemplate(tabsHtml, activeIndex, getSkeletonContentHtml(), themeUrl);
    this.#applyStyleSheets(true);

    // Use event delegation on parent nav element to prevent race conditions
    const nav = this.shadowRoot!.querySelector('nav[role="tablist"]');
    nav!.addEventListener('click', (e) => {
      const tab = (e.target as Element).closest('button[role="tab"]');
      if (tab) {
        const newIndex = parseInt((tab as HTMLElement).dataset.index || '0');
        if (newIndex !== this.#tabState.getActiveTabIndex()) {
          this.#tabState.setActiveTabIndex(newIndex);
          void this.#displayWithTabs();
        }
      }
    });

    // Add keyboard navigation for accessibility
    nav!.addEventListener('keydown', (e) => {
      const keyboardEvent = e as KeyboardEvent;
      const tab = (keyboardEvent.target as Element).closest('button[role="tab"]');
      if (!tab) {
        return;
      }

      const currentIndex = this.#tabState.getActiveTabIndex();
      const maxIndex = this.#files.length - 1;

      const newIndex = handleTabKeyNavigation(keyboardEvent.key, currentIndex, maxIndex);

      if (newIndex !== null) {
        e.preventDefault();
        this.#tabState.setActiveTabIndex(newIndex);
        void this.#displayWithTabs().then(() => {
          // Focus the newly selected tab
          const newTab = this.shadowRoot!.querySelector(`button[data-index="${newIndex}"]`);
          if (newTab) {
            (newTab as HTMLElement).focus();
          }
        });
      }
    });

    // Mark this tab as rendered
    this.#tabState.markTabAsRendered(activeIndex);

    // Load active file content in background and update when ready
    const contentElement = this.shadowRoot!.querySelector('section[role="tabpanel"]');
    await this.#loadAndRenderTabContent(activeIndex, contentElement as HTMLElement).catch((error: unknown) => {
      console.error('Failed to load tab content:', error);
      (contentElement as HTMLElement).innerHTML = getErrorContentHtml(
        `Failed to load content: ${error instanceof Error ? error.message : String(error)}`
      );
    });
  }

  #switchToTab(newIndex: number): void {
    // Update tab buttons - use aria-selected and tabindex for accessibility
    updateTabButtonStates(this.shadowRoot!, newIndex);

    // Check if content for this tab already exists
    let contentElement = this.shadowRoot!.querySelector(`section[role="tabpanel"][data-index="${newIndex}"]`);

    if (!contentElement) {
      // Create skeleton immediately (lazy load pattern)
      contentElement = createTabPanel(newIndex, getSkeletonContentHtml());

      // Append skeleton to DOM immediately (user sees it right away)
      this.shadowRoot!.querySelector('article')!.appendChild(contentElement);
      this.#tabState.markTabAsRendered(newIndex);

      // Load content asynchronously and update when ready
      void this.#loadAndRenderTabContent(newIndex, contentElement as HTMLElement).catch((error: unknown) => {
        console.error('Failed to load tab content:', error);
        (contentElement as HTMLElement).innerHTML = getErrorContentHtml(
          `Failed to load content: ${error instanceof Error ? error.message : String(error)}`
        );
      });
    }

    // Update panels - use aria-hidden instead of .hidden class
    updateTabPanelStates(this.shadowRoot!, newIndex);
  }

  async #loadAndRenderTabContent(index: number, contentElement: HTMLElement): Promise<void> {
    // Load file content
    const file = this.#getFile(index);
    await ensureFileLoaded(file, false);

    // Replace skeleton with actual content
    if (file.error || !file.code) {
      const errorMsg = file.error || 'Failed to load content: No content available';
      contentElement.innerHTML = getErrorContentHtml(errorMsg, true);

      // Add retry button event listener
      const retryButton = contentElement.querySelector('.retry-button');
      if (retryButton) {
        retryButton.addEventListener('click', () => {
          void (async () => {
            // Show skeleton during retry
            contentElement.innerHTML = getSkeletonContentHtml();
            await ensureFileLoaded(file, true);
            await this.#loadAndRenderTabContent(index, contentElement);
          })();
        });
      }
    } else {
      contentElement.innerHTML = getCodeContentHtml(file.code);
      // Apply syntax highlighting
      if (window.hljs) {
        applySyntaxHighlighting(contentElement, file.code);
      }
    }
  }

  #showError(message: string): void {
    this.shadowRoot!.innerHTML = `
    <div class="error">${escapeHtml(message)}</div>
    `;
    this.#applyStyleSheets(false);
  }
}
