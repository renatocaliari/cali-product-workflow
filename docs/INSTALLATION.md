# Installation Guide

This guide covers installing cali-product-workflow for different AI coding agent harnesses.

## Architecture: Dual-Install Pattern

pi-product-workflow uses a dual-install pattern (same as context-mode):

```
npm install -g @renatocaliari/pi-product-workflow  → Core (skills, adapters, CLI tools)
pi install npm:@renatocaliari/cali-product-workflow-pi  → Stub extension (Pi integration)
```

This allows:
- **Core package**: Works on all CLIs (skills are markdown)
- **Stub extension**: Lightweight Pi integration without duplicating core

---

## Quick Install (pi)

### Automated (Recommended)

```bash
# Clone and run setup
git clone https://github.com/renatocaliari/pi-product-workflow.git
cd pi-product-workflow
./scripts/setup.sh
```

Or use the single installer:

```bash
./install.sh
```

### Manual

```bash
# 1. Install core package
pi install npm:@renatocaliari/pi-product-workflow

# 2. Install stub extension (Pi integration)
pi install npm:@renatocaliari/cali-product-workflow-pi

# 3. Install supporting packages
pi install npm:pi-subagents
pi install npm:pi-goal
pi install npm:pi-intercom
pi install npm:pi-supervisor
pi install npm:pi-autoresearch
pi install npm:@plannotator/pi-extension
pi install npm:@juicesharp/rpiv-ask-user-question
```

---

## For Other CLIs

### Generic Install (npm)

```bash
npm install -g @renatocaliari/pi-product-workflow
```

Works on any system with Node.js >= 20.0.0. Skills are markdown files.

### opencode

```json
{
  "plugins": ["@renatocaliari/pi-product-workflow"]
}
```

### claude-code

```bash
/plugin marketplace add renatocaliari/pi-product-workflow
/plugin install pi-product-workflow@pi-product-workflow
```

### codex

```bash
codex plugin marketplace add renatocaliari/pi-product-workflow
```

---

## Installation Methods Summary

| CLI | Method | Packages |
|-----|--------|----------|
| **pi** | Dual-install | Core + Stub Extension |
| **opencode** | Plugin | Core package |
| **claude-code** | Marketplace | Core package |
| **codex** | Plugin | Core package |
| **generic** | npm | Core package only |

---

## Dependencies

### Required (all CLIs)

| Package | Purpose | Min Version |
|---------|---------|-------------|
| typebox | Runtime type validation | * |

### Pi-Specific (dual-install)

| Package | Purpose | Install Location |
|---------|---------|-----------------|
| `@renatocaliari/pi-product-workflow` | Core (skills, adapters) | npm (global) |
| `@renatocaliari/cali-product-workflow-pi` | Stub extension | npm (Pi extension) |
| pi-subagents | Parallel task execution | Pi package |
| plannotator | Visual review gate | Pi package |
| pi-goal | Goal execution mode | Pi package |
| ask-user-question | Structured questions | Pi package |
| intercom | Cross-session messaging | Pi package |
| supervisor | Outcome steering | Pi package |
| pi-autoresearch | Optimization loops | Pi package |
| context-mode | Context reduction (98%) | Optional |

---

## Auto-trigger (Optional)

Enable auto-trigger to get workflow context in all projects:

```bash
cp ~/pi-product-workflow/AGENTS.md ~/.pi/agent/AGENTS.md
```

To disable:
```bash
rm ~/.pi/agent/AGENTS.md
```

---

## Verification

### Generic verification

```bash
npm list -g @renatocaliari/pi-product-workflow
```

### Pi-specific verification

```bash
pi list | grep product-workflow
```

You should see:
- `@renatocaliari/pi-product-workflow` (core)
- `@renatocaliari/cali-product-workflow-pi` (stub)

---

## Troubleshooting

### Skills not loading

Check that packages are installed:
```bash
pi list | grep product-workflow
```

### Commands not found

Restart the CLI after installation:
```bash
pi --reload
```

### Auto-trigger not working

Verify AGENTS.md is in place:
```bash
cat ~/.pi/agent/AGENTS.md | head
```

---

## Uninstallation

### Automated

```bash
cd ~/pi-product-workflow
./scripts/uninstall.sh
```

### Manual

```bash
# Remove packages (dual-install)
pi remove npm:@renatocaliari/pi-product-workflow
pi remove npm:@renatocaliari/cali-product-workflow-pi

# Remove auto-trigger
rm ~/.pi/agent/AGENTS.md

# Remove supporting packages (optional)
pi remove npm:pi-subagents npm:pi-goal npm:@plannotator/pi-extension
```

---

## From Source

For development or customization:

```bash
git clone https://github.com/renatocaliari/pi-product-workflow.git
cd pi-product-workflow

# For Pi
pi install .

# For other CLIs
npm install -g .
```