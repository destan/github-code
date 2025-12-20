import { describe, it, expect } from 'vitest';
import { isValidGitHubUrl, parseGitHubUrl, extractFilenameFromUrl } from '@/parsers/url-parser';

describe('url-parser', () => {
  describe('isValidGitHubUrl', () => {
    it('should return true for valid GitHub blob URLs', () => {
      const validUrls = [
        'https://github.com/owner/repo/blob/main/file.ts',
        'https://github.com/spring-projects/spring-framework/blob/v6.2.10/spring-beans/src/main/kotlin/org/springframework/beans/factory/BeanFactoryExtensions.kt',
        'https://github.com/user/project/blob/abc123def/path/to/file.js',
        'https://github.com/a/b/blob/c/d',
      ];

      validUrls.forEach((url) => {
        expect(isValidGitHubUrl(url)).toBe(true);
      });
    });

    it('should return false for invalid GitHub URLs', () => {
      const invalidUrls = [
        'https://github.com/owner/repo/tree/main/file.ts',
        'https://github.com/owner/repo/blob/',
        'https://gitlab.com/owner/repo/blob/main/file.ts',
        'http://github.com/owner/repo/blob/main/file.ts', // http instead of https
        'https://github.com/owner/blob/main/file.ts', // missing repo
        'https://github.com/owner/repo/main/file.ts', // missing blob
        '',
        'not a url',
      ];

      invalidUrls.forEach((url) => {
        expect(isValidGitHubUrl(url)).toBe(false);
      });
    });
  });

  describe('parseGitHubUrl', () => {
    it('should parse valid GitHub blob URLs correctly', () => {
      const url = 'https://github.com/owner/repo/blob/main/src/file.ts';
      const result = parseGitHubUrl(url);

      expect(result).toEqual({
        rawUrl: 'https://raw.githubusercontent.com/owner/repo/main/src/file.ts',
        filename: 'file.ts',
      });
    });

    it('should parse URL with nested path', () => {
      const url =
        'https://github.com/spring-projects/spring-framework/blob/v6.2.10/spring-beans/src/main/kotlin/org/springframework/beans/factory/BeanFactoryExtensions.kt';
      const result = parseGitHubUrl(url);

      expect(result.rawUrl).toBe(
        'https://raw.githubusercontent.com/spring-projects/spring-framework/v6.2.10/spring-beans/src/main/kotlin/org/springframework/beans/factory/BeanFactoryExtensions.kt'
      );
      expect(result.filename).toBe('BeanFactoryExtensions.kt');
    });

    it('should parse URL with commit hash', () => {
      const url = 'https://github.com/user/project/blob/abc123def456/path/to/file.js';
      const result = parseGitHubUrl(url);

      expect(result.rawUrl).toBe('https://raw.githubusercontent.com/user/project/abc123def456/path/to/file.js');
      expect(result.filename).toBe('file.js');
    });

    it('should handle file at root level', () => {
      const url = 'https://github.com/owner/repo/blob/main/README.md';
      const result = parseGitHubUrl(url);

      expect(result.rawUrl).toBe('https://raw.githubusercontent.com/owner/repo/main/README.md');
      expect(result.filename).toBe('README.md');
    });

    it('should throw error for invalid GitHub URL format', () => {
      const invalidUrls = [
        'https://github.com/owner/repo/tree/main/file.ts',
        'https://github.com/owner/blob/main/file.ts',
        'https://gitlab.com/owner/repo/blob/main/file.ts',
        'not a url',
        '',
      ];

      invalidUrls.forEach((url) => {
        expect(() => parseGitHubUrl(url)).toThrow('Failed to parse GitHub URL');
      });
    });

    it('should handle URL with special characters in path', () => {
      const url = 'https://github.com/owner/repo/blob/main/path/file-name_v2.0.ts';
      const result = parseGitHubUrl(url);

      expect(result.filename).toBe('file-name_v2.0.ts');
    });

    it('should return "unknown" when path has no filename', () => {
      // This is an edge case - path.split('/').pop() might return empty string
      const url = 'https://github.com/owner/repo/blob/main/path/';
      const result = parseGitHubUrl(url);

      expect(result.filename).toBe('unknown');
    });
  });

  describe('extractFilenameFromUrl', () => {
    it('should extract filename from valid URLs', () => {
      expect(extractFilenameFromUrl('https://example.com/path/to/file.ts')).toBe('file.ts');
      expect(extractFilenameFromUrl('https://example.com/file.js')).toBe('file.js');
      expect(extractFilenameFromUrl('https://raw.githubusercontent.com/owner/repo/main/src/index.ts')).toBe('index.ts');
    });

    it('should return last path segment or unknown', () => {
      // The regex /\/([^\/]+)$/ looks for / followed by non-/ chars at end
      // URLs ending with / have no match, so return 'unknown'
      expect(extractFilenameFromUrl('https://example.com/')).toBe('unknown');
      expect(extractFilenameFromUrl('https://example.com')).toBe('example.com');
    });

    it('should return "unknown" for invalid URLs that throw', () => {
      // Edge case: if the match operation throws an exception
      expect(extractFilenameFromUrl('')).toBe('unknown');
    });

    it('should handle URLs with query parameters', () => {
      expect(extractFilenameFromUrl('https://example.com/file.ts?version=1')).toBe('file.ts?version=1');
    });

    it('should handle URLs with hash fragments', () => {
      expect(extractFilenameFromUrl('https://example.com/file.ts#L10')).toBe('file.ts#L10');
    });

    it('should extract from complex paths', () => {
      expect(extractFilenameFromUrl('https://example.com/very/long/nested/path/file.ts')).toBe('file.ts');
    });
  });
});
