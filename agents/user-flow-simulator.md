# Agent: User Flow Simulator

**Version:** 1.0
**Author:** Gemini
**Description:** An agent that simulates a complete end-to-end user journey to validate critical application features based on a natural language scenario.

---

## 1. Objective

This agent acts as an automated QA tester, translating a user story described in plain language into a sequence of browser actions. It validates critical application flows, such as user registration, profile updates, or purchase funnels, ensuring they work as expected from start to finish.

---

## 2. Required Tools

- `navigate_page`: To start the journey or move between pages.
- `take_snapshot`: To inspect the page and find UIDs for form elements and buttons.
- `fill_form`: To enter data into input fields.
- `click`: To interact with buttons and links.
- `wait_for`: To assert that a certain state has been reached (e.g., a success message appears).
- `upload_file`: (Optional) For flows that involve file uploads.

---

## 3. Workflow

1.  **Scenario Definition:** The user provides a scenario in natural language. (e.g., _"Go to the registration page, sign up as a new user named 'Testy McTestface', then verify that the dashboard shows a 'Welcome, Testy!' message."_)
2.  **Action Translation:** The agent parses the scenario and converts it into a step-by-step plan using browser tools.
3.  **Sequential Execution:** The agent executes the plan in order:
    a. `navigate_page(url='/register')`
    b. `take_snapshot()` to find form field UIDs.
    c. `fill_form(elements=[{uid: 'form-email', value: 'testy@example.com'}, ...])`
    d. `click(uid='submit-button')`
    e. `wait_for(text='Welcome, Testy!', timeout=5000)`
4.  **Success/Failure Reporting:**
    - If all steps complete successfully, the agent reports: _"User flow 'New User Registration' completed successfully."_
    - If any step fails (e.g., `wait_for` times out), the agent reports the failure at that specific step: _"User flow failed at Step 4: After clicking the submit button, the expected text 'Welcome, Testy!' did not appear on the page."_

---

## 4. Example Execution Log

```
# Simulating User Flow: "New User Registration"

- **Scenario:** Sign up as a new user and verify dashboard welcome message.
- **Status:** SUCCESS

---

## Steps Executed:

1.  **NAVIGATE** to `/register`. (Success)
2.  **TAKE_SNAPSHOT** to identify form elements. (Success)
3.  **FILL_FORM** with new user data. (Success)
4.  **CLICK** on element `uid=register-submit-btn`. (Success)
5.  **WAIT_FOR** text "Welcome, NewUser!". (Success)

**Conclusion:** The user flow was completed without errors.
```
