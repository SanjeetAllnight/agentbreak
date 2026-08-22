import { describe, it, expect } from "bun:test";
import { MOCK_AUDIT_RESULT, MOCK_DEVOPS_AUDIT_RESULT, MOCK_REPAIR_RESULT } from "../fixtures/mockData";

describe("Frontend Fixtures & State Separation", () => {
  it("MOCK_AUDIT_RESULT should contain complete audit findings without premature repair results", () => {
    expect(MOCK_AUDIT_RESULT.auditId).toBeDefined();
    expect(MOCK_AUDIT_RESULT.scorecard).toBeDefined();
    expect(MOCK_AUDIT_RESULT.scorecard?.overallScore).toBe(35);
    expect(MOCK_AUDIT_RESULT.criticalActions.length).toBeGreaterThan(0);
    expect(MOCK_AUDIT_RESULT.verdict?.passed).toBe(false);
    expect(MOCK_AUDIT_RESULT.severity?.level).toBe("S4");

    // Must NOT contain repair or candidate data in the base audit result
    expect((MOCK_AUDIT_RESULT as any).repair).toBeUndefined();
    expect((MOCK_AUDIT_RESULT as any).candidate).toBeUndefined();
    expect((MOCK_AUDIT_RESULT as any).comparison).toBeUndefined();
  });

  it("MOCK_DEVOPS_AUDIT_RESULT should reflect a clean pass with S0 severity", () => {
    expect(MOCK_DEVOPS_AUDIT_RESULT.verdict?.passed).toBe(true);
    expect(MOCK_DEVOPS_AUDIT_RESULT.severity?.level).toBe("S0");
    expect(MOCK_DEVOPS_AUDIT_RESULT.scorecard?.overallScore).toBe(100);
    expect(MOCK_DEVOPS_AUDIT_RESULT.criticalActions.length).toBe(0);
  });

  it("MOCK_REPAIR_RESULT should contain separate before/after scorecard data and suite attribution", () => {
    expect(MOCK_REPAIR_RESULT.comparison.suiteId).toBe("suite-support-v1");
    expect(MOCK_REPAIR_RESULT.comparison.beforeScore).toBe(35);
    expect(MOCK_REPAIR_RESULT.comparison.afterScore).toBe(100);
    expect(MOCK_REPAIR_RESULT.comparison.scoreDelta).toBe(65);
    expect(MOCK_REPAIR_RESULT.comparison.improved).toBe(true);
    expect(MOCK_REPAIR_RESULT.comparison.resolvedFailures.length).toBe(2);
    expect(MOCK_REPAIR_RESULT.comparison.newFailures.length).toBe(0);
    expect(MOCK_REPAIR_RESULT.candidate.systemPromptDiff).toContain("SECURITY POLICY ENFORCEMENT");
  });
});

describe("State Machine Transition Rules", () => {
  type AuditState =
    | "IDLE"
    | "RUNNING"
    | "AUDIT_COMPLETE"
    | "REPAIR_VERIFYING"
    | "REPAIR_COMPLETE"
    | "ERROR";

  function transition(
    currentState: AuditState,
    event: "START_AUDIT" | "AUDIT_FINISHED" | "START_REPAIR" | "REPAIR_FINISHED" | "RESET" | "FAIL"
  ): AuditState {
    switch (currentState) {
      case "IDLE":
        if (event === "START_AUDIT") return "RUNNING";
        return currentState;
      case "RUNNING":
        if (event === "AUDIT_FINISHED") return "AUDIT_COMPLETE";
        if (event === "FAIL") return "ERROR";
        return currentState;
      case "AUDIT_COMPLETE":
        if (event === "START_REPAIR") return "REPAIR_VERIFYING";
        if (event === "START_AUDIT") return "RUNNING";
        if (event === "RESET") return "IDLE";
        return currentState;
      case "REPAIR_VERIFYING":
        if (event === "REPAIR_FINISHED") return "REPAIR_COMPLETE";
        if (event === "FAIL") return "ERROR";
        return currentState;
      case "REPAIR_COMPLETE":
        if (event === "RESET" || event === "START_AUDIT") return event === "RESET" ? "IDLE" : "RUNNING";
        return currentState;
      case "ERROR":
        if (event === "START_AUDIT" || event === "RESET") return event === "RESET" ? "IDLE" : "RUNNING";
        return currentState;
      default:
        return currentState;
    }
  }

  it("should navigate through the complete audit -> repair lifecycle", () => {
    let s: AuditState = "IDLE";
    expect(s).toBe("IDLE");

    s = transition(s, "START_AUDIT");
    expect(s).toBe("RUNNING");

    s = transition(s, "AUDIT_FINISHED");
    expect(s).toBe("AUDIT_COMPLETE");

    s = transition(s, "START_REPAIR");
    expect(s).toBe("REPAIR_VERIFYING");

    s = transition(s, "REPAIR_FINISHED");
    expect(s).toBe("REPAIR_COMPLETE");

    s = transition(s, "RESET");
    expect(s).toBe("IDLE");
  });

  it("comparison view should only be available when state is REPAIR_COMPLETE", () => {
    const isComparisonVisible = (state: AuditState, repairResult: any) =>
      state === "REPAIR_COMPLETE" && repairResult !== null;

    expect(isComparisonVisible("IDLE", null)).toBe(false);
    expect(isComparisonVisible("RUNNING", null)).toBe(false);
    expect(isComparisonVisible("AUDIT_COMPLETE", null)).toBe(false);
    expect(isComparisonVisible("REPAIR_VERIFYING", null)).toBe(false);
    expect(isComparisonVisible("REPAIR_COMPLETE", MOCK_REPAIR_RESULT)).toBe(true);
  });
});
