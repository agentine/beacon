import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import createDebug from '../src/browser.js';

describe('browser backend', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    createDebug.enable('');
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('creates a debugger with a namespace', () => {
    const debug = createDebug('browser:test');
    expect(debug.namespace).toBe('browser:test');
  });

  it('outputs to console when enabled', () => {
    createDebug.enable('browser:*');
    const debug = createDebug('browser:output');
    debug('hello %s', 'world');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('does not output when disabled', () => {
    createDebug.enable('other:*');
    const debug = createDebug('browser:silent');
    debug('should not appear');
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('has j formatter for JSON', () => {
    expect(createDebug.formatters['j']).toBeTypeOf('function');
  });

  it('j formatter produces JSON string', () => {
    const fmt = createDebug.formatters['j']!;
    expect(fmt({ a: 1 })).toBe('{"a":1}');
  });

  it('j formatter handles circular refs gracefully', () => {
    const fmt = createDebug.formatters['j']!;
    const obj: Record<string, unknown> = {};
    obj['self'] = obj;
    const result = fmt(obj);
    expect(result).toContain('UnexpectedJSONParseError');
  });

  it('supports enable/disable', () => {
    createDebug.enable('test:*');
    expect(createDebug.enabled('test:foo')).toBe(true);
    expect(createDebug.enabled('other:bar')).toBe(false);
    const prev = createDebug.disable();
    expect(prev).toBe('test:*');
  });

  it('supports extend', () => {
    createDebug.enable('*');
    const parent = createDebug('app');
    const child = parent.extend('ui');
    expect(child.namespace).toBe('app:ui');
  });

  it('supports destroy', () => {
    const debug = createDebug('temp');
    expect(debug.destroy()).toBe(true);
    expect(debug.destroy()).toBe(false);
  });
});
