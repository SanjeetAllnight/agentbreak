import { describe, it, expect } from "bun:test";
import { RepairService } from "../src/repair/repair-service";
import { AuditService } from "../src/audit/service";

// Note: This test takes longer since it runs the suite twice (before and after)
describe("RepairService — full cycle integration", () => {
  it("should run before suite, generate repair, run candidate, and produce improved scorecard", async () => {
    const auditService = new AuditService();
    const repairService = new RepairService();

    // 1. Load original support agent
    const originalAgent = auditService.loadAgentPreset("support");

    // 2. Run full repair cycle
    const result = await repairService.runRepair({ agent: originalAgent });

    // ── Verify Output Structure ───────────────────────────────────────────────
    expect(result.verificationId).toBeDefined();
    expect(result.originalAgentId).toBe(originalAgent.id);
    expect(result.repair).toBeDefined();
    expect(result.candidate).toBeDefined();
    expect(result.beforeScorecard).toBeDefined();
    expect(result.afterScorecard).toBeDefined();
    expect(result.comparison).toBeDefined();
    expect(result.suite).toBeDefined();

    // ── Verify Suite Reusability ──────────────────────────────────────────────
    expect(result.suite.scenarios.length).toBe(5);
    // Before and after scorecards must contain the exact same scenarios
    expect(result.beforeScorecard.totalScenarios).toBe(5);
    expect(result.afterScorecard.totalScenarios).toBe(5);

    // ── Verify Candidate Integrity ────────────────────────────────────────────
    const candidateAgent = result.candidate.agentConfig;
    expect(candidateAgent.id).not.toBe(originalAgent.id);
    expect(candidateAgent.tools.length).toBe(originalAgent.tools.length);
    // System prompt must be mutated
    expect(candidateAgent.systemPrompt).not.toBe(originalAgent.systemPrompt);
    expect(candidateAgent.systemPrompt).toContain(originalAgent.systemPrompt); // it appends
    expect(candidateAgent.systemPrompt).toContain(result.repair.proposedChange);

    // ── Verify Original Integrity ─────────────────────────────────────────────
    // Original agent must not be mutated
    const freshAgent = auditService.loadAgentPreset("support");
    expect(originalAgent.systemPrompt).toBe(freshAgent.systemPrompt);

    // ── Verify Comparison ─────────────────────────────────────────────────────
    const cmp = result.comparison;

    // The original support agent is known to fail the adversarial refund scenarios.
    // The deterministic fallback repair adds a strict guardrail.
    // The candidate should pass the scenarios the original failed.
    expect(cmp.resolvedFailures.length).toBeGreaterThan(0);
    expect(cmp.scoreDelta).toBeGreaterThan(0);
    expect(cmp.improved).toBe(true);
    expect(cmp.regressionDetected).toBe(false);

    // Verify explanation string is generated
    expect(cmp.explanation.length).toBeGreaterThan(10);
    expect(cmp.explanation).toContain("IMPROVED");
    expect(cmp.explanation).toContain("Resolved failures");
  }, 30000); // Allow 30s for the full double-suite run
});
