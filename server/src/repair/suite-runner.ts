import {
  AgentConfig,
  AttackTactic,
  AuditScorecard,
  RiskProfile,
  Scenario,
  ScenarioResult,
  ScenarioSuite,
} from "@agentbreak/shared";
import { AgentRunner } from "../execution/runner";
import { MockSandbox } from "../sandbox/mock-sandbox";
import { CriticalActionDetector } from "../trace/detector";
import { LLMJudge } from "../judge/judge";
import { SeverityEngine } from "../judge/severity";
import { ScorecardBuilder } from "../judge/scorecard";
import { FindingsExtractor } from "../judge/findings";
import { saveTrace, saveVerdict } from "../../db";

/**
 * Suite Runner
 *
 * Executes a fixed ScenarioSuite against a given AgentConfig.
 * Scenarios are NOT regenerated — the same Scenario objects are used each time,
 * ensuring controlled before/after experiments.
 *
 * Returns a full AuditScorecard over all scenario results.
 */
export class SuiteRunner {
  private agentRunner = new AgentRunner();
  private criticalActionDetector = new CriticalActionDetector();
  private judge = new LLMJudge();
  private severityEngine = new SeverityEngine();
  private scorecardBuilder = new ScorecardBuilder();
  private findingsExtractor = new FindingsExtractor();

  /**
   * Runs every scenario in the suite against the given agent.
   * Returns the ScenarioResult[] and the built AuditScorecard.
   *
   * @param auditId   Unique ID for this run (used for scorecard)
   * @param agent     The AgentConfig to evaluate (may be original or candidate)
   * @param suite     The stable scenario suite — scenarios are not modified
   * @param riskProfile  Risk profile for the agent
   * @param persist   Whether to persist trace + verdict to DB (default: true)
   */
  public async run(
    auditId: string,
    agent: AgentConfig,
    suite: ScenarioSuite,
    riskProfile: RiskProfile,
    persist: boolean = true
  ): Promise<{ results: ScenarioResult[]; scorecard: AuditScorecard }> {
    const results: ScenarioResult[] = [];

    for (const scenario of suite.scenarios) {
      const scenarioResult = await this.runSingleScenario(
        agent,
        scenario,
        riskProfile,
        persist
      );
      results.push(scenarioResult);
    }

    const scorecard = this.scorecardBuilder.build(auditId, agent.id, results);
    return { results, scorecard };
  }

  /**
   * Runs a single scenario and returns a ScenarioResult.
   * Used internally by `run()`.
   */
  private async runSingleScenario(
    agent: AgentConfig,
    scenario: Scenario,
    riskProfile: RiskProfile,
    persist: boolean
  ): Promise<ScenarioResult> {
    const sandbox = new MockSandbox();

    // Execute the agent against the scenario using the adaptive runner
    const trace = await this.agentRunner.runScenario(agent, scenario, sandbox, riskProfile);

    // Deterministic critical action detection
    const criticalActions = this.criticalActionDetector.detect(trace, riskProfile);
    trace.criticalActions = criticalActions;

    // Extract deterministic findings
    const findings = this.findingsExtractor.extract(trace, criticalActions, riskProfile);

    // Judge verdict (LLM or deterministic fallback)
    const verdict = await this.judge.judge(
      trace,
      scenario,
      riskProfile,
      findings,
      criticalActions
    );

    // Deterministic severity
    const severity = this.severityEngine.compute(verdict, criticalActions, riskProfile, trace);

    // Extract tactics used
    const tacticsUsed: AttackTactic[] = Array.from(
      new Set(trace.attackEvents?.map((e) => e.tactic) ?? [])
    );

    // Persist if requested
    if (persist) {
      saveTrace(trace);
      saveVerdict(trace.id, scenario.id, verdict, severity);
    }

    return {
      scenarioId: scenario.id,
      traceId: trace.id,
      verdict,
      severity,
      criticalActionsCount: criticalActions.length,
      tacticsUsed,
    };
  }
}
