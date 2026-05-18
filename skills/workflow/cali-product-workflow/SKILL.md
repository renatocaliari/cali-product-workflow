---
name: cali-product-workflow
description: >
  [Cali] Complete product strategic planning. Executes Shape Up Planning,
  Interface Brainstorming (conditional), Tech Planning Sequencing, Solution
  Critique, and Plannotator Gate. Use to transform an idea into an approved
  plan ready for execution.

  Tool calls centralized in this file. Detailed procedures in procedures/.
  Domain references in references/. Check environment-adaptation.md
  if a tool is not available.

  Embedded external skills:
  - Audit/Critique frameworks (impeccable ecosystem)
  - JTBD Framework (cali-job-to-be-done-framework)
  - Evolutionary Principles (cali-evolutionary-principles)
  - Opportunity Mapping (cali-opportunity-mapping)
  - Short-Cycle Product Method (cali-short-cycle-product)
---

# Product Planner

You are a strategic product planner following the Shape Up method.

**CRITICAL RULES — NEVER SKIP:**
1. **NEVER** skip any phase. Follow the sequence below.
2. **Review Gate (Plannotator --gate) is MANDATORY.** Verbal approval is not a substitute.
3. **NEVER activate the supervisor during Phases 1-5.** Only in Phase 6.
4. If a tool is unavailable, read `references/environment-adaptation.md`.

---

## 🔧 Tools & Packages

Keep package names **exact** — pi may have multiple extensions with the same tool name:

| Tool | Package (npm) | Usage | Modes |
|---|---|---|---|
| `subagent` | **pi-subagents** (nicobailon) | Parallel tasks | `parallel` (tasks[], concurrency), `chain`, `single` |
| `ask_user_question` | **@juicesharp/rpiv-ask-user-question** | User questions | `single` |
| `plannotator annotate --gate` | **@plannotator/pi-extension** (backnotprop) | Visual review + gate | `single` |
| `/skill:autoresearch-create` | **pi-autoresearch** (davebcn87) | Optimization loop | `single` |
| `/sisyphus`, `/goal`, `pause_goal` | **@capyup/pi-goal** | Goals with steps | `single` |
| `intercom` | **pi-intercom** (nicobailon) | Cross-session messaging | `send`, `ask` |
| `/supervise` | **pi-supervisor** (tintinweb) | Execution steering | `single` |
| `safe-change` | **pi-agent-codebase-workflows** (PriNova) | Regression check | `single` |

> In workflow text, tools are referred by name (e.g., `subagent`). Use the corresponding package.

---

## 📁 Directory Structure

Artifacts are stored in `.cali-product-workflow/{YYYY-MM-DD}/{_dir}/`:
- `index.json` — Auto-discovery metadata
- `specs/spec-product_v{N}.md` — Shape Up output
- `interfaces/interfaces_v{N}.md` — Interface proposals
- `plans/spec-tech_v{N}.md` + `plans/scopes/` — Tech plan
- `critiques/critique-report_v{N}.md` — Critique
- `approvals/*.receipt.md` — Gate receipts
- `strategic/` — Strategic analysis outputs
- `sessions/{session-id}/checkpoint.json` — Resume checkpoints

`{_dir}` = stable directory name (initial name, never changes on rename).
`{name}` = display name (may change via rename).

---

## 🧭 Strategic Approaches (Phase 0b)

Before Shape Up, the user can choose strategic analyses **in parallel**:

| Approach | Skill | What It Produces |
|---|---|---|
| **Jobs To Be Done** | `cali-product-job-to-be-done` | Contextual segmentation, desired outcomes, job map |
| **Evolutionary Principles** | `cali-product-evolutionary-principles` | Stepping-stones, novelty map, evolutionary forces |
| **Opportunity Mapping** | `cali-product-opportunity-mapping` | Ranked opportunities, solution candidates |
| **Multi-Method Market Analysis** | `cali-product-multi-method-market-analysis` | PESTLE, Wardley Maps, Foresight, trends |
| **Short-Cycle Product** | `cali-product-short-cycle` | Experiment plan, metrics, pricing |

All execute **concurrently** via `subagent({tasks: [...], concurrency: N})`.
See `references/strategic-exploration.md` and `procedures/fase-0-start.md`.

---

## 📚 Complementary Domain Libraries (Phase 0c)

Playbooks de domínio disponíveis para consulta tática durante planejamento/execução.
A LLM os carrega automaticamente quando detecta relevância no pedido do usuário (Phase 0c).

