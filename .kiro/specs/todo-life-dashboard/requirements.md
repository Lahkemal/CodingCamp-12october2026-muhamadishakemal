# Requirements Document

## Introduction

The **To-Do Life Dashboard** is a client-side web application built with HTML, CSS, and Vanilla JavaScript.
It provides a personal productivity hub in a single browser tab — combining a time-aware greeting, a Pomodoro focus timer, a to-do list with Local Storage persistence, and a quick-links launcher. Three challenge features are included: Light/Dark mode, a custom user name in the greeting, and a configurable Pomodoro duration.

The application requires no backend server. All state is persisted in the browser's Local Storage. The codebase follows a strict folder structure: one CSS file in `css/`, one JavaScript file in `js/`.

---

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **User**: The person using the Dashboard in a browser tab.
- **LocalStorage**: The browser's `localStorage` API used for all client-side data persistence.
- **Greeting_Widget**: The UI section that displays the current time, current date, and a personalised greeting message.
- **Timer**: The Pomodoro-style countdown timer widget.
- **Session_Duration**: The number of minutes configured for a single Pomodoro session (default: 25 minutes).
- **Timer_State**: One of three states — `idle`, `running`, or `paused`.
- **Task**: A single to-do item with a text label, a completion status (`done` / `undone`), and a creation timestamp.
- **Task_List**: The ordered collection of Tasks displayed in the Dashboard.
- **Quick_Link**: A user-defined label and URL pair rendered as a clickable button.
- **Theme**: The active color scheme — either `light` or `dark`.
- **Theme_Toggle**: The control that switches between light and dark Themes.
- **Name_Setting**: The User's display name stored in LocalStorage and shown in the Greeting_Widget.

---

## Requirements

### Requirement 1: Display Current Time and Date

**User Story:** As a User, I want to see the current time and date at a glance, so that I can stay aware of the time while working.

#### Acceptance Criteria

1. WHEN the Dashboard first renders, THE Greeting_Widget SHALL immediately display the current local time in HH:MM (24-hour) format.
2. THE Greeting_Widget SHALL update the displayed time at the start of each new clock minute by synchronising to the system clock (not via a fixed 60-second interval).
3. THE Greeting_Widget SHALL display the current local date using the fixed format "DayName, DD MonthName YYYY" (e.g. "Wednesday, 15 October 2026"); no other format is acceptable.

---

### Requirement 2: Time-Based Greeting Message

**User Story:** As a User, I want to receive a greeting appropriate to the time of day, so that the Dashboard feels personal and contextual.

#### Acceptance Criteria

1. WHEN the local hour is between 05:00 and 11:59 (inclusive), THE Greeting_Widget SHALL display the message "Good Morning".
2. WHEN the local hour is between 12:00 and 17:59 (inclusive), THE Greeting_Widget SHALL display the message "Good Afternoon".
3. WHEN the local hour is between 18:00 and 20:59 (inclusive), THE Greeting_Widget SHALL display the message "Good Evening".
4. WHEN the local hour is between 21:00 and 23:59 OR between 00:00 and 04:59 (inclusive), THE Greeting_Widget SHALL display the message "Good Night".
5. WHEN the clock minute updates and the new time crosses a greeting boundary, THE Greeting_Widget SHALL update the greeting message immediately.

---

### Requirement 3: Custom Name in Greeting

**User Story:** As a User, I want to set my name so that the greeting addresses me personally, so that the Dashboard feels tailored to me.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a text input field (maximum 50 characters) and a save control for the User to enter a Name_Setting.
2. WHEN the User submits a non-empty Name_Setting (after trimming whitespace), THE Dashboard SHALL persist the trimmed Name_Setting to LocalStorage under the key `userName` and immediately update the Greeting_Widget.
3. IF a Name_Setting exists in LocalStorage, THEN THE Greeting_Widget SHALL append the Name_Setting to the greeting followed by an exclamation mark (e.g. "Good Morning, Alex!").
4. IF no Name_Setting exists in LocalStorage, THEN THE Greeting_Widget SHALL display the greeting with a trailing exclamation mark and no name suffix (e.g. "Good Morning!").
5. WHEN the User clears the Name_Setting field and submits, THE Dashboard SHALL remove the `userName` key from LocalStorage and immediately update the Greeting_Widget to display the greeting without a name suffix.
6. IF the User submits an empty or whitespace-only Name_Setting without previously clearing an existing name, THEN THE Dashboard SHALL display an inline validation message and SHALL NOT update LocalStorage or the Greeting_Widget.

---

### Requirement 4: Pomodoro Focus Timer

**User Story:** As a User, I want a countdown timer pre-set to a Pomodoro session length, so that I can time focused work sessions without switching apps.

#### Acceptance Criteria

