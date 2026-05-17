## Phase 1: Shape Up Planning

### 1a. Parallel Recon (optional — recommended for complex features)

Before shaping, launch `subagent` to map context:

```typescript
subagent({
  tasks: [
    {
      agent: "scout",
      task: `Map the current code state related to: [description].
Identify relevant files, existing flows, and impact points.`,
      output: ".cali-product-workflow/{YYYY-MM-DD}/{_dir}/context/current-state.md",
      context: "fresh"
    },
    {
      agent: "scout",
      task: `Map technical risks, external dependencies, and
constraints for: [description].`,
      output: ".cali-product-workflow/{YYYY-MM-DD}/{_dir}/context/risks.md",
      context: "fresh"
    }
  ],
  concurrency: 2
})
```

Read the outputs before proceeding.

### 1b. Shaping

Read the shape-up section references to guide the process:

- **`references/shape-up/SHAPING-COMPLETE.md`** — context, clarification and responsibilities (consolidated from: context-reconstruction, clarification-rules, main-responsibilities)
- **`references/shape-up/SHAPING-PRINCIPLES.md`** — core and shaping principles (consolidated from: core-principles, shaping-principles)
- **`references/shape-up/RISK-ANALYSIS.md`** — risk analysis and strategic alternatives (consolidated from: risk-analysis-framework, strategic-alternatives)
- **`references/shape-up/EXECUTION-GUIDE.md`** — sequencing, persistence and cross-domain (consolidated from: sequencing-and-persistence, cross-domain-adaptation, evolutionary-exploration)
- **`references/shape-up/proposal-structure.md`** — shaping output structure
- **`references/shape-up/output-expectations.md`** — strong vs weak output criteria

Use `ask_user_question` for strategic questions when needed.

After shaping:
- Save to `.cali-product-workflow/{YYYY-MM-DD}/{_dir}/plans/spec-product_{v}.md`
- Do not ask about Interface Brainstorming — already decided in Phase 0

### 1c. Scope Adjustment (after Shape Up)

Show the IN/OUT scope table. Ask:

1. **Remove IN scopes?** — `ask_user_question` multiSelect with current scopes
2. **Include OUT scopes?** — `ask_user_question` multiSelect with out-of-scope items

If user selects nothing → proceed with original Shape Up.
If there are removals/inclusions → create `spec-product_{v+1}.md` with adjusted scopes and document what changed.
