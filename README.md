# @renatocaliari/pi-product-workflow

Product workflow package for pi.dev coding agent. Includes 15 specialized skills for product planning, strategy, and execution, plus a powerful extension with workflow management commands and real-time UI.

## 🎯 Quick Start

```bash
# 1. Start a new workflow (auto-generates slug if not provided)
/workflow-start

# 2. Or with details
/workflow-start slug=my-feature name="My Feature" source=./brief.md

# 3. See workflow status
/workflow-status

# 4. Advance phases
/workflow-next

# 5. Or stop everything
/workflow-stop
```

---

## 📋 Skills (15)

### Core Planning (7 skills)
| Skill | Invocation | Description |
|-------|-----------|-------------|
| **Product Workflow** | `/skill:cali-product-workflow` | Main workflow: Shape Up + Interface + Tech Planning + Critique + Gate |
| **Short Cycle** | `/skill:cali-product-short-cycle` | Rapid validation with experiments, metrics, pricing |
| **Opportunity Mapping** | `/skill:cali-product-opportunity-mapping` | Strategic opportunity analysis |
| **Job-to-Be-Done** | `/skill:cali-product-job-to-be-done` | JTBD framework for needs discovery |
| **Evolutionary Principles** | `/skill:cali-product-evolutionary-principles` | Stepping-stones and product evolution |
| **Multi-Method Market Analysis** | `/skill:cali-product-multi-method-market-analysis` | PESTLE, Wardley Maps, Delphi, Foresight |
| **Scope Executor** | `/skill:cali-product-scope-executor` | Execute approved scopes with autonomous overnight |

### Growth & Marketing (8 skills)
| Skill | Invocation | Description |
|-------|-----------|-------------|
| **Ads** | `/skill:cali-product-ads` | Advertising strategies (Transtheoretical Model) |
| **Business Models** | `/skill:cali-product-business-models` | Business model creativity |
| **Health** | `/skill:cali-product-health` | Product health monitoring |
| **Marketplace Playbook** | `/skill:cali-product-marketplace-playbook` | Supply/demand balance tactics |
| **Open Source** | `/skill:cali-product-open-source` | Open source strategy paradox |
| **Pricing** | `/skill:cali-product-pricing` | Pricing strategies and models |
| **Promotions** | `/skill:cali-product-promotions` | MAGIC launch promotion framework |
| **Trust Building** | `/skill:cali-product-trust-building` | Trust mechanisms and guarantees |

---

## 🎮 Workflow Commands

The extension registers these commands (use `/` prefix in chat):

| Command | Description |
|---------|-------------|
| `/workflow-start` | Start new workflow. Auto-generates slug. Options: `slug=`, `name=`, `description=`, `source=filepath` |
| `/workflow-stop` | **Stop immediately!** Clears UI, aborts workflow. Use for emergencies. |
| `/workflow-pause` | Pause workflow (keeps state for later) |
| `/workflow-resume` | Resume paused workflow. Optional: `slug=myslug` |
| `/workflow-status` | Show current workflow with progress bar and phase details |
| `/workflow-list` | List all workflows (project + global) |
| `/workflow-setphase phase=N` | Set current phase (0=Clarify, 1=Shape, 2=Bet, 3=Build, 4=Critique, 5=Gate) |
| `/workflow-next` | Advance to next phase |
| `/workflow-complete` | Mark workflow as completed |
| `/workflow-goto` | Show how to navigate to a workflow in another project |

### Start Examples

```bash
# Auto-generate slug
/workflow-start

# With custom slug
/workflow-start slug=auth-system

# Full options
/workflow-start slug=auth-system name="Auth System" description="Login and registration" source=./brief.md

# Start from existing document
/workflow-start source=./product-brief.md
```

---

## 🖥️ UI Features

When a workflow is active, the extension automatically shows:

### Footer Status
```
📍 auth-system [Shape 2/6] 33%
```
Shows: slug, current phase, progress percentage.

### Progress Widget (above editor)
```
🚀 auth-system
[████████░░░░░░░░░░░░] 33% — Shape
● Clarify ▶ Shape ○ Bet ○ Build ○ Critique ○ Gate
```

### Notifications
- Phase transitions show toast: `📍 Phase 2: Shape`
- Session resume shows workflow info

---

## 🌐 Cross-Project Discovery

Workflows are tracked in two places:
1. **Local**: `{project}/cali-product-workflow.json` — per-project workflows
2. **Global**: `~/.cali-product-workflow-global.json` — all workflows

When you open a project, the extension:
- Checks for workflows in that project
- Shows active workflow UI if found
- Lists other projects' workflows via `/workflow-list`

---

## 📁 Directory Structure

```
product-workflow/
└── {YYYY-MM-DD}/
    └── {slug}/
        ├── index.json
        ├── specs/
        ├── interfaces/
        ├── plans/
        ├── critiques/
        ├── approvals/
        └── sessions/
```

---

## 🔧 Dependencies & Integration

This package integrates with other pi.dev extensions for full orchestration:

| Extension | Package | Author | Purpose |
|-----------|---------|--------|---------|
| **pi-subagents** | `pi-subagents` | nicobailon | Parallel subagent execution |
| **pi-goal** | `@capyup/pi-goal` | capyup | Goal mode: `/goal`, `/sisyphus` |
| **plannotator** | `@plannotator/pi-extension` | backnotprop | Plan review with annotations |
| **autoresearch** | `pi-autoresearch` | davebcn87 | Autonomous experiment loop |
| **ask-user-question** | `@juicesharp/rpiv-ask-user-question` | juicesharp | Structured user questions |
| **intercom** | `pi-intercom` | nicobailon | Session-to-session messaging |
| **supervisor** | `pi-supervisor** | tintinweb | Chat steering toward outcomes |

---

## 📦 Installation

### 1. Install the package
```bash
# From npm (when published)
pi install npm:@renatocaliari/pi-product-workflow

# Or from local path
pi install ~/Development/pi-product-workflow
```

### 2. Install dependencies (recommended)
```bash
pi install npm:pi-subagents npm:@capyup/pi-goal @plannotator/pi-extension pi-autoresearch @juicesharp/rpiv-ask-user-question pi-intercom pi-supervisor
```

### 3. Copy AGENTS.md (optional but recommended)
```bash
cp pi-product-workflow/AGENTS.md ~/.pi/agent/AGENTS.md
```
This enables automatic triggering of the workflow for any software work request.

---

## 🔌 Extension Details

The extension (`extensions/cali-product-workflow/`) hooks into:

- `session_start` → Create directories, restore UI
- `turn_end` → Check phase changes
- `agent_end` → Update UI
- `session_shutdown` → Persist state (don't clear UI)

Commands are registered via `pi.registerCommand()` with descriptions that help the LLM understand when to use each command.

---

## 📊 Version

Current: **0.1.0-alpha**

---

## License

MIT - Cali 2024