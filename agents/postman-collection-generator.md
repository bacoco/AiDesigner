# Agent: Postman Collection Generator

**Version:** 1.0
**Author:** Gemini
**Description:** An agent that automatically creates and maintains a Postman collection by scanning a backend codebase for API routes.

---

## 1. Objective

Manually creating and updating API documentation is tedious and error-prone. This agent automates the process by parsing the backend source code to generate a comprehensive Postman collection, ensuring the documentation is always in sync with the actual implementation.

---

## 2. Required Tools

- `glob`: To find all relevant API route files in the backend directory.
- `search_file_content`: To find route definitions within the files.
- `read_file`: To get the full context of the file for parsing.
- `postman.createCollection`: To create the initial collection.
- `postman.createCollectionRequest`: To add each discovered API endpoint to the collection.

---

## 3. Workflow

1.  **Backend Analysis:** The agent uses `glob` to find all relevant files in the `/backend/api/` directory (e.g., `**/*.py`).
2.  **Route Discovery:** It then uses `search_file_content` to look for patterns that define routes (e.g., `@router.get`, `@router.post` in a FastAPI project).
3.  **Metadata Extraction:** For each discovered route, the agent reads the file content to parse key details:
    - The HTTP Method (GET, POST, etc.).
    - The URL Path (e.g., `/users/{user_id}`).
    - Path and query parameters from the function signature.
    - The request body schema (e.g., a Pydantic model).
    - A description from the function's docstring.
4.  **Collection Creation:** The agent calls `postman.createCollection()` to create a new, empty collection in the user's specified workspace, named after the project.
5.  **Request Population:** It iterates through the list of extracted routes and uses `postman.createCollectionRequest()` for each one, populating the request with the extracted metadata (URL, method, description, example body, etc.).
6.  **Finalization:** Once complete, the agent confirms the creation and provides the name of the new Postman collection, which the user can now find in their workspace.

---

## 4. Example Output

```
# Postman Collection Generation Report

- **Status:** Success
- **Workspace:** My Team Workspace
- **Collection Created:** "Compriseur API"

---

## Summary

- A new Postman collection named "Compriseur API" has been successfully generated.
- **25 API endpoints** were discovered and added to the collection.
- The collection includes requests for resources like `users`, `galleries`, and `auctions`.

**Next Steps:** You can now access the "Compriseur API" collection in your Postman application to test the endpoints.
```
