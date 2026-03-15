import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import createDebug, { ms } from '../src/index.js';
import type { Debugger, Formatter, SetupOptions } from '../src/index.js';

describe('index entry point', () => {
  let stderrWrite: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stderrWrite = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    createDebug.enable('');
  });

  afterEach(() => {
    stderrWrite.mockRestore();
  });

  it('exports createDebug as default and named', () => {
    expect(typeof createDebug).toBe('function');
  });

  it('exports ms', () => {
    expect(ms('1h')).toBe(3600000);
    expect(ms(3600000)).toBe('1h');
  });

  it('creates a working debugger', () => {
    createDebug.enable('test:*');
    const debug = createDebug('test:index');
    expect(debug.namespace).toBe('test:index');
    debug('hello');
    expect(stderrWrite).toHaveBeenCalled();
  });

  it('has enable/disable/enabled API', () => {
    createDebug.enable('api:*');
    expect(createDebug.enabled('api:test')).toBe(true);
    const prev = createDebug.disable();
    expect(prev).toBe('api:*');
  });

  it('has formatters object', () => {
    expect(typeof createDebug.formatters).toBe('object');
  });

  it('supports custom formatters', () => {
    createDebug.enable('fmt:*');
    createDebug.formatters['h'] = (val: unknown) => {
      if (val instanceof Buffer) return val.toString('hex');
      return String(val);
    };
    const debug = createDebug('fmt:test');
    debug('data: %h', Buffer.from([0xde, 0xad, 0xbe, 0xef]));
    expect(stderrWrite).toHaveBeenCalled();
    const output = stderrWrite.mock.calls[0]![0] as string;
    expect(output).toContain('deadbeef');
    delete createDebug.formatters['h'];
  });

  it('coerces Error objects to stack traces', () => {
    createDebug.enable('err:*');
    const debug = createDebug('err:test');
    const err = new Error('test error');
    debug(err);
    expect(stderrWrite).toHaveBeenCalled();
    const output = stderrWrite.mock.calls[0]![0] as string;
    expect(output).toContain('test error');
  });

  it('handles %% escape', () => {
    createDebug.enable('esc:*');
    const debug = createDebug('esc:test');
    debug('100%% complete');
    expect(stderrWrite).toHaveBeenCalled();
    const output = stderrWrite.mock.calls[0]![0] as string;
    expect(output).toContain('100% complete');
  });

  it('handles non-string first argument', () => {
    createDebug.enable('obj:*');
    const debug = createDebug('obj:test');
    debug({ key: 'value' });
    expect(stderrWrite).toHaveBeenCalled();
  });

  it('shows time delta between calls', () => {
    createDebug.enable('delta:*');
    const debug = createDebug('delta:test');
    debug('first');
    debug('second');
    expect(stderrWrite).toHaveBeenCalledTimes(2);
    const output = stderrWrite.mock.calls[1]![0] as string;
    expect(output).toMatch(/\+\d+ms/);
  });

  it('supports extend for sub-namespaces', () => {
    createDebug.enable('*');
    const parent = createDebug('app');
    const child = parent.extend('api');
    const grandchild = child.extend('v2');
    expect(child.namespace).toBe('app:api');
    expect(grandchild.namespace).toBe('app:api:v2');
  });

  it('supports custom log function', () => {
    createDebug.enable('custom:*');
    const customLog = vi.fn();
    const debug = createDebug('custom:log');
    debug.log = customLog;
    debug('test');
    expect(customLog).toHaveBeenCalled();
    expect(stderrWrite).not.toHaveBeenCalled();
  });

  it('selectColor is deterministic', () => {
    const c1 = createDebug.selectColor('namespace');
    const c2 = createDebug.selectColor('namespace');
    expect(c1).toBe(c2);
  });

  it('names and skips reflect enabled patterns', () => {
    createDebug.enable('app:*,-app:secret');
    expect(createDebug.names().length).toBe(1);
    expect(createDebug.skips().length).toBe(1);
  });
});

describe('type exports', () => {
  it('exports Debugger type', () => {
    const debug: Debugger = createDebug('type:test');
    expect(debug.namespace).toBe('type:test');
  });

  it('exports Formatter type', () => {
    const fmt: Formatter = (val: unknown) => String(val);
    expect(fmt(42)).toBe('42');
  });
});
