/**
 * Gets syntax-highlighted lines from code using highlight.js
 */
export function getHighlightedLines(code: string | null): string[] {
  // Safety check for null/undefined code
  if (!code) {
    return [''];
  }

  const lines = code.split('\n');

  // Remove only the last empty line if it exists (from final newline)
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  const fullCode = lines.join('\n');
  const result = window.hljs!.highlightAuto(fullCode);
  const highlightedLines = result.value.split('\n');

  // Ensure highlightedLines matches lines length
  while (highlightedLines.length > lines.length) {
    highlightedLines.pop();
  }

  return highlightedLines;
}

/**
 * Applies syntax highlighting to code cells within a container
 */
export function applySyntaxHighlighting(container: Element | ShadowRoot, code: string): void {
  const codeCells = container.querySelectorAll('.code-cell');

  const applyHighlighting = (): void => {
    const highlightedLines = getHighlightedLines(code);
    codeCells.forEach((cell, index) => {
      (cell as HTMLElement).innerHTML = highlightedLines[index] || ' ';
    });
  };

  // Use requestIdleCallback to avoid blocking the main thread
  if ('requestIdleCallback' in window) {
    requestIdleCallback(applyHighlighting);
  } else {
    applyHighlighting();
  }
}
