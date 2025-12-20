import type { Theme, ResolvedTheme } from '../types';

/**
 * Resolves a theme attribute to an actual theme value.
 * Handles 'auto' theme by detecting system preference.
 *
 * @param themeAttr - The theme attribute value ('light', 'dark', or 'auto')
 * @returns The resolved theme ('light' or 'dark')
 */
export function resolveTheme(themeAttr: Theme): ResolvedTheme {
  if (themeAttr === 'dark') {
    return 'dark';
  }

  if (themeAttr === 'light') {
    return 'light';
  }

  // auto - detect system preference
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

/**
 * Gets the theme attribute from an element, defaulting to 'auto'.
 *
 * @param element - The HTML element to get the theme from
 * @returns The theme value
 */
export function getThemeAttribute(element: HTMLElement): Theme {
  const attr = element.getAttribute('theme');
  if (attr === 'dark' || attr === 'light') {
    return attr;
  }
  return 'auto';
}

/**
 * Creates a theme change handler that clears cached theme and triggers re-render.
 *
 * @param onThemeChange - Callback to invoke when theme changes
 * @returns Object with setup and cleanup functions for theme media query listener
 */
export function createThemeListener(onThemeChange: () => void): {
  setup: () => MediaQueryList | null;
  cleanup: (mediaQuery: MediaQueryList | null) => void;
  handler: () => void;
} {
  const handler = onThemeChange;

  return {
    setup: () => {
      if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', handler);
        return mediaQuery;
      }
      return null;
    },
    cleanup: (mediaQuery: MediaQueryList | null) => {
      if (mediaQuery) {
        mediaQuery.removeEventListener('change', handler);
      }
    },
    handler,
  };
}
