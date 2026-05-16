# @renatocaliari/pi-product-workflow

Complete product workflow package for pi.dev coding agent. Includes **15 specialized skills**, a powerful **extension with workflow commands**, and real-time **TUI tracking**.

---

## 🚀 Quick Start

```bash
# Start a new workflow
/product-workflow-start

# With file references and draft text
/product-workflow-start @brief.md "additional context"

/product-workflow-start @spec.md @requirements.md "OAuth login flow"

# Run the skill
/skill:cali-product-workflow
```

---

## 🎮 Commands

All commands use the `/product-workflow-` prefix. Short `/pw:` aliases also work:

| Command | Description | Alias |
|---------|-------------|-------|
| `/product-workflow-start` | Start workflow. Parses `@filename` and text as draft. | `/pw:start` |
| `/product-workflow-stop` | **Stop** and clear UI immediately. | `/pw:stop` |
| `/product-workflow-pause` | Pause (keeps state). | `/pw:pause` |
| `/product-workflow-resume` | Resume paused. Optional: `slug=myname` | `/pw:resume` |
| `/product-workflow-status` | Show current status. | `/pw:status` |
| `/product-workflow-list` | List all workflows (project + global). | `/pw:ls` |
| `/product-workflow-setphase phase=N` | Set phase (0-6). | `/pw:setphase` |
| `/product-workflow-next` | Advance to next phase. | `/pw:next` |
| `/product-workflow-complete` | Mark as completed. | `/pw:complete` |
| `/product-workflow-goto` | Navigate to workflow in another project. | `/pw:goto` |
| `/product-workflow-rename name=X` | Rename workflow slug. | `/pw:rename` |
| `/product-workflow-menu` | Open interactive overlay (phase list + actions). | `/pw:menu` |
| `/product-workflow-clean` | Archive orphaned/stalled workflows. | `/pw:clean` |

### Input Parsing Examples

```
/product-workflow-start                       → Placeholder slug "untitled-1"
/product-workflow-start @brief.md             → Slug from filename
/product-workflow-start Login flow            → Slug from text
/product-workflow-start @spec.md "OAuth"       → Both file and draft
/pw:start                                     → Same as above
```

> 💡 **Smart slug:** If no slug is provided, starts as `untitled-N`.
> After the Clarify phase completes, the extension automatically renames
> the workflow based on context (via `autoRenameFromDraft`).

### Cleanup

```
/pw:clean           → Archive workflows stalled >4h
/pw:clean hours=24  → Custom stall threshold
```

---

## 📊 Workflow Stages (Phases)

The workflow has **7 stages** that match exactly with `/skill:cali-product-workflow`:

| # | Stage | Skill Reference | Description |
|---|-------|-----------------|-------------|
| 0 | **Clarify** | Fase 0 | Initial questions, auto-discovery, workflow setup |
| 1 | **Shape** | Fase 1 | Shape Up Planning — understand, scope, risks |
| 2 | **Interface** | Fase 2 | Interface Brainstorming (conditional) |
| 3 | **Critique** | Fase 3 | Plan Critique — gap analysis |
| 4 | **Gate** | Fase 4 | Review Gate — Plannotator approval |
| 5 | **Planning** | Fase 5 | Tech Planning Sequencing |
| 6 | **Execution** | Fase 6 | Supervisor + Scope Executor |

### Stage Progression

```
Clarify → Shape → Interface → Critique → Gate → Planning → Execution
   ○        ○         ○         ○         ○        ○          ○   (not started)
   ▶        ○         ○         ○         ○        ○          ○   (Clarify active)
   ✓        ✓         ▶         ○         ○        ○          ○   (Interface active)
   ✓        ✓         ✓         ✓         ✓        ✓          ▶   (Execution active)
   ✓        ✓         ✓         ✓         ✓        ✓          ✓   (completed)
```

---

## 🖥️ TUI Updates

When a workflow is active, the **TUI is automatically updated** as the skill progresses.

The TUI is designed to be **compact and glanceable** — a single line in the footer
with the workflow slug, current phase, and contextual info.

### What Triggers Updates

| Trigger | TUI Change | Example |
|---------|-----------|---------|
| `/product-workflow-start` | **Adds** compact footer | `auth-system │ ◆ Shape 3/7 │ 3 assumptions` |
| Skill advances phase | **Updates** footer | `auth-system │ ◆ Interface 3/7 │ 5 proposals` |
| `/product-workflow-pause` | Footer changes to PAUSED | `⏸ auth-system` |
| `/product-workflow-resume` | Footer returns to normal | `auth-system │ ◆ Shape 3/7 │ ...` |
| `/product-workflow-stop` | **Removes** footer | Cleared |
| `/product-workflow-complete` | **Removes** footer | Cleared |
| Auto-rename (pós-Clarify) | Slug updates in-place | `untitled-1 → auth-system` |
| Phase transition | **Toast notification** | `◆ auth-system — entered Interface (3/7)` |

### TUI Visual

