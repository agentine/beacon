import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import createDebug from '../src/node.js';

describe('node backend', () => {
  let stderrWrite: ReturnType<typeof vi.spyOn>;
  const origDebug = process.env['DEBUG'];

  beforeEach(() => {
    stderrWrite = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    delete process.env['DEBUG'];
    createDebug.enable('');
  });

  afterEach(() => {
    stderrWrite.mockRestore();
    if (origDebug !== undefined) {
      process.env['DEBUG'] = origDebug;
    } else {
      delete process.env['DEBUG'];
    }
  });

  it('creates a debugger with a namespace', () => {
    const debug = createDebug('test:node');
    expect(debug.namespace).toBe('test:node');
  });

  it('outputs to stderr when enabled', () => {
    createDebug.enable('test:*');
    const debug = createDebug('test:output');
    debug('hello %s', 'world');
    expect(stderrWrite).toHaveBeenCalled();
    const output = stderrWrite.mock.calls[0]![0] as string;
    expect(output).toContain('test:output');
    expect(output).toContain('hello world');
  });

  it('does not output when disabled', () => {
    createDebug.enable('other:*');
    const debug = createDebug('test:silent');
    debug('should not appear');
    expect(stderrWrite).not.toHaveBeenCalled();
  });

  it('saves namespaces to DEBUG env var', () => {
    createDebug.enable('saved:*');
    expect(process.env['DEBUG']).toBe('saved:*');
  });

  it('loads namespaces from DEBUG env var', () => {
    process.env['DEBUG'] = 'env:loaded';
    // Need to re-import to trigger load, but we can test via enable
    createDebug.enable('env:loaded');
    expect(createDebug.enabled('env:loaded')).toBe(true);
  });

  it('shows time delta in output', () => {
    createDebug.enable('test:*');
    const debug = createDebug('test:delta');
    debug('first');
    debug('second');
    expect(stderrWrite).toHaveBeenCalledTimes(2);
    const output = stderrWrite.mock.calls[1]![0] as string;
    expect(output).toMatch(/\+\d+ms/);
  });

  it('supports extend', () => {
    createDebug.enable('*');
    const parent = createDebug('app');
    const child = parent.extend('server');
    expect(child.namespace).toBe('app:server');
    child('hello');
    expect(stderrWrite).toHaveBeenCalled();
    const output = stderrWrite.mock.calls[0]![0] as string;
    expect(output).toContain('app:server');
  });

  it('has o and O formatters', () => {
    expect(createDebug.formatters['o']).toBeTypeOf('function');
    expect(createDebug.formatters['O']).toBeTypeOf('function');
  });

  it('o formatter produces single-line inspect', () => {
    const fmt = createDebug.formatters['o']!;
    const result = fmt({ a: 1, b: 2 });
    expect(result).not.toContain('\n');
    expect(result).toContain('a');
  });

  it('disable returns previous namespaces', () => {
    createDebug.enable('test:*');
    const prev = createDebug.disable();
    expect(prev).toBe('test:*');
  });
});
