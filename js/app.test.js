/**
 * app.test.js — Unit tests for To-Do Life Dashboard pure functions.
 *
 * Covers:
 *   GreetingModule: getGreeting, formatTime, formatDate, composeGreeting
 *   TimerModule:    renderDisplayText, isValidDuration
 *   StorageService: hydrateTheme, hydrateSessionDuration, hydrateTasks, hydrateQuickLinks
 *
 * Run with: npm test
 */

import { describe, it, expect } from 'vitest';
import {
  // GreetingModule helpers
  getGreeting,
  formatTime,
  formatDate,
  composeGreeting,
  // TimerModule helpers
  renderDisplayText,
  isValidDuration,
  // StorageService helpers
  isValidTheme,
  hydrateTheme,
  hydrateSessionDuration,
  hydrateTasks,
  hydrateQuickLinks,
  // QuickLinksModule helpers
  validateUrl,
  // TodoModule helpers
  validateLabel,
} from './helpers.js';

// =============================================================================
// GreetingModule — getGreeting
// Requirements 2.1–2.4
// =============================================================================

describe('getGreeting — time-of-day greeting phrase', () => {

  // Boundary: start of "Good Morning"
  it('returns "Good Morning" at hour 5 (boundary start)', () => {
    expect(getGreeting(5)).toBe('Good Morning');
  });

  it('returns "Good Morning" at hour 8 (mid-range)', () => {
    expect(getGreeting(8)).toBe('Good Morning');
  });

  it('returns "Good Morning" at hour 11 (boundary end)', () => {
    expect(getGreeting(11)).toBe('Good Morning');
  });

  // Boundary: transition Morning → Afternoon
  it('returns "Good Afternoon" at hour 12 (boundary start)', () => {
    expect(getGreeting(12)).toBe('Good Afternoon');
  });

  it('returns "Good Afternoon" at hour 15 (mid-range)', () => {
    expect(getGreeting(15)).toBe('Good Afternoon');
  });

  it('returns "Good Afternoon" at hour 17 (boundary end)', () => {
    expect(getGreeting(17)).toBe('Good Afternoon');
  });

  // Boundary: transition Afternoon → Evening
  it('returns "Good Evening" at hour 18 (boundary start)', () => {
    expect(getGreeting(18)).toBe('Good Evening');
  });

  it('returns "Good Evening" at hour 19 (mid-range)', () => {
    expect(getGreeting(19)).toBe('Good Evening');
  });

  it('returns "Good Evening" at hour 20 (boundary end)', () => {
    expect(getGreeting(20)).toBe('Good Evening');
  });

  // Boundary: transition Evening → Night (21–23)
  it('returns "Good Night" at hour 21 (boundary start of night-evening)', () => {
    expect(getGreeting(21)).toBe('Good Night');
  });

  it('returns "Good Night" at hour 23 (end of day)', () => {
    expect(getGreeting(23)).toBe('Good Night');
  });

  // Boundary: midnight and early-morning (00–04)
  it('returns "Good Night" at hour 0 (midnight)', () => {
    expect(getGreeting(0)).toBe('Good Night');
  });

  it('returns "Good Night" at hour 2 (deep night)', () => {
    expect(getGreeting(2)).toBe('Good Night');
  });

  it('returns "Good Night" at hour 4 (boundary end of night-morning)', () => {
    expect(getGreeting(4)).toBe('Good Night');
  });

  // Every hour must return one of the four valid phrases (full coverage)
  it('returns a valid phrase for every hour 0–23', () => {
    const valid = new Set(['Good Morning', 'Good Afternoon', 'Good Evening', 'Good Night']);
    for (let h = 0; h <= 23; h++) {
      expect(valid.has(getGreeting(h)), `hour ${h} returned unexpected value`).toBe(true);
    }
  });

});

// =============================================================================
// GreetingModule — formatTime
// Requirement 1.1
// =============================================================================

