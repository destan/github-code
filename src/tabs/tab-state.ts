/**
 * Manages tab state for the component
 */
export class TabState {
  private activeTabIndex = 0;
  private renderedTabs = new Set<number>();
  private tabsFullyRendered = false;

  /**
   * Gets the currently active tab index
   */
  getActiveTabIndex(): number {
    return this.activeTabIndex;
  }

  /**
   * Sets the active tab index
   */
  setActiveTabIndex(index: number): void {
    this.activeTabIndex = index;
  }

  /**
   * Checks if tabs structure is fully rendered with event listeners
   */
  areTabsFullyRendered(): boolean {
    return this.tabsFullyRendered;
  }

  /**
   * Marks tabs as fully rendered
   */
  setTabsFullyRendered(value: boolean): void {
    this.tabsFullyRendered = value;
  }

  /**
   * Checks if a tab has been rendered
   */
  isTabRendered(index: number): boolean {
    return this.renderedTabs.has(index);
  }

  /**
   * Marks a tab as rendered
   */
  markTabAsRendered(index: number): void {
    this.renderedTabs.add(index);
  }

  /**
   * Clears all rendered tabs
   */
  clearRenderedTabs(): void {
    this.renderedTabs.clear();
  }

  /**
   * Gets the total number of tabs
   */
  getTabCount(files: unknown[]): number {
    return files.length;
  }

  /**
   * Resets tab state (useful when re-parsing files)
   */
  reset(): void {
    this.renderedTabs.clear();
    this.tabsFullyRendered = false;
    // Note: activeTabIndex is NOT reset here - that's handled by the caller
  }
}
