/**
 * Common debug logic shared between Node.js and browser environments.
 * This is the core namespace factory that matches debug@4.x behavior.
 */

import { ms } from './ms.js';

/** Format specifier handler */
export type Formatter = (val: unknown) => string;

/** The debug function returned by createDebug */
export interface Debugger {
  (...args: unknown[]): void;
  namespace: string;
  enabled: boolean;
  useColors: boolean;
  color: string | number;
  diff: number;
  curr: number;
  prev: number;
  extend: (sub: string, delimiter?: string) => Debugger;
  destroy: () => boolean;
  log: (...args: unknown[]) => void;
}

/** Environment-specific setup provided by node.js or browser.js */
export interface SetupOptions {
  /** Format args for output (apply colors, etc.) */
  formatArgs: (this: Debugger, args: unknown[]) => void;
  /** Write formatted output */
  log: (...args: unknown[]) => void;
  /** Save namespaces string to storage */
  save: (namespaces: string | null) => void;
  /** Load namespaces string from storage */
  load: () => string | null;
  /** Initialize a debugger (assign color, etc.) */
  init: (debug: Debugger) => void;
  /** Whether stderr is a TTY / supports color */
  useColors: () => boolean;
  /** Available colors */
  colors: (string | number)[];
  /** Custom formatters */
  formatters: Record<string, Formatter>;
  /** Namespace for inspector logging (Node.js) */
  inspectOpts?: Record<string, unknown>;
}

/**
 * Creates a debug environment with the given platform-specific options.
 * Returns the main `debug` function factory.
 */
export function setup(opts: SetupOptions) {
  const {
    formatArgs,
    save,
    load,
    init,
    useColors,
    colors,
    formatters,
  } = opts;

  /** Currently enabled namespace patterns (include) */
  let enabledNames: RegExp[] = [];
  /** Currently excluded namespace patterns */
  let skippedNames: RegExp[] = [];
  /** Raw namespaces string */
  let enabledNamespaces = '';

  /** All created debuggers (for re-enabling on enable() call) */
  const instances: Debugger[] = [];

  /**
   * The main factory: creates a debug function bound to a namespace.
   */
  function createDebug(namespace: string): Debugger {
    let prevTime: number | undefined;
    let enableOverride: boolean | null = null;

    const debug = function (this: unknown, ...args: unknown[]) {
      if (!debug.enabled) return;

      const curr = Date.now();
      const diff = curr - (prevTime || curr);
      prevTime = curr;

      debug.diff = diff;
      debug.curr = curr;
      debug.prev = prevTime;

      args[0] = coerce(args[0]);

      if (typeof args[0] !== 'string') {
        args.unshift('%O');
      }

      // Apply formatters
      let index = 0;
      args[0] = (args[0] as string).replace(/%([a-zA-Z%])/g, (match, format: string) => {
        if (match === '%%') return '%';
        index++;
        const formatter = formatters[format];
        if (typeof formatter === 'function') {
          const val = args[index];
          match = formatter.call(debug, val);
          args.splice(index, 1);
          index--;
        }
        return match;
      });

      formatArgs.call(debug, args);

      const logFn = debug.log || opts.log;
      logFn.apply(debug, args);
    } as unknown as Debugger;

    debug.namespace = namespace;
    debug.useColors = useColors();
    debug.color = selectColor(namespace);
    debug.extend = extend;
    debug.destroy = destroy;
    debug.log = undefined as unknown as (...args: unknown[]) => void;

    Object.defineProperty(debug, 'enabled', {
      enumerable: true,
      configurable: false,
      get: () =>
        enableOverride !== null
          ? enableOverride
          : isEnabled(namespace),
      set: (v: boolean) => {
        enableOverride = v;
      },
    });

    init(debug);
    instances.push(debug);

    return debug;

    function extend(sub: string, delimiter?: string): Debugger {
      const sep = delimiter === undefined ? ':' : delimiter;
      const newDebug = createDebug(debug.namespace + sep + sub);
      newDebug.log = debug.log;
      return newDebug;
    }

    function destroy(): boolean {
      const idx = instances.indexOf(debug);
      if (idx !== -1) {
        instances.splice(idx, 1);
        return true;
      }
      return false;
    }
  }

  /**
   * Enable namespaces matching the given string.
   * Supports wildcards (*) and exclusions (-prefix).
   */
  function enable(namespaces: string): void {
    save(namespaces);
    enabledNamespaces = namespaces;

    enabledNames = [];
    skippedNames = [];

    const split = (typeof namespaces === 'string' ? namespaces : '')
      .split(/[\s,]+/)
      .filter(Boolean);

    for (const ns of split) {
      if (ns[0] === '-') {
        skippedNames.push(toRegExp(ns.slice(1)));
      } else {
        enabledNames.push(toRegExp(ns));
      }
    }

    // Re-evaluate all existing instances
    for (const instance of instances) {
      (instance as Debugger & { enabled: boolean }).enabled = isEnabled(
        instance.namespace,
      );
    }
  }

  /**
   * Disable all namespaces.
   */
  function disable(): string {
    const prev = enabledNamespaces;
    enable('');
    return prev;
  }

  /**
   * Check if a namespace is enabled.
   */
  function isEnabled(name: string): boolean {
    // Check skips first
    for (const re of skippedNames) {
      if (re.test(name)) return false;
    }
    // Then check enables
    for (const re of enabledNames) {
      if (re.test(name)) return true;
    }
    return false;
  }

  /**
   * Returns true if the given namespace is enabled.
   */
  function enabled(namespace: string): boolean {
    return isEnabled(namespace);
  }

  /**
   * Convert a namespace pattern to a RegExp.
   * Supports * as wildcard.
   */
  function toRegExp(pattern: string): RegExp {
    return new RegExp(
      '^' + pattern.replace(/\*/g, '.*?') + '$',
    );
  }

  /**
   * Select a color for a namespace (hash-based).
   */
  function selectColor(namespace: string): string | number {
    let hash = 0;
    for (let i = 0; i < namespace.length; i++) {
      hash = (hash << 5) - hash + namespace.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return colors[Math.abs(hash) % colors.length]!;
  }

  /**
   * Coerce val — if it's an Error, use the stack or message.
   */
  function coerce(val: unknown): unknown {
    if (val instanceof Error) return val.stack || val.message;
    return val;
  }

  /**
   * Return the names of enabled namespaces.
   */
  function names(): RegExp[] {
    return enabledNames;
  }

  /**
   * Return the names of skipped namespaces.
   */
  function skips(): RegExp[] {
    return skippedNames;
  }

  // Load initial namespaces from environment
  const initialNamespaces = load();
  if (initialNamespaces) {
    enable(initialNamespaces);
  }

  // Attach API to the factory
  createDebug.enable = enable;
  createDebug.disable = disable;
  createDebug.enabled = enabled;
  createDebug.names = names;
  createDebug.skips = skips;
  createDebug.formatters = formatters;
  createDebug.selectColor = selectColor;
  createDebug.coerce = coerce;

  // Humanize is available as a property
  createDebug.humanize = ms;

  return createDebug;
}