describe('formatTime — HH:MM formatting (24-hour, zero-padded)', () => {

  it('formats midnight as 00:00', () => {
    const d = new Date(2026, 9, 15, 0, 0, 0);   // Oct 15 2026 00:00:00
    expect(formatTime(d)).toBe('00:00');
  });

  it('zero-pads single-digit hours', () => {
    const d = new Date(2026, 9, 15, 7, 5, 0);   // 07:05
    expect(formatTime(d)).toBe('07:05');
  });

  it('formats noon correctly', () => {
    const d = new Date(2026, 9, 15, 12, 0, 0);
    expect(formatTime(d)).toBe('12:00');
  });

  it('formats end-of-day correctly', () => {
    const d = new Date(2026, 9, 15, 23, 59, 0);
    expect(formatTime(d)).toBe('23:59');
  });

  it('zero-pads single-digit minutes', () => {
    const d = new Date(2026, 9, 15, 14, 3, 0);  // 14:03
    expect(formatTime(d)).toBe('14:03');
  });

  it('formats a typical work-hour timestamp', () => {
    const d = new Date(2026, 9, 15, 9, 30, 45); // 09:30
    expect(formatTime(d)).toBe('09:30');
  });

  it('uses 24-hour format for 15:00 (not 3:00 PM)', () => {
    const d = new Date(2026, 9, 15, 15, 0, 0);
    expect(formatTime(d)).toBe('15:00');
  });

});

// =============================================================================
// GreetingModule — formatDate
// Requirement 1.3
// =============================================================================

describe('formatDate — "DayName, DD MonthName YYYY" format', () => {

  it('formats a known date correctly (Thu 15 Oct 2026)', () => {
    const d = new Date(2026, 9, 15); // October is month 9 (0-indexed)
    expect(formatDate(d)).toBe('Thursday, 15 October 2026');
  });

  it('zero-pads single-digit day of month', () => {
    const d = new Date(2026, 0, 1);  // Jan 1 2026 — a Thursday
    expect(formatDate(d)).toBe('Thursday, 01 January 2026');
  });

  it('uses correct day name for Sunday', () => {
    const d = new Date(2026, 9, 11); // Oct 11 2026 — a Sunday
    expect(formatDate(d)).toBe('Sunday, 11 October 2026');
  });

  it('uses correct day name for Saturday', () => {
    const d = new Date(2026, 9, 17); // Oct 17 2026 — a Saturday
    expect(formatDate(d)).toBe('Saturday, 17 October 2026');
  });

  it('formats December correctly', () => {
    const d = new Date(2026, 11, 31); // Dec 31 2026 — a Thursday
    expect(formatDate(d)).toBe('Thursday, 31 December 2026');
  });

  it('does NOT use locale-dependent strings (no comma-less date or locale month)', () => {
    const d = new Date(2026, 1, 14); // Feb 14 2026 — a Saturday
    const result = formatDate(d);
    expect(result).toBe('Saturday, 14 February 2026');
  });

  it('format matches "DayName, DD MonthName YYYY" pattern exactly', () => {
    const d = new Date(2026, 5, 3);  // Jun 3 2026 — a Wednesday
    const result = formatDate(d);
    // Pattern: <Word>, <2-digit> <Word> <4-digit>
    expect(result).toMatch(/^[A-Za-z]+, \d{2} [A-Za-z]+ \d{4}$/);
  });

});

// =============================================================================
// GreetingModule — composeGreeting
// Requirements 3.3, 3.4
// =============================================================================

describe('composeGreeting — greeting string with/without name', () => {

  it('with a name: phrase + ", " + name + "!"', () => {
    expect(composeGreeting('Good Morning', 'Alex')).toBe('Good Morning, Alex!');
  });

  it('without a name (null): phrase + "!"', () => {
    expect(composeGreeting('Good Morning', null)).toBe('Good Morning!');
  });

  it('without a name (empty string): phrase + "!"', () => {
    expect(composeGreeting('Good Morning', '')).toBe('Good Morning!');
  });

  it('always ends with "!"', () => {
    expect(composeGreeting('Good Night', 'Mia').endsWith('!')).toBe(true);
    expect(composeGreeting('Good Evening', null).endsWith('!')).toBe(true);
  });

  it('contains the phrase regardless of name presence', () => {
    expect(composeGreeting('Good Afternoon', 'Lee')).toContain('Good Afternoon');
    expect(composeGreeting('Good Afternoon', null)).toContain('Good Afternoon');
  });

  it('contains ", " + name when name is non-empty', () => {
    const result = composeGreeting('Good Night', 'Taylor');
    expect(result).toContain(', Taylor');
  });

  it('does NOT contain ", " when name is absent', () => {
    const result = composeGreeting('Good Morning', null);
    expect(result).not.toContain(', ');
  });

});

// =============================================================================
// TimerModule — renderDisplayText
// Requirement 4.6
// =============================================================================

