import { describe, it, expect } from 'vitest';
import { parseFileAttribute } from '@/parsers/file-parser';

describe('file-parser', () => {
  describe('parseFileAttribute', () => {
    it('should parse single URL', () => {
      const input = 'https://github.com/owner/repo/blob/main/file.ts';
      const result = parseFileAttribute(input);

      expect(result).toEqual(['https://github.com/owner/repo/blob/main/file.ts']);
    });

    it('should parse multiple comma-separated URLs', () => {
      const input =
        'https://github.com/owner/repo/blob/main/file1.ts,https://github.com/owner/repo/blob/main/file2.ts,https://github.com/owner/repo/blob/main/file3.ts';
      const result = parseFileAttribute(input);

      expect(result).toEqual([
        'https://github.com/owner/repo/blob/main/file1.ts',
        'https://github.com/owner/repo/blob/main/file2.ts',
        'https://github.com/owner/repo/blob/main/file3.ts',
      ]);
    });

    it('should trim whitespace from URLs', () => {
      const input =
        '  https://github.com/owner/repo/blob/main/file1.ts  ,  https://github.com/owner/repo/blob/main/file2.ts  ';
      const result = parseFileAttribute(input);

      expect(result).toEqual([
        'https://github.com/owner/repo/blob/main/file1.ts',
        'https://github.com/owner/repo/blob/main/file2.ts',
      ]);
    });

    it('should filter out empty strings', () => {
      const input =
        'https://github.com/owner/repo/blob/main/file1.ts,,https://github.com/owner/repo/blob/main/file2.ts,';
      const result = parseFileAttribute(input);

      expect(result).toEqual([
        'https://github.com/owner/repo/blob/main/file1.ts',
        'https://github.com/owner/repo/blob/main/file2.ts',
      ]);
    });

    it('should handle URLs with whitespace between commas', () => {
      const input = `
        https://github.com/owner/repo/blob/main/file1.ts,
        https://github.com/owner/repo/blob/main/file2.ts,
        https://github.com/owner/repo/blob/main/file3.ts
      `;
      const result = parseFileAttribute(input);

      expect(result).toEqual([
        'https://github.com/owner/repo/blob/main/file1.ts',
        'https://github.com/owner/repo/blob/main/file2.ts',
        'https://github.com/owner/repo/blob/main/file3.ts',
      ]);
    });

    it('should return empty array for empty string', () => {
      const result = parseFileAttribute('');

      expect(result).toEqual([]);
    });

    it('should return empty array for whitespace only', () => {
      const result = parseFileAttribute('   ');

      expect(result).toEqual([]);
    });

    it('should return empty array for only commas', () => {
      const result = parseFileAttribute(',,,');

      expect(result).toEqual([]);
    });

    it('should handle URLs with special characters', () => {
      const input = 'https://github.com/owner/repo/blob/main/file-name_v2.0.ts';
      const result = parseFileAttribute(input);

      expect(result).toEqual(['https://github.com/owner/repo/blob/main/file-name_v2.0.ts']);
    });

    it('should handle long URLs with nested paths', () => {
      const input =
        'https://github.com/spring-projects/spring-framework/blob/v6.2.10/spring-beans/src/main/kotlin/org/springframework/beans/factory/BeanFactoryExtensions.kt';
      const result = parseFileAttribute(input);

      expect(result).toEqual([
        'https://github.com/spring-projects/spring-framework/blob/v6.2.10/spring-beans/src/main/kotlin/org/springframework/beans/factory/BeanFactoryExtensions.kt',
      ]);
    });

    it('should preserve URL order', () => {
      const input =
        'https://github.com/a/b/blob/main/1.ts,https://github.com/c/d/blob/main/2.ts,https://github.com/e/f/blob/main/3.ts';
      const result = parseFileAttribute(input);

      expect(result[0]).toBe('https://github.com/a/b/blob/main/1.ts');
      expect(result[1]).toBe('https://github.com/c/d/blob/main/2.ts');
      expect(result[2]).toBe('https://github.com/e/f/blob/main/3.ts');
    });
  });
});
