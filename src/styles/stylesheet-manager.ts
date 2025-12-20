import baseLightCss from './base-light.css';
import baseDarkCss from './base-dark.css';
import tabCss from './tab.css';
import type { ResolvedTheme } from '../types';

/**
 * Manages constructable stylesheets for the component.
 * Implements caching to share stylesheet instances across all component instances.
 */
export class StylesheetManager {
  private static baseStylesLight: CSSStyleSheet | null = null;
  private static baseStylesDark: CSSStyleSheet | null = null;
  private static tabStyles: CSSStyleSheet | null = null;

  /**
   * Gets the base stylesheet for the specified theme (light or dark).
   * Lazy-loads and caches the stylesheet on first access.
   */
  static getBaseStyleSheet(theme: ResolvedTheme): CSSStyleSheet {
    if (theme === 'dark') {
      if (!this.baseStylesDark) {
        this.baseStylesDark = new CSSStyleSheet();
        this.baseStylesDark.replaceSync(baseDarkCss);
      }
      return this.baseStylesDark;
    } else {
      if (!this.baseStylesLight) {
        this.baseStylesLight = new CSSStyleSheet();
        this.baseStylesLight.replaceSync(baseLightCss);
      }
      return this.baseStylesLight;
    }
  }

  /**
   * Gets the tab stylesheet.
   * Lazy-loads and caches the stylesheet on first access.
   */
  static getTabStyleSheet(): CSSStyleSheet {
    if (!this.tabStyles) {
      this.tabStyles = new CSSStyleSheet();
      this.tabStyles.replaceSync(tabCss);
    }
    return this.tabStyles;
  }

  /**
   * Gets the highlight.js theme URL for the specified theme.
   */
  static getHighlightJSThemeUrl(theme: ResolvedTheme): string {
    const themeFile = theme === 'dark' ? 'github-dark.min.css' : 'github.min.css';
    return `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/${themeFile}`;
  }
}
