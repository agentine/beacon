/**
 * Entry point for @agentine/beacon.
 * Auto-detects Node.js vs browser environment.
 */

// Re-export types
export type { Debugger, Formatter, SetupOptions } from './common.js';
export { ms } from './ms.js';

/**
 * Detect if we're running in a browser environment.
 */
function isBrowser(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.document !== 'undefined'
  );
}

// Import the appropriate backend
// Note: both imports are static for bundler compatibility,
// but only the appropriate one is used at runtime.
import nodeDebug from './node.js';
import browserDebug from './browser.js';

type DebugFactory = typeof nodeDebug;

const createDebug: DebugFactory = isBrowser() ? browserDebug : nodeDebug;

export default createDebug;
export { createDebug };
