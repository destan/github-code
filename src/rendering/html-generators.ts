/**
 * Escapes HTML special characters to prevent XSS
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Generates HTML for error display
 */
export function getErrorContentHtml(errorMessage: string, showRetry = false): string {
  const retryButton = showRetry ? `<button class="retry-button">Retry</button>` : '';
  return `<div class="error">${escapeHtml(errorMessage)}${retryButton}</div>`;
}

/**
 * Generates HTML for skeleton loading state
 */
export function getSkeletonContentHtml(): string {
  // Generate skeleton lines that look like code
  const skeletonLines = Array.from({ length: 20 }, (_, i) => {
    // Random width between 60-90%
    // Using Math.random() is acceptable here for non-cryptographic purposes
    const width = 60 + Math.random() * 30; // NOSONAR
    return `
                <div class="code-row">
                    <div class="line-number">${i + 1}</div>
                    <div class="skeleton-line" style="width: ${width}%"></div>
                </div>
            `;
  }).join('');

  return `
            <div class="code-wrapper skeleton-loading">
                <div class="code-table">
                    ${skeletonLines}
                </div>
            </div>
        `;
}

/**
 * Generates HTML for code display (without syntax highlighting)
 */
export function getCodeContentHtml(code: string | null): string {
  // Safety check for null/undefined code
  if (!code) {
    return getErrorContentHtml('No code content available');
  }

  const lines = code.split('\n');

  // Remove only the last empty line if it exists (from final newline)
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  return `
        <div class="code-wrapper hljs">
            <div class="code-table">
                ${lines
                  .map(
                    (line, index) => `
                    <div class="code-row">
                        <div class="line-number">${index + 1}</div>
                        <div class="code-cell">${escapeHtml(line) || ' '}</div>
                    </div>
                `
                  )
                  .join('')}
            </div>
        </div>
    `;
}
