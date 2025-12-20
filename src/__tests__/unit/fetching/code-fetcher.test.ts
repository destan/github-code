import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchCode, ensureFileLoaded } from '@/fetching/code-fetcher';
import type { FileMetadata } from '@/types';

describe('code-fetcher', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('fetchCode', () => {
    it('should fetch code successfully', async () => {
      const mockCode = 'const x = 1;\nconst y = 2;';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => mockCode,
      });

      const result = await fetchCode('https://example.com/file.ts');

      expect(result).toBe(mockCode);
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/file.ts');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw error on HTTP 404', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(fetchCode('https://example.com/notfound.ts')).rejects.toThrow(
        'Failed to fetch code (HTTP 404). Please check if the URL is accessible.'
      );
    });

    it('should throw error on HTTP 500', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(fetchCode('https://example.com/error.ts')).rejects.toThrow(
        'Failed to fetch code (HTTP 500). Please check if the URL is accessible.'
      );
    });

    it('should detect and enhance CORS errors', async () => {
      const corsError = new TypeError('Failed to fetch');
      (global.fetch as any).mockRejectedValueOnce(corsError);

      const promise = fetchCode('https://example.com/cors.ts');

      await expect(promise).rejects.toThrow(/CORS \(Cross-Origin Resource Sharing\) error/);
      await expect(promise).rejects.toThrow(/Failed to fetch code from https:\/\/example\.com\/cors\.ts/);
    });

    it('should include helpful CORS message', async () => {
      const corsError = new TypeError('Failed to fetch');
      (global.fetch as any).mockRejectedValueOnce(corsError);

      try {
        await fetchCode('https://blocked.com/file.ts');
      } catch (error) {
        expect((error as Error).message).toContain('CORS');
        expect((error as Error).message).toContain('raw.githubusercontent.com');
        expect((error as Error).message).toContain('https://blocked.com/file.ts');
      }
    });

    it('should re-throw non-CORS errors', async () => {
      const networkError = new Error('Network timeout');
      (global.fetch as any).mockRejectedValueOnce(networkError);

      await expect(fetchCode('https://example.com/timeout.ts')).rejects.toThrow('Network timeout');
    });

    it('should handle empty response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '',
      });

      const result = await fetchCode('https://example.com/empty.ts');

      expect(result).toBe('');
    });

    it('should handle large code content', async () => {
      const largeCode = 'x'.repeat(100000);
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => largeCode,
      });

      const result = await fetchCode('https://example.com/large.ts');

      expect(result).toBe(largeCode);
      expect(result.length).toBe(100000);
    });
  });

  describe('ensureFileLoaded', () => {
    let mockFile: FileMetadata;

    beforeEach(() => {
      mockFile = {
        filename: 'test.ts',
        rawUrl: 'https://example.com/test.ts',
        url: 'https://github.com/owner/repo/blob/main/test.ts',
        code: null,
        error: null,
        loaded: false,
      };
    });

    it('should load file content successfully', async () => {
      const mockCode = 'const x = 1;';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => mockCode,
      });

      await ensureFileLoaded(mockFile);

      expect(mockFile.code).toBe(mockCode);
      expect(mockFile.error).toBeNull();
      expect(mockFile.loaded).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(mockFile.rawUrl);
    });

    it('should skip loading if file is already loaded', async () => {
      mockFile.code = 'existing code';
      mockFile.loaded = true;

      await ensureFileLoaded(mockFile);

      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockFile.code).toBe('existing code');
    });

    it('should force reload when isRetry is true', async () => {
      mockFile.code = 'old code';
      mockFile.loaded = true;
      mockFile.error = 'old error';

      const newCode = 'new code';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => newCode,
      });

      await ensureFileLoaded(mockFile, true);

      expect(mockFile.code).toBe(newCode);
      expect(mockFile.error).toBeNull();
      expect(mockFile.loaded).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should reset loaded and error flags on retry', async () => {
      mockFile.loaded = true;
      mockFile.error = 'previous error';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'success',
      });

      await ensureFileLoaded(mockFile, true);

      expect(mockFile.loaded).toBe(true);
      expect(mockFile.error).toBeNull();
    });

    it('should handle fetch errors and set error message', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await ensureFileLoaded(mockFile);

      expect(mockFile.code).toBeNull();
      expect(mockFile.error).toContain('Failed to fetch code (HTTP 404)');
      expect(mockFile.loaded).toBe(true);
    });

    it('should mark file as loaded even on error', async () => {
      const error = new Error('Network error');
      (global.fetch as any).mockRejectedValueOnce(error);

      await ensureFileLoaded(mockFile);

      expect(mockFile.loaded).toBe(true);
      expect(mockFile.error).toBe('Network error');
      expect(mockFile.code).toBeNull();
    });

    it('should handle non-Error exceptions', async () => {
      (global.fetch as any).mockRejectedValueOnce('string error');

      await ensureFileLoaded(mockFile);

      expect(mockFile.error).toBe('string error');
      expect(mockFile.loaded).toBe(true);
    });

    it('should handle CORS errors', async () => {
      const corsError = new TypeError('Failed to fetch');
      (global.fetch as any).mockRejectedValueOnce(corsError);

      await ensureFileLoaded(mockFile);

      expect(mockFile.code).toBeNull();
      expect(mockFile.error).toContain('CORS');
      expect(mockFile.error).toContain(mockFile.rawUrl);
      expect(mockFile.loaded).toBe(true);
    });

    it('should preserve filename and urls during loading', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'code',
      });

      const originalFilename = mockFile.filename;
      const originalRawUrl = mockFile.rawUrl;
      const originalUrl = mockFile.url;

      await ensureFileLoaded(mockFile);

      expect(mockFile.filename).toBe(originalFilename);
      expect(mockFile.rawUrl).toBe(originalRawUrl);
      expect(mockFile.url).toBe(originalUrl);
    });

    it('should handle retry after previous error', async () => {
      // First attempt fails
      (global.fetch as any).mockRejectedValueOnce(new Error('First error'));
      await ensureFileLoaded(mockFile);

      expect(mockFile.error).toBe('First error');
      expect(mockFile.loaded).toBe(true);

      // Retry succeeds
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'success',
      });
      await ensureFileLoaded(mockFile, true);

      expect(mockFile.code).toBe('success');
      expect(mockFile.error).toBeNull();
      expect(mockFile.loaded).toBe(true);
    });

    it('should handle empty code content', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '',
      });

      await ensureFileLoaded(mockFile);

      expect(mockFile.code).toBe('');
      expect(mockFile.error).toBeNull();
      expect(mockFile.loaded).toBe(true);
    });
  });
});
