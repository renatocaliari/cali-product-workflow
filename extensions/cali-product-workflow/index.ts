import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const WORKFLOW_DIR = "product-workflow";
const TRACKING_FILE = "cali-product-workflow.json";
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
  status: string;
  currentPhase: number;
  phases: Phase[];
  created: string;
  updated: string;
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

function readTracking(cwd: string): TrackingData | null {
  const path = getTrackingPath(cwd);
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

function getActiveWorkflow(cwd: string): Workflow | null {
  const tracking = readTracking(cwd);
  if (!tracking) return null;
  return tracking.workflows.find(w => w.status === "in-progress") || null;
}

function getPhaseIndex(phaseId: string): number {
  return PHASE_NAMES.findIndex(p => phaseId.toLowerCase().includes(p.toLowerCase()));
}

// ============ UI HELPERS ============

function getStatusText(workflow: Workflow, theme: any): string {
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

// ============ UPDATE UI ============

function updateWorkflowUI(ctx: ExtensionContext, cwd: string): void {
  if (!ctx.ui) return;
  
  const workflow = getActiveWorkflow(cwd);
  
  if (!workflow) {
    // Clear all UI elements
    ctx.ui.setStatus("workflow", undefined);
    ctx.ui.setWidget("workflow-progress", undefined);
    return;
  }
  
  // Set status in footer
  const statusText = getStatusText(workflow, ctx.ui.theme);
  ctx.ui.setStatus("workflow", ctx.ui.theme.fg("accent", "📍 " + statusText));
  
  // Set progress widget
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
    description: "Start a new product workflow. Usage: /workflow-start slug=my-feature",
    handler: async (args, ctx) => {
      const slug = args?.slug;
      if (!slug) {
        return "Usage: /workflow-start slug=my-feature\n" +
               "Creates a new workflow and sets it as active.";
      }
      
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
        return `Workflow '${slug}' already exists. Use /workflow-status to see it.`;
      }
      
      // Create new workflow
      const workflow: Workflow = {
        slug,
        name: slug,
        description: "",
        status: "in-progress",
        currentPhase: 0,
        phases: PHASE_NAMES.map((name, i) => ({
          id: `${i}-${name.toLowerCase()}`,
          name,
          status: i === 0 ? "in-progress" : "pending"
        })),
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      };
      
      tracking.workflows.push(workflow);
      writeTracking(ctx.cwd, tracking);
      
      // Update UI
      updateWorkflowUI(ctx, ctx.cwd);
      
      return `✅ Workflow '${slug}' started!\n` +
             `Current phase: ${PHASE_NAMES[0]}\n` +
             `Run /skill:cali-product-workflow to begin planning.`;
    }
  });
  
  // /workflow-stop - Stop and clear the active workflow
  pi.registerCommand("workflow-stop", {
    description: "Stop the active workflow and clear UI",
    handler: async (args, ctx) => {
      const workflow = getActiveWorkflow(ctx.cwd);
      if (!workflow) {
        return "No active workflow to stop.";
      }
      
      // Clear UI immediately
      ctx.ui.setStatus("workflow", undefined);
      ctx.ui.setWidget("workflow-progress", undefined);
      
      // Update tracking
      const tracking = readTracking(ctx.cwd);
      if (tracking) {
        const idx = tracking.workflows.findIndex(w => w.slug === workflow.slug);
        if (idx !== -1) {
          tracking.workflows.splice(idx, 1);
          writeTracking(ctx.cwd, tracking);
        }
      }
      
      // Abort any running agent
      ctx.ui.notify("Workflow stopped and cleared", "info");
      
      return `❌ Workflow '${workflow.slug}' stopped and cleared.\n` +
             `UI has been reset. You can start a new workflow with /workflow-start.`;
    }
  });
  
  // /workflow-pause - Pause the workflow (keep state)
  pi.registerCommand("workflow-pause", {
    description: "Pause the active workflow (keeps state for later)",
    handler: async (args, ctx) => {
      const workflow = getActiveWorkflow(ctx.cwd);
      if (!workflow) {
        return "No active workflow to pause.";
      }
      
      const tracking = readTracking(ctx.cwd);
      if (tracking) {
        const idx = tracking.workflows.findIndex(w => w.slug === workflow.slug);
        if (idx !== -1) {
          tracking.workflows[idx].status = "paused";
          writeTracking(ctx.cwd, tracking);
        }
      }
      
      ctx.ui.setStatus("workflow", ctx.ui.theme.fg("warning", "⏸ " + workflow.slug + " [PAUSED]"));
      
      return `⏸ Workflow '${workflow.slug}' paused.\n` +
             `State preserved. Resume with /workflow-resume`;
    }
  });
  
  // /workflow-resume - Resume a paused workflow
  pi.registerCommand("workflow-resume", {
    description: "Resume a paused workflow",
    handler: async (args, ctx) => {
      const slug = args?.slug;
      
      const tracking = readTracking(ctx.cwd);
      if (!tracking) {
        return "No workflows found.";
      }
      
      // Find paused workflow
      const paused = tracking.workflows.find(w => w.status === "paused");
      if (!paused && !slug) {
        return "No paused workflow found. Specify slug: /workflow-resume slug=my-feature";
      }
      
      const target = slug ? tracking.workflows.find(w => w.slug === slug && w.status === "paused") : paused;
      if (!target) {
        return `Paused workflow '${slug || "unknown"}' not found.`;
      }
      
      // Resume it
      target.status = "in-progress";
      writeTracking(ctx.cwd, tracking);
      
      // Update UI
      updateWorkflowUI(ctx, ctx.cwd);
      
      return `▶️ Workflow '${target.slug}' resumed.\n` +
             `Current phase: ${PHASE_NAMES[target.currentPhase]}`;
    }
  });
  
  // /workflow-status - Show current status
  pi.registerCommand("workflow-status", {
    description: "Show current workflow status",
    handler: async (args, ctx) => {
      const workflow = getActiveWorkflow(ctx.cwd);
      if (!workflow) {
        return "No active workflow.\n" +
               "Start one with /workflow-start slug=my-feature";
      }
      
      const pct = Math.round(((workflow.currentPhase + 1) / PHASE_NAMES.length) * 100);
      const barLen = 20;
      const filled = Math.round((pct / 100) * barLen);
      const bar = "█".repeat(filled) + "░".repeat(barLen - filled);
      
      return [
        `📋 Workflow: ${workflow.slug}`,
        `Progress: [${bar}] ${pct}%`,
        `Phase: ${workflow.currentPhase + 1}/${PHASE_NAMES.length} — ${PHASE_NAMES[workflow.currentPhase]}`,
        "",
        "Phases:",
        ...workflow.phases.map((p, i) => {
          const icon = p.status === "completed" ? "✅" : 
                       p.status === "in-progress" ? "🔄" : "⬜";
          return `  ${icon} ${i + 1}. ${p.name}`;
        })
      ].join("\n");
    }
  });
  
  // /workflow-list - List all workflows
  pi.registerCommand("workflow-list", {
    description: "List all workflows",
    handler: async (args, ctx) => {
      const tracking = readTracking(ctx.cwd);
      if (!tracking || tracking.workflows.length === 0) {
        return "No workflows found.";
      }
      
      const lines = ["📋 All Workflows:", ""];
      
      for (const w of tracking.workflows) {
        const statusIcon = w.status === "in-progress" ? "🔄" :
                          w.status === "paused" ? "⏸" :
                          w.status === "completed" ? "✅" : "⬜";
        
        lines.push(`${statusIcon} ${w.slug} [${w.status}] — Phase ${w.currentPhase + 1}: ${PHASE_NAMES[w.currentPhase]}`);
      }
      
      return lines.join("\n");
    }
  });
  
  // /workflow-setphase - Set current phase (for tracking)
  pi.registerCommand("workflow-setphase", {
    description: "Set current phase. Usage: /workflow-setphase phase=2",
    handler: async (args, ctx) => {
      const phase = args?.phase !== undefined ? parseInt(args.phase) : null;
      if (phase === null || isNaN(phase) || phase < 0 || phase >= PHASE_NAMES.length) {
        return `Usage: /workflow-setphase phase=N (0-${PHASE_NAMES.length - 1})\n` +
               `Current phases: ${PHASE_NAMES.map((n, i) => `${i}: ${n}`).join(", ")}`;
      }
      
      const tracking = readTracking(ctx.cwd);
      if (!tracking) {
        return "No tracking file found.";
      }
      
      const workflow = getActiveWorkflow(ctx.cwd);
      if (!workflow) {
        return "No active workflow.";
      }
      
      const oldPhase = workflow.currentPhase;
      
      // Update workflow
      workflow.currentPhase = phase;
      workflow.updated = new Date().toISOString();
      
      // Update phases
      workflow.phases.forEach((p, i) => {
        if (i < phase) p.status = "completed";
        else if (i === phase) p.status = "in-progress";
        else p.status = "pending";
      });
      
      writeTracking(ctx.cwd, tracking);
      
      // Update UI
      updateWorkflowUI(ctx, ctx.cwd);
      
      // Notify if changed
      if (oldPhase !== phase) {
        notifyPhaseChange(ctx, workflow, oldPhase);
      }
      
      return `📍 Phase set to ${phase}: ${PHASE_NAMES[phase]}\n` +
             `UI updated.`;
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
      if (ctx.ui) {
        ctx.ui.notify("Product workflow: tracking file created", "info");
      }
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
      ctx.ui.setStatus("workflow", undefined);
      ctx.ui.setWidget("workflow-progress", undefined);
    }
  });
  
  // 4. Listen for agent_end to check if workflow should update
  pi.on("agent_end", async (_event, ctx) => {
    if (!ctx.ui) return;
    
    // Check if workflow file was modified externally
    const currentWorkflow = getActiveWorkflow(ctx.cwd);
    if (currentWorkflow) {
      updateWorkflowUI(ctx, ctx.cwd);
    }
  });
}