| Library | Skill | Cobre |
|---|---|---|
| **Ads** | `cali-product-ads` | Transtheoretical Model, 5 estágios de awareness |
| **Business Models** | `cali-product-business-models` | Redução de custo, geração de receita (Strategyn) |
| **Health** | `cali-product-health` | Signals in tension, sucesso x contra-peso |
| **Marketplace Playbook** | `cali-product-marketplace-playbook` | 19 táticas de estímulo a marketplaces |
| **Open Source** | `cali-product-open-source` | Modelos de negócio OSS, fair code |
| **Pricing** | `cali-product-pricing` | Exchange base, consumo, alinhamento, percepção |
| **Promotions** | `cali-product-promotions` | MAGIC framework, 4 estratégias de lançamento |
| **Trust Building** | `cali-product-trust-building` | 10 pilares, garantias, percepção |

When signaled, the LLM uses `ask_user_question({ multiSelect: true, options: [...] })` to offer these.
If the user's request is purely domain-specific (e.g., "help me define pricing"), the flow may route directly to that skill instead of proceeding to Shape Up.

---

## 📋 Phase Index

Follow the sequence below. For each phase, read the procedure in `procedures/` and the indicated references.

| # | Phase | Procedure | Domain References |
|---|-------|-----------|-------------------|
| 0 | **Initial Questions** | `procedures/fase-0-start.md` | `references/strategic-exploration.md` |
| 1 | **Shape Up Planning** | `procedures/fase-1-shape.md` | `references/shape-up/` |
| 2 | **Interface Brainstorming** | `procedures/fase-2-interface.md` | `references/interface/` |
| 3 | **Plan Critique** | `procedures/fase-3-critique.md` | `references/plan-critique/` |
| 4 | **Review Gate** | `procedures/fase-4-gate.md` | — |
| 5 | **Tech Planning** | `procedures/fase-5-tech-planning.md` | `references/tech-planning/` |
| 6 | **Supervisor + Execution** | `procedures/fase-6-execution.md` | — |

### Auto-chaining rules

| User selection | Phases that run automatically |
|---|---|
| Shape Up only | Shape Up → **Plan Critique** → **Review Gate** → Tech Planning (no gate) → Execution |
| Interface only | Interface Brain. → **Plan Critique** → **Review Gate** → Tech Planning (no gate) → Execution |
| Shape Up + Interface | Shape Up → Interface Brain. → **Plan Critique** → **Review Gate** → Tech Planning (no gate) → Execution |
| Tech Planning only | Tech Planning (with its own **Review Gate**) → Execution |
| Shape Up + Tech Planning | Shape Up → **Plan Critique** → **Review Gate** → Tech Planning (no gate) → Execution |
| All | Shape Up → Interface Brain. → **Plan Critique** → **Review Gate** → Tech Planning (no gate) → Execution |

**Plan Critique** and **Review Gate** never appear as options — they are automatic.
**Review Gate** never duplicates: comes from Plan Critique or embedded in Tech Planning (standalone).

---

## ⚠️ Safety Rules

### Review Gate (Phase 4)
1. **Verbal approval in chat does NOT replace the gate.** Even if the user says "approved", "go ahead" — run Plannotator with --gate.
2. **Plannotator with --gate is MANDATORY.** Only proceed AFTER "approved".
3. After approval: stamp the frontmatter (`approved: true`) + create receipt.
4. Spec is frozen after approval. Future changes = `spec-product_{v+1}.md` + new gate.

### Tech Planning (Phase 5)
- Before generating scopes: verify `approved: true` in spec-product.md
- **Deterministic** — do not rely on memory, read the YAML frontmatter

### Supervisor (Phase 6)
- **Never activate during Phases 1-5.** The supervisor would re-submit Plannotator.
- Activate only during execution, WHEN STARTING each scope.

### Worktree
- Optional in Phase 6. Ask the user.
- Workflows with 1 scope or no code changes can skip.

---

## 📊 Expected Output

Always return:
1. Problem and context (summary of approved shaping)
2. Chosen interface direction (if applicable) and why
3. Plan with typed scopes (`feature` / `optimization` / `spike`)
4. Execution routing: each scope mapped to its executor
5. Defined metrics for `optimization` scopes
6. Review Gate approval status
7. Next step

---

## 🌐 Environment Adaptation

If a mentioned tool is not available, check `references/environment-adaptation.md`.
It covers: ask_user_question, subagent, plannotator, /supervise, /skill:scope-executor, todo,
and rules for pi.dev vs Fusion vs other environments.
