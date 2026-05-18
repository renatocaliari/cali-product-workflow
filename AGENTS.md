# Development Guidelines

## Project Overview

`pi-product-workflow` is a pi.dev extension package that provides product planning workflows using Shape Up methodology. It bundles 13 specialized skills for product planning, strategy, and execution.

## Quick Start

```bash
# Install locally
pi install ./pi-product-workflow

# Or from npm (when published)
pi install npm:@renatocaliari/pi-product-workflow
```

## Development

### Testing Changes

1. Make changes to skills or extensions
2. Install locally:
   ```bash
   pi install ./path/to/pi-product-workflow
   ```
3. Reload pi to pick up changes:
   ```bash
   /reload
   ```

### Skill Development

Skills are in `skills/` directory. Each skill has:
- `SKILL.md` - The skill definition with triggers and prompts
- `references/` - Optional reference files coupled to the skill

### Extension Development

Extensions are in `extensions/` directory. See [pi.dev docs](https://pi.dev/docs/extensions) for API details.

## Related Extensions

This package integrates with:
- `pi-subagents` (nicobailon) - Subagent orchestration
- `pi-goal` (capyup) - Goal management
- `plannotator` (backnotprop) - Plan review
- `pi-autoresearch` (davebcn87) - Experiment loops
- `pi-intercom` (nicobailon) - Session messaging
- `pi-supervisor` (tintinweb) - Chat steering
- `ask-user-question` (juicesharp) - Structured questions

## Publishing

```bash
# Version bump
npm version patch  # or minor, major

# Publish
npm publish --access public

# Or use release-please for automated releases
```

## Architecture

```
pi-product-workflow/
├── skills/
│   ├── workflow/                    # 1 orchestrator
│   │   └── cali-product-workflow/
│   ├── strategic-analysis/          # 5 exploration skills (Phase 0b)
│   │   ├── cali-product-job-to-be-done/
│   │   ├── cali-product-evolutionary-principles/
│   │   ├── cali-product-opportunity-mapping/
│   │   ├── cali-product-multi-method-market-analysis/
│   │   └── cali-product-short-cycle/
│   ├── domain-libraries/            # 8 tactical playbooks (Phase 0c)
│   │   ├── cali-product-ads/
│   │   ├── cali-product-business-models/
│   │   ├── cali-product-health/
│   │   ├── cali-product-marketplace-playbook/
│   │   ├── cali-product-open-source/
│   │   ├── cali-product-pricing/
│   │   ├── cali-product-promotions/
│   │   └── cali-product-trust-building/
│   └── execution/                   # 1 autonomous executor
│       └── cali-product-scope-executor/
├── extensions/
│   └── cali-product-workflow/
└── scripts/
```

## Commands

- `/skill:cali-product-workflow` - Main workflow
- `/skill:cali-product-short-cycle` - Short cycle validation
- `/skill:cali-product-opportunity-mapping` - Opportunity analysis
- etc.

## License

MIT - See LICENSE file