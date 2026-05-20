# Technical Spec: Multi-CLI Support - Next Steps

**Version:** v1  
**Status:** Draft - For Execution  
**Date:** 2026-05-20  
**Author:** Cali (Renato Caliari)

---

## 0. Product Context

### Current State
Multi-CLI support implemented for pi, opencode, claude-code, codex. All scopes completed.

### Remaining Work
1. **Integration testing** on actual CLIs
2. **Mutation testing** for critical paths
3. **CI/CD setup** with gates
4. **Documentation** for each CLI

---

## 1. Identified Scopes

| # | Scope | Type | Justification |
|---|-------|------|---------------|
| 0 | spike-cli-integration-testing | spike | Learn CLI integration patterns |
| 1 | feature-integration-tests | feature | Test workflow on actual CLIs |
| 2 | feature-mutation-testing | feature | Add Stryker for critical paths |
| 3 | feature-cicd-gates | feature | Setup CI/CD with quality gates |

---

## 2. High-Level Sequence

```
[spike-cli-integration-testing]
       ↓
[feature-integration-tests]
       ↓
[feature-mutation-testing]
       ↓
[feature-cicd-gates]
```

---

## 3. Detailed Scopes

---

## [SCOPE-0] spike-cli-integration-testing

**Type:** spike  
**Objective:** Research CLI integration patterns and create testing strategy  
**Rationale:** Need to understand how to test on each CLI before writing tests

### Tasks
1. Research OpenCode plugin testing patterns
2. Research Claude Code plugin testing patterns  
3. Research Codex plugin testing patterns
4. Identify what can be tested in CI vs manual
5. Create testing matrix (CLI × Feature × Method)

### Output
- `docs/CLI-TESTING-MATRIX.md`

---

## [SCOPE-1] feature-integration-tests

**Type:** feature  
**Objective:** Create integration tests for each CLI  

### Tasks
1. Create `tests/integration/cli-detection.test.ts`
2. Create `tests/integration/adapters.test.ts`
3. Create `tests/integration/commands.test.ts` (mocked)
4. Create `tests/integration/events.test.ts` (mocked)
5. Run tests in CI

### Dependencies
- Requires SCOPE-0

---

## [SCOPE-2] feature-mutation-testing

**Type:** feature  
**Objective:** Add Stryker mutation testing  

### Tasks
1. Add Stryker to devDependencies
2. Configure `stryker.conf.json`
3. Run mutation tests on adapters/
4. Set minimum mutation score threshold
5. Add to CI pipeline

### Dependencies
- None (can parallelize with SCOPE-1)

---

## [SCOPE-3] feature-cicd-gates

**Type:** feature  
**Objective:** Setup CI/CD with quality gates  

### Tasks
1. Update `.github/workflows/ci.yml`
2. Add mutation score gate (BLOCK if < 50%)
3. Add test coverage gate (WARN if < 70%)
4. Add TypeScript gate (BLOCK on errors)
5. Add lint gate (BLOCK on errors)

### Dependencies
- Requires SCOPE-1 and SCOPE-2

---

## 4. Summary

| Scope | Type | Effort | Risk |
|-------|------|--------|------|
| spike-cli-integration-testing | spike | Low | Low |
| feature-integration-tests | feature | Medium | Medium |
| feature-mutation-testing | feature | Low | Low |
| feature-cicd-gates | feature | Low | Low |