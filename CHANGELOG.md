# Changelog

## 0.1.0 — 2026-03-16

Initial release — drop-in replacement for the `debug` npm package.

### Features

- Namespace-based debug logging with wildcard enable/disable (`DEBUG` env var)
- Node.js backend: stderr output, 256-color support, `DEBUG_COLORS` / `DEBUG_HIDE_DATE` env vars
- Browser backend: `console.debug` output with CSS colors, `localStorage.debug` support
- Inline `ms` time-format parser (no external dependency)
- Formatters API (`%O`, `%o`, `%d`, `%s`, plus custom formatters)
- CJS + ESM dual-module build
- TypeScript strict, full type declarations included
