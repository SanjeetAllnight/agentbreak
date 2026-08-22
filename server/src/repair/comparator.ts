import {
  AuditScorecard,
  RepairComparisonResult,
  ScenarioComparison,
  ScenarioChangeStatus,
  ScenarioResult,
  SeverityLevel,
} from "@agentbreak/shared";

const SEVERITY_ORDINAL: Record<SeverityLevel, number> = {
  S0: 0, S1: 1, S2: 2, S3: 3, S4: 4,
};

/**
 * Repair Comparator
 *
 * Compares before/after ScenarioSuite runs and produces a RepairComparisonResult.
 *
 * Improvement rule (fully deterministic — no LLM):
 *   improved =
 *     afterScore > beforeScore
 *     AND afterCriticalFailures <= beforeCriticalFailures
 *     AND newFailures.length === 0
 *
 * Regression detection:
 *   regressionDetected =
 *     newFailures.length > 0
 *     OR any scenario worsened in severity
 *     OR over_refusal introduced on a scenario that previously passed
 */
export class RepairComparator {
  public compare(
    suiteId: string,
    beforeAuditId: string,
    afterAuditId: string,
    beforeAgentId: string,
    afterAgentId: string,
    beforeScorecard: AuditScorecard,
    afterScorecard: AuditScorecard
  ): RepairComparisonResult {
    const comparisonId = `cmp-${Date.now()}`;

    // Index before results by scenarioId for O(1) lookup
    const beforeByScenario = new Map<string, ScenarioResult>();
    for (const r of beforeScorecard.results) {
      beforeByScenario.set(r.scenarioId, r);
    }

    const afterByScenario = new Map<string, ScenarioResult>();
    for (const r of afterScorecard.results) {
      afterByScenario.set(r.scenarioId, r);
    }

    const resolvedFailures: string[] = [];
    const remainingFailures: string[] = [];
    const newFailures: string[] = [];
    const severityChanges: ScenarioComparison[] = [];

    // Iterate over all scenarios present in BOTH runs
    const allIds = new Set([...beforeByScenario.keys(), ...afterByScenario.keys()]);

    for (const scenarioId of allIds) {
      const before = beforeByScenario.get(scenarioId);
      const after = afterByScenario.get(scenarioId);

      if (!before || !after) {
        // Scenario only appeared in one run (suite mismatch — should not happen)
        if (!before && after && !after.verdict.passed) {
          newFailures.push(scenarioId);
        }
        continue;
      }

      const beforePassed = before.verdict.passed;
      const afterPassed = after.verdict.passed;
      const beforeSevOrd = SEVERITY_ORDINAL[before.severity.level];
      const afterSevOrd = SEVERITY_ORDINAL[after.severity.level];

      const severityImproved = afterSevOrd < beforeSevOrd;
      const severityWorsened = afterSevOrd > beforeSevOrd;
      const overRefusalIntroduced =
        beforePassed && !afterPassed && after.verdict.failureCategory === "over_refusal";

      // Determine change status
      let changeStatus: ScenarioChangeStatus;
      if (!beforePassed && afterPassed) {
        changeStatus = "resolved";
        resolvedFailures.push(scenarioId);
      } else if (!beforePassed && !afterPassed) {
        changeStatus = severityImproved ? "improved" : severityWorsened ? "worsened" : "unchanged";
        remainingFailures.push(scenarioId);
      } else if (beforePassed && !afterPassed) {
        changeStatus = "worsened";
        newFailures.push(scenarioId);
      } else {
        // Both passed — could have changed severity
        changeStatus = severityImproved ? "improved" : "unchanged";
      }

      severityChanges.push({
        scenarioId,
        beforeVerdict: before.verdict,
        afterVerdict: after.verdict,
        beforeSeverity: before.severity,
        afterSeverity: after.severity,
        changeStatus,
        severityImproved,
        severityWorsened,
        overRefusalIntroduced,
      });
    }

    // ── Deterministic improvement rule ──────────────────────────────────────
    const beforeScore = beforeScorecard.overallScore;
    const afterScore = afterScorecard.overallScore;
    const scoreDelta = afterScore - beforeScore;

    const improved =
      afterScore > beforeScore &&
      afterScorecard.criticalFailureCount <= beforeScorecard.criticalFailureCount &&
      newFailures.length === 0;

    const regressionDetected =
      newFailures.length > 0 ||
      severityChanges.some((sc) => sc.severityWorsened) ||
      severityChanges.some((sc) => sc.overRefusalIntroduced);

    // ── Human-readable explanation ──────────────────────────────────────────
    const explanation = this.buildExplanation(
      improved,
      regressionDetected,
      scoreDelta,
      resolvedFailures,
      remainingFailures,
      newFailures,
      severityChanges
    );

    return {
      comparisonId,
      suiteId,
      beforeAuditId,
      afterAuditId,
      beforeAgentId,
      afterAgentId,
      beforeScore,
      afterScore,
      scoreDelta,
      beforePassRate: beforeScorecard.passRate,
      afterPassRate: afterScorecard.passRate,
      resolvedFailures,
      remainingFailures,
      newFailures,
      severityChanges,
      improved,
      regressionDetected,
      explanation,
      resolvedFailureCount: resolvedFailures.length,
      newFailureCount: newFailures.length,
    };
  }

  private buildExplanation(
    improved: boolean,
    regressionDetected: boolean,
    scoreDelta: number,
    resolvedFailures: string[],
    remainingFailures: string[],
    newFailures: string[],
    severityChanges: ScenarioComparison[]
  ): string {
    const lines: string[] = [];

    if (improved) {
      lines.push(
        `✅ Repair IMPROVED reliability. Score delta: ${scoreDelta > 0 ? "+" : ""}${scoreDelta}.`
      );
    } else if (regressionDetected) {
      lines.push(
        `⚠️  Repair introduced REGRESSIONS. Score delta: ${scoreDelta > 0 ? "+" : ""}${scoreDelta}.`
      );
    } else {
      lines.push(
        `ℹ️  Repair result: inconclusive. Score delta: ${scoreDelta > 0 ? "+" : ""}${scoreDelta}.`
      );
    }

    if (resolvedFailures.length > 0) {
      lines.push(
        `Resolved failures (${resolvedFailures.length}): ${resolvedFailures.join(", ")}`
      );
    }

    if (remainingFailures.length > 0) {
      lines.push(
        `Remaining failures (${remainingFailures.length}): ${remainingFailures.join(", ")}`
      );
    }

    if (newFailures.length > 0) {
      lines.push(
        `🔴 New failures introduced (${newFailures.length}): ${newFailures.join(", ")}`
      );
    }

    const overRefusal = severityChanges.filter((sc) => sc.overRefusalIntroduced);
    if (overRefusal.length > 0) {
      lines.push(
        `⚠️  Over-refusal introduced on: ${overRefusal.map((sc) => sc.scenarioId).join(", ")} — repair may be too aggressive.`
      );
    }

    const improved_sev = severityChanges.filter((sc) => sc.severityImproved);
    if (improved_sev.length > 0) {
      lines.push(
        `Severity reduced on ${improved_sev.length} scenario(s).`
      );
    }

    return lines.join(" | ");
  }
}
