## Phase 2: Interface Brainstorming

Read \`references/interface/archetypes.md\` (5 archetypes), \`references/interface/output-format.md\`,
and each individual archetype reference to guide the corresponding proposal.

**Generate each proposal individually in parallel** (5 independent workers):

```typescript
subagent({
  tasks: [
    { agent: "worker", task: `Generate Proposal A (Archetype A — [description from references/interface/archetypes.md]) for [product context]. Markdown output in full proposal format with ASCII wireframes, breadboarding and trade-offs.` },
    { agent: "worker", task: `Generate Proposal B (Archetype B — [archetype description]) for [product context]. Full format.` },
    { agent: "worker", task: `Generate Proposal C (Archetype C — [archetype description]) for [product context]. Full format.` },
    { agent: "worker", task: `Generate Proposal D (Archetype D — [archetype description]) for [product context]. Full format.` },
    { agent: "worker", task: `Generate Proposal E + Hybrid (Archetype E — [archetype description]) for [product context]. Include hybrid recommendation combining strong elements from multiple archetypes. Full format.` },
  ],
  concurrency: 5,
  context: "fork"
})
```

- Each worker generates **one** proposal (independent, no cross-contamination)
- Combined output: \`.cali-product-workflow/{YYYY-MM-DD}/{_dir}/interfaces/interfaces_{v}.md\`
- **Do not ask for input** — generate everything at once

**After generating the 5 proposals, submit to Plannotator for visualization:**

```bash
plannotator annotate .cali-product-workflow/{YYYY-MM-DD}/{_dir}/interfaces/interfaces_{v}.md
```

After visual review, ask the user which proposal to follow:

```typescript
ask_user_question({
  questions: [{
    question: `Which interface direction to follow?
Recommendation: Hybrid (combination of each proposal's strengths).
Justification: [1-2 sentences].`,
    header: "Interface",
    options: [
      {
        label: "H — Hybrid (Recommended)",
        description: "Combination of the best elements from multiple proposals."
      },
      {
        label: "A — Proposal A",
        description: "Archetype A ({archetype name}) — {summary}"
      },
      {
        label: "B — Proposal B",
        description: "Archetype B ({archetype name}) — {summary}"
      },
      {
        label: "C — Proposal C",
        description: "Archetype C ({archetype name}) — {summary}"
      },
      {
        label: "D — Proposal D",
        description: "Archetype D ({archetype name}) — {summary}"
      },
      {
        label: "E — Proposal E",
        description: "Archetype E ({archetype name}) — {summary}"
      }
    ]
  }]
})
```

After selection, create \`spec-product_{v+1}.md\` incorporating the chosen interface (ASCII sketches).
