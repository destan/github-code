import { describe, it, expect, beforeEach } from 'vitest';
import { TabState } from '@/tabs/tab-state';

describe('TabState', () => {
  let tabState: TabState;

  beforeEach(() => {
    tabState = new TabState();
  });

  describe('activeTabIndex management', () => {
    it('should initialize with activeTabIndex of 0', () => {
      expect(tabState.getActiveTabIndex()).toBe(0);
    });

    it('should set and get activeTabIndex', () => {
      tabState.setActiveTabIndex(2);
      expect(tabState.getActiveTabIndex()).toBe(2);
    });

    it('should update activeTabIndex multiple times', () => {
      tabState.setActiveTabIndex(1);
      expect(tabState.getActiveTabIndex()).toBe(1);

      tabState.setActiveTabIndex(3);
      expect(tabState.getActiveTabIndex()).toBe(3);

      tabState.setActiveTabIndex(0);
      expect(tabState.getActiveTabIndex()).toBe(0);
    });
  });

  describe('tabsFullyRendered flag', () => {
    it('should initialize with tabsFullyRendered as false', () => {
      expect(tabState.areTabsFullyRendered()).toBe(false);
    });

    it('should set tabsFullyRendered to true', () => {
      tabState.setTabsFullyRendered(true);
      expect(tabState.areTabsFullyRendered()).toBe(true);
    });

    it('should set tabsFullyRendered to false', () => {
      tabState.setTabsFullyRendered(true);
      tabState.setTabsFullyRendered(false);
      expect(tabState.areTabsFullyRendered()).toBe(false);
    });

    it('should toggle tabsFullyRendered state', () => {
      expect(tabState.areTabsFullyRendered()).toBe(false);
      tabState.setTabsFullyRendered(true);
      expect(tabState.areTabsFullyRendered()).toBe(true);
      tabState.setTabsFullyRendered(false);
      expect(tabState.areTabsFullyRendered()).toBe(false);
    });
  });

  describe('renderedTabs Set management', () => {
    it('should initialize with no rendered tabs', () => {
      expect(tabState.isTabRendered(0)).toBe(false);
      expect(tabState.isTabRendered(1)).toBe(false);
    });

    it('should mark tab as rendered', () => {
      tabState.markTabAsRendered(0);
      expect(tabState.isTabRendered(0)).toBe(true);
    });

    it('should track multiple rendered tabs', () => {
      tabState.markTabAsRendered(0);
      tabState.markTabAsRendered(2);
      tabState.markTabAsRendered(5);

      expect(tabState.isTabRendered(0)).toBe(true);
      expect(tabState.isTabRendered(1)).toBe(false);
      expect(tabState.isTabRendered(2)).toBe(true);
      expect(tabState.isTabRendered(3)).toBe(false);
      expect(tabState.isTabRendered(5)).toBe(true);
    });

    it('should not duplicate rendered tabs', () => {
      tabState.markTabAsRendered(1);
      tabState.markTabAsRendered(1);
      tabState.markTabAsRendered(1);

      // Set behavior - should only have one entry
      expect(tabState.isTabRendered(1)).toBe(true);
    });

    it('should clear all rendered tabs', () => {
      tabState.markTabAsRendered(0);
      tabState.markTabAsRendered(1);
      tabState.markTabAsRendered(2);

      tabState.clearRenderedTabs();

      expect(tabState.isTabRendered(0)).toBe(false);
      expect(tabState.isTabRendered(1)).toBe(false);
      expect(tabState.isTabRendered(2)).toBe(false);
    });
  });

  describe('getTabCount', () => {
    it('should return count of files', () => {
      const files = [{ name: 'file1' }, { name: 'file2' }, { name: 'file3' }];
      expect(tabState.getTabCount(files)).toBe(3);
    });

    it('should return 0 for empty array', () => {
      expect(tabState.getTabCount([])).toBe(0);
    });

    it('should return count for single file', () => {
      const files = [{ name: 'file1' }];
      expect(tabState.getTabCount(files)).toBe(1);
    });

    it('should work with any array-like structure', () => {
      const files = ['a', 'b', 'c', 'd', 'e'];
      expect(tabState.getTabCount(files)).toBe(5);
    });
  });

  describe('reset', () => {
    it('should clear rendered tabs', () => {
      tabState.markTabAsRendered(0);
      tabState.markTabAsRendered(1);

      tabState.reset();

      expect(tabState.isTabRendered(0)).toBe(false);
      expect(tabState.isTabRendered(1)).toBe(false);
    });

    it('should reset tabsFullyRendered to false', () => {
      tabState.setTabsFullyRendered(true);

      tabState.reset();

      expect(tabState.areTabsFullyRendered()).toBe(false);
    });

    it('should NOT reset activeTabIndex', () => {
      tabState.setActiveTabIndex(3);

      tabState.reset();

      // activeTabIndex should NOT be reset - caller handles this
      expect(tabState.getActiveTabIndex()).toBe(3);
    });

    it('should handle multiple resets', () => {
      tabState.markTabAsRendered(0);
      tabState.setTabsFullyRendered(true);

      tabState.reset();
      expect(tabState.isTabRendered(0)).toBe(false);
      expect(tabState.areTabsFullyRendered()).toBe(false);

      tabState.markTabAsRendered(1);
      tabState.setTabsFullyRendered(true);

      tabState.reset();
      expect(tabState.isTabRendered(1)).toBe(false);
      expect(tabState.areTabsFullyRendered()).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should handle typical tab switching workflow', () => {
      // Initial state
      expect(tabState.getActiveTabIndex()).toBe(0);
      expect(tabState.areTabsFullyRendered()).toBe(false);

      // First render
      tabState.setTabsFullyRendered(true);
      tabState.markTabAsRendered(0);

      expect(tabState.isTabRendered(0)).toBe(true);

      // Switch to tab 1
      tabState.setActiveTabIndex(1);
      tabState.markTabAsRendered(1);

      expect(tabState.getActiveTabIndex()).toBe(1);
      expect(tabState.isTabRendered(0)).toBe(true);
      expect(tabState.isTabRendered(1)).toBe(true);

      // Switch to tab 2
      tabState.setActiveTabIndex(2);
      tabState.markTabAsRendered(2);

      expect(tabState.getActiveTabIndex()).toBe(2);
      expect(tabState.isTabRendered(2)).toBe(true);
    });

    it('should handle re-parsing files scenario', () => {
      // Initial state with tabs rendered
      tabState.setActiveTabIndex(2);
      tabState.setTabsFullyRendered(true);
      tabState.markTabAsRendered(0);
      tabState.markTabAsRendered(1);
      tabState.markTabAsRendered(2);

      // Re-parse files (reset tabs but preserve active index)
      const previousIndex = tabState.getActiveTabIndex();
      tabState.reset();

      expect(tabState.getActiveTabIndex()).toBe(previousIndex); // Preserved
      expect(tabState.areTabsFullyRendered()).toBe(false); // Reset
      expect(tabState.isTabRendered(0)).toBe(false); // Reset
      expect(tabState.isTabRendered(1)).toBe(false); // Reset
      expect(tabState.isTabRendered(2)).toBe(false); // Reset
    });

    it('should handle lazy loading scenario', () => {
      // Start with tabs not fully rendered
      expect(tabState.areTabsFullyRendered()).toBe(false);

      // User views tab 0 (lazy load)
      tabState.markTabAsRendered(0);
      expect(tabState.isTabRendered(0)).toBe(true);
      expect(tabState.isTabRendered(1)).toBe(false);

      // Tabs become fully rendered
      tabState.setTabsFullyRendered(true);

      // User switches to tab 2 (lazy load)
      tabState.setActiveTabIndex(2);
      tabState.markTabAsRendered(2);

      expect(tabState.isTabRendered(0)).toBe(true);
      expect(tabState.isTabRendered(1)).toBe(false); // Still not rendered
      expect(tabState.isTabRendered(2)).toBe(true);
    });
  });
});
