# Installation Guide

This guide covers installing cali-product-workflow for different AI coding agent harnesses.

## Quick Install (pi)

```bash
# Install via npm
pi install npm:@renatocaliari/pi-product-workflow

# Or from source
git clone https://github.com/renatocaliari/pi-product-workflow.git
cd pi-product-workflow
pi install ./
```

### Optional: Auto-trigger

Enable auto-trigger in all projects:

```bash
cp ~/pi-product-workflow/AGENTS.md ~/.pi/agent/AGENTS.md
```

To disable:
```bash
rm ~/.pi/agent/AGENTS.md
```

---

## Installation Methods

### Method 1: NPM Package (Recommended)

```bash
pi install npm:@renatocaliari/pi-product-workflow
```

This installs the package with all skills and dependencies.

### Method 2: From Source

```bash
git clone https://github.com/renatocaliari/pi-product-workflow.git ~/pi-product-workflow
cd ~/pi-product-workflow
pi install ./
```

### Method 3: Quick Test (No Install)

```bash
pi -e npm:@renatocaliari/pi-product-workflow
```

---

## Dependencies

### Required

| Package | Purpose | Min Version |
|---------|---------|-------------|
| pi-subagents | Parallel task execution | 0.24.0 |
| plannotator | Visual review gate | 0.19.0 |
| pi-goal | Goal execution mode | 0.6.0 |
| ask-user-question | Structured questions | 1.6.0 |
| intercom | Cross-session messaging | 0.6.0 |
| supervisor | Outcome steering | 0.4.0 |

### Optional

| Package | Purpose | Benefit |
|---------|---------|---------|
| context-mode | Context reduction (98%) | Lower token usage |
| autoresearch | Optimization loops | Experiment automation |

---

## Setup Script

Run the setup script for automated installation:

```bash
cd ~/pi-product-workflow
./scripts/setup.sh
```

This script:
1. Installs npm dependencies
2. Copies AGENTS.md to enable auto-trigger
3. Verifies installation

---

## Verification

Check installation:

```bash
pi list
```

You should see:
- `@renatocaliari/pi-product-workflow`
- All dependencies

---

## For Other CLIs

### opencode

```json
{
  "plugins": ["@renatocaliari/pi-product-workflow"]
}
```

### claude-code

```bash
/plugin marketplace add renatocaliari/pi-product-workflow
```

### codex

Installation method TBD ( Codex may use different plugin system).

---

## Troubleshooting

### Skills not loading

Check that the package is installed:
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

```bash
cd ~/pi-product-workflow
./scripts/uninstall.sh
```

Or manually:
```bash
rm ~/.pi/agent/AGENTS.md
pi uninstall @renatocaliari/pi-product-workflow
```