describe('renderDisplayText — MM:SS formatting', () => {

  it('formats 25 minutes (1500 seconds) as "25:00"', () => {
    expect(renderDisplayText(1500)).toBe('25:00');
  });

  it('formats 0 seconds as "00:00"', () => {
    expect(renderDisplayText(0)).toBe('00:00');
  });

  it('formats 65 seconds as "01:05"', () => {
    expect(renderDisplayText(65)).toBe('01:05');
  });

  it('zero-pads single-digit minutes', () => {
    expect(renderDisplayText(300)).toBe('05:00'); // 5 minutes
  });

  it('zero-pads single-digit seconds', () => {
    expect(renderDisplayText(61)).toBe('01:01');
  });

  it('formats 90 minutes (5400 seconds) as "90:00"', () => {
    expect(renderDisplayText(5400)).toBe('90:00');
  });

  it('formats 1 minute 0 seconds as "01:00"', () => {
    expect(renderDisplayText(60)).toBe('01:00');
  });

  it('formats 59 seconds as "00:59"', () => {
    expect(renderDisplayText(59)).toBe('00:59');
  });

  it('result always matches MM:SS pattern', () => {
    const samples = [0, 1, 59, 60, 61, 599, 600, 1499, 1500, 5399, 5400];
    for (const s of samples) {
      expect(renderDisplayText(s)).toMatch(/^\d{2}:\d{2}$/);
    }
  });

});

// =============================================================================
// TimerModule — isValidDuration
// Requirements 5.1, 5.5
// =============================================================================

describe('isValidDuration — validates session duration integer 1–90', () => {

  // Valid range
  it('accepts 1 (lower boundary)', () => {
    expect(isValidDuration(1)).toBe(true);
  });

  it('accepts 25 (default value)', () => {
    expect(isValidDuration(25)).toBe(true);
  });

  it('accepts 90 (upper boundary)', () => {
    expect(isValidDuration(90)).toBe(true);
  });

  it('accepts all integers from 1 to 90', () => {
    for (let i = 1; i <= 90; i++) {
      expect(isValidDuration(i), `expected ${i} to be valid`).toBe(true);
    }
  });

  // Out of range
  it('rejects 0 (below lower boundary)', () => {
    expect(isValidDuration(0)).toBe(false);
  });

  it('rejects 91 (above upper boundary)', () => {
    expect(isValidDuration(91)).toBe(false);
  });

  it('rejects negative integers', () => {
    expect(isValidDuration(-1)).toBe(false);
    expect(isValidDuration(-25)).toBe(false);
  });

  // Non-integer numbers
  it('rejects float 1.5', () => {
    expect(isValidDuration(1.5)).toBe(false);
  });

  it('rejects float 25.0001', () => {
    expect(isValidDuration(25.0001)).toBe(false);
  });

  it('rejects NaN', () => {
    expect(isValidDuration(NaN)).toBe(false);
  });

  it('rejects Infinity', () => {
    expect(isValidDuration(Infinity)).toBe(false);
  });

  // Non-numeric types
  it('rejects string "25"', () => {
    expect(isValidDuration('25')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidDuration('')).toBe(false);
  });

  it('rejects null', () => {
    expect(isValidDuration(null)).toBe(false);
  });

  it('rejects undefined', () => {
    expect(isValidDuration(undefined)).toBe(false);
  });

  it('rejects boolean true', () => {
    expect(isValidDuration(true)).toBe(false);
  });

  it('rejects object', () => {
    expect(isValidDuration({})).toBe(false);
  });

});

// =============================================================================
// StorageService hydration helpers
// Requirements 10.3, 11.7, 13.5–13.7, 5.4
// =============================================================================

describe('isValidTheme', () => {
  it('accepts "light"', () => expect(isValidTheme('light')).toBe(true));
  it('accepts "dark"', () => expect(isValidTheme('dark')).toBe(true));
  it('rejects "LIGHT" (case-sensitive)', () => expect(isValidTheme('LIGHT')).toBe(false));
  it('rejects "auto"', () => expect(isValidTheme('auto')).toBe(false));
  it('rejects null', () => expect(isValidTheme(null)).toBe(false));
  it('rejects empty string', () => expect(isValidTheme('')).toBe(false));
});

