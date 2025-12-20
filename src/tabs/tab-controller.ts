import type { FileMetadata } from '../types';
import { escapeHtml } from '../rendering/html-generators';

/**
 * Generates HTML for tab buttons
 */
export function generateTabsHtml(files: FileMetadata[], activeTabIndex: number): string {
  return files
    .map(
      (file, index) => `
        <button role="tab"
                id="tab-${index}"
                aria-selected="${index === activeTabIndex ? 'true' : 'false'}"
                aria-controls="panel-${index}"
                tabindex="${index === activeTabIndex ? '0' : '-1'}"
                data-index="${index}">
            ${escapeHtml(file.filename)}
        </button>
    `
    )
    .join('');
}

/**
 * Updates tab button states (aria attributes) when switching tabs
 */
export function updateTabButtonStates(shadowRoot: ShadowRoot, newActiveIndex: number): void {
  const tabs = shadowRoot.querySelectorAll('nav > button');
  tabs.forEach((tab) => {
    const tabIndex = parseInt((tab as HTMLElement).dataset.index || '0');
    const isSelected = tabIndex === newActiveIndex;
    tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    tab.setAttribute('tabindex', isSelected ? '0' : '-1');
  });
}

/**
 * Updates tab panel visibility states when switching tabs
 */
export function updateTabPanelStates(shadowRoot: ShadowRoot, activeIndex: number): void {
  const allPanels = shadowRoot.querySelectorAll('section[role="tabpanel"]');
  allPanels.forEach((panel) => {
    const panelIndex = parseInt((panel as HTMLElement).dataset.index || '0');
    panel.setAttribute('aria-hidden', panelIndex !== activeIndex ? 'true' : 'false');
  });
}

/**
 * Creates a new tab panel element for lazy loading
 */
export function createTabPanel(index: number, skeletonHtml: string): HTMLElement {
  const contentElement = document.createElement('section');
  contentElement.setAttribute('role', 'tabpanel');
  contentElement.setAttribute('id', `panel-${index}`);
  contentElement.setAttribute('aria-labelledby', `tab-${index}`);
  contentElement.dataset.index = String(index);
  contentElement.innerHTML = skeletonHtml;
  return contentElement;
}

/**
 * Handles keyboard navigation for tabs (Arrow keys, Home, End)
 * Returns the new index if navigation should occur, null otherwise
 */
export function handleTabKeyNavigation(key: string, currentIndex: number, maxIndex: number): number | null {
  switch (key) {
    case 'ArrowLeft':
      return currentIndex > 0 ? currentIndex - 1 : maxIndex;
    case 'ArrowRight':
      return currentIndex < maxIndex ? currentIndex + 1 : 0;
    case 'Home':
      return 0;
    case 'End':
      return maxIndex;
    default:
      return null;
  }
}
