---
name: cali-scope-executor
description: >
  [Cali] Reads an approved product plan with typed scopes (feature, optimization, spike)
  and routes each scope to its correct executor. Acts as the autonomous overnight
  "set and forget" orchestrator — the pi equivalent of /goal for approved plans.
---

# Execution Executor

Autonomous plan execution orchestrator. Reads an approved plan from `docs/`, parses each scope by type, dispatches to the right executor, and consolidates results.

This skill is designed to run **after** the Plannotator gate approves the plan. It replaces manual step-by-step execution with a single autonomous orchestration pass.

---

## Input

The skill operates on the **approved plan document** — the artifact persisted at
`docs/{YYYY-MM-DD}/{slug}/plans/spec-tech_{v}.md` after the Plannotator gate passes.

Where `{slug}` is a short kebab-case identifier for the project (e.g. `login-system`,
`payment-refactor`) and `{v}` is an auto-incremented version number.

The plan must contain scopes with type annotations:
- `[TYPE] feature` — implement new functionality
- `[TYPE] optimization` — improve a measurable metric (must include `[METRIC]`)
- `[TYPE] spike` — research or prototype

If the plan has the optional **"Execution routing"** section (from cali-product-workflow), use it directly. Otherwise, infer routing from `[TYPE]` tags.

---

## Role

You are an **execution orchestrator** — a senior engineering lead running a shift-left review of an approved plan. Your job is NOT to redesign or question the plan (that already happened in earlier phases). Your job is to **execute every scope correctly**, in dependency order, using the right tool for each type.

You have access to all pi tools and subagents. Use them.

---

## Workflow

### Step 1: Read and parse the plan

Read the approved plan file. Identify every scope and its type.

Example scope shape:
```
[SCOPE-1]
[TYPE] feature
Objective: Implement user login
Dependencies: None
DoD: User can log in with email/password
ACs: - Email and password fields validate
     - Successful login redirects to dashboard
     - Failed login shows error message
```

```
[SCOPE-2]
[TYPE] optimization
[METRIC] API P95 latency < 200ms (lower is better)
Objective: Optimize search endpoint
Dependencies: SCOPE-1
DoD: Search latency meets target
```

```
[SCOPE-3]
[TYPE] spike
Objective: Evaluate vector database options
Dependencies: None
DoD: Recommendation document with pros/cons
```

Build an execution plan respecting dependencies: scopes with no dependencies run first, dependent scopes wait.

### Step 2b: Resolve executor per scope

Para cada scope no plano:
1. Verifique se há `[EXECUTOR]` explícito
2. Se SIM → ignore o `[TYPE]`, use o executor especificado
3. Se NÃO → use o routing padrão por tipo

| `[TYPE]` | `[EXECUTOR]` | Resultado |
|---|---|---|
| `feature` | *ausente* → worker |
| `feature` | `autoresearch` → **autoresearch** (override) |
| `optimization` | *ausente* → autoresearch |
| `optimization` | `worker` → **worker** (override) |
| `spike` | *ausente* → scout + researcher |
| `spike` | `autoresearch` → **autoresearch** (override, raro) |

### Step 2c: Report the execution plan

Before executing, present a clear execution plan to the user com o executor já resolvido:

