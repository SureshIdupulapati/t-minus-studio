---
name: pnpm AI integration setup
description: Workspace dependency linking when a Replit AI integration template is copied into a pnpm monorepo.
---

After copying an AI integration package into a pnpm workspace and adding its workspace dependency and TypeScript references, run `pnpm install` before code generation or typechecking. The package source being present does not guarantee that its dependencies are linked into the workspace.

**Why:** Typechecking and generated client work failed until pnpm refreshed the workspace links for the copied integration package.

**How to apply:** After wiring a copied integration into the monorepo manifests and project references, install dependencies once, then run codegen and typecheck.
