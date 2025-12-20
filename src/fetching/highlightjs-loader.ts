/**
 * Shared promise to prevent multiple simultaneous loads of highlight.js
 */
let highlightJSLoadingPromise: Promise<void> | null = null;

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
 * Loads highlight.js library from CDN if not already loaded.
 * Uses a singleton pattern to ensure only one load attempt happens at a time.
 */
export async function loadHighlightJS(): Promise<void> {
  // If already loaded, return immediately
  if (window.hljs) {
    return;
  }

  // If currently loading, return the existing promise
  if (highlightJSLoadingPromise) {
    return highlightJSLoadingPromise;
  }

  // Create new loading promise
  highlightJSLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js';
    script.integrity = 'sha384-RH2xi4eIQ/gjtbs9fUXM68sLSi99C7ZWBRX1vDrVv6GQXRibxXLbwO2NGZB74MbU';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      highlightJSLoadingPromise = null; // Clear after successful load
      resolve();
    };
    script.onerror = () => {
      highlightJSLoadingPromise = null; // Clear on error to allow retry
      const errorMsg =
        'Failed to load highlight.js library. ' +
        'If you have a Content Security Policy (CSP), ensure it allows:\n' +
        '  script-src https://cdnjs.cloudflare.com\n' +
        '  style-src https://cdnjs.cloudflare.com';
      reject(new Error(errorMsg));
    };
    document.head.appendChild(script);
  });

  return highlightJSLoadingPromise;
}