```
📋 Execution Plan for: {plan-name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 1 (parallel):
  ⏩ [SCOPE-1] Login — feature → worker
  ⏩ [SCOPE-3] Vector DB eval — spike → scout + researcher
  ⏩ [SCOPE-4] Refatorar pagamentos — feature → autoresearch (override)

Phase 2 (after SCOPE-1):
  ⏩ [SCOPE-2] Search optimization — optimization → autoresearch
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Ask the user:
```
Shall I proceed with autonomous execution? I'll report back when all scopes are complete.
```

If the user says yes, proceed autonomously. If no, ask what they'd like to adjust.

### Step 3: Execute feature scopes (feature → worker)

Para cada scope com executor resolvido = `worker` (seja por default do tipo feature ou por override [EXECUTOR] worker):

1. **Spawn worker** with the scope's DoD and ACs as the task:
   ```typescript
   subagent({
     agent: "worker",
     task: `Implement [SCOPE-X]: {objective}
   DoD: {DoD}
   ACs: {acceptance criteria}
   Files in scope: {from plan or inferred}
   Constraints: tests must pass, no regressions`,
     context: "fork"
   })
   ```
2. **After worker completes, run parallel-review:**
   ```typescript
   subagent({
     tasks: [
       { agent: "reviewer", task: "Review diff for correctness and regressions", output: false },
       { agent: "reviewer", task: "Review diff for simplicity and code quality:
- KISS: é a solução mais simples possível?
- DRY: há duplicação que deveria ser extraída?
- Nenhuma função > 50 linhas
- Nenhum arquivo > 400 linhas
- Complexidade ciclomática baixa (max 3 níveis de indentação)
- Se for Go + Datastar: Locality of Behavior seguido? (data-* attributes no componente, zero JS solto)
- Se for React/Vue/Svelte: Separation of Concerns seguido? (lógica extraída do template)

Reporte violações como sugestões — o worker deve corrigir.", output: false }
     ],
     concurrency: 2,
     context: "fresh"
   })
   ```
3. **Apply feedback:** synthesize reviewer findings and apply fixes worth doing now
4. **If the scope involves UI/visual changes**, run quality checks:
   - `/skill:audit` — accessibility (WCAG POUR), performance, theming, anti-patterns. Carregue a skill antes de usar.
   - `/skill:critique` — design review (heuristics, cognitive load, AI slop detection). Carregue a skill antes de usar.
   
   Use-as diretamente — não dependem de outras skills de design.
5. **Mark scope as complete** and move to the next

### Step 4: Execute optimization scopes (optimization → autoresearch)

Para cada scope com executor resolvido = `autoresearch` (seja por default do tipo optimization ou por override [EXECUTOR] autoresearch):

1. **Check if autoresearch is already set up** for this scope (look for existing `autoresearch.md` with matching metric)
2. **If not set up, launch autoresearch setup:**
   ```typescript
   subagent({
     agent: "delegate",
     task: `Setup autoresearch for optimization scope [SCOPE-X]:
   Objective: {objective}
   Command: {infer from metric or use plan's suggested command}
   Metric: {metric name} ({unit}, {direction} is better)
   Files in scope: {from plan}
   Constraints: {from plan, e.g. tests must pass}
   Use /skill:autoresearch-create and configure the loop.
   Once configured, let it run autonomously.`,
     context: "fork"
   })
   ```
3. **Set a stopping condition.** Autoresearch loops forever by default. Set `maxIterations` in `autoresearch.config.json` or define a target:
   - If metric target is defined in the plan (e.g., `API P95 latency < 200ms`): stop when target is met
   - If no target: run for a reasonable number of iterations (10-20) or until improvements plateau
   - Use the autoresearch widget/dashboard to monitor progress
4. **When autoresearch completes** (target met or iterations exhausted), run `parallel-review` on the optimization changes
5. **Mark scope as complete**

### Step 5: Execute spike scopes (spike → scout + researcher)

Para cada scope com executor resolvido = `scout` (seja por default do tipo spike ou por [EXECUTOR] scout):

1. **Run parallel investigation:**
   ```typescript
   subagent({
     tasks: [
       { agent: "scout", task: `Investigate existing codebase for: {objective}. Find relevant files, patterns, and constraints.` },
       { agent: "researcher", task: `Research best practices and solutions for: {objective}. Provide concrete options with pros/cons.` }
     ],
     concurrency: 2,
     context: "fresh"
   })
   ```
2. **Consolidate findings** into a recommendation document at `docs/{YYYY-MM-DD}/{slug}/plans/spikes/{scope-name}-decision.md` (create the `spikes/` subdirectory if needed)
3. **If the spike reveals a code change is needed,** optionally run `parallel-review`
4. **Mark scope as complete**

### Step 6: Handle dependencies between scopes

- Scopes without dependencies can run **in parallel** (up to reasonable concurrency)
- If a scope depends on another, wait for it to complete first
- Use `subagent` with `async: true` and check status periodically for parallel phases
- After all scopes in a phase complete, proceed to the next phase

### Step 7: Compliance Check

Antes de gerar o relatório final, cruze o plano original (spec-tech.md) com o que foi executado:

1. **Cobertura:** todo scope do spec-tech.md foi executado?
   - Se algum scope foi pulado: documente o motivo no relatório
   - Se scopes extras foram criados: documente a justificativa
2. **DoD:** cada scope executado atingiu seu Definition of Done original?
   - Se não: documente o gap
3. **Princípios:** leia `references/tech-planning/generation-principles.md`
   e verifique se os princípios foram seguidos no código gerado
   - Se violações foram detectadas pelo parallel-review: foram corrigidas?
4. **Resultado da verificação:** APROVADO | RESSALVAS | REPROVADO

### Step 8: Report results

After all scopes are executed and compliance verified, produce a consolidated report and save it:

**Save to:** `docs/{YYYY-MM-DD}/{slug}/execution-report.md`

```
📊 Execution Results: {plan-name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ [SCOPE-1] Login — feature — DONE (3 files changed, 2 reviews passed)
✅ [SCOPE-2] Search optimization — optimization — DONE (latency 180ms, target <200ms ✓)
✅ [SCOPE-3] Vector DB eval — spike — DONE (recommendation in docs/spikes/)

Timeline: {total duration}
Commits: {commit hashes for each scope}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Next steps:
- Review and merge branches
- Run full test suite
```

---

## Parallel Execution Rules

- **Independent scopes can run in parallel.** Use subagent's `async: true` + `concurrency` to run multiple scopes simultaneously.
- **Dependent scopes must wait.** If SCOPE-2 depends on SCOPE-1, do not start SCOPE-2 until SCOPE-1 is complete and reviewed.
- **Worktree isolation** is available via `worktree: true` for scopes that might touch overlapping files. Use it when multiple feature scopes modify the same area.
- **Reasonable concurrency:** 2-3 parallel scopes maximum unless the plan explicitly allows more. Running too many in parallel increases the risk of conflicts.

---

## Error Handling

- **If a worker fails** (crash, stuck, timeout): note it, log the error, and move to the next scope. Do not block the entire execution on one failure.
- **If autoresearch crashes:** check the log, fix if trivial, otherwise skip and note it.
- **If a reviewer finds blocking issues:** flag them but continue execution. Report them in the final summary. Do not halt the pipeline for review findings — the user will address them.
- **If a spike is inconclusive:** document what was learned and recommend next steps.

---

## Execution Modes

This skill supports two modes, chosen at the start:

| Mode | Behavior |
|------|----------|
| **Full autonomous** | Execute all scopes without pausing. Report at the end. Best for overnight runs. |
| **Scope-by-scope** | Execute one scope, present results, ask to proceed. Best for interactive oversight. |

The default is **Full autonomous**. Ask the user if they want scope-by-scope instead.

---

## Workflow Position

This skill runs **after** the Plannotator gate approves the plan, replacing manual execution:

```
1. Shape Up Planning → spec-product.md (business rules, scope, risks)
2. [Optional] Interface Brainstorming → interfaces.md (wireframes, proposals)
3. Plan Critique → gap analysis on product spec + revision
4. Plannotator Gate → approves spec-product.md ← PRODUCT APPROVED
5. Tech Planning Sequencing → spec-tech.md (product context + tech scopes)
6. Execution Executor ← YOU ARE HERE
   ├── Read spec-tech.md (has product context + typed scopes)
   ├── Report execution plan → user confirms
   ├── Execute features → worker + parallel-review
   ├── Execute optimizations → autoresearch
   ├── Execute spikes → scout + researcher
   └── Report consolidated results to execution-report.md
```

---

## How to invoke

### Com pi-supervisor (recomendado)

O **pi-supervisor** é uma extensão que observa a conversa com um LLM separado
(pode ser um modelo mais barato) e steering o agente de volta se ele desviar
do objetivo. Use o slash command `/supervise` antes de começar:

```bash
/supervise Execute o plano aprovado em docs/{YYYY-MM-DD}/{slug}/plans/spec-tech_{v}.md
roteando scopes corretamente. Salve relatório em execution-report.md.
```

Depois que o supervisor confirmar (resposta "Supervision started"), prossiga:

```bash
/skill:cali-scope-executor
```

O supervisor vai observar cada turno e, se o agente desviar do plano,
injetar uma mensagem de steering para corrigir o curso.

### Sem supervisor

```bash
/skill:cali-scope-executor
```

### From a parent agent (programmatic):

```typescript
subagent({
  agent: "worker",
  task: "Execute the approved plan at docs/2026-05-12/login-system/plans/spec-tech_1.md using the cali-scope-executor skill. Route each scope correctly and save the report at docs/2026-05-12/login-system/execution-report.md.",
  skills: ["cali-scope-executor", "autoresearch-create"],
  context: "fork"
})
```

**As a follow-up to cali-product-workflow:**

After the cali-product-workflow produces an approved plan, the same agent (or a new one) can continue:

```typescript
subagent({
  agent: "delegate",
  task: `The plan at docs/{YYYY-MM-DD}/{slug}/plans/spec-tech_{v}.md is approved. Execute it using cali-scope-executor skill and save the report.`,
  skills: ["cali-scope-executor"],
  context: "fork"
})
```

---

## Interaction with Other Tools

| Tool/Skill | How this skill uses it |
|------------|----------------------|
| **worker** (pi-subagents) | Implements feature scopes |
| **reviewer** (pi-subagents) | Reviews implementation diffs |
| **scout** (pi-subagents) | Investigates codebase for spike scopes |
| **researcher** (pi-subagents) | External research for spike scopes |
| **autoresearch-create** | Sets up optimization experiment loops |
| **autoresearch.config.json** | Controls max iterations for optimization scopes |
| **parallel-review** (pi-subagents) | Runs adversarial review after implementation |
| **worktree** (pi-subagents) | Isolates parallel feature work |

---

## Output Expectations

Strong execution runs:
- **Respect dependency order** — no scope starts before its dependencies
- **Use the right tool for each type** — worker for features, autoresearch for optimization, scout for spikes
- **Handle failures gracefully** — one failed scope doesn't block the rest
- **Produce a clear final report** — what was done, what changed, what failed

Weak execution runs:
- **Run everything sequentially** when parallel is safe
- **Use worker for optimization scopes** (loses the autoresearch loop advantage)
- **Ignore scope types** and treat everything as implementation
- **Block on minor failures** or reviewer feedback