1. THE Timer SHALL initialise in `idle` state with a countdown equal to the Session_Duration (defaulting to 25 minutes if no `sessionDuration` key exists in LocalStorage).
2. WHEN the Timer is in `idle` or `paused` state and the User activates the Start control, THE Timer SHALL transition to `running` state and count down one second per real second.
3. WHEN the Timer is in `running` state and the User activates the Stop control, THE Timer SHALL transition to `paused` state and halt the countdown at the current remaining time.
4. WHEN the User activates the Reset control from any state, THE Timer SHALL transition to `idle` state and restore the countdown to the current Session_Duration.
5. WHEN the Timer reaches 00:00 while in `running` state, THE Timer SHALL transition to `idle` state, display 00:00, and display a visible on-screen alert message (e.g. "Session complete!") that remains until the User dismisses it or activates Reset.
6. THE Timer SHALL display the remaining time in MM:SS format at all times.

---

### Requirement 5: Configurable Pomodoro Duration

**User Story:** As a User, I want to change the Pomodoro timer duration, so that I can adapt session lengths to different types of work.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a numeric input field and a save control for setting a Session_Duration value in whole minutes between 1 and 90 (inclusive).
2. WHEN the User saves a valid Session_Duration, THE Dashboard SHALL persist the integer value to LocalStorage under the key `sessionDuration`.
3. WHEN the User saves a valid Session_Duration, THE Timer SHALL transition to `idle` state (regardless of any prior running or paused state) and display the new Session_Duration as MM:00.
4. WHEN the Dashboard loads and a `sessionDuration` key exists in LocalStorage with an integer value between 1 and 90, THE Timer SHALL initialise to that value instead of the default 25 minutes.
5. IF the User enters a Session_Duration that is non-numeric, non-integer, or outside the range 1–90, THEN THE Dashboard SHALL display an inline validation message adjacent to the input field and SHALL NOT update the Timer or LocalStorage; the validation message SHALL clear when the User modifies the input to a valid value.

---

### Requirement 6: To-Do List — Add Tasks

**User Story:** As a User, I want to add tasks to a list, so that I can track what I need to accomplish.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a text input (accepting a maximum of 255 characters) and a submit control for entering a new Task.
2. WHEN the User submits a non-empty task label (after trimming whitespace), THE Task_List SHALL add the new Task with status `undone` and record the creation timestamp in ISO 8601 UTC format.
3. WHEN the User submits a task label that, after trimming leading and trailing whitespace, matches an existing Task label (case-insensitive), THE Dashboard SHALL display an inline warning message adjacent to the input and SHALL NOT add a duplicate Task; the warning SHALL remain visible until the User modifies the task label input.
4. IF the User submits an empty or whitespace-only task label, THEN THE Dashboard SHALL display an inline validation message adjacent to the input and SHALL NOT add a Task; the message SHALL remain visible until the User modifies the task label input.
5. WHEN a new Task is added, THE Dashboard SHALL persist the updated Task_List to LocalStorage under the key `tasks`.
6. IF the LocalStorage write operation fails when persisting the Task_List, THEN THE Dashboard SHALL display an inline error message indicating the save failed and SHALL retain the Task in the in-memory Task_List for the current session.

---

### Requirement 7: To-Do List — Edit Tasks

**User Story:** As a User, I want to edit an existing task's label, so that I can correct mistakes or update task descriptions.

#### Acceptance Criteria

1. THE Dashboard SHALL provide an edit control for each Task in the Task_List.
2. WHEN the User activates the edit control for a Task, THE Dashboard SHALL display an editable text input (maximum 255 characters) pre-filled with the Task's current label.
3. WHEN the User saves the edited label (via a save control or pressing Enter) and the new label is non-empty (after trimming) and does not duplicate another existing Task label (case-insensitive), THE Dashboard SHALL update the Task's label and persist the updated Task_List to LocalStorage.
4. IF the User saves an empty or whitespace-only label, THEN THE Dashboard SHALL display an inline validation message adjacent to the edit input and SHALL NOT update the Task.
5. IF the edited label (after trimming, case-insensitive) matches another existing Task's label, THEN THE Dashboard SHALL display an inline warning message adjacent to the edit input and SHALL NOT update the Task.
6. WHEN the User cancels the edit (e.g. pressing Escape or activating a cancel control), THE Dashboard SHALL discard the changes, restore the original label display, and SHALL NOT update LocalStorage.

---

### Requirement 8: To-Do List — Mark Tasks as Done

**User Story:** As a User, I want to mark tasks as done, so that I can track my progress.

#### Acceptance Criteria

1. THE Dashboard SHALL display a checkbox toggle control on each Task in the Task_List.
2. WHEN the User activates the toggle on an `undone` Task, THE Task_List SHALL set the Task status to `done` and apply a strikethrough style to the Task's label text.
3. WHEN the User activates the toggle on a `done` Task, THE Task_List SHALL set the Task status to `undone` and remove the strikethrough style from the Task's label text.
4. WHEN a Task's status changes, THE Dashboard SHALL persist the updated Task_List to LocalStorage.

