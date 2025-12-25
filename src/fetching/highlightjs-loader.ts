/**
 * Shared promise to prevent multiple simultaneous loads of highlight.js
 */
let highlightJSLoadingPromise: Promise<void> | null = null;

/**
 * Track which URL was loaded for introspection
 */
let loadedHighlightJSUrl: string | null = null;

/**
 * Track the source of the loaded highlight.js library
 */
let highlightJSSource: 'user-provided' | 'cdn-default' | 'global' = 'global';

/**
 * Type definition for highlight.js on window object
 */
declare global {
  interface Window {
    hljs?: {
      highlightAuto: (code: string) => { value: string };
    };
  }
}

/**
 * Get the URL that was loaded (or will be loaded)
 * Returns "auto" if using default behavior or global hljs
 */
export function getLoadedHighlightJSUrl(): string {
  return loadedHighlightJSUrl || 'auto';
}

/**
 * Get the source of the highlight.js library
 */
export function getHighlightJSSource(): 'user-provided' | 'cdn-default' | 'global' {
  return highlightJSSource;
}

/**
 * Loads highlight.js library from CDN if not already loaded.
 * Uses a singleton pattern to ensure only one load attempt happens at a time.
 * @param customUrl - Optional custom URL to load highlight.js from
 */
export async function loadHighlightJS(customUrl?: string): Promise<void> {
  // If already loaded globally, track and return
  if (window.hljs) {
    if (!loadedHighlightJSUrl) {
      highlightJSSource = 'global';
      loadedHighlightJSUrl = 'auto';
    }
    return;
  }

  // If currently loading, check for URL conflicts and return the existing promise
  if (highlightJSLoadingPromise) {
    if (customUrl && loadedHighlightJSUrl && customUrl !== loadedHighlightJSUrl) {
      console.warn(
        `[github-code] Different highlight.js URLs detected. ` +
          `Already loading from "${loadedHighlightJSUrl}", ` +
          `but this instance requested "${customUrl}". ` +
          `The first URL will be used for all instances.`
      );
    }
    return highlightJSLoadingPromise;
  }

  // Determine which URL to use
  const DEFAULT_URL = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js';
  const urlToLoad = customUrl || DEFAULT_URL;

  // Track state
  loadedHighlightJSUrl = urlToLoad;
  highlightJSSource = customUrl ? 'user-provided' : 'cdn-default';

  // Create new loading promise
  highlightJSLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = urlToLoad;

    // Only add integrity for default CDN URL
    if (!customUrl) {
      script.integrity = 'sha384-RH2xi4eIQ/gjtbs9fUXM68sLSi99C7ZWBRX1vDrVv6GQXRibxXLbwO2NGZB74MbU';
      script.crossOrigin = 'anonymous';
    }

    script.onload = () => {
      highlightJSLoadingPromise = null;

      // Validate that window.hljs was defined
      if (!window.hljs) {
        loadedHighlightJSUrl = null;
        highlightJSSource = 'global';
        reject(
          new Error(
            `The script at "${urlToLoad}" loaded successfully but did not define window.hljs. ` +
              `Please ensure this URL points to a valid highlight.js library.`
          )
        );
        return;
      }

      resolve();
    };

    script.onerror = () => {
      highlightJSLoadingPromise = null;
      loadedHighlightJSUrl = null;
      highlightJSSource = 'global';

      const errorMsg =
        `Failed to load highlight.js library from: ${urlToLoad}\n` +
        (customUrl
          ? 'Please check that the URL is correct and accessible.'
          : 'If you have a Content Security Policy (CSP), ensure it allows:\n' +
            '  script-src https://cdnjs.cloudflare.com\n' +
            '  style-src https://cdnjs.cloudflare.com');
      reject(new Error(errorMsg));
    };

    document.head.appendChild(script);
  });

  return highlightJSLoadingPromise;
}
