/**
 * Comprehensive compatibility tests verifying debug@4.x behavior.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import createDebug from '../src/index.js';

describe('debug@4.x compatibility', () => {
  let stderrWrite: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stderrWrite = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    createDebug.enable('');
  });

  afterEach(() => {
    stderrWrite.mockRestore();
  });

  describe('namespace creation', () => {
    it('creates a function', () => {
      const debug = createDebug('ns');
      expect(typeof debug).toBe('function');
    });

    it('has a namespace property', () => {
      const debug = createDebug('my:namespace');
      expect(debug.namespace).toBe('my:namespace');
    });

    it('has an enabled property', () => {
      const debug = createDebug('check:enabled');
      expect(typeof debug.enabled).toBe('boolean');
    });

    it('has a color property', () => {
      const debug = createDebug('has:color');
      expect(debug.color).toBeDefined();
    });
  });

  describe('namespace matching — wildcards', () => {
    it('matches exact namespace', () => {
      createDebug.enable('exact');
      expect(createDebug.enabled('exact')).toBe(true);
      expect(createDebug.enabled('other')).toBe(false);
    });

    it('matches * wildcard (all)', () => {
      createDebug.enable('*');
      expect(createDebug.enabled('anything')).toBe(true);
      expect(createDebug.enabled('deeply:nested:ns')).toBe(true);
    });

    it('matches trailing wildcard', () => {
      createDebug.enable('app:*');
      expect(createDebug.enabled('app:server')).toBe(true);
      expect(createDebug.enabled('app:db')).toBe(true);
      expect(createDebug.enabled('app:deeply:nested')).toBe(true);
      expect(createDebug.enabled('other:thing')).toBe(false);
    });

    it('matches leading wildcard', () => {
      createDebug.enable('*:error');
      expect(createDebug.enabled('app:error')).toBe(true);
      expect(createDebug.enabled('db:error')).toBe(true);
      expect(createDebug.enabled('app:info')).toBe(false);
    });

    it('matches middle wildcard', () => {
      createDebug.enable('app:*:error');
      expect(createDebug.enabled('app:server:error')).toBe(true);
      expect(createDebug.enabled('app:db:error')).toBe(true);
      expect(createDebug.enabled('app:error')).toBe(false);
    });
  });

  describe('namespace matching — exclusions', () => {
    it('excludes with - prefix', () => {
      createDebug.enable('*,-secret');
      expect(createDebug.enabled('app')).toBe(true);
      expect(createDebug.enabled('secret')).toBe(false);
    });

    it('exclusion overrides inclusion', () => {
      createDebug.enable('app:*,-app:secret');
      expect(createDebug.enabled('app:server')).toBe(true);
      expect(createDebug.enabled('app:secret')).toBe(false);
    });

    it('exclusion with wildcard', () => {
      createDebug.enable('*,-app:*');
      expect(createDebug.enabled('other')).toBe(true);
      expect(createDebug.enabled('app:server')).toBe(false);
      expect(createDebug.enabled('app:db')).toBe(false);
    });

    it('multiple exclusions', () => {
      createDebug.enable('*,-secret,-hidden');
      expect(createDebug.enabled('app')).toBe(true);
      expect(createDebug.enabled('secret')).toBe(false);
      expect(createDebug.enabled('hidden')).toBe(false);
    });
  });

  describe('namespace matching — multiple patterns', () => {
    it('comma-separated', () => {
      createDebug.enable('app,db');
      expect(createDebug.enabled('app')).toBe(true);
      expect(createDebug.enabled('db')).toBe(true);
      expect(createDebug.enabled('cache')).toBe(false);
    });

    it('space-separated', () => {
      createDebug.enable('app db');
      expect(createDebug.enabled('app')).toBe(true);
      expect(createDebug.enabled('db')).toBe(true);
    });

    it('mixed separators', () => {
      createDebug.enable('app, db cache');
      expect(createDebug.enabled('app')).toBe(true);
      expect(createDebug.enabled('db')).toBe(true);
      expect(createDebug.enabled('cache')).toBe(true);
    });
  });

  describe('enable/disable API', () => {
    it('enable() activates namespaces', () => {
      createDebug.enable('test:*');
      expect(createDebug.enabled('test:one')).toBe(true);
    });

    it('disable() returns previous namespaces', () => {
      createDebug.enable('test:*');
      const prev = createDebug.disable();
      expect(prev).toBe('test:*');
    });

    it('disable() deactivates all', () => {
      createDebug.enable('*');
      createDebug.disable();
      expect(createDebug.enabled('anything')).toBe(false);
    });

    it('re-enable updates existing instances', () => {
      const debug = createDebug('re:enable');
      expect(debug.enabled).toBe(false);
      createDebug.enable('re:*');
      expect(debug.enabled).toBe(true);
      createDebug.disable();
      expect(debug.enabled).toBe(false);
    });

    it('names() returns enabled patterns', () => {
      createDebug.enable('a:*,b:*');
      expect(createDebug.names()).toHaveLength(2);
    });

    it('skips() returns excluded patterns', () => {
      createDebug.enable('*,-a,-b');
      expect(createDebug.skips()).toHaveLength(2);
    });
  });

  describe('output behavior', () => {
    it('does not output when disabled', () => {
      const debug = createDebug('silent');
      debug('should not appear');
      expect(stderrWrite).not.toHaveBeenCalled();
    });

    it('outputs when enabled', () => {
      createDebug.enable('loud:*');
      const debug = createDebug('loud:test');
      debug('hello');
      expect(stderrWrite).toHaveBeenCalled();
    });

    it('includes namespace in output', () => {
      createDebug.enable('ns:*');
      const debug = createDebug('ns:output');
      debug('message');
      const output = stderrWrite.mock.calls[0]![0] as string;
      expect(output).toContain('ns:output');
    });

    it('includes message in output', () => {
      createDebug.enable('msg:*');
      const debug = createDebug('msg:test');
      debug('hello world');
      const output = stderrWrite.mock.calls[0]![0] as string;
      expect(output).toContain('hello world');
    });

    it('includes time delta', () => {
      createDebug.enable('time:*');
      const debug = createDebug('time:test');
      debug('a');
      debug('b');
      const output = stderrWrite.mock.calls[1]![0] as string;
      expect(output).toMatch(/\+\d+ms/);
    });
  });

  describe('printf-style formatting', () => {
    it('formats %s as string', () => {
      createDebug.enable('fmt:*');
      const debug = createDebug('fmt:s');
      debug('hello %s', 'world');
      const output = stderrWrite.mock.calls[0]![0] as string;
      expect(output).toContain('hello world');
    });

    it('formats %d as number', () => {
      createDebug.enable('fmt:*');
      const debug = createDebug('fmt:d');
      debug('count: %d', 42);
      const output = stderrWrite.mock.calls[0]![0] as string;
      expect(output).toContain('count: 42');
    });

    it('escapes %%', () => {
      createDebug.enable('fmt:*');
      const debug = createDebug('fmt:pct');
      debug('100%% done');
      const output = stderrWrite.mock.calls[0]![0] as string;
      expect(output).toContain('100% done');
    });

    it('handles %o formatter (compact inspect)', () => {
      createDebug.enable('fmt:*');
      const debug = createDebug('fmt:o');
      debug('obj: %o', { a: 1 });
      const output = stderrWrite.mock.calls[0]![0] as string;
      expect(output).toContain('a');
    });

    it('handles %O formatter (full inspect)', () => {
      createDebug.enable('fmt:*');
      const debug = createDebug('fmt:O');
      debug('obj: %O', { b: 2 });
      const output = stderrWrite.mock.calls[0]![0] as string;
      expect(output).toContain('b');
    });
  });

  describe('custom formatters', () => {
    afterEach(() => {
      delete createDebug.formatters['x'];
    });

    it('allows registering custom formatters', () => {
      createDebug.formatters['x'] = (v) => 'custom:' + String(v);
      createDebug.enable('cf:*');
      const debug = createDebug('cf:test');
      debug('val: %x', 42);
      const output = stderrWrite.mock.calls[0]![0] as string;
      expect(output).toContain('custom:42');
    });
  });

  describe('error coercion', () => {
    it('coerces Error to stack trace', () => {
      createDebug.enable('err:*');
      const debug = createDebug('err:coerce');
      const err = new Error('test');
      debug(err);
      const output = stderrWrite.mock.calls[0]![0] as string;
      expect(output).toContain('test');
    });
  });

  describe('extend', () => {
    it('creates sub-namespace with : delimiter', () => {
      const parent = createDebug('parent');
      const child = parent.extend('child');
      expect(child.namespace).toBe('parent:child');
    });

    it('supports custom delimiter', () => {
      const parent = createDebug('parent');
      const child = parent.extend('child', '/');
      expect(child.namespace).toBe('parent/child');
    });

    it('chains extends', () => {
      const a = createDebug('a');
      const b = a.extend('b');
      const c = b.extend('c');
      expect(c.namespace).toBe('a:b:c');
    });
  });

  describe('destroy', () => {
    it('removes instance', () => {
      const debug = createDebug('destroy:test');
      expect(debug.destroy()).toBe(true);
      expect(debug.destroy()).toBe(false);
    });
  });

  describe('custom log function', () => {
    it('uses custom log when set', () => {
      createDebug.enable('log:*');
      const customLog = vi.fn();
      const debug = createDebug('log:custom');
      debug.log = customLog;
      debug('test');
      expect(customLog).toHaveBeenCalled();
      expect(stderrWrite).not.toHaveBeenCalled();
    });
  });

  describe('humanize (ms)', () => {
    it('exposes humanize function', () => {
      expect(typeof createDebug.humanize).toBe('function');
    });

    it('parses time strings', () => {
      expect(createDebug.humanize('1h')).toBe(3600000);
    });

    it('formats milliseconds', () => {
      expect(createDebug.humanize(3600000)).toBe('1h');
    });
  });
});
