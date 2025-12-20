import type { FileMetadata } from '../types';

/**
 * Fetches code content from a URL
 * @throws {Error} If the fetch fails (network error, HTTP error, CORS error)
 */
export async function fetchCode(url: string): Promise<string> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch code (HTTP ${response.status}). Please check if the URL is accessible.`);
    }

    return await response.text();
  } catch (error) {
    // Detect CORS errors specifically
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Failed to fetch code from ${url}. ` +
          `This is likely a CORS (Cross-Origin Resource Sharing) error. ` +
          `The server needs to allow requests from this origin. ` +
          `GitHub's raw.githubusercontent.com should work without CORS issues.`
      );
    }
    throw error;
  }
}

/**
 * Ensures a file's content is loaded, fetching it if necessary
 * @param file The file metadata object to load
 * @param isRetry Whether this is a retry attempt (will force re-fetch)
 */
export async function ensureFileLoaded(file: FileMetadata, isRetry = false): Promise<void> {
  // Already loaded (skip if not a retry)
  if (file.loaded && !isRetry) {
    return;
  }

  // If retrying, reset the loaded flag to allow re-fetch
  if (isRetry) {
    file.loaded = false;
    file.error = null;
  }

  try {
    const code = await fetchCode(file.rawUrl);
    file.code = code;
    file.error = null;
    file.loaded = true;
  } catch (error) {
    file.code = null;
    file.error = error instanceof Error ? error.message : String(error);
    file.loaded = true; // Mark as loaded so we show error (can retry later)
  }
}
