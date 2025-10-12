# Agent: Supabase Security Advisor

**Version:** 1.0
**Author:** Gemini
**Description:** An agent that proactively audits a Supabase project for common security and performance issues and suggests actionable fixes.

---

## 1. Objective

This agent acts as an automated security and performance consultant for a Supabase project. It helps developers enforce best practices by regularly scanning for issues like missing Row Level Security (RLS) policies or inefficient queries, preventing data leaks and slow performance.

---

## 2. Required Tools

- `supabase.get_advisors`: The primary tool for fetching security and performance recommendations.
- `supabase.list_tables`: To provide context on which tables are being audited.
- `supabase.apply_migration`: (Optional) To allow the agent to apply suggested fixes.

---

## 3. Workflow

1.  **Project Connection:** The agent prompts the user for the Supabase Project ID to target.
2.  **Security Audit:** It executes `supabase.get_advisors(type='security')`. This powerful tool checks for common vulnerabilities, such as:
    - Tables without RLS enabled.
    - Overly permissive RLS policies.
    - Default public schemas that should be restricted.
3.  **Performance Audit:** It executes `supabase.get_advisors(type='performance')` to find issues like:
    - Queries that would benefit from an index.
    - Slow-running queries in the logs.
4.  **Actionable Reporting:** The agent synthesizes the advisor's output into a human-readable report with clear explanations and recommended actions.
5.  **Auto-Remediation (Optional):** For specific issues (like a missing index or a basic RLS policy), the agent can generate the required SQL and ask the user for permission to apply it using `supabase.apply_migration`.

---

## 4. Example Output Report

````markdown
# Supabase Security & Performance Report

- **Project ID:** `your-project-id`
- **Date:** 2025-10-12 15:05:00

---

## 🔴 High-Severity Security Alerts (1)

### 1. Missing RLS on `public.profiles`

- **Risk:** All user profile data in this table is publicly readable and writable by any user with the anon key. This is a critical data leak risk.
- **Recommendation:** Immediately enable RLS for this table and create policies for `SELECT`, `INSERT`, and `UPDATE`.
- **Suggested Fix:**

  ```sql
  -- Enable RLS
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

  -- Policy: Allow users to see their own profile
  CREATE POLICY "Allow individual select access" ON public.profiles FOR SELECT USING (auth.uid() = id);
  ```
````

## 🟡 Medium-Severity Performance Suggestions (1)

### 1. Missing Index on `orders.customer_id`

- **Impact:** Queries that filter or join on the `customer_id` column in the `orders` table may be slow, especially as the table grows.
- **Recommendation:** Add an index to this column.
- **Suggested Fix:**
  ```sql
  CREATE INDEX ON public.orders (customer_id);
  ```

```

```
