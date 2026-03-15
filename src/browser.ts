/**
 * Browser-specific debug backend.
 * Outputs via console with CSS colors and localStorage-based DEBUG control.
 */

import { setup, type Debugger } from './common.js';
import { ms } from './ms.js';

/**
 * CSS color palette for browser console output.
 */
const colors = [
  '#0000CC', '#0000FF', '#0033CC', '#0033FF', '#0066CC', '#0066FF',
  '#0099CC', '#0099FF', '#00CC00', '#00CC33', '#00CC66', '#00CC99',
  '#00CCCC', '#00CCFF', '#3300CC', '#3300FF', '#3333CC', '#3333FF',
  '#3366CC', '#3366FF', '#3399CC', '#3399FF', '#33CC00', '#33CC33',
  '#33CC66', '#33CC99', '#33CCCC', '#33CCFF', '#6600CC', '#6600FF',
  '#6633CC', '#6633FF', '#66CC00', '#66CC33', '#9900CC', '#9900FF',
  '#9933CC', '#9933FF', '#99CC00', '#99CC33', '#CC0000', '#CC0033',
  '#CC0066', '#CC0099', '#CC00CC', '#CC00FF', '#CC3300', '#CC3333',
  '#CC3366', '#CC3399', '#CC33CC', '#CC33FF', '#CC6600', '#CC6633',
  '#CC9900', '#CC9933', '#CCCC00', '#CCCC33', '#FF0000', '#FF0033',
  '#FF0066', '#FF0099', '#FF00CC', '#FF00FF', '#FF3300', '#FF3333',
  '#FF3366', '#FF3399', '#FF33CC', '#FF33FF', '#FF6600', '#FF6633',
  '#FF9900', '#FF9933', '#FFCC00', '#FFCC33',
];

/**
 * Whether the browser console supports CSS styling (%c).
 * Heuristic: most modern browsers do.
 */
function useColors(): boolean {
  // In a real browser, we'd check navigator.userAgent.
  // For server-side rendering or test environments, return false.
  if (typeof window !== 'undefined' && typeof window.navigator !== 'undefined') {
    // Chrome, Firefox, Edge, Safari all support %c in console
    return true;
  }
  return false;
}

/**
 * Format args for browser console output with CSS colors and time deltas.
 */
function formatArgs(this: Debugger, args: unknown[]): void {
  const useColor = this.useColors;
  const name = this.namespace;
  const diff = ms(this.diff, { long: false });

  if (useColor) {
    const c = this.color as string;
    args[0] =
      '%c' + name + '%c ' + (args[0] as string) + ' %c+' + diff;
    args.splice(1, 0,
      'color:' + c,
      'color:inherit',
      'color:' + c,
    );
  } else {
    args[0] = name + ' ' + (args[0] as string) + ' +' + diff;
  }
}

/**
 * Save namespaces to localStorage.
 */
function save(namespaces: string | null): void {
  try {
    if (typeof localStorage !== 'undefined') {
      if (namespaces) {
        localStorage.setItem('debug', namespaces);
      } else {
        localStorage.removeItem('debug');
      }
    }
  } catch {
    // localStorage may be disabled (private browsing, etc.)
  }
}

/**
 * Load namespaces from localStorage.
 */
function load(): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('debug');
    }
  } catch {
    // localStorage may be disabled
  }
  // Fall back to checking for a global `debug` variable
  if (typeof process !== 'undefined' && process.env && process.env['DEBUG']) {
    return process.env['DEBUG'];
  }
  return null;
}

/**
 * Initialize a debug instance for the browser.
 */
function init(_debug: Debugger): void {
  // Nothing extra needed for browser
}

/**
 * Log to the console, picking the appropriate console method.
 */
function log(...args: unknown[]): void {
  // Use console.debug if available, otherwise console.log
  if (typeof console !== 'undefined') {
    if (typeof console.debug === 'function') {
      console.debug(...args);
    } else {
      console.log(...args);
    }
  }
}

const createDebug = setup({
  formatArgs,
  log,
  save,
  load,
  init,
  useColors,
  colors,
  formatters: {
    j(val: unknown): string {
      try {
        return JSON.stringify(val);
      } catch (error) {
        return '[UnexpectedJSONParseError]: ' + (error as Error).message;
      }
    },
  },
});

export default createDebug;