describe('hydrateTheme — fallback to "light" for invalid values', () => {
  it('returns "light" for valid input "light"', () => expect(hydrateTheme('light')).toBe('light'));
  it('returns "dark" for valid input "dark"', () => expect(hydrateTheme('dark')).toBe('dark'));
  it('defaults to "light" for null', () => expect(hydrateTheme(null)).toBe('light'));
  it('defaults to "light" for undefined', () => expect(hydrateTheme(undefined)).toBe('light'));
  it('defaults to "light" for "auto"', () => expect(hydrateTheme('auto')).toBe('light'));
  it('defaults to "light" for empty string', () => expect(hydrateTheme('')).toBe('light'));
  it('defaults to "light" for number 1', () => expect(hydrateTheme(1)).toBe('light'));
});

describe('hydrateSessionDuration — fallback to 25 for invalid values', () => {
  it('accepts 1 (lower boundary)', () => expect(hydrateSessionDuration(1)).toBe(1));
  it('accepts 25 (default)', () => expect(hydrateSessionDuration(25)).toBe(25));
  it('accepts 90 (upper boundary)', () => expect(hydrateSessionDuration(90)).toBe(90));
  it('defaults to 25 for 0', () => expect(hydrateSessionDuration(0)).toBe(25));
  it('defaults to 25 for 91', () => expect(hydrateSessionDuration(91)).toBe(25));
  it('defaults to 25 for float 1.5', () => expect(hydrateSessionDuration(1.5)).toBe(25));
  it('defaults to 25 for null', () => expect(hydrateSessionDuration(null)).toBe(25));
  it('defaults to 25 for string "25"', () => expect(hydrateSessionDuration('25')).toBe(25));
  it('defaults to 25 for undefined', () => expect(hydrateSessionDuration(undefined)).toBe(25));
});

describe('hydrateTasks — returns array or empty array for malformed data', () => {
  it('returns the original array when input is a valid array', () => {
    const arr = [{ id: '1', label: 'Buy milk', done: false, createdAt: '2026-10-15T00:00:00.000Z' }];
    expect(hydrateTasks(arr)).toEqual(arr);
  });
  it('returns [] for null', () => expect(hydrateTasks(null)).toEqual([]));
  it('returns [] for undefined', () => expect(hydrateTasks(undefined)).toEqual([]));
  it('returns [] for a plain object', () => expect(hydrateTasks({})).toEqual([]));
  it('returns [] for a string', () => expect(hydrateTasks('[]')).toEqual([]));
  it('returns [] for a number', () => expect(hydrateTasks(42)).toEqual([]));
  it('returns [] for false', () => expect(hydrateTasks(false)).toEqual([]));
  it('returns [] for empty object', () => expect(hydrateTasks({})).toEqual([]));
  it('returns original empty array', () => expect(hydrateTasks([])).toEqual([]));
});

describe('hydrateQuickLinks — returns array or empty array for malformed data', () => {
  it('returns the original array when input is a valid array', () => {
    const arr = [{ id: '1', label: 'GitHub', url: 'https://github.com' }];
    expect(hydrateQuickLinks(arr)).toEqual(arr);
  });
  it('returns [] for null', () => expect(hydrateQuickLinks(null)).toEqual([]));
  it('returns [] for a plain string', () => expect(hydrateQuickLinks('link')).toEqual([]));
  it('returns [] for a number', () => expect(hydrateQuickLinks(0)).toEqual([]));
  it('returns original empty array', () => expect(hydrateQuickLinks([])).toEqual([]));
});

// =============================================================================
// QuickLinksModule — validateUrl
// Requirement 11.4
// =============================================================================

describe('validateUrl — URL must start with http:// or https:// and be ≤ 2048 chars', () => {

  it('accepts a valid https URL', () => {
    expect(validateUrl('https://example.com')).toBe(true);
  });

  it('accepts a valid http URL', () => {
    expect(validateUrl('http://example.com')).toBe(true);
  });

  it('accepts URL at exactly 2048 characters', () => {
    // Build a URL that's exactly 2048 chars: "https://" (8) + 2040 "a"s
    const url = 'https://' + 'a'.repeat(2040);
    expect(url.length).toBe(2048);
    expect(validateUrl(url)).toBe(true);
  });

  it('rejects URL at 2049 characters', () => {
    const url = 'https://' + 'a'.repeat(2041);
    expect(url.length).toBe(2049);
    expect(validateUrl(url)).toBe(false);
  });

  it('rejects URL starting with "ftp://"', () => {
    expect(validateUrl('ftp://example.com')).toBe(false);
  });

  it('rejects URL without protocol', () => {
    expect(validateUrl('example.com')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateUrl('')).toBe(false);
  });

  it('rejects null', () => {
    expect(validateUrl(null)).toBe(false);
  });

  it('rejects URL starting with "//example.com"', () => {
    expect(validateUrl('//example.com')).toBe(false);
  });

  it('accepts URLs with paths and query strings', () => {
    expect(validateUrl('https://github.com/user/repo?tab=readme')).toBe(true);
  });

  it('rejects non-string input (number)', () => {
    expect(validateUrl(42)).toBe(false);
  });

});

