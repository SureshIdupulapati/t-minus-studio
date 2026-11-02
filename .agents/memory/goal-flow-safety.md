---
name: Goal-flow safety
description: Non-obvious form activation, navigation, and concurrent-edit hazards encountered during the real goal-creation walkthrough.
---

Goal setup must remain in its dialog until the user explicitly chooses manual planning or Gemini.

**Why:** React can reuse a step-transition button as the next step's submit button before the native click's default action finishes. This can submit an incomplete goal instead of merely advancing the wizard.

**How to apply:** Give transition and submit controls distinct identities and cancel the transition click's default action. Verify advancing a step creates neither a saved goal nor a planning request.

Keep the state-owning application component stable across ordinary page navigation.

**Why:** Route-specific inline component factories can remount the application while a new goal is awaiting its persistence effect, losing the selected goal or creation result.

**How to apply:** Preserve the application component's identity across its main routes; navigation after creation must show the same saved goal.

Unexpected concurrent source changes invalidate an otherwise passing verification.

**Why:** During a live walkthrough, the main screen source was replaced by an older version after a fix, restoring removed pages and removing the Gemini designer. The origin of that replacement was not established; the tester reported only read-only source access and browser interactions.

**How to apply:** If screenshots suddenly show an obsolete interface, compare the currently served source and working tree with the approved committed version before assuming browser caching or retrying the same flow. Preserve legitimate merged changes when correcting drift.
