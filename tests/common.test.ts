import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setup, type Debugger, type SetupOptions } from '../src/common.js';

function makeSetup(overrides: Partial<SetupOptions> = {}) {
  const log = vi.fn();
  const saved: { ns: string | null } = { ns: null };
  const opts: SetupOptions = {
    formatArgs(args) {
      // no-op for tests
    },
    log,
    save(ns) {
      saved.ns = ns;
    },
    load() {
      return saved.ns;
    },
    init() {},
    useColors: () => false,
    colors: [1, 2, 3, 4, 5, 6],
    formatters: {},
    ...overrides,
  };
  const createDebug = setup(opts);
  return { createDebug, log, saved, opts };
}

describe('createDebug', () => {
  it('creates a debug function with a namespace', () => {
    const { createDebug } = makeSetup();
    const debug = createDebug('app:server');
    expect(debug.namespace).toBe('app:server');
    expect(typeof debug).toBe('function');
  });

  it('assigns a color to the namespace', () => {
    const { createDebug } = makeSetup();
    const debug = createDebug('app:server');
    expect([1, 2, 3, 4, 5, 6]).toContain(debug.color);
  });

  it('consistently assigns the same color to the same namespace', () => {
    const { createDebug } = makeSetup();
    const d1 = createDebug('app:server');
    const d2 = createDebug('app:server');
    expect(d1.color).toBe(d2.color);
  });
});

describe('enable/disable', () => {
  it('enables a specific namespace', () => {
    const { createDebug, log } = makeSetup();
    createDebug.enable('app:server');
    const debug = createDebug('app:server');
    expect(debug.enabled).toBe(true);
    debug('test message');
    expect(log).toHaveBeenCalled();
  });

  it('disables non-matching namespaces', () => {
    const { createDebug, log } = makeSetup();
    createDebug.enable('app:server');
    const debug = createDebug('app:db');
    expect(debug.enabled).toBe(false);
    debug('test message');
    expect(log).not.toHaveBeenCalled();
  });

  it('supports wildcard patterns', () => {
    const { createDebug } = makeSetup();
    createDebug.enable('app:*');
    expect(createDebug('app:server').enabled).toBe(true);
    expect(createDebug('app:db').enabled).toBe(true);
    expect(createDebug('other:thing').enabled).toBe(false);
  });

  it('supports exclusion patterns', () => {
    const { createDebug } = makeSetup();
    createDebug.enable('*,-app:db');
    expect(createDebug('app:server').enabled).toBe(true);
    expect(createDebug('app:db').enabled).toBe(false);
    expect(createDebug('other').enabled).toBe(true);
  });

  it('supports multiple comma-separated patterns', () => {
    const { createDebug } = makeSetup();
    createDebug.enable('app:server,app:db');
    expect(createDebug('app:server').enabled).toBe(true);
    expect(createDebug('app:db').enabled).toBe(true);
    expect(createDebug('app:auth').enabled).toBe(false);
  });

  it('supports space-separated patterns', () => {
    const { createDebug } = makeSetup();
    createDebug.enable('app:server app:db');
    expect(createDebug('app:server').enabled).toBe(true);
    expect(createDebug('app:db').enabled).toBe(true);
  });

  it('disable() returns previous namespaces', () => {
    const { createDebug } = makeSetup();
    createDebug.enable('app:*');
    const prev = createDebug.disable();
    expect(prev).toBe('app:*');
  });

  it('disable() disables all namespaces', () => {
    const { createDebug } = makeSetup();
    createDebug.enable('app:*');
    createDebug.disable();
    expect(createDebug('app:server').enabled).toBe(false);
  });

  it('enabled() checks if a namespace is enabled', () => {
    const { createDebug } = makeSetup();
    createDebug.enable('app:*');
    expect(createDebug.enabled('app:server')).toBe(true);
    expect(createDebug.enabled('other')).toBe(false);
  });

  it('re-evaluates existing instances on enable()', () => {
    const { createDebug } = makeSetup();
    const debug = createDebug('app:server');
    expect(debug.enabled).toBe(false);
    createDebug.enable('app:*');
    expect(debug.enabled).toBe(true);
  });

  it('enable with * enables all', () => {
    const { createDebug } = makeSetup();
    createDebug.enable('*');
    expect(createDebug('anything').enabled).toBe(true);
    expect(createDebug('deep:nested:ns').enabled).toBe(true);
  });
});

describe('extend', () => {
  it('creates a sub-namespace with : delimiter', () => {
    const { createDebug } = makeSetup();
    createDebug.enable('*');
    const debug = createDebug('app');
    const sub = debug.extend('server');
    expect(sub.namespace).toBe('app:server');
  });

  it('supports custom delimiter', () => {
    const { createDebug } = makeSetup();
    createDebug.enable('*');
    const debug = createDebug('app');
    const sub = debug.extend('server', '/');
    expect(sub.namespace).toBe('app/server');
  });

  it('inherits log function', () => {
    const { createDebug } = makeSetup();
    createDebug.enable('*');
    const customLog = vi.fn();
    const debug = createDebug('app');
    debug.log = customLog;
    const sub = debug.extend('server');
    expect(sub.log).toBe(customLog);
  });
});

describe('destroy', () => {
  it('removes the debugger from instances', () => {
    const { createDebug } = makeSetup();
    const debug = createDebug('app:server');
    expect(debug.destroy()).toBe(true);
  });

  it('returns false on second destroy', () => {
    const { createDebug } = makeSetup();
    const debug = createDebug('app:server');
    debug.destroy();
    expect(debug.destroy()).toBe(false);
  });
});

describe('coerce', () => {
  it('converts Error to stack trace', () => {
    const { createDebug, log } = makeSetup();
    createDebug.enable('*');
    const debug = createDebug('test');
    const err = new Error('test error');
    debug(err);
    expect(log).toHaveBeenCalled();
    const args = log.mock.calls[0]!;
    const output = args.map(String).join(' ');
    expect(output).toContain('test error');
  });
});

describe('names and skips', () => {
  it('returns enabled patterns', () => {
    const { createDebug } = makeSetup();
    createDebug.enable('app:*,-app:db');
    expect(createDebug.names()).toHaveLength(1);
    expect(createDebug.skips()).toHaveLength(1);
  });
});

describe('save/load', () => {
  it('saves namespaces via the save function', () => {
    const { createDebug, saved } = makeSetup();
    createDebug.enable('app:*');
    expect(saved.ns).toBe('app:*');
  });

  it('loads initial namespaces from load()', () => {
    const { createDebug } = makeSetup({
      load: () => 'preloaded:*',
    });
    expect(createDebug.enabled('preloaded:test')).toBe(true);
  });
});

describe('selectColor', () => {
  it('is deterministic', () => {
    const { createDebug } = makeSetup();
    const c1 = createDebug.selectColor('test');
    const c2 = createDebug.selectColor('test');
    expect(c1).toBe(c2);
  });

  it('returns a color from the palette', () => {
    const { createDebug } = makeSetup();
    const c = createDebug.selectColor('anything');
    expect([1, 2, 3, 4, 5, 6]).toContain(c);
  });
});
