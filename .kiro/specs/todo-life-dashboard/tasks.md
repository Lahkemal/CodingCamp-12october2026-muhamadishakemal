# Implementation Plan: To-Do Life Dashboard

## Overview

Implement a zero-dependency, client-side single-page web application using HTML, CSS, and Vanilla JavaScript. The app is organized as `index.html`, `css/style.css`, and `js/app.js`. All state persists in `localStorage`. Implementation follows the module-revealing pattern (IIFE with named internal modules): `StorageService`, `ThemeModule`, `GreetingModule`, `TimerModule`, `TodoModule`, and `QuickLinksModule`.

---

## Tasks

- [x] 1. Scaffold project structure and HTML skeleton
  - Create `index.html` at the workspace root with the full HTML skeleton: `<html>`, `<head>`, `<body>`, and one section per widget (Greeting, Timer, To-Do List, Quick Links, Theme Toggle)
  - Link `css/style.css` and `js/app.js` in `index.html`
  - Create `css/style.css` with an empty rule-set placeholder
  - Create `js/app.js` with an empty top-level IIFE `(function() { })();`
  - Verify the file opens without errors in a browser via `file://` protocol
  - _Requirements: 14.1, 14.2, 14.4, 14.5, 14.7_

- [x] 2. Implement StorageService and CSS theming foundation
  - [x] 2.1 Implement `StorageService` inside the IIFE
    - Write `get(key)` — `JSON.parse` wrapper returning `null` on any error
    - Write `set(key, value)` — `JSON.stringify` + write; catch `QuotaExceededError` and return `false`
    - Write `remove(key)`
    - Write `hydrate()` — reads `theme`, `userName`, `sessionDuration`, `tasks`, `quickLinks`; validates each; returns a typed `AppState` object with safe defaults
    - Validation in `hydrate()`: theme must be `"light"` or `"dark"` (else `"light"`); `sessionDuration` must be integer 1–90 (else 25); `tasks` / `quickLinks` must parse to an array (else `[]`); overwrite invalid keys
    - _Requirements: 10.3, 11.7, 13.5, 13.6, 13.7, 14.6_

  - [ ]* 2.2 Write property test for `StorageService.hydrate()` — malformed data
    - **Property 8: Malformed localStorage data yields an empty list**
    - Use `fc.anything().filter(x => !Array.isArray(x))` for `tasks` and `quickLinks`
    - **Validates: Requirements 10.3, 11.7**

  - [x] 2.3 Add CSS custom properties for light and dark themes in `css/style.css`
    - Define all `--color-*` variables on `:root` (light theme values)
    - Override variables on `html.theme-dark` (dark theme values)
    - Add base reset, body, and layout styles using only the custom properties
    - _Requirements: 13.3, 14.1_

- [x] 3. Implement ThemeModule
  - [x] 3.1 Implement `ThemeModule` inside the IIFE
    - Write `apply(theme)` — adds/removes `theme-dark` class on `document.documentElement`
    - Write `toggle()` — flips the active theme, calls `apply`, calls `StorageService.set('theme', …)`
    - Write `init(state)` — calls `apply(state.theme)`; attaches click listener to the Theme_Toggle button
    - Ensure the Theme_Toggle button is `position: fixed` in CSS so it is always visible regardless of scroll position
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

  - [ ]* 3.2 Write property test for `ThemeModule.toggle()` — involution
    - **Property 12: Theme toggle is an involution**
    - Use `fc.constantFrom('light', 'dark')` as starting theme; assert toggling twice restores original
    - **Validates: Requirements 13.2, 13.3**

  - [ ]* 3.3 Write property test for theme persistence round-trip
    - **Property 13: Theme persistence round-trip**
    - After `toggle()`, assert `localStorage.getItem('theme')` equals the new theme value
    - **Validates: Requirements 13.4**

- [ ] 4. Checkpoint — Ensure all tests pass
  - Run all tests written so far; confirm StorageService and ThemeModule behave correctly. Ask the user if questions arise.

