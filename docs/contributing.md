# Contributing Guide

Thanks for your interest in contributing! This guide covers the basics of adding recipes or improvements to the MAX Recipes cookbook.

> **Note:** This is a new project and we're still figuring things out. We're not sure how many folks will contribute yet, so we're keeping the process lightweight and flexible. If something doesn't work or you have ideas to improve the workflow, let us know!

## Quick Start

### Prerequisites

- **Python** 3.11 or higher
- **Node.js** 22.x or higher
- **uv** - Fast Python package installer ([install here](https://github.com/astral-sh/uv))
- **Git**

### Fork and Setup

> You'll need to fork the repo first. Direct push access is restricted to maintainers.

1. **Fork** [github.com/modular/max-recipes](https://github.com/modular/max-recipes) on GitHub

2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/max-recipes.git
   cd max-recipes
   ```

3. **Add upstream:**
   ```bash
   git remote add upstream https://github.com/modular/max-recipes.git
   ```

4. **Install dependencies:**
   ```bash
   # Backend
   cd backend
   uv sync
   cd ..

   # Frontend
   cd frontend
   npm install
   cd ..
   ```

5. **Run development servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   uv run uvicorn src.main:app --reload --port 8000

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

Visit `http://localhost:5173` to see the app.

## Adding a Recipe

Recipes consist of multiple files across frontend and backend:

**Frontend files** (`frontend/src/recipes/[recipe-name]/`):
- **`ui.tsx`** - React component (exports `Component` function)
- **`README.mdx`** - Documentation (MDX format)

**Backend file** (`backend/src/recipes/[recipe_name].py`):
- **`[recipe_name].py`** - FastAPI router with recipe logic

**Example recipes to reference:**
- Simple: [`multiturn-chat`](../frontend/src/recipes/multiturn-chat/) (frontend) + [`multiturn_chat.py`](../backend/src/recipes/multiturn_chat.py) (backend)
- Advanced: [`image-captioning`](../frontend/src/recipes/image-captioning/) (frontend) + [`image_captioning.py`](../backend/src/recipes/image_captioning.py) (backend)

**Registration steps:**
1. Add entry to [`frontend/src/recipes/registry.ts`](../frontend/src/recipes/registry.ts) with `slug`, `title`, `description`, and `component`
2. Create backend router in [`backend/src/recipes/[recipe_name].py`](../backend/src/recipes/)
3. Include router in [`backend/src/main.py`](../backend/src/main.py)
4. Add README to `readmeComponents` in `registry.ts`

Routes auto-generate from registry - no manual route definitions needed!

See [`.claude/project-context.md`](../.claude/project-context.md) for detailed recipe creation steps.

## Development Workflow

1. **Create a branch in your fork:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** and test locally with both dev servers running

3. **Format frontend code:**
   ```bash
   cd frontend
   npm run format
   ```

4. **Commit with clear messages:**
   ```bash
   git commit -m "Add RAG recipe"
   ```

5. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create PR** from your fork to upstream `main` branch

## Code Standards

**Frontend (TypeScript):**
- Use types, **never use `any`** (use `unknown` instead)
- Functional components with React hooks
- 4 spaces, no semis, single quotes (Prettier config)
- See [`frontend/src/lib/types.ts`](../frontend/src/lib/types.ts) for shared types

**Backend (Python):**
- Type hints for function signatures
- FastAPI best practices
- Follow existing recipe patterns

**General:**
- Comment complex logic
- Follow existing patterns in codebase
- Reference [`multiturn-chat`](../frontend/src/recipes/multiturn-chat/) for clean example

## Pull Requests

- Use descriptive titles: `Add X` or `Fix Y`
- Include what changed and why
- Add screenshots for UI changes (optional)
- Address review feedback by pushing to your branch

Maintainers will review and merge approved PRs.

## Syncing Your Fork

Keep your fork updated:

```bash
git fetch upstream
git checkout main
git rebase upstream/main
git push origin main
```

## Getting Help

- **Architecture**: [docs/architecture.md](./architecture.md) - Design decisions and patterns
- **Docker**: [docs/docker.md](./docker.md) - Container deployment
- **Project Context**: [.claude/project-context.md](../.claude/project-context.md) - Comprehensive reference
- **Issues**: [GitHub Issues](https://github.com/modular/max-recipes/issues)
- **Forum**: [forum.modular.com](https://forum.modular.com/)

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0 with LLVM Exception. See [LICENSE](../LICENSE) for details.

---

Thanks for contributing!
