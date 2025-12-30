# Contributing

## CI/CD Flow

```mermaid
flowchart LR
    subgraph CI[CI Workflow]
        checks[Lint & Type-check]
        build[Build]
        unit[Unit Tests]
        e2e[E2E Tests]
    end

    subgraph Release[Release Workflow]
        analyze[Analyze Commits]
        version[Bump Version]
        rebuild[Rebuild with Version]
        publish[Publish to npm]
        github[GitHub Release]
        commit[Commit package.json]
    end

    Push -->|main branch| CI
    CI -->|success| Release
    analyze --> version --> rebuild --> publish --> github --> commit
```

## Version Embedding

The version displayed in `GitHubCode.info` comes from `package.json` and is embedded at build time.

```mermaid
sequenceDiagram
    participant SR as semantic-release
    participant PJ as package.json
    participant Build as npm run build
    participant NPM as npm registry

    SR->>SR: Analyze commits
    SR->>PJ: Bump version (e.g., 0.2.1 → 0.2.2)
    SR->>Build: prepareCmd triggers rebuild
    Note right of Build: Version now embedded in dist/
    SR->>NPM: Publish package
    SR->>PJ: Commit updated package.json
```

## Commit Conventions

This repo uses [Conventional Commits](https://www.conventionalcommits.org/) with semantic-release:

| Prefix | Release Type | Example |
|--------|--------------|---------|
| `fix:` | Patch (0.0.x) | `fix: theme change breaks tabs` |
| `feat:` | Minor (0.x.0) | `feat: add custom hljs url support` |
| `feat!:` or `BREAKING CHANGE:` | Major (x.0.0) | `feat!: rename file attribute` |
| `chore:`, `docs:`, `style:`, `refactor:`, `test:` | No release | `chore: update dependencies` |

## Development

```bash
npm install
npm run dev            # Watch mode
npm run test:ci        # Full CI check (lint + typecheck + build + tests)
```
