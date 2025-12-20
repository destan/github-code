/**
 * Parses the comma-separated file attribute into individual URLs
 */
export function parseFileAttribute(fileAttr: string): string[] {
  return fileAttr
    .split(',')
    .map((url) => url.trim())
    .filter((url) => url.length > 0);
}
