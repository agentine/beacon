# Beacon — Drop-in Replacement for debug

**Package:** `@agentine/beacon`
**Language:** Node.js (JavaScript/TypeScript)
**Replaces:** [debug](https://github.com/debug-js/debug) (479M weekly downloads)

## Why Replace debug?

- **Supply chain attack (Sept 2025):** Maintainer's npm account was phished; malicious code was published to 2B+ weekly downstream installs for ~2 hours.
- **Maintenance backlog:** 62 open issues, 23 open PRs (some dating to 2017). Only 2 maintainers.
- **No viable alternative:** `debug-better` has 1 download/week. No serious replacement exists.
- **Dependency risk:** debug depends on `ms` for time parsing — another single-maintainer package.

## Scope

Drop-in replacement for `debug@4.x` with API compatibility. Zero external dependencies.

## Core Features

1. **Namespace-based debug output** — `beacon('app:server')` creates a debug function scoped to a namespace
2. **Environment variable control** — `DEBUG=app:*` enables matching namespaces (wildcard/exclusion support)
3. **Browser + Node.js** — Universal module (CJS + ESM)
4. **Colorized output** — Automatic color assignment per namespace (terminal + browser console)
5. **Time deltas** — Millisecond diff between invocations shown inline
6. **Printf-style formatting** — `%s`, `%d`, `%o`, `%O`, `%j` format specifiers
7. **Custom formatters** — Extensible formatter API
8. **Coerce values** — Error objects display stack traces
9. **Inline `ms` parsing** — No external dependency for time string parsing

## Architecture

```
src/
  index.js          # Entry point, namespace factory
  common.js         # Shared logic (createDebug, enable/disable, formatting)
  node.js           # Node.js-specific: stderr output, colors, env vars
  browser.js        # Browser-specific: console output, localStorage
  ms.js             # Inlined ms-style time parser/formatter
```

## API Surface (debug-compatible)

```js
const beacon = require('@agentine/beacon');
const log = beacon('app:server');

log('listening on port %d', 3000);

beacon.enable('app:*');
beacon.disable();
beacon.enabled('app:server'); // boolean
beacon.formatters.h = (v) => v.toString('hex');
```

## Deliverables

- [ ] Full API compatibility with debug@4.x
- [ ] Zero dependencies (inline ms parsing)
- [ ] CJS + ESM dual module
- [ ] TypeScript type definitions
- [ ] Test suite covering all debug@4.x behavior
- [ ] README with migration guide
- [ ] Published to npm as `@agentine/beacon`

## Non-Goals

- Custom transports/log levels (that's a logger, not debug)
- Structured logging / JSON output
- Log aggregation features
