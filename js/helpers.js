/**
 * helpers.js — Pure functions extracted from app.js for unit testing.
 *
 * These are the same implementations used inside the IIFE in app.js.
 * Exporting them here allows Vitest (Node.js) to import and test them
 * without needing a DOM or localStorage.
 *
 * ⚠  This file is a TEST HELPER only. The production app still runs
 *    entirely from js/app.js. Do NOT import this file from app.js.
 */

// -------------------------------------------------------------------------
// GreetingModule helpers — Tasks 5.1
// -------------------------------------------------------------------------

const DAY_NAMES   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * getGreeting(hour) — Returns time-of-day greeting phrase.
 * 05–11 → "Good Morning"
 * 12–17 → "Good Afternoon"
 * 18–20 → "Good Evening"
 * 21–23, 00–04 → "Good Night"
 */
export function getGreeting(hour) {
  if (hour >= 5 && hour <= 11) return 'Good Morning';
  if (hour >= 12 && hour <= 17) return 'Good Afternoon';
  if (hour >= 18 && hour <= 20) return 'Good Evening';
  return 'Good Night'; // 21–23 and 00–04
}

/**
 * formatTime(date) — Returns local time as "HH:MM" (24-hour, zero-padded).
 */
export function formatTime(date) {
  var h = date.getHours();
  var m = date.getMinutes();
  return (h < 10 ? '0' + h : '' + h) + ':' + (m < 10 ? '0' + m : '' + m);
}

/**
 * formatDate(date) — Returns "DayName, DD MonthName YYYY".
 * e.g. "Thursday, 15 October 2026"
 */
export function formatDate(date) {
  var dayName   = DAY_NAMES[date.getDay()];
  var dd        = date.getDate();
  var monthName = MONTH_NAMES[date.getMonth()];
  var yyyy      = date.getFullYear();
  return dayName + ', ' + (dd < 10 ? '0' + dd : '' + dd) + ' ' + monthName + ' ' + yyyy;
}

/**
 * composeGreeting(phrase, name) — Builds the full greeting string.
 * With name    → "Good Morning, Alex!"
 * Without name → "Good Morning!"
 */
export function composeGreeting(phrase, name) {
  return name ? phrase + ', ' + name + '!' : phrase + '!';
}

// -------------------------------------------------------------------------
// TimerModule helpers — Tasks 6.1, 6.2, 6.4
// -------------------------------------------------------------------------

/**
 * renderDisplayText(seconds) — Formats seconds to "MM:SS" string.
 * Pure function — no DOM side-effects.
 * e.g. 1500 → "25:00", 65 → "01:05", 0 → "00:00"
 */
export function renderDisplayText(seconds) {
  var m = Math.floor(seconds / 60);
  var s = seconds % 60;
  return (m < 10 ? '0' + m : '' + m) + ':' + (s < 10 ? '0' + s : '' + s);
}

/**
 * isValidDuration(value) — Returns true iff value is an integer in [1, 90].
 * Mirrors the validation logic inside TimerModule.applyNewDuration.
 */
export function isValidDuration(value) {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 90
  );
}

// -------------------------------------------------------------------------
// StorageService helpers — Task 2.1
// -------------------------------------------------------------------------

/**
 * isValidTheme(value) — Returns true iff value is exactly "light" or "dark".
 */
export function isValidTheme(value) {
  return value === 'light' || value === 'dark';
}

/**
 * hydrateTheme(raw) — Returns validated theme with fallback to "light".
 */
export function hydrateTheme(raw) {
  return isValidTheme(raw) ? raw : 'light';
}

/**
 * hydrateSessionDuration(raw) — Returns validated integer 1–90 or default 25.
 */
export function hydrateSessionDuration(raw) {
  if (
    typeof raw === 'number' &&
    Number.isInteger(raw) &&
    raw >= 1 &&
    raw <= 90
  ) {
    return raw;
  }
  return 25;
}

/**
 * hydrateTasks(raw) — Returns the array if valid, else [].
 */
export function hydrateTasks(raw) {
  return Array.isArray(raw) ? raw : [];
}

/**
 * hydrateQuickLinks(raw) — Returns the array if valid, else [].
 */
export function hydrateQuickLinks(raw) {
  return Array.isArray(raw) ? raw : [];
}

// -------------------------------------------------------------------------
// QuickLinksModule helpers — Task 10.1
// -------------------------------------------------------------------------

/**
 * validateUrl(raw) — Returns true iff raw starts with http:// or https://
 * and has length ≤ 2048.
 */
export function validateUrl(raw) {
  if (typeof raw !== 'string') return false;
  return (raw.startsWith('http://') || raw.startsWith('https://')) && raw.length <= 2048;
}

// -------------------------------------------------------------------------
// TodoModule helpers — Task 8.1
// -------------------------------------------------------------------------

/**
 * validateLabel(raw, excludeId, tasks) — Pure function version of the
 * TodoModule.validateLabel closure method, accepting the tasks array
 * explicitly so it can be tested without DOM or module state.
 *
 * Returns:
 *   { ok: false, error: 'empty' }      — trimmed input is empty
 *   { ok: false, error: 'duplicate' }  — case-insensitive match in tasks
 *                                        (excluding the task with excludeId)
 *   { ok: true }                       — label is valid
 *
 * Satisfies Req 6.3, 6.4, 7.4, 7.5.
 */
export function validateLabel(raw, excludeId, tasks) {
  var trimmed = (raw || '').trim();

  if (trimmed.length === 0) {
    return { ok: false, error: 'empty' };
  }

  var lowerTrimmed = trimmed.toLowerCase();
  var taskList = Array.isArray(tasks) ? tasks : [];
  for (var i = 0; i < taskList.length; i++) {
    if (taskList[i].id === excludeId) continue;
    if (taskList[i].label.toLowerCase() === lowerTrimmed) {
      return { ok: false, error: 'duplicate' };
    }
  }

  return { ok: true };
}
