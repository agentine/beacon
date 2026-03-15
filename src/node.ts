/**
 * Node.js-specific debug backend.
 * Outputs to stderr with 256-color support and time deltas.
 */

import * as tty from 'node:tty';
import * as util from 'node:util';
import { setup, type Debugger } from './common.js';
import { ms } from './ms.js';

/**
 * 256-color palette for terminal output.
 * Excludes colors that are too dark or too close to the background.
 */
const colors = [
  20, 21, 26, 27, 32, 33, 38, 39, 40, 41, 42, 43, 44, 45, 56, 57, 62, 63,
  68, 69, 74, 75, 76, 77, 78, 79, 80, 81, 92, 93, 98, 99, 112, 113, 128,
  129, 134, 135, 148, 149, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169,
  170, 171, 172, 173, 178, 179, 184, 185, 196, 197, 198, 199, 200, 201, 202,
  203, 204, 205, 206, 207, 208, 209, 214, 215, 220, 221,
];

/**
 * Read an env variable, normalizing "true"/"false"/"yes"/"no" to booleans,
 * and numeric strings to numbers.
 */
function envVal(key: string): string | boolean | number | undefined {
  const val = process.env[key];
  if (val === undefined) return undefined;
  if (val === 'true' || val === 'yes' || val === '1') return true;
  if (val === 'false' || val === 'no' || val === '0') return false;
  if (val !== '' && !isNaN(Number(val))) return Number(val);
  return val;
}

/**
 * Whether stderr supports color output.
 */
function supportsColor(): boolean {
  const colorEnv = envVal('DEBUG_COLORS');
  if (colorEnv === false) return false;
  if (colorEnv === true) return true;

  if (process.stderr && typeof (process.stderr as tty.WriteStream).hasColors === 'function') {
    return (process.stderr as tty.WriteStream).hasColors();
  }
  return false;
}

/**
 * Format args for Node.js output with ANSI colors and time deltas.
 */
function formatArgs(this: Debugger, args: unknown[]): void {
  const name = this.namespace;
  const useColor = this.useColors;
  const diff = humanize(this.diff);

  if (useColor) {
    const c = this.color as number;
    const colorCode = '\u001B[3' + (c < 8 ? String(c) : '8;5;' + String(c));
    const prefix = '  ' + colorCode + ';1m' + name + ' ' + '\u001B[0m';
    args[0] = prefix + (args[0] as string);
    args.push(colorCode + 'm+' + diff + '\u001B[0m');
  } else {
    const dateStr = hideDate() ? '' : new Date().toISOString() + ' ';
    args[0] = dateStr + name + ' ' + (args[0] as string);
    args.push('+' + diff);
  }
}

function hideDate(): boolean {
  return envVal('DEBUG_HIDE_DATE') === true;
}

function humanize(msVal: number): string {
  return ms(msVal, { long: false });
}

/**
 * Save namespaces to the DEBUG environment variable.
 */
function save(namespaces: string | null): void {
  if (namespaces) {
    process.env['DEBUG'] = namespaces;
  } else {
    delete process.env['DEBUG'];
  }
}

/**
 * Load namespaces from the DEBUG environment variable.
 */
function load(): string | null {
  return process.env['DEBUG'] || null;
}

/**
 * Initialize a debug instance for Node.js.
 */
function init(_debug: Debugger): void {
  // Nothing extra needed for Node.js
}

/**
 * Log to stderr.
 */
function log(...args: unknown[]): void {
  process.stderr.write(util.format(...args) + '\n');
}

const createDebug = setup({
  formatArgs,
  log,
  save,
  load,
  init,
  useColors: supportsColor,
  colors,
  formatters: {
    o(val: unknown): string {
      return util.inspect(val, { showHidden: false, depth: 2, colors: supportsColor() })
        .split('\n')
        .map((str) => str.trim())
        .join(' ');
    },
    O(val: unknown): string {
      return util.inspect(val, { showHidden: false, depth: null, colors: supportsColor() });
    },
  },
});

export default createDebug;