---

### Requirement 9: To-Do List — Delete Tasks

**User Story:** As a User, I want to delete tasks I no longer need, so that my list stays relevant.

#### Acceptance Criteria

1. THE Dashboard SHALL display a delete control for each Task in the Task_List.
2. WHEN the User activates the delete control for a Task, THE Task_List SHALL remove that Task from the list.
3. WHEN a Task is removed, THE Dashboard SHALL persist the updated Task_List to LocalStorage.

---

### Requirement 10: To-Do List — Persistence on Reload

**User Story:** As a User, I want my tasks to survive a page reload, so that I do not lose my list between sessions.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Task_List SHALL read the `tasks` key from LocalStorage and render all previously saved Tasks.
2. WHEN LocalStorage contains no `tasks` key, THE Task_List SHALL render an empty list.
3. WHEN the Dashboard loads and the `tasks` value in LocalStorage is malformed or cannot be parsed as a valid Task array, THE Dashboard SHALL discard the malformed data and render an empty list.

---

### Requirement 11: Quick Links — Add and Display

**User Story:** As a User, I want to save favourite website links as buttons, so that I can open them quickly without typing URLs.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a text input for the Quick_Link label (maximum 100 characters), a text input for the Quick_Link URL (maximum 2048 characters), and a submit control.
2. WHEN the User submits a Quick_Link with a non-empty label and a valid URL (beginning with `http://` or `https://`), THE Dashboard SHALL add the Quick_Link to the quick-links panel and persist the updated collection to LocalStorage under the key `quickLinks`.
3. IF the User submits a Quick_Link with an empty label, THEN THE Dashboard SHALL display an inline validation message adjacent to the label input and SHALL NOT add the Quick_Link.
4. IF the User submits a Quick_Link with an empty URL or a URL that does not begin with `http://` or `https://`, THEN THE Dashboard SHALL display an inline validation message adjacent to the URL input and SHALL NOT add the Quick_Link.
5. WHEN the User activates a Quick_Link button, THE Dashboard SHALL open the associated URL in a new browser tab.
6. WHEN the Dashboard loads, THE Dashboard SHALL read the `quickLinks` key from LocalStorage and render all previously saved Quick_Links.
7. WHEN the Dashboard loads and the `quickLinks` value in LocalStorage is malformed or cannot be parsed as a valid Quick_Link array, THE Dashboard SHALL discard the malformed data and render an empty quick-links panel.

---

### Requirement 12: Quick Links — Delete

**User Story:** As a User, I want to remove quick links I no longer use, so that my link panel stays tidy.

#### Acceptance Criteria

1. THE Dashboard SHALL display a delete control for each Quick_Link.
2. WHEN the User activates the delete control for a Quick_Link, THE Dashboard SHALL remove the Quick_Link from the panel and persist the updated collection to LocalStorage.

---

### Requirement 13: Light / Dark Mode

**User Story:** As a User, I want to toggle between a light and a dark color theme, so that I can use the Dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a Theme_Toggle control that is visible at all times regardless of scroll position.
2. WHEN the User activates the Theme_Toggle, THE Dashboard SHALL switch the active Theme from `light` to `dark`, or from `dark` to `light`.
3. WHEN the Theme changes, THE Dashboard SHALL apply the CSS class corresponding to the new Theme (e.g. `theme-dark`) to the root `<html>` element and remove the previous Theme class.
4. WHEN the Theme changes, THE Dashboard SHALL persist the active Theme value (`"light"` or `"dark"`) to LocalStorage under the key `theme`.
5. WHEN the Dashboard loads and the `theme` key in LocalStorage contains exactly `"light"` or `"dark"`, THE Dashboard SHALL apply that stored Theme before the first render.
6. WHEN the Dashboard loads and no `theme` key exists in LocalStorage, THE Dashboard SHALL default to the `light` Theme.
7. WHEN the Dashboard loads and the `theme` key in LocalStorage contains a value other than `"light"` or `"dark"`, THE Dashboard SHALL default to the `light` Theme and overwrite the invalid stored value.

---

### Requirement 14: Technical Constraints

**User Story:** As a developer, I want the project to follow defined technical and structural rules, so that the codebase remains simple, maintainable, and dependency-free.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented using only HTML, CSS, and Vanilla JavaScript with no external frameworks or libraries.
2. THE Dashboard SHALL require no backend server; all runtime behaviour SHALL execute client-side in the browser.
3. THE Dashboard SHALL function correctly in current stable versions of Chrome, Firefox, Edge, and Safari.
4. THE Dashboard SHALL contain exactly one CSS file located at `css/style.css`.
5. THE Dashboard SHALL contain exactly one JavaScript file located at `js/app.js`.
6. THE Dashboard SHALL use the browser `localStorage` API as the sole data persistence mechanism.
7. WHEN the Dashboard is opened as a standalone HTML file (file:// protocol), THE Dashboard SHALL function without errors.
