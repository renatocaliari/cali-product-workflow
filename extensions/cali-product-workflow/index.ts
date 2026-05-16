import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, basename, dirname } from "node:path";

const WORKFLOW_DIR = "product-workflow";
const TRACKING_FILE = "cali-product-workflow.json";
const GLOBAL_TRACKING_FILE = ".cali-product-workflow-global.json";
const SCHEMA_URL = "https://raw.githubusercontent.com/renatocaliari/pi-product-workflow/main/cali-product-workflow.schema.json";

const PHASE_NAMES = ["Clarify", "Shape", "Bet", "Build", "Critique", "Gate"];

interface Phase {
  id: string;
  name: string;
  status: string;
  started?: string;
  completed?: string;
}

interface Workflow {
  slug: string;
  name: string;
  description: string;
  source?: string;  // Reference to source document/file
  status: string;
  currentPhase: number;
  phases: Phase[];
  created: string;
  updated: string;
  cwd?: string;    // Project path for cross-folder discovery
}

interface TrackingData {
  $schema: string;
  version: string;
  created: string;
  updated: string;
  workflows: Workflow[];
}

// ============ STATE MANAGEMENT ============

function getTrackingPath(cwd: string): string {
  return join(cwd, TRACKING_FILE);
}

function getGlobalTrackingPath(cwd: string): string {
  // Global tracking in home directory
  const home = process.env.HOME || dirname(cwd);
  return join(home, GLOBAL_TRACKING_FILE);
}

