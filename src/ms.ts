/**
 * Inlined ms-style time string parser/formatter.
 * Compatible with the `ms` npm package.
 */

const s = 1000;
const m = s * 60;
const h = m * 60;
const d = h * 24;
const w = d * 7;
const y = d * 365.25;

const parseRe =
  /^(-?(?:\d+)?\.?\d+)\s*(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i;

/**
 * Parse a time string (e.g. "1h", "2 days") to milliseconds,
 * or format a number of milliseconds to a human-readable string.
 */
export function ms(val: string): number;
export function ms(val: number, options?: { long?: boolean }): string;
export function ms(
  val: string | number,
  options?: { long?: boolean },
): number | string {
  if (typeof val === 'string' && val.length > 0) {
    return parse(val);
  } else if (typeof val === 'number' && isFinite(val)) {
    return options?.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val),
  );
}

function parse(str: string): number {
  const trimmed = str.trim();
  if (trimmed.length > 100) {
    throw new Error('Value exceeds the maximum length of 100 characters.');
  }

  const match = parseRe.exec(trimmed);
  if (!match) {
    return NaN;
  }

  const n = parseFloat(match[1]!);
  const type = (match[2] || 'ms').toLowerCase();

  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'weeks':
    case 'week':
    case 'w':
      return n * w;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      throw new Error('The unit ' + type + ' was matched, but no handler.');
  }
}

function fmtShort(ms: number): string {
  const abs = Math.abs(ms);
  if (abs >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (abs >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (abs >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (abs >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

function plural(ms: number, abs: number, n: number, name: string): string {
  const isPlural = abs >= n * 1.5;
  return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
}

function fmtLong(ms: number): string {
  const abs = Math.abs(ms);
  if (abs >= d) {
    return plural(ms, abs, d, 'day');
  }
  if (abs >= h) {
    return plural(ms, abs, h, 'hour');
  }
  if (abs >= m) {
    return plural(ms, abs, m, 'minute');
  }
  if (abs >= s) {
    return plural(ms, abs, s, 'second');
  }
  return ms + ' ms';
}
