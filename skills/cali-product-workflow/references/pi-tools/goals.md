# Tool: /sisyphus, /goal

> Goal tracking with typed scopes and step-by-step execution for PI.

---

## Specific Command (PI)

```bash
/sisyphus [scope-name]
/goal [description]
pause_goal
```

| Info | Value |
|------|-------|
| Package | @capyup/pi-goal (capyup) |
| Commands | /sisyphus, /goal, pause_goal |

---

## When to Use

| Phase | Purpose |
|-------|---------|
| Phase 11 (Execution) | Scoped implementation per scope |
| After Tech Planning | Each scope becomes a goal |

---

## Pattern for Scope Execution

```bash
/sisyphus Scope: [scope-name]
  Step 1: [description with DoD]
    - Criterion A
    - Criterion B
  Step 2: [description]
  ...
```

### DoD Format
```markdown
Done when:
- [ ] Acceptance criterion 1
- [ ] Acceptance criterion 2
```

---

## Goal Generation (After Tech Planning)

For each scope in approved spec-tech:

```bash
/sisyphus Scope: [scope-name]
  Objective: {from scope description}
  DoD: {from scope}
  Files in scope: {from plan}
  Constraints: tests must pass
```

---

## Fallback (Other Harnesses)

If goal system is not available:
- Use todo tool for progress tracking
- Create checkpoint files for resume
- Mark `[DONE:n]` in responses

**Abstraction:** "Goal with typed scopes and acceptance criteria"

---

## Related

- Phase 11: Execution
- spec-tech scopes