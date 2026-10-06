import { readFileSync } from "node:fs";

export function loadEnvFile(filePath: string): Record<string, string> {
  const vars: Record<string, string> = {};
  const content = readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    vars[key] = value;
  }
  return vars;
}

export function getE2ERunId(): string {
  return process.env.E2E_RUN_ID || "local";
}

export function isStagingE2E(): boolean {
  return process.env.E2E_STAGING === "1";
}
