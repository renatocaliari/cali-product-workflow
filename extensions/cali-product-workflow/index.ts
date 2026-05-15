import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const WORKFLOW_DIR = "product-workflow";
const TRACKING_FILE = "cali-product-workflow.json";
const SCHEMA_URL = "https://raw.githubusercontent.com/cali/pi-product-workflow/main/cali-product-workflow.schema.json";

interface Workflow {
  slug: string;
  status: string;
}

interface TrackingData {
  $schema: string;
  version: string;
  created: string;
  updated: string;
  workflows: Workflow[];
}

function formatStatus(tracking: TrackingData): string {
  const lines = [`📋 Workflow Status`, ``];
  
  if (!tracking.workflows || tracking.workflows.length === 0) {
    lines.push("No workflows found.");
    return lines.join("\n");
  }
  
  const byStatus: Record<string, string[]> = {};
  for (const w of tracking.workflows) {
    const status = w.status || "unknown";
    if (!byStatus[status]) byStatus[status] = [];
    byStatus[status].push(w.slug);
  }
  
  for (const [status, slugs] of Object.entries(byStatus)) {
    lines.push(`**${status}** (${slugs.length}):`);
    for (const slug of slugs) {
      lines.push(`  - ${slug}`);
    }
    lines.push("");
  }
  
  return lines.join("\n");
}

export default function (pi: ExtensionAPI) {
  // Scaffolding on session_start
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
    } else {
      // Notify existing workflows
      try {
        const tracking: TrackingData = JSON.parse(readFileSync(trackingPath, "utf-8"));
        const inProgress = tracking.workflows?.filter(w => w.status === "in-progress");
        if (inProgress?.length > 0 && ctx.ui) {
          ctx.ui.notify(
            `Product workflow: ${inProgress.length} in-progress (${inProgress.map(w => w.slug).join(", ")})`,
            "info"
          );
        }
      } catch {
        // Ignore
      }
    }
  });
  
  // Command: show workflow status
  pi.registerCommand("workflow-status", {
    description: "Show current workflow status from cali-product-workflow.json",
    action: async (_ctx) => {
      const trackingPath = join(_ctx.cwd, TRACKING_FILE);
      if (existsSync(trackingPath)) {
        try {
          const tracking: TrackingData = JSON.parse(readFileSync(trackingPath, "utf-8"));
          return formatStatus(tracking);
        } catch {
          return "Error reading tracking file";
        }
      }
      return "No tracking file found. Run a product workflow first.";
    }
  });
  
  // Command: init workflow
  pi.registerCommand("workflow-init", {
    description: "Initialize a new product workflow",
    action: async (_ctx, args?: { slug: string; name?: string }) => {
      if (!args?.slug) {
        return "Usage: /workflow-init slug=my-feature name='My Feature'";
      }
      
      const trackingPath = join(_ctx.cwd, TRACKING_FILE);
      let tracking: TrackingData;
      
      if (existsSync(trackingPath)) {
        try {
          tracking = JSON.parse(readFileSync(trackingPath, "utf-8"));
        } catch {
          return "Error reading tracking file";
        }
      } else {
        tracking = {
          "$schema": SCHEMA_URL,
          "version": "1.0",
          "created": new Date().toISOString(),
          "updated": new Date().toISOString(),
          "workflows": []
        };
      }
      
      // Check if slug already exists
      if (tracking.workflows.some(w => w.slug === args.slug)) {
        return `Workflow '${args.slug}' already exists`;
      }
      
      // Add new workflow
      tracking.workflows.push({
        slug: args.slug,
        status: "draft",
        name: args.name || args.slug,
        description: "",
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        phases: [
          { id: "0-clarify", name: "Clarify", status: "pending" },
          { id: "1-shape", name: "Shape", status: "pending" },
          { id: "2-bet", name: "Bet", status: "pending" },
          { id: "3-build", name: "Build", status: "pending" },
          { id: "4-critique", name: "Critique", status: "pending" },
          { id: "5-gate", name: "Gate", status: "pending" }
        ]
      });
      
      tracking.updated = new Date().toISOString();
      writeFileSync(trackingPath, JSON.stringify(tracking, null, 2));
      
      return `✅ Workflow '${args.slug}' initialized`;
    }
  });
  
  // Command: list workflows
  pi.registerCommand("workflow-list", {
    description: "List all workflows in tracking file",
    action: async (_ctx) => {
      const trackingPath = join(_ctx.cwd, TRACKING_FILE);
      if (existsSync(trackingPath)) {
        const tracking: TrackingData = JSON.parse(readFileSync(trackingPath, "utf-8"));
        return formatStatus(tracking);
      }
      return "No tracking file found";
    }
  });
}