// To-Do Life Dashboard — Main Application Script
// Architecture: module-revealing pattern (IIFE) with named internal modules.
// Modules: StorageService, ThemeModule, GreetingModule, TimerModule,
//          TodoModule, QuickLinksModule

(function () {
  'use strict';

  // =========================================================================
  // StorageService — Task 2.1
  // Central gateway for all localStorage reads and writes.
  // No other module touches localStorage directly.
  // =========================================================================

  var StorageService = (function () {

    /**
     * get(key) — JSON.parse wrapper.
     * Returns the parsed value, or null on any error (missing key, parse error).
     */
    function get(key) {
      try {
        var raw = localStorage.getItem(key);
        if (raw === null) return null;
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    }

    /**
     * set(key, value) — JSON.stringify + localStorage.setItem.
     * Returns true on success, false if a QuotaExceededError (or any write error) occurs.
     */
    function set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        // Covers QuotaExceededError and any other storage error
        return false;
      }
    }

    /**
     * remove(key) — localStorage.removeItem wrapper.
     */
    function remove(key) {
      localStorage.removeItem(key);
    }

    /**
     * hydrate() — Reads all five app keys from localStorage, validates each,
     * and returns a fully-typed AppState object with safe defaults.
     *
     * Validation rules:
     *   theme          → must be exactly "light" or "dark"; else default "light" and overwrite
     *   userName       → string (trimmed, non-empty) or null
     *   sessionDuration→ integer 1–90; else default 25 and overwrite
     *   tasks          → must parse to an Array; else [] and overwrite
     *   quickLinks     → must parse to an Array; else [] and overwrite
     */
    function hydrate() {
      // --- theme ---
      var rawTheme = get('theme');
      var theme;
      if (rawTheme === 'light' || rawTheme === 'dark') {
        theme = rawTheme;
      } else {
        theme = 'light';
        // Overwrite invalid/missing value (Req 13.7)
        set('theme', theme);
      }

      // --- userName ---
      var rawName = get('userName');
      var userName;
      if (typeof rawName === 'string' && rawName.trim().length > 0) {
        userName = rawName.trim();
      } else {
        userName = null;
        // Do NOT overwrite — absence of userName key is the expected "no name" state
      }

      // --- sessionDuration ---
      var rawDuration = get('sessionDuration');
      var sessionDuration;
      if (
        typeof rawDuration === 'number' &&
        Number.isInteger(rawDuration) &&
        rawDuration >= 1 &&
        rawDuration <= 90
      ) {
        sessionDuration = rawDuration;
      } else {
        sessionDuration = 25;
        // Overwrite invalid value (Req 5.4 / 14.6)
        set('sessionDuration', sessionDuration);
      }

      // --- tasks ---
      var rawTasks = get('tasks');
      var tasks;
      if (Array.isArray(rawTasks)) {
        tasks = rawTasks;
      } else {
        tasks = [];
        // Overwrite malformed data (Req 10.3)
        if (localStorage.getItem('tasks') !== null) {
          set('tasks', tasks);
        }
      }

      // --- quickLinks ---
      var rawLinks = get('quickLinks');
      var quickLinks;
      if (Array.isArray(rawLinks)) {
        quickLinks = rawLinks;
      } else {
        quickLinks = [];
        // Overwrite malformed data (Req 11.7)
        if (localStorage.getItem('quickLinks') !== null) {
          set('quickLinks', quickLinks);
        }
      }

      return {
        theme: theme,
        userName: userName,
        sessionDuration: sessionDuration,
        tasks: tasks,
        quickLinks: quickLinks
      };
    }

    // Expose public API
    return {
      get: get,
      set: set,
      remove: remove,
      hydrate: hydrate
    };

  })();

  // =========================================================================
  // ThemeModule — Task 3.1
  // Manages light/dark theme via a class on <html> and persists the choice.
  // =========================================================================

  var ThemeModule = (function () {

    /**
     * apply(theme) — Adds or removes the `theme-dark` class on <html>.
     * @param {string} theme  'dark' → add class; anything else → remove class.
     */
    function apply(theme) {
      if (theme === 'dark') {
        document.documentElement.classList.add('theme-dark');
      } else {
        document.documentElement.classList.remove('theme-dark');
      }
    }

    /**
     * toggle() — Reads the current theme from the DOM, flips it,
     * applies the new class, and persists the new value via StorageService.
     */
    function toggle() {
      var currentTheme = document.documentElement.classList.contains('theme-dark')
        ? 'dark'
        : 'light';
      var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      apply(newTheme);
      StorageService.set('theme', newTheme);
    }

    /**
     * init(state) — Applies the stored theme immediately (before any render)
     * and wires the click listener on the theme-toggle button.
     * @param {{ theme: string }} state  Hydrated app state from StorageService.
     */
    function init(state) {
      // Apply theme before any render to avoid flash of wrong theme (Req 13.5)
      apply(state.theme);

      var btn = document.getElementById('theme-toggle');
      if (btn) {
        btn.addEventListener('click', toggle);
      }
    }

    return {
      apply: apply,
      toggle: toggle,
      init: init
    };

  })();

  // =========================================================================
  // GreetingModule — Tasks 5.1, 5.3, 5.5
  // Owns the Greeting Widget: time, date, greeting message, custom user name.
  // =========================================================================

  var GreetingModule = (function () {

    // Day and month name arrays — locale-independent (Req 1.3)
    var DAY_NAMES   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];

    // Cached DOM references (set during init)
    var elTime, elDate, elMessage, elNameInput, elNameError, elNameForm;

    // Tracks whether the user has ever interacted with the name field in this
    // session — used to distinguish "never typed" from "cleared deliberately"
    // (Req 3.6: whitespace-only with no prior intent → show validation message)
    var nameFieldTouched = false;

    // -----------------------------------------------------------------------
    // 5.1 — Pure helper functions
    // -----------------------------------------------------------------------

    /**
     * getGreeting(hour) — Returns time-of-day greeting phrase.
     * 05–11 → "Good Morning"
     * 12–17 → "Good Afternoon"
     * 18–20 → "Good Evening"
     * 21–23, 00–04 → "Good Night"
     * @param {number} hour  Integer 0–23 (local hour from Date.getHours())
     * @returns {string}
     */
    function getGreeting(hour) {
      if (hour >= 5 && hour <= 11) return 'Good Morning';
      if (hour >= 12 && hour <= 17) return 'Good Afternoon';
      if (hour >= 18 && hour <= 20) return 'Good Evening';
      return 'Good Night'; // 21–23 and 00–04
    }

    /**
     * formatTime(date) — Returns local time as "HH:MM" (24-hour, zero-padded).
     * @param {Date} date
     * @returns {string}
     */
    function formatTime(date) {
      var h = date.getHours();
      var m = date.getMinutes();
      return (h < 10 ? '0' + h : '' + h) + ':' + (m < 10 ? '0' + m : '' + m);
    }

    /**
     * formatDate(date) — Returns "DayName, DD MonthName YYYY".
     * e.g. "Thursday, 15 October 2026"
     * Uses locale-independent arrays — no Intl or toLocaleDateString (Req 1.3).
     * @param {Date} date
     * @returns {string}
     */
    function formatDate(date) {
      var dayName   = DAY_NAMES[date.getDay()];
      var dd        = date.getDate();
      var monthName = MONTH_NAMES[date.getMonth()];
      var yyyy      = date.getFullYear();
      return dayName + ', ' + (dd < 10 ? '0' + dd : '' + dd) + ' ' + monthName + ' ' + yyyy;
    }

    // -----------------------------------------------------------------------
    // 5.3 — render(now, name) and scheduleNextTick()
    // -----------------------------------------------------------------------

    /**
     * render(now, name) — Updates time, date, and greeting DOM elements.
     * Greeting string:
     *   With name    → "Good Morning, Alex!"
     *   Without name → "Good Morning!"
     * @param {Date}        now   Current date/time
     * @param {string|null} name  Trimmed user name or null
     */
    function render(now, name) {
      if (elTime)    elTime.textContent    = formatTime(now);
      if (elDate)    elDate.textContent    = formatDate(now);
      if (elMessage) {
        var phrase = getGreeting(now.getHours());
        var greeting = name
          ? phrase + ', ' + name + '!'
          : phrase + '!';
        elMessage.textContent = greeting;
      }
    }

    /**
     * scheduleNextTick() — Schedules the next render at the start of the
     * following wall-clock minute (Req 1.2: synchronise to system clock, not
     * a fixed 60-second interval).
     */
    function scheduleNextTick() {
      var now = new Date();
      var msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
      setTimeout(function () {
        var tickNow = new Date();
        render(tickNow, StorageService.get('userName'));
        scheduleNextTick();
      }, msUntilNextMinute);
    }

    // -----------------------------------------------------------------------
    // 5.5 — saveName(raw) and init(state)
    // -----------------------------------------------------------------------

    /**
     * clearNameError() — Removes any inline validation message.
     */
    function clearNameError() {
      if (elNameError) elNameError.textContent = '';
    }

    /**
     * showNameError(msg) — Displays an inline validation message (Req 3.6).
     */
    function showNameError(msg) {
      if (elNameError) elNameError.textContent = msg;
    }

    /**
     * saveName(raw) — Processes the raw name input:
     *   • Non-empty after trim → persist to localStorage, re-render (Req 3.2)
     *   • Empty string (user explicitly cleared) → remove from localStorage,
     *     re-render without name (Req 3.5)
     *   • Whitespace-only with no prior intent (nameFieldTouched = false) →
     *     show inline validation message, do NOT update localStorage (Req 3.6)
     * @param {string} raw  Value from the name input field
     */
    function saveName(raw) {
      var trimmed = raw.trim();

      if (trimmed.length > 0) {
        // Non-empty: persist and re-render with name
        StorageService.set('userName', trimmed);
        nameFieldTouched = true;
        clearNameError();
        render(new Date(), trimmed);
        // Reflect the persisted value back into the input
        if (elNameInput) elNameInput.value = trimmed;

      } else if (raw.length === 0) {
        // Explicitly empty (user cleared the field): remove name from storage
        StorageService.remove('userName');
        nameFieldTouched = true;
        clearNameError();
        render(new Date(), null);

      } else {
        // Whitespace-only (raw.length > 0 but trimmed.length === 0)
        if (!nameFieldTouched) {
          // No prior interaction → show validation message, do NOT change state
          showNameError('Please enter a valid name (non-whitespace characters).');
        } else {
          // User previously saved or cleared a name; treat whitespace-only as
          // a clear intent — remove name from storage (Req 3.5 / 3.6)
          StorageService.remove('userName');
          clearNameError();
          render(new Date(), null);
        }
      }
    }

    /**
     * init(state) — Entry point for GreetingModule.
     * Caches DOM references, renders once, wires event listener, and
     * schedules the next-minute tick.
     * @param {{ userName: string|null }} state  Hydrated app state
     */
    function init(state) {
      // Cache DOM elements
      elTime      = document.getElementById('greeting-time');
      elDate      = document.getElementById('greeting-date');
      elMessage   = document.getElementById('greeting-message');
      elNameInput = document.getElementById('greeting-name-input');
      elNameError = document.getElementById('greeting-name-error');
      elNameForm  = document.getElementById('greeting-name-form');

      // Pre-fill name input if a name is already stored
      if (elNameInput && state.userName) {
        elNameInput.value = state.userName;
      }

      // Initial render (Req 1.1)
      render(new Date(), state.userName);

      // Wire the save control: listen on form submit (covers Enter key + button click)
      if (elNameForm) {
        elNameForm.addEventListener('submit', function (e) {
          e.preventDefault();
          saveName(elNameInput ? elNameInput.value : '');
        });
      }

      // Clear validation error as soon as the user starts typing (Req 3.6)
      if (elNameInput) {
        elNameInput.addEventListener('input', function () {
          clearNameError();
          nameFieldTouched = true;
        });
      }

      // Schedule next-minute tick (Req 1.2)
      scheduleNextTick();
    }

    // Expose public API (module-revealing pattern)
    return {
      init:              init,
      render:            render,
      getGreeting:       getGreeting,
      formatTime:        formatTime,
      formatDate:        formatDate,
      scheduleNextTick:  scheduleNextTick,
      saveName:          saveName
    };

  })();

  // =========================================================================
  // TimerModule — Task 6.1 (state + display/alert helpers)
  //               Tasks 6.2 / 6.4 will add start/stop/reset/tick/applyNewDuration/init
  // =========================================================================

  var TimerModule = (function () {

    // -----------------------------------------------------------------------
    // Closure-level state
    // -----------------------------------------------------------------------
    var timerState      = 'idle';   // 'idle' | 'running' | 'paused'
    var remainingSeconds = 0;
    var intervalId      = null;
    var currentDuration = 25;       // session duration in minutes

    // Cached DOM references (populated in init)
    var elDisplay, elAlert, elAlertMessage, elDurationError;

    // -----------------------------------------------------------------------
    // renderDisplay(seconds) — Task 6.1
    // Formats an integer number of seconds as MM:SS (zero-padded) and writes
    // it to the timer display element.
    // e.g. 1500 → "25:00",  65 → "01:05",  0 → "00:00"
    // Satisfies Req 4.6 (MM:SS display at all times).
    // -----------------------------------------------------------------------
    function renderDisplay(seconds) {
      var m = Math.floor(seconds / 60);
      var s = seconds % 60;
      var mmss = (m < 10 ? '0' + m : '' + m) + ':' + (s < 10 ? '0' + s : '' + s);
      if (elDisplay) {
        elDisplay.textContent = mmss;
      }
    }

    // -----------------------------------------------------------------------
    // showAlert(msg) — Task 6.1
    // Makes the timer alert element visible and sets its message text.
    // Satisfies Req 4.5 (visible on-screen alert on session completion).
    // -----------------------------------------------------------------------
    function showAlert(msg) {
      if (elAlertMessage) {
        elAlertMessage.textContent = msg;
      }
      if (elAlert) {
        elAlert.hidden = false;
      }
    }

    // -----------------------------------------------------------------------
    // dismissAlert() — Task 6.1
    // Hides the timer alert element.
    // Satisfies Req 4.5 (alert dismissible by the user).
    // -----------------------------------------------------------------------
    function dismissAlert() {
      if (elAlert) {
        elAlert.hidden = true;
      }
    }

    // -----------------------------------------------------------------------
    // start() — Task 6.2
    // Transitions idle/paused → running and begins the 1-second countdown.
    // Satisfies Req 4.2.
    // -----------------------------------------------------------------------
    function start() {
      // Ignore if already running
      if (timerState === 'running') return;

      timerState = 'running';
      intervalId = setInterval(tick, 1000);
    }

    // -----------------------------------------------------------------------
    // stop() — Task 6.2
    // Transitions running → paused; preserves remaining time.
    // Satisfies Req 4.3.
    // -----------------------------------------------------------------------
    function stop() {
      // Ignore if not running
      if (timerState !== 'running') return;

      clearInterval(intervalId);
      intervalId = null;
      timerState = 'paused';
    }

    // -----------------------------------------------------------------------
    // reset() — Task 6.2
    // Works from any state; restores full session duration and goes idle.
    // Satisfies Req 4.4.
    // -----------------------------------------------------------------------
    function reset() {
      clearInterval(intervalId);
      intervalId = null;
      timerState = 'idle';
      remainingSeconds = currentDuration * 60;
      renderDisplay(remainingSeconds);
      dismissAlert();
    }

    // -----------------------------------------------------------------------
    // tick() — Task 6.2
    // Called by setInterval every 1000 ms while running.
    // Decrements the counter; fires the completion alert when it reaches 0.
    // Satisfies Req 4.2, 4.5.
    // -----------------------------------------------------------------------
    function tick() {
      remainingSeconds -= 1;
      renderDisplay(remainingSeconds);

      if (remainingSeconds === 0) {
        clearInterval(intervalId);
        intervalId = null;
        timerState = 'idle';
        showAlert('Session complete!');
      }
    }

    // -----------------------------------------------------------------------
    // applyNewDuration(mins) — Task 6.4
    // Validates the supplied duration and, when valid, updates currentDuration,
    // persists to localStorage, and resets the timer.
    // Satisfies Req 4.1, 5.1, 5.2, 5.3, 5.5.
    // -----------------------------------------------------------------------
    function applyNewDuration(mins) {
      var isValid = (
        typeof mins === 'number' &&
        Number.isInteger(mins) &&
        mins >= 1 &&
        mins <= 90
      );

      if (isValid) {
        currentDuration = mins;
        StorageService.set('sessionDuration', mins);
        reset(); // transitions to idle and renders new MM:00
        if (elDurationError) {
          elDurationError.textContent = '';
        }
      } else {
        if (elDurationError) {
          elDurationError.textContent = 'Please enter a whole number between 1 and 90.';
        }
      }
    }

    // -----------------------------------------------------------------------
    // init(state) — Task 6.4
    // Caches DOM references, seeds state from the hydrated AppState, wires
    // all button and form listeners.
    // Satisfies Req 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5.
    // -----------------------------------------------------------------------
    function init(state) {
      // Cache closure-level DOM references
      elDisplay      = document.getElementById('timer-display');
      elAlert        = document.getElementById('timer-alert');
      elAlertMessage = document.getElementById('timer-alert-message');
      elDurationError = document.getElementById('timer-duration-error');

      // Local DOM references used only inside init
      var elDurationInput = document.getElementById('timer-duration-input');
      var elDurationForm  = document.getElementById('timer-duration-form');

      // Seed state from hydrated AppState (Req 5.4)
      currentDuration  = state.sessionDuration;
      remainingSeconds = state.sessionDuration * 60;

      // Initial display render (Req 4.1)
      renderDisplay(remainingSeconds);

      // Pre-fill duration input with stored value
      if (elDurationInput) {
        elDurationInput.value = state.sessionDuration;
      }

      // Wire timer control buttons
      var elStart  = document.getElementById('timer-start');
      var elStop   = document.getElementById('timer-stop');
      var elReset  = document.getElementById('timer-reset');
      var elDismiss = document.getElementById('timer-alert-dismiss');

      if (elStart)   elStart.addEventListener('click', start);
      if (elStop)    elStop.addEventListener('click', stop);
      if (elReset)   elReset.addEventListener('click', reset);
      if (elDismiss) elDismiss.addEventListener('click', dismissAlert);

      // Wire duration form submit (Req 5.2, 5.3, 5.5)
      if (elDurationForm) {
        elDurationForm.addEventListener('submit', function (e) {
          e.preventDefault();
          applyNewDuration(parseInt(elDurationInput ? elDurationInput.value : '', 10));
        });
      }

      // Clear duration error as soon as the user modifies the input (Req 5.5)
      if (elDurationInput) {
        elDurationInput.addEventListener('input', function () {
          if (elDurationError) {
            elDurationError.textContent = '';
          }
        });
      }
    }

    // -----------------------------------------------------------------------
    // Expose public API
    // -----------------------------------------------------------------------
    return {
      renderDisplay:    renderDisplay,
      showAlert:        showAlert,
      dismissAlert:     dismissAlert,
      start:            start,
      stop:             stop,
      reset:            reset,
      tick:             tick,
      applyNewDuration: applyNewDuration,
      init:             init
    };

  })();

  // =========================================================================
  // TodoModule — Tasks 8.1, 8.4, 8.6
  // Owns the To-Do List widget.
  // =========================================================================

  var TodoModule = (function () {

    // -----------------------------------------------------------------------
    // Closure-level state
    // -----------------------------------------------------------------------

    // In-memory task array — single source of truth; DOM is a projection of this.
    var tasks = [];

    // Cached DOM references (populated in init)
    var elList, elInput, elAddError;

    // -----------------------------------------------------------------------
    // validateLabel(raw, excludeId) — Task 8.1
    // Validates a raw label string against the current tasks array.
    //
    // Returns:
    //   { ok: false, error: 'empty' }      — trimmed label is empty
    //   { ok: false, error: 'duplicate' }  — trimmed label matches an existing
    //                                        task label (case-insensitive),
    //                                        ignoring the task with excludeId
    //   { ok: true }                       — label is valid
    //
    // Satisfies Req 6.3, 6.4, 7.4, 7.5.
    // -----------------------------------------------------------------------
    function validateLabel(raw, excludeId) {
      var trimmed = (raw || '').trim();

      // Reject empty / whitespace-only (Req 6.4, 7.4)
      if (trimmed.length === 0) {
        return { ok: false, error: 'empty' };
      }

      // Reject case-insensitive duplicate, excluding the task being edited (Req 6.3, 7.5)
      var lowerTrimmed = trimmed.toLowerCase();
      for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].id === excludeId) continue; // skip the task being edited
        if (tasks[i].label.toLowerCase() === lowerTrimmed) {
          return { ok: false, error: 'duplicate' };
        }
      }

      return { ok: true };
    }

    // -----------------------------------------------------------------------
    // renderTask(task) — Task 8.1
    // Builds and returns an <li> element representing a single task:
    //   • checkbox (checked when done)
    //   • <label> with text (strikethrough style when done)
    //   • Edit button
    //   • Delete button
    // Wires per-task event listeners.
    // Satisfies Req 8.1, 8.2, 8.3, 9.1.
    // -----------------------------------------------------------------------
    function renderTask(task) {
      var li = document.createElement('li');
      li.className = 'todo__item';
      li.dataset.id = task.id;

      // --- Checkbox (Req 8.1) ---
      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'todo__checkbox';
      checkbox.checked = task.done === true;
      checkbox.id = 'todo-check-' + task.id;
      checkbox.setAttribute('aria-label', 'Mark task done: ' + task.label);

      // --- Label text (Req 8.2, 8.3 — strikethrough when done) ---
      var labelEl = document.createElement('label');
      labelEl.htmlFor = 'todo-check-' + task.id;
      labelEl.className = 'todo__label' + (task.done ? ' todo__label--done' : '');
      labelEl.textContent = task.label;

      // --- Edit button (Req 7.1) ---
      var editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn btn--small todo__edit-btn';
      editBtn.textContent = 'Edit';
      editBtn.setAttribute('aria-label', 'Edit task: ' + task.label);

      // --- Delete button (Req 9.1) ---
      var deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'btn btn--small btn--danger todo__delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', 'Delete task: ' + task.label);

      // --- Wire per-task event listeners ---
      // Checkbox: toggle done status (Req 8.2, 8.3)
      checkbox.addEventListener('change', function () {
        TodoModule.toggleTask(task.id);
      });

      // Edit button: open edit UI (Req 7.1, 7.2)
      editBtn.addEventListener('click', function () {
        TodoModule.editTask(task.id, task.label);
      });

      // Delete button: remove task (Req 9.2)
      deleteBtn.addEventListener('click', function () {
        TodoModule.deleteTask(task.id);
      });

      // Assemble the list item
      li.appendChild(checkbox);
      li.appendChild(labelEl);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);

      return li;
    }

    // -----------------------------------------------------------------------
    // renderList(tasks) — Task 8.1
    // Clears the <ul id="todo-list"> container and re-renders every task.
    // Satisfies Req 8.1–8.3, 9.1 (DOM reflects in-memory array).
    // -----------------------------------------------------------------------
    function renderList(taskArray) {
      if (!elList) return;

      // Clear existing children
      elList.innerHTML = '';

      // Append a rendered <li> for each task
      for (var i = 0; i < taskArray.length; i++) {
        elList.appendChild(renderTask(taskArray[i]));
      }
    }

    // -----------------------------------------------------------------------
    // persistTasks() — Task 8.4 (stub, completed in 8.4)
    // Writes the in-memory tasks array to localStorage.
    // Satisfies Req 6.5, 6.6.
    // -----------------------------------------------------------------------
    function persistTasks() {
      var ok = StorageService.set('tasks', tasks);
      if (!ok && elAddError) {
        elAddError.textContent = 'Save failed — changes are kept for this session only.';
      }
    }

    // -----------------------------------------------------------------------
    // addTask(rawLabel) — Task 8.4
    // Validates the label, creates a new task object, appends it to the
    // in-memory array, persists, and re-renders the list.
    // Satisfies Req 6.1, 6.2, 6.3, 6.4, 6.5, 6.6.
    // -----------------------------------------------------------------------
    function addTask(rawLabel) {
      var result = validateLabel(rawLabel, null);

      if (!result.ok) {
        if (elAddError) {
          if (result.error === 'empty') {
            elAddError.textContent = 'Please enter a task.';
          } else if (result.error === 'duplicate') {
            elAddError.textContent = 'A task with this name already exists.';
          }
        }
        return;
      }

      // Build new task object (Req 6.2)
      var id        = Date.now().toString();
      var createdAt = new Date().toISOString();
      var task      = { id: id, label: rawLabel.trim(), done: false, createdAt: createdAt };

      // Update in-memory array and persist
      tasks.push(task);
      persistTasks();

      // Re-render and reset UI
      renderList(tasks);
      if (elInput)    elInput.value = '';
      if (elAddError) elAddError.textContent = '';
    }

    // -----------------------------------------------------------------------
    // editTask(id, currentLabel) — Task 8.6
    // Replaces the task label display with an inline edit UI.
    // Satisfies Req 7.1–7.6.
    // -----------------------------------------------------------------------
    function editTask(id, currentLabel) {
      // Find the <li> for this task
      var li = document.querySelector('[data-id="' + id + '"]');
      if (!li) return;

      // Clear the existing contents
      li.innerHTML = '';

      // --- Edit input ---
      var editInput = document.createElement('input');
      editInput.type = 'text';
      editInput.className = 'todo__edit-input';
      editInput.value = currentLabel;
      editInput.maxLength = 255;
      editInput.setAttribute('aria-label', 'Edit task label');

      // --- Inline error message ---
      var editError = document.createElement('span');
      editError.className = 'todo__edit-error';
      editError.setAttribute('aria-live', 'polite');

      // --- Save button ---
      var saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'btn btn--small todo__save-btn';
      saveBtn.textContent = 'Save';
      saveBtn.setAttribute('aria-label', 'Save task edit');

      // --- Cancel button ---
      var cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn btn--small todo__cancel-btn';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.setAttribute('aria-label', 'Cancel task edit');

      // Assemble the edit UI inside the <li>
      li.appendChild(editInput);
      li.appendChild(editError);
      li.appendChild(saveBtn);
      li.appendChild(cancelBtn);

      // Focus the input for immediate editing
      editInput.focus();

      // --- Save handler ---
      function doSave() {
        var result = validateLabel(editInput.value, id);
        if (!result.ok) {
          if (result.error === 'empty') {
            editError.textContent = 'Please enter a task.';
          } else if (result.error === 'duplicate') {
            editError.textContent = 'A task with this name already exists.';
          }
          return;
        }

        // Update in-memory array
        for (var i = 0; i < tasks.length; i++) {
          if (tasks[i].id === id) {
            tasks[i].label = editInput.value.trim();
            break;
          }
        }

        persistTasks();
        renderList(tasks);
      }

      // --- Cancel handler ---
      function doCancel() {
        renderList(tasks);
      }

      // Wire Save button click
      saveBtn.addEventListener('click', doSave);

      // Wire Cancel button click
      cancelBtn.addEventListener('click', doCancel);

      // Wire keyboard shortcuts on the input
      editInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          doSave();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          doCancel();
        }
      });
    }

    // -----------------------------------------------------------------------
    // toggleTask(id) — Task 8.6
    // Flips the done state of a task and persists + re-renders.
    // Satisfies Req 8.2, 8.3, 8.4.
    // -----------------------------------------------------------------------
    function toggleTask(id) {
      for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].id === id) {
          tasks[i].done = !tasks[i].done;
          break;
        }
      }
      persistTasks();
      renderList(tasks);
    }

    // -----------------------------------------------------------------------
    // deleteTask(id) — Task 8.6
    // Removes a task from the in-memory array, persists, and re-renders.
    // Satisfies Req 9.2, 9.3.
    // -----------------------------------------------------------------------
    function deleteTask(id) {
      var index = -1;
      for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].id === id) {
          index = i;
          break;
        }
      }
      if (index !== -1) {
        tasks.splice(index, 1);
        persistTasks();
        renderList(tasks);
      }
    }

    // -----------------------------------------------------------------------
    // init(state) — Task 8.4
    // Caches DOM references, seeds in-memory tasks, renders the list, and
    // wires the add-form submit and input listeners.
    // Satisfies Req 10.1, 10.2, 6.1.
    // -----------------------------------------------------------------------
    function init(state) {
      // Cache DOM references
      elList     = document.getElementById('todo-list');
      elInput    = document.getElementById('todo-input');
      elAddError = document.getElementById('todo-add-error');

      // Seed in-memory array from hydrated state (Req 10.1)
      tasks = Array.isArray(state.tasks) ? state.tasks : [];

      // Initial render (Req 10.1)
      renderList(tasks);

      // Wire add-form submit listener (Req 6.1, 6.2)
      var elAddForm = document.getElementById('todo-add-form');
      if (elAddForm) {
        elAddForm.addEventListener('submit', function (e) {
          e.preventDefault();
          addTask(elInput ? elInput.value : '');
        });
      }

      // Clear add-error as soon as user modifies the input (Req 6.3, 6.4)
      if (elInput) {
        elInput.addEventListener('input', function () {
          if (elAddError) elAddError.textContent = '';
        });
      }
    }

    // -----------------------------------------------------------------------
    // Expose public API
    // -----------------------------------------------------------------------
    return {
      validateLabel: validateLabel,
      renderTask:    renderTask,
      renderList:    renderList,
      persistTasks:  persistTasks,
      addTask:       addTask,
      editTask:      editTask,
      toggleTask:    toggleTask,
      deleteTask:    deleteTask,
      init:          init
    };

  })();

  // =========================================================================
  // QuickLinksModule — Tasks 10.1, 10.3
  // Owns the Quick Links widget.
  // =========================================================================

  var QuickLinksModule = (function () {

    // -----------------------------------------------------------------------
    // Closure-level state
    // -----------------------------------------------------------------------

    // In-memory links array — single source of truth; DOM is a projection of this.
    var links = [];

    // Cached DOM references (populated in init)
    var elList, elLabelInput, elUrlInput, elLabelError, elUrlError;

    // -----------------------------------------------------------------------
    // validateUrl(raw) — Task 10.1
    // Returns true iff raw is a string starting with "http://" or "https://"
    // and has length ≤ 2048.
    // Satisfies Req 11.4.
    // -----------------------------------------------------------------------
    function validateUrl(raw) {
      if (typeof raw !== 'string') return false;
      return (raw.startsWith('http://') || raw.startsWith('https://')) && raw.length <= 2048;
    }

    // -----------------------------------------------------------------------
    // renderLinks(linksArray) — Task 10.1
    // Clears the quick-links container and rebuilds it from the provided array.
    // Each link gets:
    //   • A button that opens the URL in a new tab (window.open)
    //   • A delete button that calls deleteLink(id)
    // Satisfies Req 11.5, 11.6, 12.1.
    // -----------------------------------------------------------------------
    function renderLinks(linksArray) {
      if (!elList) return;

      // Clear existing children
      elList.innerHTML = '';

      for (var i = 0; i < linksArray.length; i++) {
        var link = linksArray[i];

        // Wrapper element for one link entry
        var item = document.createElement('div');
        item.className = 'quicklinks__item';
        item.dataset.id = link.id;

        // --- Link button (Req 11.5) ---
        var linkBtn = document.createElement('button');
        linkBtn.type = 'button';
        linkBtn.className = 'btn btn--link quicklinks__link-btn';
        linkBtn.textContent = link.label;
        linkBtn.setAttribute('aria-label', 'Open ' + link.label + ' in new tab');

        // Capture link.url in a closure-safe way
        (function (url) {
          linkBtn.addEventListener('click', function () {
            window.open(url, '_blank');
          });
        }(link.url));

        // --- Delete button (Req 12.1) ---
        var deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn btn--small btn--danger quicklinks__delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.setAttribute('aria-label', 'Delete link: ' + link.label);

        // Capture link.id in a closure-safe way
        (function (id) {
          deleteBtn.addEventListener('click', function () {
            QuickLinksModule.deleteLink(id);
          });
        }(link.id));

        item.appendChild(linkBtn);
        item.appendChild(deleteBtn);
        elList.appendChild(item);
      }
    }

    // -----------------------------------------------------------------------
    // persistLinks() — Task 10.1
    // Writes the in-memory links array to localStorage via StorageService.
    // Satisfies Req 11.2, 12.2.
    // -----------------------------------------------------------------------
    function persistLinks() {
      var ok = StorageService.set('quickLinks', links);
      if (!ok && elLabelError) {
        elLabelError.textContent = 'Save failed — changes are kept for this session only.';
      }
    }

    // -----------------------------------------------------------------------
    // addLink(rawLabel, rawUrl) — Task 10.3
    // Validates label and URL; on success pushes to the array, persists, and
    // re-renders. On failure shows the appropriate inline validation message.
    // Satisfies Req 11.1, 11.2, 11.3, 11.4, 11.6.
    // -----------------------------------------------------------------------
    function addLink(rawLabel, rawUrl) {
      var trimmedLabel = (rawLabel || '').trim();
      var trimmedUrl   = (rawUrl   || '').trim();

      var labelOk = trimmedLabel.length > 0;
      var urlOk   = validateUrl(trimmedUrl);

      if (!labelOk) {
        if (elLabelError) {
          elLabelError.textContent = 'Please enter a label for the link.';
        }
      }
      if (!urlOk) {
        if (elUrlError) {
          elUrlError.textContent = 'Please enter a valid URL starting with http:// or https://.';
        }
      }
      if (!labelOk || !urlOk) return;

      // Build new link object
      var id   = Date.now().toString();
      var link = { id: id, label: trimmedLabel, url: trimmedUrl };

      links.push(link);
      persistLinks();
      renderLinks(links);

      // Clear form inputs and error messages
      if (elLabelInput) elLabelInput.value = '';
      if (elUrlInput)   elUrlInput.value   = '';
      if (elLabelError) elLabelError.textContent = '';
      if (elUrlError)   elUrlError.textContent   = '';
    }

    // -----------------------------------------------------------------------
    // deleteLink(id) — Task 10.3
    // Removes the link with the given id from the array, persists, re-renders.
    // Satisfies Req 12.1, 12.2.
    // -----------------------------------------------------------------------
    function deleteLink(id) {
      var index = -1;
      for (var i = 0; i < links.length; i++) {
        if (links[i].id === id) {
          index = i;
          break;
        }
      }
      if (index !== -1) {
        links.splice(index, 1);
        persistLinks();
        renderLinks(links);
      }
    }

    // -----------------------------------------------------------------------
    // init(state) — Task 10.3
    // Caches DOM references, seeds in-memory links from hydrated state,
    // renders the list, and wires the add-form submit listener.
    // Satisfies Req 11.6, 11.7.
    // -----------------------------------------------------------------------
    function init(state) {
      // Cache DOM references
      elList        = document.getElementById('quicklinks-list');
      elLabelInput  = document.getElementById('quicklinks-label-input');
      elUrlInput    = document.getElementById('quicklinks-url-input');
      elLabelError  = document.getElementById('quicklinks-label-error');
      elUrlError    = document.getElementById('quicklinks-url-error');

      // Seed in-memory array from hydrated state (Req 11.6)
      links = Array.isArray(state.quickLinks) ? state.quickLinks : [];

      // Initial render
      renderLinks(links);

      // Wire add-form submit listener (Req 11.1, 11.2)
      var elAddForm = document.getElementById('quicklinks-add-form');
      if (elAddForm) {
        elAddForm.addEventListener('submit', function (e) {
          e.preventDefault();
          addLink(
            elLabelInput ? elLabelInput.value : '',
            elUrlInput   ? elUrlInput.value   : ''
          );
        });
      }

      // Clear label error as soon as the user modifies the label input
      if (elLabelInput) {
        elLabelInput.addEventListener('input', function () {
          if (elLabelError) elLabelError.textContent = '';
        });
      }

      // Clear URL error as soon as the user modifies the URL input
      if (elUrlInput) {
        elUrlInput.addEventListener('input', function () {
          if (elUrlError) elUrlError.textContent = '';
        });
      }
    }

    // -----------------------------------------------------------------------
    // Expose public API
    // -----------------------------------------------------------------------
    return {
      validateUrl:  validateUrl,
      renderLinks:  renderLinks,
      persistLinks: persistLinks,
      addLink:      addLink,
      deleteLink:   deleteLink,
      init:         init
    };

  })();

  // =========================================================================
  // Initialization — Task 11.1
  // Called once the DOM is ready via the DOMContentLoaded listener below.
  // Sequence matters: ThemeModule.init() MUST run first (before any render)
  // to avoid a flash of the wrong theme (Req 13.5).
  // =========================================================================

  function init() {
    // 1. Read all localStorage keys and produce a validated AppState object.
    var state = StorageService.hydrate();

    // 2. Apply the stored theme to <html> before anything else renders (Req 13.5).
    ThemeModule.init(state);

    // 3. Initialise each widget module in sequence.
    GreetingModule.init(state);   // Req 1.1 — renders time/date/greeting immediately
    TimerModule.init(state);      // Req 4.1 — renders timer at stored/default duration
    TodoModule.init(state);       // Req 10.1 — renders task list from stored tasks
    QuickLinksModule.init(state); // Req 11.6 — renders quick links from stored links
  }

  // Attach the DOMContentLoaded listener so init() runs as soon as the HTML
  // document has been fully parsed (Req 14.7 — works with file:// too).
  document.addEventListener('DOMContentLoaded', init);

})();
