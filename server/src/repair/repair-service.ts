import {
  AgentConfig,
  AuditScorecard,
  CandidateAgentConfig,
  DeterministicFinding,
  JudgeVerdict,
  RepairVerificationResult,
  RiskProfile,
  ScenarioSuite,
  SeverityDetail,
  StructuredRepairRecommendation,
  Trace,
  Scenario,
  CriticalAction,
} from "@agentbreak/shared";
import { RepairGenerator } from "./repair-generator";
import { CandidateConfigBuilder } from "./candidate-config";
import { SuiteRunner } from "./suite-runner";
import { RepairComparator } from "./comparator";
import { SuitBuilder } from "../scenario/suite-builder";
import { RiskAnalyzer } from "../risk/analyzer";
import { saveRepair } from "../../db";

export interface RepairRunOptions {
  agent: AgentConfig;
  riskProfile?: RiskProfile;
  /** Pre-existing failure context from a prior audit */
  failureContext?: {
    trace: Trace;
    scenario: Scenario;
    verdict: JudgeVerdict;
    severity: SeverityDetail;
    findings: DeterministicFinding[];
    criticalActions: CriticalAction[];
  };
  /** Existing suite — if not provided, builds the standard support suite */
  suite?: ScenarioSuite;
}

/**
 * Repair Service
 *
 * Orchestrates the complete self-verifying repair cycle:
 *
 * 1. Build or reuse a ScenarioSuite
 * 2. Run the suite against the original agent (before)
 * 3. Generate a repair recommendation from the first failure found
 * 4. Build a candidate config (copy + system prompt guardrail)
 * 5. Run the SAME suite against the candidate (after)
 * 6. Compare before/after scorecards
 * 7. Return RepairVerificationResult
 *
 * The original agent is never modified.
 */
export class RepairService {
  private repairGenerator = new RepairGenerator();
  private candidateBuilder = new CandidateConfigBuilder();
  private suiteRunner = new SuiteRunner();
  private comparator = new RepairComparator();
  private suiteBuilder = new SuitBuilder();
  private riskAnalyzer = new RiskAnalyzer();

  /**
   * Runs the full repair + regression verification cycle.
   */
  public async runRepair(options: RepairRunOptions): Promise<RepairVerificationResult> {
    const { agent } = options;

    // ── 1. Risk profile ──────────────────────────────────────────────────────
    const riskProfile = options.riskProfile ?? this.riskAnalyzer.analyze(agent);

    // ── 2. Build or reuse suite ──────────────────────────────────────────────
    const suite = options.suite ?? this.suiteBuilder.buildSuite(agent.name);

    // ── 3. Run suite against ORIGINAL agent (before) ─────────────────────────
    const beforeAuditId = `audit-before-${Date.now()}`;
    const { results: beforeResults, scorecard: beforeScorecard } =
      await this.suiteRunner.run(beforeAuditId, agent, suite, riskProfile, true);

    // ── 4. Find first significant failure to generate repair from ─────────────
    // Prefer S4 → S3 → S2 → any failure
    const orderedFailed = [...beforeResults]
      .filter((r) => !r.verdict.passed)
      .sort((a, b) => {
        const ord = { S4: 4, S3: 3, S2: 2, S1: 1, S0: 0 };
        return ord[b.severity.level] - ord[a.severity.level];
      });

    // For repair generation we need the trace context — use failure context from
    // options if provided, otherwise synthesize from the suite results
    let repair: StructuredRepairRecommendation;

    if (orderedFailed.length > 0) {
      const worstResult = orderedFailed[0];

      if (options.failureContext && options.failureContext.scenario.id === worstResult.scenarioId) {
        // Reuse the richer context from the prior audit if available for the same scenario
        repair = await this.repairGenerator.generate(
          agent,
          options.failureContext.trace,
          options.failureContext.scenario,
          options.failureContext.verdict,
          options.failureContext.severity,
          options.failureContext.findings,
          options.failureContext.criticalActions
        );
      } else {
        // Generate from the verdict/severity metadata alone (deterministic fallback path)
        repair = this.repairGenerator.generateDeterministicFallback(
          agent,
          { id: "synthetic", scenarioId: worstResult.scenarioId, turns: [], agentId: agent.id },
          suite.scenarios.find((s) => s.id === worstResult.scenarioId) ?? suite.scenarios[0],
          worstResult.verdict,
          worstResult.severity,
          [],
          []
        );
      }
    } else {
      // All scenarios passed — generate a no-op repair
      repair = this.repairGenerator.generateDeterministicFallback(
        agent,
        { id: "synthetic", scenarioId: "none", turns: [], agentId: agent.id },
        suite.scenarios[0],
        {
          passed: true,
          failureCategory: "appropriate_handling",
          rationale: "All scenarios passed.",
          confidence: "high",
          evidenceTurns: [],
          judgeMode: "deterministic_fallback",
        },
        beforeScorecard.results[0]?.severity ?? {
          level: "S0", reason: "no failures", criticalTool: null,
          reversibility: "none", scope: "none", impact: "none", evidence: "",
        },
        [],
        []
      );
    }

    // ── 5. Build candidate config (copy + guardrail) ──────────────────────────
    const candidate: CandidateAgentConfig = this.candidateBuilder.build(agent, repair);

    // ── 6. Run SAME suite against candidate (after) ───────────────────────────
    const afterAuditId = `audit-after-${Date.now()}`;
    const { results: afterResults, scorecard: afterScorecard } =
      await this.suiteRunner.run(afterAuditId, candidate.agentConfig, suite, riskProfile, true);

    // ── 7. Compare ────────────────────────────────────────────────────────────
    const comparison = this.comparator.compare(
      suite.suiteId,
      beforeAuditId,
      afterAuditId,
      agent.id,
      candidate.agentConfig.id,
      beforeScorecard,
      afterScorecard
    );

    // ── 8. Persist ────────────────────────────────────────────────────────────
    const verificationId = `verify-${Date.now()}`;
    saveRepair(verificationId, agent.id, repair, candidate, comparison);

    return {
      verificationId,
      originalAgentId: agent.id,
      repair,
      candidate,
      beforeScorecard,
      afterScorecard,
      comparison,
      suite,
    };
  }
}
