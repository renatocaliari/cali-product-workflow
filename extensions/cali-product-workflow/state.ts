import { existsSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, basename, dirname, extname } from "node:path";
import type { Workflow, TrackingData, ParsedInput } from "./types";
import { TRACKING_FILE, GLOBAL_TRACKING_FILE, SCHEMA_URL } from "./types";

// ── Shared State ─────────────────────────────────────────────────────

export const parsedInputStore: Map<string, ParsedInput> = new Map();

let untitledCounter = 0;

// ── Input Parsing ────────────────────────────────────────────────────

const FILE_REF_REGEX = /@[\w\-\/\.]+(?::\d+(?::\d+)?)?/g;

export function parseInputForWorkflow(input: string): ParsedInput {
  const sources: string[] = [];
  const matches = input.match(FILE_REF_REGEX);
  if (matches) {
    for (const match of matches) {
      let filePath = match.slice(1).split(":")[0];
      if (!filePath.startsWith("./") && !filePath.startsWith("/")) {
        filePath = "./" + filePath;
      }
      sources.push(filePath);
    }
  }

  const text = input
    .replace(FILE_REF_REGEX, " ")
    .replace(/\/[a-z-]+(\s|$)/gi, " ")
    .replace(/[a-z]+=[^\s]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return { sources, draftText: text };
}

// ── File Paths ───────────────────────────────────────────────────────

function getTrackingPath(cwd: string): string {
  return join(cwd, TRACKING_FILE);
}

function getGlobalTrackingPath(): string {
  return join(process.env.HOME || dirname(process.cwd()), GLOBAL_TRACKING_FILE);
}

// ── Read / Write ─────────────────────────────────────────────────────

export function readTracking(cwd: string): TrackingData | null {
  const path = getTrackingPath(cwd);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

export function readGlobalTracking(): TrackingData | null {
  const path = getGlobalTrackingPath();
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

export function writeTracking(cwd: string, data: TrackingData): void {
  writeFileSync(getTrackingPath(cwd), JSON.stringify(data, null, 2));
}

export function writeGlobalTracking(data: TrackingData): void {
  writeFileSync(getGlobalTrackingPath(), JSON.stringify(data, null, 2));
}

// ── Query ────────────────────────────────────────────────────────────

export function getActiveWorkflow(cwd: string): Workflow | null {
  const tracking = readTracking(cwd);
  if (!tracking) return null;
  return tracking.workflows.find(w => w.status === "in-progress") || null;
}

export function getAllActiveWorkflows(cwd: string): Workflow[] {
  const tracking = readTracking(cwd);
  if (!tracking) return [];
  return tracking.workflows.filter(
    w => w.status === "in-progress" || w.status === "paused"
  );
}

// ── Slugs ────────────────────────────────────────────────────────────

/** Create a URL-safe, human-readable slug from text */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

/** Placeholder display slug when user hasn't provided context yet */
export function generatePlaceholderSlug(): string {
  untitledCounter++;
  return `untitled-${untitledCounter}`;
}

/** Stable directory hash (never changes, survives rename) */
export function generateDirHash(): string {
  const ts = Date.now().toString(36).slice(-4);
  const rand = Math.random().toString(36).substring(2, 8);
  return `wf-${ts}-${rand}`;
}

/** Readable date-stamped directory, e.g. "2026-05-16" */
export function getDateStamp(date?: Date): string {
  return (date || new Date()).toISOString().slice(0, 10);
}

/** Suggest a friendlier slug from draft content */
export function suggestSlugFromDraft(draft: string): string | null {
  const clean = draft
    .replace(/```[\s\S]*?```/g, "")
    .replace(/=== FILE:.*?===/g, "")
    .replace(/### Initial Draft\n\n/, "")
    .trim();

  // First sentence under 80 chars
  const firstLine = clean.split("\n")[0]?.trim();
  if (firstLine && firstLine.length > 3 && firstLine.length < 80) {
    return slugify(firstLine);
  }

  // First 4 significant words
  const words = clean.split(/\s+/).filter(w => w.length > 2).slice(0, 4);
  if (words.length >= 2) return slugify(words.join(" "));

  return null;
}

// ── Rename ───────────────────────────────────────────────────────────

/** Rename a workflow's display slug. Directory stays unchanged. */
export function renameWorkflow(
  cwd: string,
  oldSlug: string,
  newName: string
): { ok: true } | { ok: false; error: string } {
  const finalSlug = slugify(newName);
  if (!finalSlug || finalSlug.length < 2) {
    return { ok: false, error: "Name must be at least 2 characters" };
  }

  // 1. Local tracking
  const tracking = readTracking(cwd);
  if (!tracking) return { ok: false, error: "No tracking file" };

  const wf = tracking.workflows.find(w => w.slug === oldSlug);
  if (!wf) return { ok: false, error: `Workflow '${oldSlug}' not found` };

  wf.slug = finalSlug;
  wf.updated = new Date().toISOString();
  writeTracking(cwd, tracking);

  // 2. Global tracking
  const globalTracking = readGlobalTracking();
  if (globalTracking) {
    const gwf = globalTracking.workflows.find(w => w.slug === oldSlug);
    if (gwf) {
      gwf.slug = finalSlug;
      gwf.updated = new Date().toISOString();
    }
    writeGlobalTracking(globalTracking);
  }

  // 3. index.json (directory name = oldSlug = stable initial slug)
  const ds = getDateStamp(new Date(wf.created));
  const idxPath = join(cwd, "product-workflow", ds, oldSlug, "index.json");
  if (existsSync(idxPath)) {
    try {
      const idx = JSON.parse(readFileSync(idxPath, "utf-8"));
      idx.slug = finalSlug;
      idx.updated_at = new Date().toISOString();
      writeFileSync(idxPath, JSON.stringify(idx, null, 2));
    } catch {
      /* skip */
    }
  }

  return { ok: true };
}

// ── Helpers ──────────────────────────────────────────────────────────

export function readSourceFile(sourcePath: string): string | null {
  if (!sourcePath.startsWith("./") && !sourcePath.startsWith("/")) {
    sourcePath = "./" + sourcePath;
  }
  if (!existsSync(sourcePath)) return null;
  try {
    const st = statSync(sourcePath);
    return st.isDirectory()
      ? `Directory: ${sourcePath}`
      : readFileSync(sourcePath, "utf-8").slice(0, 50000);
  } catch {
    return null;
  }
}

export function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 100) + "\n\n[... truncated ...]";
}
