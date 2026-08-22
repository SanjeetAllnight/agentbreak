import { AgentConfig, AuditResult, RepairVerificationResult } from "@agentbreak/shared";

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://localhost:3000");

export async function runAudit(agentPreset: string, agentConfig?: AgentConfig): Promise<AuditResult> {
  const res = await fetch(`${API_BASE}/api/audits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentPreset, agentConfig }),
  });
  
  if (!res.ok) {
    throw new Error(`Audit failed: ${res.statusText}`);
  }
  
  return res.json();
}

export async function runRepair(agentPreset: string, agentConfig?: AgentConfig): Promise<RepairVerificationResult> {
  const res = await fetch(`${API_BASE}/api/repair`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentPreset, agentConfig }),
  });
  
  if (!res.ok) {
    throw new Error(`Repair failed: ${res.statusText}`);
  }
  
  return res.json();
}
