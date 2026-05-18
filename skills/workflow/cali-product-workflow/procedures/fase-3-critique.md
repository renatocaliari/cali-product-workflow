## Phase 3: Plan Critique

### 3a. Analysis via subagent

Launch subagent with checklists from `references/plan-critique/`:

```typescript
subagent({
  agent: "reviewer",
  task: `Review the spec-product.md using checklists from references/plan-critique/.
Read: CHECKLISTS.md (flows, states, affordances, data, system, feasibility) and output-format.
Output: Executive Summary + Critical Questions (🚨) + Important (🤔) + Minor (🔎) + Strengths.
Do NOT resolve gaps — only identify and classify.
Save to .cali-product-workflow/{YYYY-MM-DD}/{_dir}/plans/critique-report.md`,
  output: ".cali-product-workflow/{YYYY-MM-DD}/{_dir}/plans/critique-report.md"
})
```

### 3b. Gap Resolution

Ask mode: **Auto-resolve** (applies rules from `auto-resolve-rules.md`) or **Manual** (ask one by one).

- 🔎 is always automatic
- Auto-resolve: save `spec-product_{v}-pre-critique.md`, create `spec-product_{v+1}.md` with
  "Resolved Gaps" section, and show change summary before proceeding
- Manual: ask each 🚨 and 🤔 individually
- After resolving, create `spec-product_{v+1}.md` with documented resolutions
