---
name: GitHub export access
description: Independent GitHub CLI authentication and the workspace Git-write guard.
---

An attached GitHub connector can report healthy yet return no runtime connection. Do not conclude GitHub access is unavailable until checking the workspace CLI with a non-secret request such as `gh api user --jq '.login'`.

**Why:** The connector exposed no runtime connection, while the GitHub CLI could create a private repository and push successfully through Replit's secure GitHub proxy.

**How to apply:** Use authenticated CLI operations without reading or printing tokens. If Git is not configured for CLI credentials, a per-command credential helper can call `gh auth git-credential`. Workspace Git configuration writes may require the explicit `DANGEROUSLY_ALLOW_GIT=1` guard; use it only for the narrow operation the user authorized, not destructive history changes.
