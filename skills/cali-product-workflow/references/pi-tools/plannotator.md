# Tool: plannotator annotate --gate

> Visual review with human approval gate for PI workflow.

---

## Specific Command (PI)

```bash
plannotator annotate <file>.md --gate
```

| Info | Value |
|------|-------|
| Package | @plannotator/pi-extension (backnotprop) |
| Command | `plannotator annotate <file>.md --gate` |
| Example | `plannotator annotate .cali-product-workflow/2026-05-19/pw-xxx/specs/spec-product_v1.md --gate` |

---

## When to Use

| Phase | Purpose | File |
|-------|---------|------|
| Phase 5 | Shape Up spec approval | `specs/spec-product_v{N}.md` |
| Phase 8 | Interface proposals approval | `interfaces/interfaces_v{N}.md` |
| Standalone Tech Planning | Plan approval (no Shape Up) | `plans/spec-tech_v{N}.md` |

---

## ⚠️ CRITICAL: --gate Flag

**The `--gate` flag is MANDATORY.**

| Without `--gate` | With `--gate` |
|------------------|--------------|
| ❌ No Approve button | ✅ Approve button visible |
| ❌ No blocking | ✅ Blocks until approval |
| ❌ Opens in background | ✅ Opens as active review |
| ❌ Can be skipped | ✅ Forces decision |

**If you forget `--gate`:** UI opens but user cannot approve, and workflow continues incorrectly.

---

## After Approval

After user approval:

### 1. Stamp YAML frontmatter
```yaml
approved: true
approved_at: "2026-05-19T15:00:00-03:00"
approved_via: plannotator --gate
```

### 2. Create receipt
```bash
mkdir -p .plannotator/approvals/{_dir}
cat > .plannotator/approvals/{_dir}/{filename}_v{N}.approved.md << 'EOF'
# Approval: {filename}_v{N}.md
- Approved at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
- Spec hash: `git hash-object <file>`
- Verdict: approved
EOF
```

### 3. File is frozen
Future changes require new version + new gate.

---

## Fallback (Other Harnesses)

If `plannotator` is not available:
- Use manual visual review with approval tracking
- Block execution until explicit reviewer confirmation
- Document approval in manual receipt file

**Abstraction:** "Visual review gate with blocking human approval"