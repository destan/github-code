import type { GitHubUrlParts } from '../types';

/**
 * Regex pattern to validate GitHub blob URLs
 */
// eslint-disable-next-line no-useless-escape
const GITHUB_BLOB_PATTERN = /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/blob\/.+/;

/**
 * Checks if a URL is a valid GitHub blob URL
 */
export function isValidGitHubUrl(url: string): boolean {
  return GITHUB_BLOB_PATTERN.test(url);
}

/**
 * Parses a GitHub blob URL into its components
 * @throws {Error} If the URL cannot be parsed
 */
export function parseGitHubUrl(url: string): GitHubUrlParts {
  // eslint-disable-next-line no-useless-escape
  const match = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)$/.exec(url);

  if (!match) {
    throw new Error('Failed to parse GitHub URL');
  }

  const owner = match[1];
  const repo = match[2];
  const commit = match[3];
  const path = match[4];

  if (!owner || !repo || !commit || !path) {
    throw new Error('Failed to parse GitHub URL');
  }

  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${commit}/${path}`;

  const filename = path.split('/').pop() || 'unknown';

  return {
    rawUrl,
    filename,
  };
}

/**
 * Extracts filename from any URL (fallback for non-standard URLs)
 */
export function extractFilenameFromUrl(url: string): string {
  try {
    // eslint-disable-next-line no-useless-escape
    const match = /\/([^\/]+)$/.exec(url);
    return match?.[1] ?? 'unknown';
  } catch {
    return 'unknown';
  }
}
