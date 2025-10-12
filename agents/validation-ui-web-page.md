# Agent: Validation UI Web Page

**Version:** 1.0
**Author:** Gemini
**Description:** An autonomous agent that audits a web page by interacting with its elements and reporting console errors for debugging.

---

## 1. Objective

The primary objective of this agent is to perform a user interface (UI) validation audit on a given web page. It simulates user interactions by clicking all buttons and interactive elements, monitors the browser console for JavaScript errors, and produces a comprehensive summary report.

---

## 2. Required Tools

This agent relies exclusively on browser control tools:

- `list_pages`: To list open web pages.
- `select_page`: To target a specific page for testing.
- `take_snapshot`: To get a textual DOM representation of the page and identify interactive elements.
- `click`: To simulate a click on an element via its `uid`.
- `list_console_messages`: To retrieve console logs, especially errors.
- `write_file`: To save the final validation report.

---

## 3. Trigger (Hook)

The agent is designed to be activated by a user instruction. The workflow starts when the user requests a UI validation.

**Example Trigger Prompts:**

- "Run the validation agent on the current page."
- "Can you execute `Validation UI Web Page` on page index 2?"
- "Audit the active page's interface."

---

## 4. Workflow (Execution Process)

The agent follows a rigorous sequence of steps to ensure a complete audit.

### Step 1: Target Page Identification

1.  The agent executes `list_pages()` to get the list of open pages.
2.  If multiple pages are open, the agent asks the user to specify the target (by its index or title).
3.  The agent uses `select_page(pageIdx=...)` to connect to the target page.

### Step 2: Static Page Analysis

1.  The agent executes `take_snapshot()` to capture the page's full DOM structure.
2.  It parses the snapshot to identify all interactive elements, focusing on `<button>` tags and elements with `role="button"`.
3.  It builds a list of these elements with their `uid` and accessible text or name.

### Step 3: Interactive Test Loop

For each interactive element identified in Step 2:

1.  The agent records the element that is about to be clicked.
2.  It executes `click(uid=...)` on the element.
3.  It pauses for a moment (~1 second) to allow asynchronous scripts to run.
4.  It executes `list_console_messages()` and **immediately** checks for new errors.
5.  If one or more errors are found, it associates them with the element that was just clicked and stores them for the report.

### Step 4: Validation Report Generation

1.  Once the test loop is complete, the agent synthesizes the results.
2.  It generates a Markdown report containing:
    - A header with the page URL, test date, and time.
    - A list of all elements that were clicked.
    - A **"Bugs Detected"** section if errors were found, detailing each error (message, source, and the action that likely caused it).
    - A **"No Errors Detected"** success message if the console remained clean.

### Step 5: Finalization

1.  The agent presents the final report to the user.
2.  It offers to save the report to a file via `write_file`, for example: `ui-validation-report-YYYY-MM-DD.md`.

---

## 5. Example Output Report

```markdown
# UI Validation Report

- **Page Tested:** `https://example.com/dashboard`
- **Test Date:** 2025-10-12 14:30:00

---

## Actions Performed

- Clicked button "Login" (uid: `btn-login`)
- Clicked button "Create Report" (uid: `create-report-btn`)
- Clicked link "View Statistics" (uid: `stats-link-42`)

---

## Bugs Detected (1)

### Error 1: `TypeError: Cannot read properties of null (reading 'update')`

- **Triggering Action:** Click on button **"Create Report"** (uid: `create-report-btn`)
- **Source:** `app.js:256:12`
- **Full Message:** `TypeError: Cannot read properties of null (reading 'update') at HTMLButtonElement.createReport (app.js:256:12)`
```
