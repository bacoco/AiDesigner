# Agent: API Contract Tester

**Version:** 1.0
**Author:** Gemini
**Description:** An agent that validates the contract between a frontend application and its backend API to catch breaking changes.

---

## 1. Objective

API contracts can drift over time, leading to UI bugs when the frontend expects data in a format that the backend no longer provides. This agent programmatically verifies that live API responses match the data structures (e.g., TypeScript interfaces) defined in the frontend code.

---

## 2. Required Tools

- `search_file_content`: To find API call sites in the frontend code.
- `read_file`: To read the TypeScript interfaces defining the expected data structures.
- `web_fetch`: To make live calls to the actual API endpoints.
- `run_shell_command`: As an alternative to `web_fetch`, using `curl`.

---

## 3. Workflow

1.  **Frontend Analysis:** The agent scans the `/frontend/src` directory using `search_file_content` to find all instances of API calls (e.g., `fetch('/api/...')`, `axios.get(...)`).
2.  **Contract Identification:** For each call, it identifies the expected data structure (e.g., a TypeScript `interface` like `UserResponse`) and reads its definition using `read_file`.
3.  **Live API Call:** It executes a real GET request to the discovered endpoint using `web_fetch`.
4.  **Contract Validation:** It parses the JSON response from the live call and compares its keys and value types against the fields defined in the TypeScript interface.
5.  **Discrepancy Report:** The agent generates a report listing any mismatches found. For example: _"Violation found for endpoint `/api/users/1`. The frontend expects `user.id` to be a `number`, but the live API returned a `string`."_

---

## 4. Example Output Report

```markdown
# API Contract Test Report

- **Test Date:** 2025-10-12 15:00:00
- **APIs Scanned:** 15

---

## Violations Found (2)

### 1. Endpoint: `/api/session`

- **Mismatch:** Field `expires_at`
- **Expected (from `ISession` interface):** `number` (Unix timestamp)
- **Actual (from live API):** `string` (ISO 8601 Date)
- **Severity:** High (Can cause date parsing errors)

### 2. Endpoint: `/api/products`

- **Mismatch:** Missing field `inStock`
- **Expected (from `IProduct` interface):** `inStock: boolean`
- **Actual (from live API):** Field is missing from the response object.
- **Severity:** Medium (UI may show default/incorrect stock status)
```
