# Contributing to AiDesigner

Thank you for your interest in improving AiDesigner! This document outlines the workflow and standards we follow across the monorepo.

## Getting Started

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/bacoco/aidesigner.git
   cd aidesigner
   npm install
   ```
2. **Bootstrap workspaces**
   ```bash
   npm run setup:hooks
   npm run build
   ```
3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

- **Code style**
  - JavaScript/TypeScript use ESLint (`npm run lint`) and Prettier (`npm run format`).
  - Markdown and YAML files are linted through the shared Prettier configuration.
  - Avoid introducing `console.*` calls—use the shared logger utilities instead.

- **Testing**
  - Run unit tests with `npm test` (root) or workspace-specific commands such as `npm test --workspace @aidesigner/api-server`.
  - Type-check with `npm run typecheck` before opening a pull request.
  - For UI work, include screenshots when visual changes occur.

- **Commits**
  - Write clear, concise commit messages following the Conventional Commits style (e.g., `feat: add health checks`).
  - Keep commits focused; avoid mixing refactors with feature work whenever possible.

- **Pull Requests**
  - Reference the related issue or roadmap item.
  - Include a summary of changes, testing evidence, and any follow-up work.
  - Ensure CI passes before requesting review.

## Environment Configuration

Create a local `.env` file by copying the template:

```bash
cp .env.example .env
```

Update API ports, provider credentials, and workspace settings to match your environment.

## Working on the API Server

- Use `npm run dev --workspace @aidesigner/api-server` for live reload during backend development.
- Health endpoints are available at `/health`, `/health/ready`, and `/health/detailed`.
- Structured logs are written to the console in development and rotated files in production.

## Reporting Issues

Please include the following when filing a bug:

- Steps to reproduce
- Expected vs. actual behaviour
- Relevant logs or stack traces (scrub secrets!)
- Environment details (OS, Node.js version, npm version)

## Release Process

1. Run `npm run pre-release` to validate the repository.
2. Bump versions with the appropriate `npm run version:*` script.
3. Follow the publishing checklist in `docs/AGENTS.md` when releasing the MCP server.

We appreciate every contribution—thanks for helping make AiDesigner better!
