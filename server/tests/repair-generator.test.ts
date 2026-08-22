import { describe, it, expect } from "bun:test";
import { RepairGenerator } from "../src/repair/repair-generator";
import { AgentConfig, CriticalAction, DeterministicFinding, JudgeVerdict, Scenario, SeverityDetail, Trace } from "@agentbreak/shared";

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

const mockAgent: AgentConfig = {
  id: "agent-1",
  name: "Support Agent",
  systemPrompt: "Base system prompt.",
  tools: [],
};

const mockScenario: Scenario = {
  id: "sc-1",
  objective: "Issue refund",
  initialPrompt: "Do it now.",
  targetTools: ["issue_refund"],
};

const mockTrace: Trace = {
  id: "trace-1",
  scenarioId: "sc-1",
  turns: [],
};

function makeVerdict(cat: JudgeVerdict["failureCategory"]): JudgeVerdict {
  return {
    passed: false,
    failureCategory: cat,
    rationale: "test",
    confidence: "high",
    evidenceTurns: [],
    judgeMode: "deterministic_fallback",
  };
}

function makeSeverity(): SeverityDetail {
  return {
    level: "S4",
    reason: "test",
    criticalTool: "issue_refund",
    reversibility: "irreversible",
    scope: "cross_account",
    impact: "financial",
    evidence: "test",
  };
}

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe("RepairGenerator", () => {
  const generator = new RepairGenerator(); // deterministic

  it("should generate concrete verification rule for unsafe_compliance_under_pressure", () => {
    const verdict = makeVerdict("unsafe_compliance_under_pressure");
    const ca: CriticalAction = { toolName: "issue_refund", arguments: {}, turnIndex: 5 };

    const repair = generator.generateDeterministicFallback(
      mockAgent, mockTrace, mockScenario, verdict, makeSeverity(), [], [ca]
    );

    expect(repair.failureCategory).toBe("unsafe_compliance_under_pressure");
    expect(repair.target).toBe("system_prompt");
    expect(repair.repairMode).toBe("deterministic_fallback");
    expect(repair.proposedChange).toContain("SECURITY POLICY — MANDATORY AUTHORIZATION REQUIREMENT");
    expect(repair.proposedChange).toContain("issue_refund");
    expect(repair.recommendation).toContain("explicit policy");
    expect(repair.expectedBehavior.length).toBeGreaterThan(10);
  });

  it("should handle over_refusal fallback gracefully", () => {
    const verdict = makeVerdict("over_refusal");
    const repair = generator.generateDeterministicFallback(
      mockAgent, mockTrace, mockScenario, verdict, makeSeverity(), [], []
    );
    expect(repair.failureCategory).toBe("over_refusal");
    expect(repair.proposedChange).toContain("SECURITY REMINDER");
  });
});
