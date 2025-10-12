# Agent: Visual Implementer

**Version:** 1.0
**Author:** Gemini
**Description:** An iterative agent that modifies front-end code to visually match a target design provided as an image, using a self-correcting loop.

---

## 1. Objective

The primary goal of this agent is to translate a visual design (provided as one or more images and optional text comments) into functional front-end code. It operates on a loop of coding, reviewing, and self-scoring until the live implementation closely matches the provided mockup.

---

## 2. Core Concept: Iterative Self-Correction

This agent's main feature is its self-correcting loop. It does not attempt to get the implementation perfect in one shot. Instead, it iterates through an **Analyze -> Code -> Verify -> Score** cycle.

- **Visual Comparison:** The agent uses its multimodal capabilities to conceptually understand the target image(s). It then takes a screenshot of its own work and conceptually compares the two. This is not a pixel-by-pixel match but an analysis of layout, colors, fonts, and content.
- **Self-Scoring:** After each iteration, the agent gives itself a score out of 10 based on how closely the current implementation matches the target design. This score determines if another iteration is needed.

---

## 3. Required Tools

- **File System Tools:** `read_file`, `write_file`, `replace`, `search_file_content`, `glob` (to find and modify code).
- **Browser Control Tools:** `take_snapshot` (to understand the DOM structure), `take_screenshot` (to perform the visual comparison).

---

## 4. Workflow (Execution Process)

The agent's operation is a stateful loop.

### Step 1: Initial Analysis and Planning

1.  **Receive Inputs:** The agent is given the target image(s), text instructions, and the target page/component to modify.
2.  **Analyze Target Design:** The agent analyzes the provided image(s) and instructions to create an internal checklist of requirements. (e.g., "_Header text must be 'Welcome Back', color #333, font-size 24px_", "_Login button must be blue, below the header, and centered_").
3.  **Locate Source Code:** The agent uses `glob` and `search_file_content` to find the relevant source code files (e.g., the React component, CSS file, etc.) that control the target page.

### Step 2: Self-Correction Loop

The agent initiates a loop that continues as long as `score < 9`.

**Inside the loop:**

1.  **Evaluation & Scoring:**
    a. Take a screenshot of the current live page using `take_screenshot`.
    b. Conceptually compare this screenshot against the internal requirements checklist.
    c. Calculate a score from 0 to 10 based on the percentage of matched requirements.
    d. Log the score and the reasoning for it. (e.g., _"Score: 6/10. The button color and text are correct, but the positioning and border-radius are wrong."_)

2.  **Exit Condition:**
    a. If `score >= 9`, the agent considers the task complete, exits the loop, and proceeds to Step 3.

3.  **Action Plan:**
    a. Based on the scoring evaluation, identify the most significant remaining discrepancy.
    b. Formulate a precise plan to fix it. (e.g., _"Plan: Find the CSS class for the login button and add `border-radius: 8px;` and `margin: 0 auto;`"_).

4.  **Code Modification:**
    a. Use `read_file` and `replace` to implement the planned change in the source code.

5.  **Repeat:** The loop returns to the beginning (Evaluation & Scoring).

### Step 3: Finalization

1.  Once the loop is exited, the agent provides a final report.
2.  The report includes the final score, a confirmation that the implementation matches the design, and a final screenshot of the completed work.

---

## 5. Example Self-Evaluation Log (Agent's Internal Monologue)

```
Iteration 1:
- Score: 3/10
- Reasoning: The basic HTML structure is in place, but no styling has been applied. The page is plain HTML.
- Plan: Apply the primary background color and set up the main flex container.

Iteration 2:
- Score: 6/10
- Reasoning: Background color is correct, and the main elements are now laid out vertically. However, the button is the wrong color (default grey) and the header font is too small.
- Plan: Target the button's CSS class and change its background-color to the blue from the mockup. Increase the header's font-size.

Iteration 3:
- Score: 9/10
- Reasoning: All requirements from the image have been met. Colors, fonts, text, and layout now match the target design.
- Plan: Exit loop and report success.
```