function readTracking(cwd: string): TrackingData | null {
  const path = getTrackingPath(cwd);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

function readGlobalTracking(): TrackingData | null {
  const path = getGlobalTrackingPath(process.cwd());
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

function writeTracking(cwd: string, data: TrackingData): void {
  const path = getTrackingPath(cwd);
  writeFileSync(path, JSON.stringify(data, null, 2));
}

function writeGlobalTracking(data: TrackingData): void {
  const path = getGlobalTrackingPath(process.cwd());
  writeFileSync(path, JSON.stringify(data, null, 2));
}

function getActiveWorkflow(cwd: string): Workflow | null {
  const tracking = readTracking(cwd);
  if (!tracking) return null;
  return tracking.workflows.find(w => w.status === "in-progress") || null;
}

function getActiveWorkflowGlobal(): Workflow | null {
  const tracking = readGlobalTracking();
  if (!tracking) return null;
  return tracking.workflows.find(w => w.status === "in-progress") || null;
}

function getPhaseIndex(phaseId: string): number {
  return PHASE_NAMES.findIndex(p => phaseId.toLowerCase().includes(p.toLowerCase()));
}

function generateSlug(): string {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6);
  return `workflow-${timestamp}-${random}`;
}

function readSourceFile(sourcePath: string): string | null {
  if (!existsSync(sourcePath)) return null;
  
  try {
    const stat = statSync(sourcePath);
    if (stat.isDirectory()) {
      return `Directory: ${sourcePath}`;
    }
    return readFileSync(sourcePath, "utf-8").slice(0, 10000); // Limit to 10KB
  } catch {
    return null;
  }
}

// ============ UI HELPERS ============

function getStatusText(workflow: Workflow): string {
  const phaseName = PHASE_NAMES[workflow.currentPhase] || "Unknown";
  const pct = Math.round(((workflow.currentPhase + 1) / PHASE_NAMES.length) * 100);
  return `${workflow.slug} [${phaseName} ${workflow.currentPhase + 1}/${PHASE_NAMES.length}] ${pct}%`;
}

function getProgressBar(workflow: Workflow, theme: any): string[] {
  const pct = Math.round(((workflow.currentPhase + 1) / PHASE_NAMES.length) * 100);
  const barLen = 20;
  const filled = Math.round((pct / 100) * barLen);
  const bar = "█".repeat(filled) + "░".repeat(barLen - filled);
  
  const lines = [
    theme.fg("accent", "🚀") + " " + theme.fg("text", workflow.slug),
    `[${bar}] ${pct}% — ${PHASE_NAMES[workflow.currentPhase]}`,
    ""
  ];
  
  // Phase indicators
  const phaseLine = PHASE_NAMES.map((name, i) => {
    if (i < workflow.currentPhase) {
      return theme.fg("success", "●") + " " + theme.fg("muted", name);
    } else if (i === workflow.currentPhase) {
      return theme.fg("success", "▶") + " " + theme.fg("accent", name);
    } else {
      return theme.fg("dim", "○") + " " + theme.fg("dim", name);
    }
  }).join(" ");
  
  lines.push(phaseLine);
  
  return lines;
}

function updateWorkflowUI(ctx: ExtensionContext, cwd: string): void {
  if (!ctx.ui) return;
  
  const workflow = getActiveWorkflow(cwd);
  
  if (!workflow) {
    ctx.ui.setStatus("workflow", undefined);
    ctx.ui.setWidget("workflow-progress", undefined);
    return;
  }
  
  const statusText = getStatusText(workflow);
  ctx.ui.setStatus("workflow", ctx.ui.theme.fg("accent", "📍 " + statusText));
  
  ctx.ui.setWidget("workflow-progress", (_tui, theme) => ({
    render: (_width) => getProgressBar(workflow, theme),
    invalidate: () => {}
  }), { placement: "aboveEditor" });
}

function notifyPhaseChange(ctx: ExtensionContext, workflow: Workflow, oldPhase: number): void {
  if (!ctx.ui) return;
  
  const newPhase = workflow.currentPhase;
  if (oldPhase !== newPhase) {
    const phaseName = PHASE_NAMES[newPhase] || "Unknown";
    ctx.ui.notify(
      `📍 Phase ${newPhase + 1}: ${phaseName}`,
      "info"
    );
  }
}

// ============ COMMANDS ============

function registerCommands(pi: ExtensionAPI): void {
  
  // /workflow-start - Start a new workflow
  pi.registerCommand("workflow-start", {
    description: "Start a new product workflow. Creates workflow in current project. Auto-generates slug if not provided. Optional: name, description, source file path.",
    handler: async (args, ctx) => {
      // Generate slug if not provided
      let slug = args?.slug;
      if (!slug) {
        slug = generateSlug();
      }
      
      // Normalize slug (replace spaces/special chars)
      slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
      
      let tracking = readTracking(ctx.cwd);
      if (!tracking) {
        tracking = {
          "$schema": SCHEMA_URL,
          "version": "1.0",
          "created": new Date().toISOString(),
          "updated": new Date().toISOString(),
          "workflows": []
        };
      }
      
      // Check if already exists
      if (tracking.workflows.some(w => w.slug === slug)) {
        return `Workflow '${slug}' already exists.\nUse /workflow-status to see it.`;
      }
      
      // Read source file if provided
      let sourceContent: string | undefined;
      if (args?.source) {
        sourceContent = readSourceFile(args.source);
      }
      
      // Create new workflow
      const workflow: Workflow = {
        slug,
        name: args?.name || slug,
        description: args?.description || (sourceContent ? "See source file" : ""),
        source: args?.source,
        status: "in-progress",
        currentPhase: 0,
        phases: PHASE_NAMES.map((name, i) => ({
          id: `${i}-${name.toLowerCase()}`,
          name,
          status: i === 0 ? "in-progress" : "pending"
        })),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        cwd: ctx.cwd
      };
      
      tracking.workflows.push(workflow);
      writeTracking(ctx.cwd, tracking);
      
      // Also update global tracking
      const globalTracking = readGlobalTracking() || {
        "$schema": SCHEMA_URL,
        "version": "1.0",
        "created": new Date().toISOString(),
        "updated": new Date().toISOString(),
        "workflows": []
      };
      globalTracking.workflows.push(workflow);
      writeGlobalTracking(globalTracking);
      
      // Update UI
      updateWorkflowUI(ctx, ctx.cwd);
      
      // Read source content summary if available
      let sourceInfo = "";
      if (sourceContent) {
        const preview = sourceContent.slice(0, 500);
        sourceInfo = `\n\n📄 Source: ${args.source}\nPreview:\n\`\`\`\n${preview}...\n\`\`\``;
      }
      
      return [
        `✅ Workflow '${slug}' started!`,
        `Current phase: ${PHASE_NAMES[0]}`,
        `Project: ${ctx.cwd}`,
        sourceInfo,
        "",
        `Run /skill:cali-product-workflow to begin planning.`
      ].join("\n");
    }
  });
  
  // /workflow-stop - Stop and clear the active workflow
  pi.registerCommand("workflow-stop", {
    description: "Stop the active workflow immediately, clear all UI elements, and abort any running work.",
    handler: async (args, ctx) => {
      const workflow = getActiveWorkflow(ctx.cwd);
      if (!workflow) {
        // Try global
        const global = getActiveWorkflowGlobal();
        if (global) {
          // Remove from global
          const globalTracking = readGlobalTracking();
          if (globalTracking) {
            globalTracking.workflows = globalTracking.workflows.filter(w => w.slug !== global.slug);
            writeGlobalTracking(globalTracking);
          }
          ctx.ui.setStatus("workflow", undefined);
          ctx.ui.setWidget("workflow-progress", undefined);
          ctx.ui.notify("Workflow stopped and cleared", "info");
          return `❌ Workflow '${global.slug}' stopped and cleared.\nUI has been reset.`;
        }
        return "No active workflow to stop.";
      }
      
      // Clear UI immediately
      ctx.ui.setStatus("workflow", undefined);
      ctx.ui.setWidget("workflow-progress", undefined);
      
      // Update tracking - remove workflow
      const tracking = readTracking(ctx.cwd);
      if (tracking) {
        tracking.workflows = tracking.workflows.filter(w => w.slug !== workflow.slug);
        writeTracking(ctx.cwd, tracking);
      }
      
      // Also remove from global
      const globalTracking = readGlobalTracking();
      if (globalTracking) {
        globalTracking.workflows = globalTracking.workflows.filter(w => w.slug !== workflow.slug);
        writeGlobalTracking(globalTracking);
      }
      
      ctx.ui.notify("Workflow stopped and cleared", "info");
      
      return [
        `❌ Workflow '${workflow.slug}' stopped and cleared.`,
        `UI has been reset.`,
        `You can start a new workflow with /workflow-start.`
      ].join("\n");
    }
  });
  
  // /workflow-pause - Pause the workflow (keep state)
  pi.registerCommand("workflow-pause", {
    description: "Pause the active workflow (keeps state for later).",
    handler: async (args, ctx) => {
      const workflow = getActiveWorkflow(ctx.cwd);
      if (!workflow) {
        return "No active workflow to pause.\nUse /workflow-list to see all workflows.";
      }
      
      const tracking = readTracking(ctx.cwd);
      if (tracking) {
        const idx = tracking.workflows.findIndex(w => w.slug === workflow.slug);
        if (idx !== -1) {
          tracking.workflows[idx].status = "paused";
          writeTracking(ctx.cwd, tracking);
        }
      }
      
      // Update global
      const globalTracking = readGlobalTracking();
      if (globalTracking) {
        const idx = globalTracking.workflows.findIndex(w => w.slug === workflow.slug);
        if (idx !== -1) {
          globalTracking.workflows[idx].status = "paused";
          writeGlobalTracking(globalTracking);
        }
      }
      
      if (ctx.ui) {
        ctx.ui.setStatus("workflow", ctx.ui.theme.fg("warning", "⏸ " + workflow.slug + " [PAUSED]"));
      }
      
      return [
        `⏸ Workflow '${workflow.slug}' paused.`,
        `State preserved.`,
        `Resume with /workflow-resume`
      ].join("\n");
    }
  });
  
  // /workflow-resume - Resume a paused workflow
  pi.registerCommand("workflow-resume", {
    description: "Resume a paused workflow. Optionally specify slug.",
    handler: async (args, ctx) => {
      const slug = args?.slug;
      
      const tracking = readTracking(ctx.cwd);
      const globalTracking = readGlobalTracking();
      
      // Find paused workflow in current project or global
      let paused = tracking?.workflows.find(w => w.status === "paused");
      if (!paused && globalTracking) {
        paused = globalTracking.workflows.find(w => w.status === "paused");
      }
      
      if (!paused) {
        if (slug) {
          return `Paused workflow '${slug}' not found.`;
        }
        return [
          "No paused workflow found.",
          "Use /workflow-list to see all workflows.",
          "Or specify slug: /workflow-resume slug=my-feature"
        ].join("\n");
      }
      
      const target = slug 
        ? (tracking?.workflows.find(w => w.slug === slug && w.status === "paused") || 
           globalTracking?.workflows.find(w => w.slug === slug && w.status === "paused"))
        : paused;
      
      if (!target) {
        return `Paused workflow '${slug || "unknown"}' not found.`;
      }
      
      // Resume in current project
      if (tracking) {
        const idx = tracking.workflows.findIndex(w => w.slug === target.slug);
        if (idx !== -1) {
          tracking.workflows[idx].status = "in-progress";
          writeTracking(ctx.cwd, tracking);
        }
      }
      
      // Update global
      if (globalTracking) {
        const idx = globalTracking.workflows.findIndex(w => w.slug === target.slug);
        if (idx !== -1) {
          globalTracking.workflows[idx].status = "in-progress";
          writeGlobalTracking(globalTracking);
        }
      }
      
      // Update UI
      updateWorkflowUI(ctx, ctx.cwd);
      
      return [
        `▶️ Workflow '${target.slug}' resumed.`,
        `Current phase: ${PHASE_NAMES[target.currentPhase]}`,
        `Project: ${target.cwd || ctx.cwd}`
      ].join("\n");
    }
  });
  
  // /workflow-status - Show current status
  pi.registerCommand("workflow-status", {
    description: "Show current workflow status with progress bar and phase details.",
    handler: async (args, ctx) => {
      const workflow = getActiveWorkflow(ctx.cwd);
      
      if (!workflow) {
        // Check global
        const global = getActiveWorkflowGlobal();
        if (global) {
          const pct = Math.round(((global.currentPhase + 1) / PHASE_NAMES.length) * 100);
          return [
            `📍 Global workflow: ${global.slug}`,
            `Phase: ${global.currentPhase + 1}/${PHASE_NAMES.length} — ${PHASE_NAMES[global.currentPhase]}`,
            `Project: ${global.cwd}`,
            `Status: ${global.status}`,
            "",
            `Navigate to project folder to continue: cd ${global.cwd}`
          ].join("\n");
        }
        
        return [
          "No active workflow in this project.",
          "",
          "Start one with:",
          "  /workflow-start slug=my-feature",
          "  /workflow-start slug=my-feature name='My Feature' description='What we want to build'",
          "  /workflow-start source=./brief.md  (auto-generates slug)",
          "",
          "Or check /workflow-list for other workflows."
        ].join("\n");
      }
      
      const pct = Math.round(((workflow.currentPhase + 1) / PHASE_NAMES.length) * 100);
      const barLen = 20;
      const filled = Math.round((pct / 100) * barLen);
      const bar = "█".repeat(filled) + "░".repeat(barLen - filled);
      
      return [
        `📋 Workflow: ${workflow.slug}`,
        workflow.name !== workflow.slug ? `Name: ${workflow.name}` : "",
        `Progress: [${bar}] ${pct}%`,
        `Phase: ${workflow.currentPhase + 1}/${PHASE_NAMES.length} — ${PHASE_NAMES[workflow.currentPhase]}`,
        workflow.source ? `Source: ${workflow.source}` : "",
        workflow.description ? `Description: ${workflow.description}` : "",
        "",
        "Phases:",
        ...workflow.phases.map((p, i) => {
          const icon = p.status === "completed" ? "✅" : 
                       p.status === "in-progress" ? "🔄" : "⬜";
          const prefix = i === workflow.currentPhase ? "▶ " : "  ";
          return `${prefix}${icon} ${i + 1}. ${p.name}`;
        })
      ].filter(Boolean).join("\n");
    }
  });
  
  // /workflow-list - List all workflows
  pi.registerCommand("workflow-list", {
    description: "List all workflows in current project and global.",
    handler: async (args, ctx) => {
      const lines: string[] = [];
      
      // Current project
      const tracking = readTracking(ctx.cwd);
      if (tracking && tracking.workflows.length > 0) {
        lines.push("📁 Current Project:");
        for (const w of tracking.workflows) {
          const statusIcon = w.status === "in-progress" ? "🔄" :
                            w.status === "paused" ? "⏸" :
                            w.status === "completed" ? "✅" : "⬜";
          lines.push(`  ${statusIcon} ${w.slug} [${w.status}] — Phase ${w.currentPhase + 1}: ${PHASE_NAMES[w.currentPhase]}`);
        }
        lines.push("");
      }
      
      // Global
      const globalTracking = readGlobalTracking();
      if (globalTracking && globalTracking.workflows.length > 0) {
        // Filter out ones already in current project
        const globalOnly = globalTracking.workflows.filter(w => 
          !tracking?.workflows.some(tw => tw.slug === w.slug)
        );
        
        if (globalOnly.length > 0) {
          lines.push("🌐 Global (other projects):");
          for (const w of globalOnly) {
            const statusIcon = w.status === "in-progress" ? "🔄" :
                              w.status === "paused" ? "⏸" :
                              w.status === "completed" ? "✅" : "⬜";
            lines.push(`  ${statusIcon} ${w.slug} [${w.status}] — ${PHASE_NAMES[w.currentPhase]}`);
            lines.push(`     Project: ${w.cwd}`);
          }
        }
      }
      
      if (lines.length === 0) {
        return "No workflows found.\nStart one with /workflow-start";
      }
      
      return lines.join("\n");
    }
  });
  
  // /workflow-setphase - Set current phase
  pi.registerCommand("workflow-setphase", {
    description: "Set the current phase of the active workflow. Phase is 0-5: 0=Clarify, 1=Shape, 2=Bet, 3=Build, 4=Critique, 5=Gate",
    handler: async (args, ctx) => {
      const phaseArg = args?.phase;
      const phaseName = args?.phasename;
      
      let phase: number | null = null;
      
      if (phaseArg !== undefined) {
        phase = parseInt(String(phaseArg));
      } else if (phaseName) {
        phase = PHASE_NAMES.findIndex(p => 
          p.toLowerCase() === String(phaseName).toLowerCase()
        );
      }
      
      if (phase === null || isNaN(phase) || phase < 0 || phase >= PHASE_NAMES.length) {
        return [
          `Usage: /workflow-setphase phase=N  (where N is 0-${PHASE_NAMES.length - 1})`,
          "Or: /workflow-setphase phasename=Clarify",
          "",
          "Available phases:",
          ...PHASE_NAMES.map((name, i) => `  ${i}: ${name}`)
        ].join("\n");
      }
      
      const workflow = getActiveWorkflow(ctx.cwd);
      if (!workflow) {
        return "No active workflow.\nStart one with /workflow-start";
      }
      
      const oldPhase = workflow.currentPhase;
      
      // Update local tracking
      const tracking = readTracking(ctx.cwd);
      if (tracking) {
        const idx = tracking.workflows.findIndex(w => w.slug === workflow.slug);
        if (idx !== -1) {
          tracking.workflows[idx].currentPhase = phase;
          tracking.workflows[idx].phases.forEach((p, i) => {
            if (i < phase!) p.status = "completed";
            else if (i === phase!) p.status = "in-progress";
            else p.status = "pending";
          });
          tracking.workflows[idx].updated = new Date().toISOString();
          writeTracking(ctx.cwd, tracking);
          workflow.currentPhase = phase;
          workflow.phases = tracking.workflows[idx].phases;
        }
      }
      
      // Update global tracking
      const globalTracking = readGlobalTracking();
      if (globalTracking) {
        const idx = globalTracking.workflows.findIndex(w => w.slug === workflow.slug);
        if (idx !== -1) {
          globalTracking.workflows[idx].currentPhase = phase;
          writeGlobalTracking(globalTracking);
        }
      }
      
      // Update UI
      updateWorkflowUI(ctx, ctx.cwd);
      
      // Notify if changed
      if (oldPhase !== phase) {
        notifyPhaseChange(ctx, workflow, oldPhase);
      }
      
      return [
        `📍 Phase set to ${phase}: ${PHASE_NAMES[phase!]}`,
        `Progress: ${phase! + 1}/${PHASE_NAMES.length}`,
        `UI updated.`
      ].join("\n");
    }
  });
  
  // /workflow-next - Advance to next phase
  pi.registerCommand("workflow-next", {
    description: "Advance the active workflow to the next phase.",
    handler: async (args, ctx) => {
      const workflow = getActiveWorkflow(ctx.cwd);
      if (!workflow) {
        return "No active workflow.\nStart one with /workflow-start";
      }
      
      const nextPhase = workflow.currentPhase + 1;
      if (nextPhase >= PHASE_NAMES.length) {
        return [
          `Workflow '${workflow.slug}' is already on the last phase: ${PHASE_NAMES[workflow.currentPhase]}`,
          `Use /workflow-complete to mark as finished.`
        ].join("\n");
      }
      
      // Call setphase
      const tracking = readTracking(ctx.cwd);
      if (tracking) {
        const idx = tracking.workflows.findIndex(w => w.slug === workflow.slug);
        if (idx !== -1) {
          tracking.workflows[idx].currentPhase = nextPhase;
          tracking.workflows[idx].phases.forEach((p, i) => {
            if (i < nextPhase) p.status = "completed";
            else if (i === nextPhase) p.status = "in-progress";
            else p.status = "pending";
          });
          tracking.workflows[idx].updated = new Date().toISOString();
          writeTracking(ctx.cwd, tracking);
          workflow.currentPhase = nextPhase;
        }
      }
      
      // Update global
      const globalTracking = readGlobalTracking();
      if (globalTracking) {
        const idx = globalTracking.workflows.findIndex(w => w.slug === workflow.slug);
        if (idx !== -1) {
          globalTracking.workflows[idx].currentPhase = nextPhase;
          writeGlobalTracking(globalTracking);
        }
      }
      
      updateWorkflowUI(ctx, ctx.cwd);
      notifyPhaseChange(ctx, workflow, nextPhase - 1);
      
      return [
        `✅ Advanced to Phase ${nextPhase + 1}: ${PHASE_NAMES[nextPhase]}`,
        `Workflow: ${workflow.slug}`
      ].join("\n");
    }
  });
  
  // /workflow-complete - Mark workflow as completed
  pi.registerCommand("workflow-complete", {
    description: "Mark the active workflow as completed.",
    handler: async (args, ctx) => {
      const workflow = getActiveWorkflow(ctx.cwd);
      if (!workflow) {
        return "No active workflow to complete.";
      }
      
      // Clear UI
      ctx.ui.setStatus("workflow", undefined);
      ctx.ui.setWidget("workflow-progress", undefined);
      
      // Update tracking
      const tracking = readTracking(ctx.cwd);
      if (tracking) {
        const idx = tracking.workflows.findIndex(w => w.slug === workflow.slug);
        if (idx !== -1) {
          tracking.workflows[idx].status = "completed";
          tracking.workflows[idx].updated = new Date().toISOString();
          writeTracking(ctx.cwd, tracking);
        }
      }
      
      // Update global
      const globalTracking = readGlobalTracking();
      if (globalTracking) {
        const idx = globalTracking.workflows.findIndex(w => w.slug === workflow.slug);
        if (idx !== -1) {
          globalTracking.workflows[idx].status = "completed";
          writeGlobalTracking(globalTracking);
        }
      }
      
      ctx.ui.notify(`🎉 Workflow '${workflow.slug}' completed!`, "info");
      
      return [
        `🎉 Workflow '${workflow.slug}' completed!`,
        `All phases finished.`,
        `Project: ${ctx.cwd}`
      ].join("\n");
    }
  });
  
  // /workflow-goto - Go to workflow in another project
  pi.registerCommand("workflow-goto", {
    description: "Switch to a workflow from another project. Shows instructions to navigate.",
    handler: async (args, ctx) => {
      const slug = args?.slug;
      
      const globalTracking = readGlobalTracking();
      if (!globalTracking) {
        return "No global workflows found.";
      }
      
      const workflow = slug 
        ? globalTracking.workflows.find(w => w.slug === slug)
        : globalTracking.workflows.find(w => w.status === "in-progress");
      
      if (!workflow) {
        return [
          `Workflow '${slug || "active"}' not found.`,
          "Use /workflow-list to see all workflows."
        ].join("\n");
      }
      
      return [
        `📍 Workflow: ${workflow.slug}`,
        `Project: ${workflow.cwd}`,
        `Phase: ${PHASE_NAMES[workflow.currentPhase]}`,
        "",
        `To continue this workflow:`,
        `  1. Navigate: cd ${workflow.cwd}`,
        `  2. Resume: /workflow-resume slug=${workflow.slug}`,
        "",
        `Or the LLM will auto-detect it when you open that project.`
      ].join("\n");
    }
  });
}

// ============ MAIN EXTENSION ============

export default function (pi: ExtensionAPI) {
  
  // 1. Scaffolding on session_start
  pi.on("session_start", async (_event, ctx) => {
    // Create workflow directory
    const workflowPath = join(ctx.cwd, WORKFLOW_DIR);
    mkdirSync(workflowPath, { recursive: true });
    
    // Create tracking file if not exists
    const trackingPath = join(ctx.cwd, TRACKING_FILE);
    if (!existsSync(trackingPath)) {
      const template: TrackingData = {
        "$schema": SCHEMA_URL,
        "version": "1.0",
        "created": new Date().toISOString(),
        "updated": new Date().toISOString(),
        "workflows": []
      };
      writeFileSync(trackingPath, JSON.stringify(template, null, 2));
    }
    
    // Register commands
    registerCommands(pi);
    
    // Restore UI state if there's an active workflow
    if (ctx.ui) {
      updateWorkflowUI(ctx, ctx.cwd);
      
      const workflow = getActiveWorkflow(ctx.cwd);
      if (workflow) {
        ctx.ui.notify(
          `📍 Resumed: ${workflow.slug} (Phase ${workflow.currentPhase + 1}: ${PHASE_NAMES[workflow.currentPhase]})`,
          "info"
        );
      } else {
        // Check global for workflows in this project
        const globalTracking = readGlobalTracking();
        if (globalTracking) {
          const projectWorkflow = globalTracking.workflows.find(w => 
            w.cwd === ctx.cwd && w.status !== "completed"
          );
          if (projectWorkflow) {
            // Move to local tracking
            const tracking = readTracking(ctx.cwd);
            if (tracking && !tracking.workflows.some(w => w.slug === projectWorkflow.slug)) {
              tracking.workflows.push(projectWorkflow);
              writeTracking(ctx.cwd, tracking);
            }
            
            updateWorkflowUI(ctx, ctx.cwd);
            ctx.ui.notify(
              `📍 Found workflow: ${projectWorkflow.slug} (Phase ${projectWorkflow.currentPhase + 1}: ${PHASE_NAMES[projectWorkflow.currentPhase]})`,
              "info"
            );
          }
        }
      }
    }
  });
  
  // 2. Track phase changes during agent turns
  pi.on("turn_end", async (_event, ctx) => {
    const workflow = getActiveWorkflow(ctx.cwd);
    if (!workflow || !ctx.ui) return;
    
    // Check if phase should advance based on tracking file
    const tracking = readTracking(ctx.cwd);
    if (tracking) {
      const current = tracking.workflows.find(w => w.slug === workflow.slug);
      if (current && current.currentPhase !== workflow.currentPhase) {
        const oldPhase = workflow.currentPhase;
        workflow.currentPhase = current.currentPhase;
        updateWorkflowUI(ctx, ctx.cwd);
        notifyPhaseChange(ctx, workflow, oldPhase);
      }
    }
  });
  
  // 3. Clear UI on session shutdown
  pi.on("session_shutdown", async (_event, ctx) => {
    if (ctx.ui) {
      // Don't clear - let UI persist for next session in same project
    }
  });
  
  // 4. Listen for agent_end to check if workflow should update
  pi.on("agent_end", async (_event, ctx) => {
    if (!ctx.ui) return;
    
    const currentWorkflow = getActiveWorkflow(ctx.cwd);
    if (currentWorkflow) {
      updateWorkflowUI(ctx, ctx.cwd);
    }
  });
}
