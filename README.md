# github-code

[![npm version](https://img.shields.io/npm/v/github-code)](https://www.npmjs.com/package/github-code)
[![bundle size](https://img.shields.io/bundlephobia/minzip/github-code)](https://bundlephobia.com/package/github-code)
[![License](https://img.shields.io/npm/l/github-code)](https://github.com/destan/github-code/blob/main/LICENSE)
[![highlight.js](https://img.shields.io/badge/highlight.js-syntax%20highlighting-blue)](https://highlightjs.org/)

A web component for displaying GitHub files with syntax highlighting.

## Demo

See the live demo: **[github-code Demo](https://destan.github.io/github-code/)**

## Installation

Include the script in your HTML:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/github-code/dist/github-code.min.js"></script>
```

Or install via npm:

```bash
npm install github-code
```

## Usage

### Single File

```html
<github-code
  file="https://github.com/owner/repo/blob/main/src/example.ts">
</github-code>
```

### Multiple Files (Tabbed)

Comma-separate URLs to display files as tabs:

```html
<github-code
  file="https://github.com/owner/repo/blob/main/src/app.ts,
        https://github.com/owner/repo/blob/main/src/utils.ts">
</github-code>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `file` | _(required)_ | GitHub blob URL(s). Comma-separated for multiple files. |
| `theme` | `auto` | `light`, `dark`, or `auto` (follows system preference) |

## URL Format

URLs must be GitHub blob URLs:

```
https://github.com/{owner}/{repo}/blob/{branch|commit}/{path}
```

## Features

- Syntax highlighting via highlight.js (auto-detected language)
- Lazy loading (content fetched on demand)
- Keyboard-accessible tabs (Arrow keys, Home, End)
- CSP-compliant (no inline styles)
- Shadow DOM encapsulation

## Development

```bash
npm install
npm run build          # Build dist files
npm run dev            # Watch mode
npm run test:ci        # Full CI check (lint + typecheck + build + tests)
```

## License

MIT
