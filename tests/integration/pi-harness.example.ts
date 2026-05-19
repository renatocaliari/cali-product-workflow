/**
 * pi-test-harness Integration Example
 * 
 * This file demonstrates how to use @marcfargas/pi-test-harness
 * to test the pi-product-workflow extension in a real PI environment.
 * 
 * NOTE: These tests require the extension to be installed in a real PI
 * environment with all peer dependencies. They won't run in isolation.
 * 
 * To run these tests, you need:
 * 1. A real PI installation with the extension installed
 * 2. All peer dependencies installed
 * 3. The test harness correctly configured
 * 
 * For now, these serve as documentation for future integration testing.
 */
import { describe, it, expect, afterEach } from 'vitest';
import type { TestSession } from '@marcfargas/pi-test-harness';

// Skip these tests until we have a proper PI test environment
// Run with: npx vitest run tests/integration/pi-harness.test.ts --environment=node
describe.skip('Extension Integration with pi-test-harness', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let t: TestSession;

  afterEach(() => {
    t?.dispose();
  });

  describe('Workflow Start', () => {
    it('should create index.json when workflow starts', async () => {
      // This would be implemented when pi-test-harness is properly configured
      // import { createTestSession, when, calls, says } from '@marcfargas/pi-test-harness';
      // 
      // t = await createTestSession({
      //   extensions: ['./extensions/cali-product-workflow'],
      //   mockTools: {
      //     bash: '...',
      //     read: '...',
      //   },
      // });
      //
      // await t.run(
      //   when('/skill:cali-product-workflow', [
      //     calls('write', { path: expect.stringContaining('index.json') }),
      //     says(expect.stringContaining('Setup')),
      //   ]),
      // );
      //
      // expect(t.events.toolResultsFor('write')).toHaveLength(1);
    });
  });

  describe('Phase Advancement', () => {
    it('should advance to Shape phase after Setup', async () => {
      // Would test: /pw:next advances phase
    });

    it('should call plannotator gate after Critique', async () => {
      // Would test: plannotator annotate --gate is called
    });
  });

  describe('Error Handling', () => {
    it('should handle missing workflow gracefully', async () => {
      // Would test: error handling when workflow doesn't exist
    });

    it('should validate phase transitions', async () => {
      // Would test: cannot skip phases
    });
  });

  describe('Tool Calls', () => {
    it('should call subagent for parallel work', async () => {
      // Would test: subagent is called with correct parameters
    });

    it('should use ask_user_question for clarifications', async () => {
      // Would test: ask patterns are used correctly
    });
  });

  describe('UI Interactions', () => {
    it('should show workflow status in TUI', async () => {
      // Would test: ctx.ui.select is called with phase options
    });

    it('should confirm before archiving', async () => {
      // Would test: ctx.ui.confirm is called
    });
  });
});

// ── Quick Reference for pi-test-harness ───────────────────────────────

/**
 * PLAYBOOK DSL REFERENCE
 * 
 * when(prompt, actions):
 *   Defines a conversation turn — the prompt you send and what the model does
 * 
 * calls(tool, params):
 *   The model calls a tool. Pi's hooks fire, tool executes (real or mocked)
 * 
 * says(text):
 *   The model emits text. The agent turn ends
 * 
 * .then(callback):
 *   Capture tool result for use in subsequent calls
 * 
 * Example:
 * 
 * await t.run(
 *   when('Build a snake game', [
 *     calls('write', { path: 'index.json', content: '{}' }),
 *     says('Workflow started in Setup phase.'),
 *   ]),
 *   when('/pw:next', [
 *     calls('plannotator', { annotate: '--gate', path: 'spec.md' }),
 *     says('Approved. Moving to Shape phase.'),
 *   ]),
 * );
 * 
 * ASSERTIONS:
 * 
 * t.events.toolCallsFor('bash')      // All calls to "bash"
 * t.events.toolResultsFor('bash')    // All results from "bash"
 * t.events.uiCallsFor('confirm')     // All UI confirm calls
 * t.events.messages                  // All messages
 * 
 * MOCK TOOLS:
 * 
 * mockTools: {
 *   bash: 'command output',              // Static string
 *   read: (params) => 'file contents',  // Dynamic function
 *   write: { content: [{ type: 'text', text: 'OK' }] }, // ToolResult
 * }
 * 
 * MOCK UI:
 * 
 * mockUI: {
 *   confirm: false,     // Deny all
 *   select: 0,          // First item
 *   input: 'user text', // Fixed input
 * }
 */