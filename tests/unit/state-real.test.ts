/**
 * Unit tests: REAL State Functions
 * 
 * Tests actual exported functions from state.ts:
 * - readTracking / writeTracking
 * - getActiveWorkflow / getAllActiveWorkflows
 * - renameWorkflow
 * - reconcileTracking
 * - parseInputForWorkflow
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, mkdirSync 
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  readTracking,
  writeTracking,
  getActiveWorkflow,
  getAllActiveWorkflows,
  renameWorkflow,
  reconcileTracking,
  archiveWorkflowOnDisk,
  parseInputForWorkflow,
  generateDirHash,
  hashToWorkflowId,
  toSafeName,
  getDateStamp,
  suggestNameFromDraft,
} from '../../extensions/cali-product-workflow/state';

describe('REAL State Functions', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'pw-real-state-'));
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // ── readTracking / writeTracking ──────────────────────────────────────

  describe('readTracking / writeTracking', () => {
    it('readTracking returns null when tracking does not exist', () => {
      const result = readTracking(tempDir);
      expect(result).toBeNull();
    });

    it('readTracking reads what writeTracking wrote', () => {
      // Create directory first
      mkdirSync(join(tempDir, '.cali-product-workflow'), { recursive: true });
      
      const data = {
        $schema: "https://example.com/schema",
        version: "1.0",
        created: "2026-05-19T00:00:00Z",
        updated: "2026-05-19T00:00:00Z",
        workflows: []
      };

      writeTracking(tempDir, data);
      const result = readTracking(tempDir);

      expect(result).not.toBeNull();
      expect(result?.version).toBe('1.0');
      expect(result?.workflows).toEqual([]);
    });

    it('writeTracking persists data across calls', () => {
      // Create directory first
      mkdirSync(join(tempDir, '.cali-product-workflow'), { recursive: true });
      
      const data = {
        $schema: "",
        version: "1.0",
        created: "",
        updated: "",
        workflows: [{ name: 'test', status: 'in-progress', currentPhase: 0 }]
      };

      writeTracking(tempDir, data);
      
      const read = readTracking(tempDir);
      expect(read?.workflows).toHaveLength(1);
      expect(read?.workflows[0].name).toBe('test');
    });
  });

  // ── getActiveWorkflow ───────────────────────────────────────────────

  describe('getActiveWorkflow', () => {
    it('returns null when no workflows', () => {
      mkdirSync(join(tempDir, '.cali-product-workflow'), { recursive: true });
      writeTracking(tempDir, {
        $schema: "", version: "1.0", created: "", updated: "", workflows: []
      });

      const result = getActiveWorkflow(tempDir);
      expect(result).toBeNull();
    });

    it('returns the in-progress workflow', () => {
      mkdirSync(join(tempDir, '.cali-product-workflow'), { recursive: true });
      writeTracking(tempDir, {
        $schema: "",
        version: "1.0",
        created: "",
        updated: "",
        workflows: [
          { name: 'wf-completed', status: 'completed', currentPhase: 5 },
          { name: 'wf-active', status: 'in-progress', currentPhase: 2 },
        ]
      });

      const result = getActiveWorkflow(tempDir);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('wf-active');
      expect(result?.status).toBe('in-progress');
    });

    it('returns null when all workflows are completed', () => {
      mkdirSync(join(tempDir, '.cali-product-workflow'), { recursive: true });
      writeTracking(tempDir, {
        $schema: "",
        version: "1.0",
        created: "",
        updated: "",
        workflows: [
          { name: 'wf-1', status: 'completed', currentPhase: 5 },
          { name: 'wf-2', status: 'archived', currentPhase: 3 },
        ]
      });

      const result = getActiveWorkflow(tempDir);
      expect(result).toBeNull();
    });
  });

  // ── getAllActiveWorkflows ──────────────────────────────────────────

  describe('getAllActiveWorkflows', () => {
    it('returns all in-progress workflows', () => {
      mkdirSync(join(tempDir, '.cali-product-workflow'), { recursive: true });
      writeTracking(tempDir, {
        $schema: "",
        version: "1.0",
        created: "",
        updated: "",
        workflows: [
          { name: 'wf-1', status: 'in-progress', currentPhase: 1 },
          { name: 'wf-2', status: 'completed', currentPhase: 5 },
          { name: 'wf-3', status: 'in-progress', currentPhase: 2 },
        ]
      });

      const results = getAllActiveWorkflows(tempDir);
      expect(results).toHaveLength(2);
      expect(results.map(w => w.name)).toContain('wf-1');
      expect(results.map(w => w.name)).toContain('wf-3');
    });

    it('returns empty array when no active workflows', () => {
      mkdirSync(join(tempDir, '.cali-product-workflow'), { recursive: true });
      writeTracking(tempDir, {
        $schema: "",
        version: "1.0",
        created: "",
        updated: "",
        workflows: [
          { name: 'wf-1', status: 'completed', currentPhase: 5 },
        ]
      });

      const results = getAllActiveWorkflows(tempDir);
      expect(results).toHaveLength(0);
    });
  });

  // ── renameWorkflow ────────────────────────────────────────────────

  describe('renameWorkflow', () => {
    it('renames workflow successfully', () => {
      mkdirSync(join(tempDir, '.cali-product-workflow'), { recursive: true });
      writeTracking(tempDir, {
        $schema: "",
        version: "1.0",
        created: "2026-01-01T00:00:00Z",
        updated: "2026-01-01T00:00:00Z",
        workflows: [
          { name: 'old-name', status: 'in-progress', currentPhase: 1, phases: [], created: "2026-01-01T00:00:00Z", updated: "2026-01-01T00:00:00Z" },
        ]
      });

      const result = renameWorkflow(tempDir, 'old-name', 'new-name');

      expect(result.ok).toBe(true);

      const tracking = readTracking(tempDir);
      expect(tracking?.workflows.find(w => w.name === 'new-name')).toBeDefined();
      expect(tracking?.workflows.find(w => w.name === 'old-name')).toBeUndefined();
    });

    it('fails when workflow not found', () => {
      mkdirSync(join(tempDir, '.cali-product-workflow'), { recursive: true });
      writeTracking(tempDir, {
        $schema: "",
        version: "1.0",
        created: "",
        updated: "",
        workflows: []
      });

      const result = renameWorkflow(tempDir, 'nonexistent', 'new-name');
      expect(result.ok).toBe(false);
    });

    it('fails with short name', () => {
      mkdirSync(join(tempDir, '.cali-product-workflow'), { recursive: true });
      writeTracking(tempDir, {
        $schema: "",
        version: "1.0",
        created: "",
        updated: "",
        workflows: [
          { name: 'test', status: 'in-progress', currentPhase: 0 },
        ]
      });

      const result = renameWorkflow(tempDir, 'test', 'x');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('at least 2 characters');
    });
  });

  // ── reconcileTracking ──────────────────────────────────────────────

  describe('reconcileTracking', () => {
    it('detects workflows on disk not in tracking', () => {
      // Create workflow on disk
      const wfDir = join(tempDir, '.cali-product-workflow', '2026-05-19', 'pw-disk-workflow');
      mkdirSync(wfDir, { recursive: true });
      writeFileSync(join(wfDir, 'index.json'), JSON.stringify({
        name: 'disk-workflow',
        _dir: 'pw-disk-workflow',
        workflow_status: 'in-progress',
        current_phase_index: 2,
      }));

      // Tracking has no workflows
      writeTracking(tempDir, {
        $schema: "",
        version: "1.0",
        created: "",
        updated: "",
        workflows: []
      });

      reconcileTracking(tempDir);

      const tracking = readTracking(tempDir);
      const diskWorkflow = tracking?.workflows.find(w => w.name === 'disk-workflow');
      expect(diskWorkflow).toBeDefined();
      expect(diskWorkflow?.currentPhase).toBe(2);
    });
  });

  // ── parseInputForWorkflow ──────────────────────────────────────────

  describe('parseInputForWorkflow', () => {
    it('extracts file references', () => {
      const input = 'Build @src/main.ts and @lib/utils.ts for me';
      const result = parseInputForWorkflow(input);

      expect(result.sources).toContain('./src/main.ts');
      expect(result.sources).toContain('./lib/utils.ts');
    });

    it('extracts text without file references', () => {
      const input = 'Build a snake game in Go';
      const result = parseInputForWorkflow(input);

      expect(result.sources).toHaveLength(0);
      expect(result.draftText).toContain('snake game');
    });

    it('handles empty input', () => {
      const result = parseInputForWorkflow('');
      expect(result.sources).toHaveLength(0);
      expect(result.draftText).toBe('');
    });
  });

  // ── Utility Functions ──────────────────────────────────────────────

  describe('Utility Functions', () => {
    it('generateDirHash creates pw- prefixed hash', () => {
      const hash1 = generateDirHash();
      const hash2 = generateDirHash();

      expect(hash1.startsWith('pw-')).toBe(true);
      expect(hash2.startsWith('pw-')).toBe(true);
      expect(hash1).not.toBe(hash2);
    });

    it('hashToWorkflowId extracts last segment of hash', () => {
      // hashToWorkflowId uses last segment only: pw-a-b-c → wf-c
      expect(hashToWorkflowId('pw-ollc-whkaxv')).toBe('wf-whkaxv');
      expect(hashToWorkflowId('pw-test-abc')).toBe('wf-abc');
    });

    it('toSafeName converts to lowercase with dashes', () => {
      // Real behavior: multiple chars become multiple dashes
      expect(toSafeName('My Project!')).toBe('my-project');
      expect(toSafeName('API v2.0')).toBe('api-v2-0');
      expect(toSafeName('')).toBe('');
    });

    it('getDateStamp returns ISO date', () => {
      const stamp = getDateStamp();
      expect(stamp).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('suggestNameFromDraft extracts keywords', () => {
      const draft = 'Build a snake game in Go for terminal';
      const suggestion = suggestNameFromDraft(draft);

      expect(suggestion).toBeTruthy();
      expect(suggestion?.length).toBeGreaterThan(0);
    });
  });

  // ── archiveWorkflowOnDisk ──────────────────────────────────────────

  describe('archiveWorkflowOnDisk', () => {
    it('archives workflow in index.json', () => {
      // Create a workflow directory
      const wfDir = join(tempDir, '.cali-product-workflow', '2026-05-19', 'pw-archive-test');
      mkdirSync(wfDir, { recursive: true });
      writeFileSync(join(wfDir, 'index.json'), JSON.stringify({
        name: 'test-workflow',
        _dir: 'pw-archive-test',
        workflow_status: 'in-progress',
        current_phase_index: 5,
      }));

      const result = archiveWorkflowOnDisk(tempDir, 'test-workflow');
      expect(result).toBe(true);

      // Verify the workflow is now archived
      const index = JSON.parse(readFileSync(join(wfDir, 'index.json'), 'utf-8'));
      expect(index.workflow_status).toBe('archived');
      expect(index.updated_at).toBeDefined();
    });

    it('returns false when workflow not found', () => {
      const result = archiveWorkflowOnDisk(tempDir, 'nonexistent-workflow');
      expect(result).toBe(false);
    });

    it('returns false when no workflows directory exists', () => {
      // Create parent dir but no workflows
      mkdirSync(join(tempDir, '.cali-product-workflow'), { recursive: true });

      const result = archiveWorkflowOnDisk(tempDir, 'any-workflow');
      expect(result).toBe(false);
    });

    it('updates only target workflow in date directory', () => {
      // Create two workflows in same date
      const wf1 = join(tempDir, '.cali-product-workflow', '2026-05-19', 'pw-workflow-1');
      const wf2 = join(tempDir, '.cali-product-workflow', '2026-05-19', 'pw-workflow-2');
      mkdirSync(wf1, { recursive: true });
      mkdirSync(wf2, { recursive: true });
      
      writeFileSync(join(wf1, 'index.json'), JSON.stringify({
        name: 'workflow-1',
        _dir: 'pw-workflow-1',
        workflow_status: 'in-progress',
      }));
      writeFileSync(join(wf2, 'index.json'), JSON.stringify({
        name: 'workflow-2',
        _dir: 'pw-workflow-2',
        workflow_status: 'in-progress',
      }));

      // Archive only workflow-1
      const result = archiveWorkflowOnDisk(tempDir, 'workflow-1');
      expect(result).toBe(true);

      // workflow-1 should be archived
      const index1 = JSON.parse(readFileSync(join(wf1, 'index.json'), 'utf-8'));
      expect(index1.workflow_status).toBe('archived');

      // workflow-2 should NOT be changed
      const index2 = JSON.parse(readFileSync(join(wf2, 'index.json'), 'utf-8'));
      expect(index2.workflow_status).toBe('in-progress');
    });
  });
});