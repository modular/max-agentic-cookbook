# Contributing Guide

Thanks for your interest in contributing! This guide covers the basics of adding recipes or improvements to the Agentic Cookbook.

> **Note:** This is a new project and we're still figuring things out. We're not sure how many folks will contribute yet, so we're keeping the process lightweight and flexible. If something doesn't work or you have ideas to improve the workflow, let us know!

## Quick Start

### Prerequisites

- Node.js 22.x or higher
- pnpm package manager
- Git

### Fork and Setup

> You'll need to fork the repo first. Direct push access is restricted to maintainers.

1. **Fork** [github.com/modular/max-agentic-cookbook](https://github.com/modular/max-agentic-cookbook) on GitHub

2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/max-agentic-cookbook.git
   cd max-agentic-cookbook
   ```

3. **Add upstream:**
   ```bash
   git remote add upstream https://github.com/modular/max-agentic-cookbook.git
   ```

4. **Install and run:**
   ```bash
   pnpm install
   pnpm dev
   ```

## Adding a Recipe

Recipes live in `packages/recipes/src/[recipe-name]/` with two files:

- **`ui.tsx`** - React component (frontend)
- **`api.ts`** - Request handler (backend)

**Example recipes to reference:**
- Simple: [`multiturn-chat`](../packages/recipes/src/multiturn-chat/) - Basic streaming chat
- Advanced: [`image-captioning`](../packages/recipes/src/image-captioning/) - NDJSON streaming, parallel processing

**Register your recipe** in:
- [`metadata.ts`](../packages/recipes/src/registry/metadata.ts) - Name, description, tags
- [`api.ts`](../packages/recipes/src/registry/api.ts) - Backend handler
- [`ui.ts`](../packages/recipes/src/registry/ui.ts) - Frontend component

Restart the dev server after adding a new recipe.

## Development Workflow

1. **Create a branch in your fork:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** and test locally

3. **Format and lint:**
   ```bash
   pnpm format
   pnpm lint
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

- **TypeScript** - Use types, avoid `any`
- **React hooks** - Functional components only
- **Inline docs** - Comment complex logic
- **Follow existing patterns** - Check existing recipes for style

See [`multiturn-chat`](../packages/recipes/src/multiturn-chat/) for a clean example.

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

- **Architecture**: [docs/architecture.md](./architecture.md)
- **Docker**: [docs/docker.md](./docker.md)
- **Issues**: [GitHub Issues](https://github.com/modular/max-recipes/issues)
- **Forum**: [forum.modular.com](https://forum.modular.com/)

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0 with LLVM Exception. See [LICENSE](../LICENSE) for details.

---

Thanks for contributing!