- [x] 5. Implement GreetingModule
  - [x] 5.1 Implement pure helper functions `getGreeting(hour)`, `formatTime(date)`, `formatDate(date)`
    - `getGreeting`: returns `"Good Morning"` (05–11), `"Good Afternoon"` (12–17), `"Good Evening"` (18–20), `"Good Night"` (21–23, 00–04)
    - `formatTime`: returns HH:MM (24-hour, zero-padded)
    - `formatDate`: returns `"DayName, DD MonthName YYYY"` using the locale-independent day/month name arrays
    - _Requirements: 1.1, 1.3, 2.1, 2.2, 2.3, 2.4_

  - [ ]* 5.2 Write property test for `getGreeting` — full hour coverage
    - **Property 1: Greeting phrase covers all hours without gaps**
    - Use `fc.integer({ min: 0, max: 23 })` ; assert each result is one of the four valid phrases and matches boundary definitions
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

  - [x] 5.3 Implement `GreetingModule.render(now, name)` and `scheduleNextTick()`
    - `render`: composes greeting string (with or without name + `!`), updates time, date, and greeting DOM elements
    - `scheduleNextTick`: calculates `msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds()` then calls `setTimeout` to call `render` + `scheduleNextTick` again
    - _Requirements: 1.2, 3.3, 3.4_

  - [ ]* 5.4 Write property test for greeting string format
    - **Property 2: Greeting string format with and without a name**
    - Use `fc.string()` for phrase and `fc.option(fc.string())` for name; assert result ends with `"!"`, contains phrase, and if name is non-empty contains `", " + name`
    - **Validates: Requirements 3.3, 3.4**

  - [x] 5.5 Implement `GreetingModule.saveName(raw)` and `GreetingModule.init(state)`
    - `saveName`: trim input; if non-empty → persist to `localStorage` key `userName`, re-render; if empty → `StorageService.remove('userName')`, re-render; if whitespace-only with no prior name change intent → show inline validation message
    - `init`: renders once with `new Date()` and stored name; attaches save control listener; calls `scheduleNextTick()`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 6. Implement TimerModule
  - [x] 6.1 Implement internal timer state and `renderDisplay(seconds)`, `showAlert(msg)`, `dismissAlert()`
    - Declare closure variables: `timerState = 'idle'`, `remainingSeconds`, `intervalId`
    - `renderDisplay`: formats seconds to MM:SS and updates the timer DOM element
    - `showAlert` / `dismissAlert`: shows/hides the on-screen alert element
    - _Requirements: 4.5, 4.6_

  - [x] 6.2 Implement `start()`, `stop()`, `reset()`, `tick()`
    - `start`: only when `idle` or `paused`; set `timerState = 'running'`; start `setInterval` calling `tick` every 1000 ms
    - `stop`: only when `running`; clear interval; set `timerState = 'paused'`
    - `reset`: clear interval; set `timerState = 'idle'`; restore `remainingSeconds` to `currentDuration * 60`; call `renderDisplay`; call `dismissAlert`
    - `tick`: decrement `remainingSeconds`; call `renderDisplay`; if `remainingSeconds === 0`, clear interval, set `idle`, call `showAlert`
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [ ]* 6.3 Write property test for `reset()` — always restores Session_Duration
    - **Property 11: Timer reset always restores to current Session_Duration**
    - Use `fc.integer({ min: 1, max: 90 })` for duration and `fc.constantFrom('idle', 'running', 'paused')` for initial state; assert `remainingSeconds === d * 60` after reset
    - **Validates: Requirements 4.4**

  - [x] 6.4 Implement `applyNewDuration(mins)` and `TimerModule.init(state)`
    - `applyNewDuration`: validate integer 1–90; if valid → `StorageService.set('sessionDuration', …)`; call `reset()`; if invalid → show inline validation message; clear message when input is modified to valid
    - `init`: set `remainingSeconds` from state; call `renderDisplay`; wire Start, Stop, Reset button listeners; wire duration-save control listener
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 6.5 Write property test for `applyNewDuration` — full integer range validation
    - **Property 10: Session duration validation covers full integer range**
    - Use `fc.integer()`, `fc.float()`, `fc.string()` as inputs; assert accepted iff integer in [1, 90]; assert timer state and localStorage unchanged for rejected values
    - **Validates: Requirements 5.1, 5.5**

