# @danielbodnar/guidelines

Centralized config files, templates, and guidelines for linters, formatters, editors, CI/CD, and more. Ship consistent tooling across every project with a single CLI.

## Install

```bash
bun add -d @danielbodnar/guidelines
```

## Usage

### List available configs

```bash
# Show all categories
bunx guidelines list

# Show tools in a category
bunx guidelines list linters
```

### Get info about a tool

```bash
bunx guidelines info oxlint
bunx guidelines info cloudflare   # aliases work too
```

### Initialize configs in your project

```bash
# Copy a single tool's config
bunx guidelines init oxlint

# Copy multiple tools at once
bunx guidelines init oxlint biome-formatter lefthook tsconfig

# Initialize an entire category
bunx guidelines init --category linters

# Interactive mode — pick from menus
bunx guidelines init --interactive

# Preview what would be copied
bunx guidelines init oxlint --dry-run

# Overwrite existing files
bunx guidelines init oxlint --force

# Fetch latest configs from GitHub (no local install needed)
bunx guidelines init oxlint --remote
bunx guidelines list --remote
bunx guidelines info oxlint --remote
```

## Available Configs

### Linters

| Tool | Description |
|------|-------------|
| `oxlint` | Rust-based linter — fast, zero-config ESLint alternative |
| `biome` | All-in-one Rust-based linter with TypeScript-first rules |

### Formatters

| Tool | Description |
|------|-------------|
| `biome-formatter` | Rust-based formatter — Prettier-compatible with tabs |
| `dprint` | Pluggable formatter for TS, JSON, Markdown, TOML |

### Git Hooks

| Tool | Description |
|------|-------------|
| `lefthook` | Fast git hooks manager with parallel execution |

### Commit Conventions

| Tool | Description |
|------|-------------|
| `commitlint` | Conventional commit message enforcement |

### Editors

| Tool | Description |
|------|-------------|
| `editorconfig` | Editor-agnostic coding style definitions |

### TypeScript

| Tool | Description |
|------|-------------|
| `tsconfig` | Strict TypeScript config for Bun + ESNext |

### GitHub

| Tool | Description |
|------|-------------|
| `github-actions` | CI workflow with lint, typecheck, and test |
| `dependabot` | Automated dependency updates |
| `renovate` | Flexible dependency updates with automerge |

### Infrastructure

| Tool | Description |
|------|-------------|
| `wrangler` | Cloudflare Workers with full observability |
| `devcontainer` | Dev container with Bun, mise, and extensions |
| `compose` | Docker Compose for multi-service dev environments |

### Tooling

| Tool | Description |
|------|-------------|
| `mise` | Polyglot tool version manager |
| `bunfig` | Bun runtime and test runner configuration |

### Claude Code

| Tool | Description |
|------|-------------|
| `claude-code` | Project-level CLAUDE.md and settings template |

### Languages

| Tool | Description |
|------|-------------|
| `rust` | Rust formatting, linting, and toolchain config (rustfmt, clippy) |

### Frameworks

| Tool | Description |
|------|-------------|
| `astro` | Astro static site config with TypeScript strict mode |
| `hono` | Hono web framework entry point for Bun |

### Documentation

| Tool | Description |
|------|-------------|
| `typedoc` | TypeScript API documentation generator |

## File Strategies

Each config file declares how it integrates into your project:

| Strategy | Behavior |
|----------|----------|
| `copy` | Copies the file, skips if it already exists (unless `--force`) |
| `merge` | Deep-merges JSON into an existing file (e.g., `biome-formatter` into `biome.jsonc`) |
| `append` | Appends content to an existing file, skips if content already present |
| `template` | Copies with variable substitution (future) |
| `reference` | Documentation-only, not copied |

## Shareable Configs

Tools that support `extends` can reference configs directly from the package:

```jsonc
// biome.jsonc
{ "extends": ["@danielbodnar/guidelines/configs/linters/biome/biome.jsonc"] }

// dprint.json
{ "extends": "@danielbodnar/guidelines/configs/formatters/dprint/dprint.json" }
```

## Quick Start

Set up a typical Bun + TypeScript project in one command:

```bash
bunx guidelines init tsconfig editorconfig oxlint biome-formatter lefthook commitlint github-actions bunfig
```

## Authoring Configs

Add new tools by creating a directory under `configs/<category>/<tool>/`:

```
configs/
  <category>/
    category.json           # { name, displayName, description }
    <tool>/
      manifest.json         # Tool manifest (Zod-validated)
      <config files...>     # Actual config files to distribute
```

The manifest schema is defined in `src/registry/types.ts`.

## Development

```bash
bun install
bun run dev           # Run CLI in development
bun test              # Run tests
bun run check         # TypeScript type-check
bun run lint          # Lint with oxlint
bun run build         # Compile standalone binary to .dist/guidelines
```

## License

MIT
