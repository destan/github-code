/**
 * Represents a single file to be displayed in the component
 */
export interface FileMetadata {
  /** The display name of the file (extracted from URL) */
  filename: string;
  /** The raw content URL (e.g., raw.githubusercontent.com) */
  rawUrl: string;
  /** The original GitHub blob URL */
  url: string;
  /** The fetched code content (null if not yet loaded) */
  code: string | null;
  /** Error message if loading failed */
  error: string | null;
  /** Whether the file has been loaded (successfully or with error) */
  loaded: boolean;
}

/**
 * Result of parsing a GitHub URL
 */
export interface GitHubUrlParts {
  /** The raw content URL */
  rawUrl: string;
  /** The filename extracted from the path */
  filename: string;
}

/**
 * Theme mode for the component
 */
export type Theme = 'light' | 'dark' | 'auto';

/**
 * Resolved theme (either light or dark, never auto)
 */
export type ResolvedTheme = 'light' | 'dark';
