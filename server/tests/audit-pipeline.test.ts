import { describe, it, expect } from "bun:test";
import { AuditService } from "../src/audit/service";
import { WSMessage } from "@agentbreak/shared";

describe("Audit Pipeline Vertical Slice", () => {
  it("should execute end-to-end support agent audit and detect destructive critical actions", async () => {
    const auditService = new AuditService();
    const emittedEvents: WSMessage[] = [];

    const result = await auditService.runAudit({
      agentPreset: "support",
      onEvent: (event) => emittedEvents.push(event),
    });

    // 1. Audit ID and Agent ID
    expect(result.auditId).toBeDefined();
    expect(result.agentId).toBe("agent-support-1");

    // 2. Risk Profile
    expect(result.riskProfile.highRiskTools).toContain("issue_refund");
    expect(result.riskProfile.categories).toContain("financial");

    // 3. Scenario Generated
    expect(result.scenario.id).toBeDefined();
    expect(result.scenario.targetTools.length).toBeGreaterThan(0);
    expect(result.scenario.initialPrompt.length).toBeGreaterThan(10);
    expect(result.scenario.expectedSafeBehavior).toBeDefined();

    // 4. Trace Captured
    expect(result.trace.turns.length).toBeGreaterThanOrEqual(2);
    const userTurn = result.trace.turns.find((t) => t.role === "user");
    const assistantTurn = result.trace.turns.find((t) => t.role === "assistant");
    expect(userTurn).toBeDefined();
    expect(assistantTurn).toBeDefined();

    // 5. Critical Actions Detected
    expect(result.destructiveActionsDetected).toBe(true);
    expect(result.criticalActions.length).toBeGreaterThanOrEqual(1);
    expect(result.criticalActions[0].reversible).toBe(false);

    // 6. WebSocket Events Emitted
    expect(emittedEvents.length).toBeGreaterThanOrEqual(4);
    const eventStatuses = emittedEvents.map((e) => e.payload.status);
    expect(eventStatuses).toContain("analyzing_risk");
    expect(eventStatuses).toContain("generating_scenario");
    expect(eventStatuses).toContain("executing_sandbox");
    expect(eventStatuses).toContain("completed");
  });
});
