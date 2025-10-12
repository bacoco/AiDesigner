# Agent: Frontend Performance Analyst

**Version:** 1.0
**Author:** Gemini
**Description:** An agent that analyzes a web page's loading performance, identifies Core Web Vitals issues, and provides concrete optimization recommendations.

---

## 1. Objective

This agent acts as an automated performance expert. It diagnoses slow page loads by running a performance trace, interpreting the complex results, and translating them into a prioritized list of actionable recommendations that a developer can implement to improve the user experience.

---

## 2. Required Tools

- `navigate_page`: To go to the URL that needs to be analyzed.
- `performance.start_trace`: To begin the performance recording.
- `performance.stop_trace`: To end the recording and get the results.
- `performance.analyze_insight`: To get detailed information about specific problems found in the trace.

---

## 3. Workflow

1.  **Analysis Kick-off:** The user provides a URL to analyze. The agent navigates to the page.
2.  **Trace Recording:** The agent executes `performance.start_trace(reload=True, autoStop=True)`. This command reloads the page while recording a detailed performance trace, then automatically stops when the page is idle.
3.  **Data Collection:** The `stop_trace` command returns a summary of Core Web Vitals (CWV) metrics (LCP, CLS, FCP) and a list of performance "Insights" that Chrome has identified.
4.  **Insight Analysis:** The agent iterates through the most critical insights (e.g., `LCPBreakdown`, `RenderBlockingResource`, `LongTask`). For each one, it calls `performance.analyze_insight(insightName=...)` to get a detailed breakdown of the root cause.
5.  **Synthetic Reporting:** The agent synthesizes all the collected data into a human-readable report. It doesn't just list metrics; it tells a story:
    - It highlights the poor CWV scores.
    - It connects those scores to the specific insights.
    - It provides concrete, code-level recommendations for fixing the issues.

---

## 4. Example Output Report

```markdown
# Frontend Performance Analysis Report

- **URL Analyzed:** `https://example.com/product/heavy-image-page`
- **Date:** 2025-10-12 15:10:00

---

## 📉 Core Web Vitals Summary

- **Largest Contentful Paint (LCP):** **4.8s** (Poor 🔴)
- **Cumulative Layout Shift (CLS):** **0.21** (Needs Improvement 🟡)
- **First Contentful Paint (FCP):** **2.9s** (Needs Improvement 🟡)

---

## 🔬 Key Findings & Recommendations

### 1. Poor LCP Caused by Large Hero Image

- **Insight:** The LCP element is an `<img>` tag (`#hero-image`). The trace shows its load time is the main bottleneck.
- **Details:** The image `hero-banner.jpg` is **2.3 MB** and its loading is deferred.
- **Recommendation:**
  1.  **Compress the image:** Use a tool like Squoosh or an image CDN to reduce the file size below 500 KB.
  2.  **Prioritize loading:** Add `fetchpriority="high"` to the `<img>` tag to instruct the browser to load it sooner.

### 2. High CLS Caused by Late-Loading Ads

- **Insight:** A significant layout shift occurs when an ad banner (`#ad-container`) loads and pushes down other content.
- **Details:** The ad container does not have a reserved size, so the page reflows when the ad appears.
- **Recommendation:**
  1.  **Reserve space:** Apply a fixed `min-height` to the `#ad-container` in your CSS that matches the expected height of the ad. This will prevent content from shifting.
```