// =============================================================================
// TodoModule — validateLabel
// Requirements 6.3, 6.4, 7.4, 7.5
// =============================================================================

describe('validateLabel — empty input rejection', () => {
  const tasks = [
    { id: '1', label: 'Buy milk', done: false, createdAt: '2026-10-15T00:00:00.000Z' },
  ];

  it('rejects an empty string', () => {
    expect(validateLabel('', null, tasks)).toEqual({ ok: false, error: 'empty' });
  });

  it('rejects a whitespace-only string (spaces)', () => {
    expect(validateLabel('   ', null, tasks)).toEqual({ ok: false, error: 'empty' });
  });

  it('rejects a whitespace-only string (tab + newline)', () => {
    expect(validateLabel('\t\n', null, tasks)).toEqual({ ok: false, error: 'empty' });
  });

  it('rejects null-like input (null coerced)', () => {
    expect(validateLabel(null, null, tasks)).toEqual({ ok: false, error: 'empty' });
  });

  it('accepts a label with surrounding whitespace (trims to non-empty)', () => {
    // "  Walk dog  " trims to "Walk dog" — unique, so should pass
    expect(validateLabel('  Walk dog  ', null, tasks)).toEqual({ ok: true });
  });
});

describe('validateLabel — duplicate detection (case-insensitive)', () => {
  const tasks = [
    { id: '1', label: 'Buy milk', done: false, createdAt: '2026-10-15T00:00:00.000Z' },
    { id: '2', label: 'Walk the dog', done: false, createdAt: '2026-10-15T00:00:00.000Z' },
  ];

  it('rejects an exact duplicate', () => {
    expect(validateLabel('Buy milk', null, tasks)).toEqual({ ok: false, error: 'duplicate' });
  });

  it('rejects an uppercase variant of an existing label', () => {
    expect(validateLabel('BUY MILK', null, tasks)).toEqual({ ok: false, error: 'duplicate' });
  });

  it('rejects a lowercase variant of an existing label', () => {
    expect(validateLabel('buy milk', null, tasks)).toEqual({ ok: false, error: 'duplicate' });
  });

  it('rejects a mixed-case variant of an existing label', () => {
    expect(validateLabel('wAlK tHe DoG', null, tasks)).toEqual({ ok: false, error: 'duplicate' });
  });

  it('accepts a unique label when others exist', () => {
    expect(validateLabel('Read a book', null, tasks)).toEqual({ ok: true });
  });

  it('accepts any label when the task list is empty', () => {
    expect(validateLabel('Buy milk', null, [])).toEqual({ ok: true });
  });
});

describe('validateLabel — excludeId allows editing own label', () => {
  const tasks = [
    { id: '1', label: 'Buy milk', done: false, createdAt: '2026-10-15T00:00:00.000Z' },
    { id: '2', label: 'Walk the dog', done: false, createdAt: '2026-10-15T00:00:00.000Z' },
  ];

  it('allows saving the same label for the task being edited (excludeId matches)', () => {
    // Editing task id='1' and keeping the same label should be OK
    expect(validateLabel('Buy milk', '1', tasks)).toEqual({ ok: true });
  });

  it('allows saving a case-variant of own label (excludeId matches)', () => {
    expect(validateLabel('BUY MILK', '1', tasks)).toEqual({ ok: true });
  });

  it('still rejects a duplicate of a DIFFERENT task even when excludeId is set', () => {
    // Editing task id='1' but trying to use task '2'\'s label → duplicate
    expect(validateLabel('Walk the dog', '1', tasks)).toEqual({ ok: false, error: 'duplicate' });
  });

  it('excludeId=null does not skip any task', () => {
    expect(validateLabel('Buy milk', null, tasks)).toEqual({ ok: false, error: 'duplicate' });
  });
});
