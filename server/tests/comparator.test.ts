import { describe, it, expect } from "bun:test";
import { RepairComparator } from "../src/repair/comparator";
import { AuditScorecard, ScenarioResult } from "@agentbreak/shared";

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function makeScorecard(score: number, criticalFails: number, results: ScenarioResult[]): AuditScorecard {
  return {
    auditId: "test-audit",
    agentId: "agent-1",
    totalScenarios: results.length,
    passedScenarios: results.filter(r => r.verdict.passed).length,
    failedScenarios: results.filter(r => !r.verdict.passed).length,
    passRate: 0,
    overallScore: score,
    scoreFormula: "test",
    categoryBreakdown: { unsafe_compliance_under_pressure: 0, verification_omission: 0, hallucinated_confidence: 0, goal_drift: 0, loop_retry_pathology: 0, over_refusal: 0, appropriate_handling: 0 },
    severityDistribution: { S0: 0, S1: 0, S2: 0, S3: 0, S4: 0 },
    criticalFailureCount: criticalFails,
    worstScenarios: [],
    highRiskToolStats: {},
    results,
  };
}

function makeRes(id: string, passed: boolean, sevLevel: "S0" | "S1" | "S2" | "S3" | "S4", cat: any = "unsafe_compliance_under_pressure"): ScenarioResult {
  return {
    scenarioId: id,
    traceId: "t-1",
    verdict: { passed, failureCategory: cat, rationale: "", confidence: "high", evidenceTurns: [], judgeMode: "deterministic_fallback" },
    severity: { level: sevLevel, reason: "", criticalTool: null, reversibility: "none", scope: "none", impact: "none", evidence: "" },
    criticalActionsCount: passed ? 0 : 1,
    tacticsUsed: [],
  };
}

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe("RepairComparator", () => {
  const comparator = new RepairComparator();

  it("should detect resolved failures and mark as improved", () => {
    // Before: S4 failure
    const before = makeScorecard(60, 1, [makeRes("sc-1", false, "S4")]);
    // After: S0 passed
    const after = makeScorecard(100, 0, [makeRes("sc-1", true, "S0", "appropriate_handling")]);

    const cmp = comparator.compare("suite-1", "b-aud", "a-aud", "b-ag", "a-ag", before, after);

    expect(cmp.resolvedFailures).toContain("sc-1");
    expect(cmp.remainingFailures.length).toBe(0);
    expect(cmp.newFailures.length).toBe(0);
    expect(cmp.scoreDelta).toBe(40);
    expect(cmp.improved).toBe(true);
    expect(cmp.regressionDetected).toBe(false);
  });

  it("should detect new failures (regression)", () => {
    // Before: S0 passed
    const before = makeScorecard(100, 0, [makeRes("sc-1", true, "S0", "appropriate_handling")]);
    // After: S3 failure
    const after = makeScorecard(75, 1, [makeRes("sc-1", false, "S3")]);

    const cmp = comparator.compare("suite-1", "b-aud", "a-aud", "b-ag", "a-ag", before, after);

    expect(cmp.newFailures).toContain("sc-1");
    expect(cmp.improved).toBe(false);
    expect(cmp.regressionDetected).toBe(true);
  });

  it("should detect over-refusal introduction as a regression", () => {
    // Before: benign scenario passed (S0)
    const before = makeScorecard(100, 0, [makeRes("sc-benign", true, "S0", "appropriate_handling")]);
    // After: benign scenario failed (over_refusal - S1)
    const after = makeScorecard(92, 0, [makeRes("sc-benign", false, "S1", "over_refusal")]);

    const cmp = comparator.compare("suite-1", "b-aud", "a-aud", "b-ag", "a-ag", before, after);

    expect(cmp.newFailures).toContain("sc-benign");
    expect(cmp.improved).toBe(false);
    expect(cmp.regressionDetected).toBe(true);
    const sevChange = cmp.severityChanges.find(s => s.scenarioId === "sc-benign");
    expect(sevChange?.overRefusalIntroduced).toBe(true);
  });

  it("should detect severity worsening as a regression even if score improves due to other fixes", () => {
    // sc-1: S4 -> S0 (improves +40)
    // sc-2: S1 -> S2 (worsens -7)
    // net score delta: +33
    const before = makeScorecard(57, 1, [makeRes("sc-1", false, "S4"), makeRes("sc-2", false, "S1")]);
    const after = makeScorecard(90, 0, [makeRes("sc-1", true, "S0"), makeRes("sc-2", false, "S2")]);

    const cmp = comparator.compare("suite-1", "b-aud", "a-aud", "b-ag", "a-ag", before, after);

    // Score improved
    expect(cmp.scoreDelta).toBe(33);
    expect(cmp.resolvedFailures).toContain("sc-1");

    // But sc-2 worsened in severity
    const sc2Change = cmp.severityChanges.find(s => s.scenarioId === "sc-2");
    expect(sc2Change?.severityWorsened).toBe(true);
    expect(cmp.regressionDetected).toBe(true);

    // Since regression rules override simple score improvement in some contexts (though improved flag might technically just check newFailures.length == 0. Let's verify our specific improvement logic:)
    // Our rule: afterScore > beforeScore AND afterCriticalFailures <= beforeCriticalFailures AND newFailures.length === 0
    // newFailures = [] (it was already failing, just got worse).
    // so improved=true, regressionDetected=true. The explanation will note regressions.
    expect(cmp.improved).toBe(true); 
  });
});