- [x] 7. Checkpoint — Ensure all tests pass
  - Run all tests; confirm GreetingModule and TimerModule behave correctly. Ask the user if questions arise.

- [x] 8. Implement TodoModule
  - [x] 8.1 Implement `validateLabel(raw, excludeId)` and `renderTask(task)` / `renderList(tasks)`
    - `validateLabel`: trim; reject if empty (return `{ ok: false, error: 'empty' }`); reject if duplicate case-insensitive match excluding `excludeId` (return `{ ok: false, error: 'duplicate' }`); else `{ ok: true }`
    - `renderTask`: create task DOM element with checkbox, label (strikethrough when `done`), edit button, delete button; wire per-task listeners
    - `renderList`: clear the list container; iterate tasks array and append `renderTask` results
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.2, 8.1, 8.2, 8.3, 9.1_

  - [ ]* 8.2 Write property test for whitespace-only label rejection
    - **Property 4: Whitespace-only and empty task labels are always rejected**
    - Use `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))` as input; assert task list unchanged and no localStorage write
    - **Validates: Requirements 6.4**

  - [ ]* 8.3 Write property test for case-insensitive duplicate detection
    - **Property 5: Duplicate task label detection is case-insensitive**
    - Use `fc.string()` for base label plus a case-variant; assert rejection and unchanged task list
    - **Validates: Requirements 6.3, 7.5**

  - [x] 8.4 Implement `addTask(rawLabel)`, `persistTasks()`, and `TodoModule.init(state)`
    - `addTask`: call `validateLabel`; on error show inline message and return; generate `id` (Date.now().toString()), `createdAt` (ISO 8601 UTC), `done: false`; push to in-memory array; call `persistTasks`; call `renderList`; clear input field; clear validation message
    - `persistTasks`: call `StorageService.set('tasks', tasks)`; if `false` returned, show inline storage-error message
    - `init`: set in-memory tasks array from `state.tasks`; call `renderList`; wire add-form submit listener
    - _Requirements: 6.1, 6.2, 6.5, 6.6, 10.1, 10.2_

  - [ ]* 8.5 Write property test for task add round-trip (localStorage persistence)
    - **Property 3: Task addition round-trip**
    - Use `fc.string({ minLength: 1 }).filter(s => s.trim().length > 0)` for valid labels; assert stored JSON contains a Task with the trimmed label
    - **Validates: Requirements 6.2, 6.5**

  - [x] 8.6 Implement `editTask(id, rawNewLabel)`, `toggleTask(id)`, `deleteTask(id)`
    - `editTask`: show edit input pre-filled with current label; on save validate via `validateLabel(raw, id)`; on success update label, persist, re-render; on empty/duplicate show inline message; on Escape/cancel restore original display without persisting
    - `toggleTask`: flip `done` boolean; call `persistTasks`; call `renderList`
    - `deleteTask`: splice task from array; call `persistTasks`; call `renderList`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.2, 8.3, 8.4, 9.2, 9.3_

  - [ ]* 8.7 Write property test for task toggle involution
    - **Property 6: Task toggle is an involution**
    - Use `fc.boolean()` as initial `done` value; assert toggling twice returns original value
    - **Validates: Requirements 8.2, 8.3**

  - [ ]* 8.8 Write property test for task serialization round-trip
    - **Property 7: Task list persistence round-trip**
    - Use `fc.record({ id: fc.string(), label: fc.string(), done: fc.boolean(), createdAt: fc.string() })` array; serialize then hydrate; assert deep equality
    - **Validates: Requirements 10.1, 10.3**

- [x] 9. Checkpoint — Ensure all tests pass
  - Run all tests; confirm TodoModule add, edit, toggle, delete, and persistence behave correctly. Ask the user if questions arise.

