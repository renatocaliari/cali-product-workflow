## Phase 5: Tech Planning Sequencing

### 5a. Scope Generation

Read `references/tech-planning/` (TECH-CONTEXT.md, SCOPES-AND-SEQUENCING.md, TECH-OUTPUT.md, generation-principles.md) and launch subagent:

```typescript
subagent({
  agent: "planner",
  task: `Generate tech scopes for the approved spec-product.md using references/tech-planning/.

1. Check strategic stability (Step 0)
2. Codebase awareness check (Step 1)
3. Technical risk analysis (Step 2)
4. Identify spikes (Step 3)
5. Define typed scopes: feature | optimization | spike (Step 4)
6. Sequence (riskiest-first or ui-first) (Step 5)
7. Detail each scope with DoD + acceptance criteria (Step 6)
8. Format per output-format.md (Step 7)

Output: .cali-product-workflow/{YYYY-MM-DD}/{_dir}/plans/spec-tech_{v}.md
Input: .cali-product-workflow/{YYYY-MM-DD}/{_dir}/plans/spec-product_{v}.md`,
  output: ".cali-product-workflow/{YYYY-MM-DD}/{_dir}/plans/spec-tech_{v}.md"
})
```

Output: `.cali-product-workflow/{YYYY-MM-DD}/{_dir}/plans/spec-tech_{v}.md`
Input: `.cali-product-workflow/{YYYY-MM-DD}/{_dir}/plans/spec-product_{v}.md`

⚠️ **Security check:** Read the YAML frontmatter of spec-product.md:
```bash
head -10 ...spec-product_{v}.md | grep "approved:"
```
- ✅ `approved: true` → proceed
- ❌ No `approved: true` → **GO BACK to Phase 4. Do not proceed.**
  This check is **deterministic** — does not depend on memory.

### 5b. Conditional Review Gate

**If standalone (no Shape Up/Interface):** execute the Review Gate on `spec-tech.md`:

```bash
plannotator annotate .cali-product-workflow/{YYYY-MM-DD}/{_dir}/plans/spec-tech_{v}.md --gate
```

After approval, stamp spec-tech.md (same procedure as Phase 4):
1. Add to YAML frontmatter:
   ```yaml
   approved: true
   approved_at: "<timestamp>"
   approved_via: plannotator --gate
   ```
2. Create receipt at `.plannotator/approvals/{_dir}/spec-tech_{v}.approved.md`:
   ```bash
   mkdir -p .plannotator/approvals/{_dir} && cat > .plannotator/approvals/{_dir}/spec-tech_{v}.approved.md << 'EOF'
   # Approval: spec-tech_{v}.md
   - Approved at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
   - Spec hash: `git hash-object .cali-product-workflow/.../spec-tech_{v}.md`
   - Verdict: approved
   EOF
   ```
3. spec-tech.md is frozen. Future revisions create `spec-tech_{v+1}.md`.

**If post-Shape-Up:** the gate already ran in Phase 4 — skip this step.

### 5c. Goal Generation (Step 9)

After tech plan approval, convert each scope into a `/sisyphus` goal with DoD as completion criteria:

**For each scope in the approved spec-tech.md:**

```typescript
/sisyphus Scope: {scope_name}

Steps:
1. {step 1}
   Done: {criterion}
2. {step 2}
   Done: {criterion}
...

DoD: {scope DoD}
AC: {acceptance criteria}
Deps: {scope dependencies}
```

**Optimization/spike scopes with metrics → `/skill:autoresearch-create`**
(they become experiment loops, not goals)

**Rules:**
- Scopes with dependencies: create goal AFTER the dependency is complete
- Use `pause_goal` with reason if a scope gets blocked
- `/goal-tweak` for scope adjustments during execution
