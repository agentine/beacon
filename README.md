# @agentine/beacon

Drop-in replacement for [debug](https://github.com/debug-js/debug). Namespace-based debug logging for Node.js and browsers with zero dependencies.

## Install

```bash
npm install @agentine/beacon
```

## Usage

```js
const beacon = require('@agentine/beacon');
const log = beacon('app:server');

log('listening on port %d', 3000);
// app:server listening on port 3000 +0ms
```

ESM:

```js
import beacon from '@agentine/beacon';
const log = beacon('app:server');
```

## Enabling namespaces

Set the `DEBUG` environment variable:

```bash
DEBUG=app:* node app.js        # enable all app:* namespaces
DEBUG=app:server node app.js   # enable only app:server
DEBUG=*,-app:db node app.js    # enable all except app:db
DEBUG=app,db node app.js       # enable app and db
```

In the browser, use `localStorage`:

```js
localStorage.debug = 'app:*';
```

## API

### `beacon(namespace)`

Create a debug function for the given namespace.

```js
const debug = beacon('myapp:server');
debug('listening');        // only outputs if 'myapp:server' is enabled
```

### `beacon.enable(namespaces)`

Enable debug output for the given namespace string.

```js
beacon.enable('app:*');
beacon.enable('app:server,app:db');
beacon.enable('*,-app:secret');
```

### `beacon.disable()`

Disable all namespaces. Returns the previously enabled namespaces string.

```js
const prev = beacon.disable();
```

### `beacon.enabled(namespace)`

Check if a namespace is enabled.

```js
if (beacon.enabled('app:server')) {
  // ...
}
```

### `debug.extend(sub, [delimiter])`

Create a sub-namespace.

```js
const debug = beacon('app');
const server = debug.extend('server');  // app:server
const api = debug.extend('api', '/');   // app/api
```

### `debug.destroy()`

Remove the debugger instance.

### Format specifiers

- `%s` — String
- `%d` — Number
- `%o` — Object (compact)
- `%O` — Object (full)
- `%j` — JSON (browser only)
- `%%` — Literal `%`

### Custom formatters

```js
beacon.formatters.h = (v) => v.toString('hex');

const debug = beacon('app');
debug('buffer: %h', Buffer.from([0xde, 0xad]));
// app buffer: dead +0ms
```

### `beacon.humanize`

Access the built-in ms parser/formatter:

```js
beacon.humanize('1h');      // 3600000
beacon.humanize(60000);     // '1m'
```

## Migrating from debug

Replace the package name in your imports:

```diff
- const debug = require('debug');
+ const debug = require('@agentine/beacon');
```

Or with ESM:

```diff
- import debug from 'debug';
+ import debug from '@agentine/beacon';
```

Everything else works the same — namespaces, environment variables, wildcards, formatters, and the full API are compatible with debug@4.x.

## Environment variables

| Variable | Description |
|---|---|
| `DEBUG` | Comma/space-separated namespace patterns to enable |
| `DEBUG_COLORS` | Force enable/disable colors (`true`/`false`) |
| `DEBUG_HIDE_DATE` | Hide ISO date prefix in non-color mode (`true`/`false`) |

## Features

- Full debug@4.x API compatibility
- Zero dependencies (ms parsing is inlined)
- CJS + ESM dual module
- TypeScript type definitions included
- Node.js: stderr output with 256-color support
- Browser: console output with CSS colors
- Automatic color assignment per namespace
- Time deltas between log calls

## License

MIT
