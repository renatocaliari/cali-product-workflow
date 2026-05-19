# Tool: subagent

> Parallel task delegation for PI using pi-subagents (nicobailon).

---

## Specific Command (PI)

```typescript
subagent({
  agent: "[type]",
  task: "...",
  output: "...",
  context: "[fork|fresh]"
})
```

| Info | Value |
|------|-------|
| Package | pi-subagents (nicobailon) |
| Modes | parallel (tasks[], concurrency), chain, single |

---

## Agent Types

| Type | Purpose | Example |
|------|---------|---------|
| `worker` | Parallel task execution | Generate proposals A-E |
| `reviewer` | Adversarial code review | Review diff, check regressions |
| `scout` | Codebase investigation | Find relevant files, patterns |
| `researcher` | External research | Investigate external docs |
| `delegate` | Skill-based delegation | Execute skill with context |
| `planner` | Strategic planning | Generate tech scopes from spec |

---

## Common Patterns

### Parallel (Step 1 - 5 proposals)
```typescript
subagent({
  tasks: [
    { agent: "worker", task: "Generate Proposal A for [context]. Full format." },
    { agent: "worker", task: "Generate Proposal B for [context]. Full format." },
    { agent: "worker", task: "Generate Proposal C for [context]. Full format." },
    { agent: "worker", task: "Generate Proposal D for [context]. Full format." },
    { agent: "worker", task: "Generate Proposal E for [context]. Full format." }
  ],
  concurrency: 5,
  context: "fork"
})
```

### Single (Step 3 - Hybrid)
```typescript
subagent({
  agent: "worker",
  task: "Read proposals A-E from interfaces_v{N}.md. Generate Hybrid combining best elements.",
  reads: [".cali-product-workflow/.../interfaces/interfaces_v{N}.md"]
})
```

### Parallel with Review
```typescript
subagent({
  tasks: [
    { agent: "reviewer", task: "Review diff for correctness", output: false },
    { agent: "reviewer", task: "Review diff for simplicity", output: false }
  ],
  concurrency: 2,
  context: "fork"
})
```

### Scouting
```typescript
subagent({
  agent: "scout",
  task: "Investigate codebase for: [objective]. Find relevant files, patterns, constraints.",
  output: "context-findings.md"
})
```

---

## Context Mode

| Mode | When to use |
|------|-------------|
| `fork` | Independent task, fresh context |
| `fresh` | Start new without parent context |

**Default:** `fork` for parallel tasks.

---

## Output Files

For tasks that save output, use meaningful paths:
```
.cali-product-workflow/{YYYY-MM-DD}/{_dir}/interfaces/interfaces_v{N}.md
.cali-product-workflow/.../strategic/{name}.md
```

---

## Fallback (Other Harnesses)

If `subagent` is not available:
- Execute task directly while preserving context
- Keep outputs in files for continuation
- Use harness equivalent (e.g., Fusion's `fn_delegate_task`)

**Abstraction:** "Parallel task delegation with specialized agent"