**Active Workflow (compact footer):**
```
│ auth-system  │  ◆ Shape 3/7  │  2 assumptions  │  /pw:menu for details
└─────────────────────────────────────────────────────────────────────
```

**Active Workflow (with artifacts):**
```
│ auth-system  │  ◆ Interface 3/7  │  5 proposals · hybrid:C  │  /pw:menu
└─────────────────────────────────────────────────────────────────────────
```

**Paused:**
```
│ ⏸ auth-system                                       │  ← Footer (warning)
└─────────────────────────────────────────────────────────────────────
```

### Interactive Overlay

Use `/pw:menu` or `/product-workflow-menu` to open the **interactive overlay** —
a focused dialog with the complete phase list, navigation, and quick actions.

```
╔═══════════════════════════════════╗
║  ◆ auth-system                    ║
║                                   ║
║  ✓ Clarify                       ║
║  ◆ Shape   ← current             ║
║  ○ Interface                     ║
║  ○ Critique                      ║
║  ○ Gate                          ║
║  ○ Planning                      ║
║  ○ Execution                     ║
║                                   ║
║  ↑↓ navigate  n:next  s:stop     ║
╚═══════════════════════════════════╝
```

### How Updates Work

The skill writes to `cali-product-workflow.json` when it advances phases. The extension watches for these changes:

1. **Skill advances phase** → writes to tracking file
2. **Extension detects change** (via `tool_call` and `turn_end` events)
3. **TUI updates** automatically — no command needed from user

### TUI Element Names

All TUI elements use clear, user-facing names:

| Element | Label | Purpose |
|---------|-------|---------|
| Footer status | `▶ {slug} [{stage}]` | Current workflow + stage |
| Widget | `▶ Workflow:` | Shows full workflow info |
| Notification | `▶ Workflow: {name} — Phase {n}: {stage}` | Phase transitions |

---

## 📋 Skills (15)

### Core Planning Skills (7)

| Skill | Invocation | What it Does |
|-------|-----------|--------------|
| **Product Workflow** | `/skill:cali-product-workflow` | Main orchestrator: Shape Up → Interface → Critique → Gate → Planning → Execution |
| **Short Cycle** | `/skill:cali-product-short-cycle` | Rapid validation: experiments, metrics, pre-sales, MVP |
| **Opportunity Mapping** | `/skill:cali-product-opportunity-mapping` | Strategic opportunity analysis |
| **Job-to-Be-Done** | `/skill:cali-product-job-to-be-done` | JTBD framework for needs discovery |
| **Evolutionary Principles** | `/skill:cali-product-evolutionary-principles` | Stepping-stones, product evolution |
| **Multi-Method Market** | `/skill:cali-product-multi-method-market-analysis` | PESTLE, Wardley Maps, Delphi, Foresight |
| **Scope Executor** | `/skill:cali-product-scope-executor` | Execute approved scopes autonomously |

### Growth & Marketing Skills (8)

| Skill | Invocation | What it Does |
|-------|-----------|--------------|
| **Ads** | `/skill:cali-product-ads` | Transtheoretical Model advertising |
| **Business Models** | `/skill:cali-product-business-models` | Business model creativity |
| **Health** | `/skill:cali-product-health` | Product health monitoring |
| **Marketplace Playbook** | `/skill:cali-product-marketplace-playbook` | Supply/demand balance tactics |
| **Open Source** | `/skill:cali-product-open-source` | Open source strategy |
| **Pricing** | `/skill:cali-product-pricing` | Pricing strategies |
| **Promotions** | `/skill:cali-product-promotions` | MAGIC launch promotions |
| **Trust Building** | `/skill:cali-product-trust-building` | Trust mechanisms |

---

## 🔧 Dependencies

| Extension | Package | Purpose |
|-----------|---------|---------|
| **pi-subagents** | `pi-subagents` | Parallel execution, built-in agents |
| **pi-goal** | `@capyup/pi-goal` | `/goal`, `/sisyphus` modes |
| **plannotator** | `@plannotator/pi-extension` | Plan review with `--gate` |
| **autoresearch** | `pi-autoresearch` | Optimization experiments |
| **ask-user-question** | `@juicesharp/rpiv-ask-user-question` | Structured questions |
| **intercom** | `pi-intercom` | Session messaging |
| **supervisor** | `pi-supervisor` | Outcome steering |

---

## 📦 Installation

```bash
# From local path
pi install ~/Development/pi-product-workflow

# From npm (after publishing)
pi install npm:@renatocaliari/pi-product-workflow

# Copy AGENTS.md for automatic triggering
cp ~/Development/pi-product-workflow/AGENTS.md ~/.pi/agent/AGENTS.md
```

---

## 📁 Tracking Files

| File | Location | Purpose |
|------|----------|---------|
| `cali-product-workflow.json` | Project root | Local workflow state |
| `.cali-product-workflow-global.json` | Home directory | Cross-project workflows |

---

## 📊 Version

**Current**: 0.1.0-alpha

---

## License

MIT - Cali 2024