- [x] 10. Implement QuickLinksModule
  - [x] 10.1 Implement `validateUrl(raw)`, `renderLinks(links)`, and `persistLinks()`
    - `validateUrl`: return `true` iff string starts with `http://` or `https://` and `length <= 2048`
    - `renderLinks`: clear quick-links container; create one button per link with label text; attach click listener opening URL in new tab (`window.open(url, '_blank')`); add delete button per link
    - `persistLinks`: call `StorageService.set('quickLinks', links)`
    - _Requirements: 11.5, 11.6, 12.1_

  - [x] 10.2 Write property test for Quick Link URL validation
    - **Property 9: Quick Link URL validation**
    - Use `fc.string()` and valid URL arbitraries; assert `validateUrl` returns `true` iff starts with `http://` or `https://` and length ≤ 2048
    - **Validates: Requirements 11.4**

  - [x] 10.3 Implement `addLink(rawLabel, rawUrl)`, `deleteLink(id)`, and `QuickLinksModule.init(state)`
    - `addLink`: trim label and URL; validate label non-empty (else inline message on label input); validate URL via `validateUrl` (else inline message on URL input); generate `id`; push to array; call `persistLinks`; call `renderLinks`; clear form inputs
    - `deleteLink`: splice link from array; call `persistLinks`; call `renderLinks`
    - `init`: set in-memory links array from `state.quickLinks`; call `renderLinks`; wire add-form submit listener
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.6, 11.7, 12.2_

- [x] 11. Wire all modules in the initialization routine
  - [x] 11.1 Implement the top-level `init()` function inside the IIFE
    - Call `StorageService.hydrate()` to get `AppState`
    - Call `ThemeModule.init(state)` — must run first (before render) to avoid flash of wrong theme
    - Call `GreetingModule.init(state)`, `TimerModule.init(state)`, `TodoModule.init(state)`, `QuickLinksModule.init(state)` in sequence
    - Attach `DOMContentLoaded` event listener that calls `init()`
    - _Requirements: 1.1, 4.1, 10.1, 11.6, 13.5, 14.7_

  - [ ]* 11.2 Write integration smoke test — empty localStorage
    - Simulate a page load with empty localStorage; assert all five modules render with default values (light theme, 25-minute timer, empty task list, empty quick-links panel, greeting without name)
    - _Requirements: 1.1, 4.1, 10.2, 11.7, 13.6_

  - [ ]* 11.3 Write integration test — full localStorage hydration
    - Seed localStorage with valid `theme`, `userName`, `sessionDuration`, `tasks`, `quickLinks`; simulate `init()`; assert all widgets hydrate to the stored values
    - _Requirements: 10.1, 11.6, 13.5_

- [ ] 12. Final checkpoint — Ensure all tests pass
  - Run the full test suite; open `index.html` via `file://` and visually verify all widgets. Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP.
- Each task references specific requirements for traceability.
- Checkpoints (tasks 4, 7, 9, 12) ensure incremental validation across module boundaries.
- Property tests use the **fast-check** library and must run a minimum of 100 iterations each.
- Every property test file must include the comment tag `// Feature: todo-life-dashboard, Property N: <property_text>`.
- Unit tests and property tests are complementary — both are needed for full coverage.
- The IIFE module pattern ensures no global variable pollution (Requirement 14.1).
- `ThemeModule.init` must always be called before any other module renders to avoid a flash of unstyled/wrong-theme content.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.3"] },
    { "id": 2, "tasks": ["2.2", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "5.1"] },
    { "id": 4, "tasks": ["5.2", "5.3"] },
    { "id": 5, "tasks": ["5.4", "5.5", "6.1"] },
    { "id": 6, "tasks": ["6.2"] },
    { "id": 7, "tasks": ["6.3", "6.4"] },
    { "id": 8, "tasks": ["6.5", "8.1"] },
    { "id": 9, "tasks": ["8.2", "8.3", "8.4"] },
    { "id": 10, "tasks": ["8.5", "8.6"] },
    { "id": 11, "tasks": ["8.7", "8.8", "10.1"] },
    { "id": 12, "tasks": ["10.2", "10.3"] },
    { "id": 13, "tasks": ["11.1"] },
    { "id": 14, "tasks": ["11.2", "11.3"] }
  ]
}
```
