import { describe, it, expect } from 'vitest';
import { ms } from '../src/ms.js';

describe('ms(string)', () => {
  it('parses milliseconds', () => {
    expect(ms('100')).toBe(100);
    expect(ms('50ms')).toBe(50);
    expect(ms('100 msecs')).toBe(100);
    expect(ms('1 millisecond')).toBe(1);
    expect(ms('5 milliseconds')).toBe(5);
  });

  it('parses seconds', () => {
    expect(ms('1s')).toBe(1000);
    expect(ms('5s')).toBe(5000);
    expect(ms('1 sec')).toBe(1000);
    expect(ms('10 secs')).toBe(10000);
    expect(ms('1 second')).toBe(1000);
    expect(ms('5 seconds')).toBe(5000);
  });

  it('parses minutes', () => {
    expect(ms('1m')).toBe(60000);
    expect(ms('5m')).toBe(300000);
    expect(ms('1 min')).toBe(60000);
    expect(ms('10 mins')).toBe(600000);
    expect(ms('1 minute')).toBe(60000);
    expect(ms('3 minutes')).toBe(180000);
  });

  it('parses hours', () => {
    expect(ms('1h')).toBe(3600000);
    expect(ms('5h')).toBe(18000000);
    expect(ms('1 hr')).toBe(3600000);
    expect(ms('2 hrs')).toBe(7200000);
    expect(ms('1 hour')).toBe(3600000);
    expect(ms('3 hours')).toBe(10800000);
  });

  it('parses days', () => {
    expect(ms('1d')).toBe(86400000);
    expect(ms('2d')).toBe(172800000);
    expect(ms('1 day')).toBe(86400000);
    expect(ms('3 days')).toBe(259200000);
  });

  it('parses weeks', () => {
    expect(ms('1w')).toBe(604800000);
    expect(ms('2w')).toBe(1209600000);
    expect(ms('1 week')).toBe(604800000);
    expect(ms('3 weeks')).toBe(1814400000);
  });

  it('parses years', () => {
    expect(ms('1y')).toBe(31557600000);
    expect(ms('2y')).toBe(63115200000);
    expect(ms('1 yr')).toBe(31557600000);
    expect(ms('1 year')).toBe(31557600000);
    expect(ms('2 years')).toBe(63115200000);
  });

  it('handles decimals', () => {
    expect(ms('1.5h')).toBe(5400000);
    expect(ms('2.5 hrs')).toBe(9000000);
    expect(ms('.5d')).toBe(43200000);
  });

  it('handles negative values', () => {
    expect(ms('-1h')).toBe(-3600000);
    expect(ms('-3 days')).toBe(-259200000);
    expect(ms('-200')).toBe(-200);
  });

  it('is case insensitive', () => {
    expect(ms('1H')).toBe(3600000);
    expect(ms('5S')).toBe(5000);
    expect(ms('1 Day')).toBe(86400000);
  });

  it('trims whitespace', () => {
    expect(ms('  1h  ')).toBe(3600000);
    expect(ms(' 100 ')).toBe(100);
  });

  it('returns NaN for invalid strings', () => {
    expect(ms('abc')).toBeNaN();
    expect(ms('☕')).toBeNaN();
  });

  it('throws for strings over 100 chars', () => {
    expect(() => ms('a'.repeat(101))).toThrow();
  });
});

describe('ms(number) - short format', () => {
  it('formats milliseconds', () => {
    expect(ms(500)).toBe('500ms');
    expect(ms(0)).toBe('0ms');
  });

  it('formats seconds', () => {
    expect(ms(1000)).toBe('1s');
    expect(ms(5000)).toBe('5s');
    expect(ms(1500)).toBe('2s');
  });

  it('formats minutes', () => {
    expect(ms(60000)).toBe('1m');
    expect(ms(90000)).toBe('2m');
  });

  it('formats hours', () => {
    expect(ms(3600000)).toBe('1h');
    expect(ms(7200000)).toBe('2h');
  });

  it('formats days', () => {
    expect(ms(86400000)).toBe('1d');
    expect(ms(172800000)).toBe('2d');
  });

  it('rounds correctly', () => {
    expect(ms(1200)).toBe('1s');
    expect(ms(1800)).toBe('2s');
  });

  it('handles negative numbers', () => {
    expect(ms(-500)).toBe('-500ms');
    expect(ms(-3600000)).toBe('-1h');
  });
});

describe('ms(number, { long: true }) - long format', () => {
  it('formats singular', () => {
    expect(ms(1000, { long: true })).toBe('1 second');
    expect(ms(60000, { long: true })).toBe('1 minute');
    expect(ms(3600000, { long: true })).toBe('1 hour');
    expect(ms(86400000, { long: true })).toBe('1 day');
  });

  it('formats plural', () => {
    expect(ms(5000, { long: true })).toBe('5 seconds');
    expect(ms(120000, { long: true })).toBe('2 minutes');
    expect(ms(7200000, { long: true })).toBe('2 hours');
    expect(ms(172800000, { long: true })).toBe('2 days');
  });

  it('formats ms', () => {
    expect(ms(500, { long: true })).toBe('500 ms');
    expect(ms(0, { long: true })).toBe('0 ms');
  });

  it('handles negative numbers', () => {
    expect(ms(-3600000, { long: true })).toBe('-1 hour');
    expect(ms(-7200000, { long: true })).toBe('-2 hours');
  });
});

describe('ms() - error handling', () => {
  it('throws on empty string', () => {
    expect(() => ms('')).toThrow();
  });

  it('throws on non-finite numbers', () => {
    expect(() => ms(Infinity)).toThrow();
    expect(() => ms(NaN)).toThrow();
  });
});
