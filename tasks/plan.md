# Implementation Plan: Project Task List and View Range Navigation

## Overview

Replace Section 3's date-filtered task rows with a persistent task list for the selected project, then replace View 0's flat range switching with the three-level keyboard flow shown in the supplied image.

## Architecture Decisions

- Query project tasks with aggregated latest activity in one database query; no migration or per-task query is needed.
- Preserve Section 3's selected date for manual entries, daily totals, day navigation, and Toggl sync, but do not use it to decide which task names are visible.
- Keep date-period calculations in a small pure module so calendar boundaries and navigation can be tested without rendering Ink.
- Reuse the existing View detail renderers and data hooks; only their date range source changes.
- Use View-local navigation depth so `Enter` and `Esc` move between range, period, and detail levels without changing global navigation.

## Task List

### Phase 1: Persistent project task list

- Add a model query that returns all task definitions for one project, ordered with the running task first and remaining tasks by latest activity.
- Add a project-task hook and connect Section 3 to it.
- Remove tracked duration and deletion from the Section 3 list while preserving task metadata and existing date-dependent operations.
- Add focused tests for task normalization and list layout behavior.

### Checkpoint: Project tasks

- Focused tests pass.
- Production build succeeds.
- Section 3 has no date filter or delete key.

### Phase 2: Hierarchical View 0 ranges

- Add tested calendar-period calculations for daily, weekly, monthly, and yearly ranges.
- Keep range navigation, period navigation, and existing content visible together.
- Connect View 0 keys so `h/l` selects horizontal ranges and periods, `Enter` descends, `Esc` ascends, and `t` returns to current.
- Reuse existing task, project, client, and dashboard detail renderers with the selected calendar period.

### Checkpoint: Complete

- Full test suite passes.
- Production build succeeds.
- The final diff passes correctness, simplicity, security, and performance review.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Latest-activity loading creates an N+1 query | Medium | Use one grouped SQL subquery joined to task definitions. |
| `Esc` conflicts with global mode handling | Medium | Reuse the existing component-handler priority for special keys. |
| Existing range consumers receive inconsistent dates | High | Replace all three View range sources together with one tested calendar range. |
| Section 3 actions still need a date | Medium | Preserve `selectedDate`; change only list loading and rendering. |

## Open Questions

None. User-approved assumptions are recorded in the conversation.
