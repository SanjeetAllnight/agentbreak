import {
  AgentConfig,
  AttackTactic,
  AuditResult,
  AuditScorecard,
  JudgeVerdict,
  ScenarioResult,
  SeverityDetail,
  WSMessage,
} from "@agentbreak/shared";
import { RiskAnalyzer } from "../risk/analyzer";
import { ScenarioGenerator } from "../scenario/generator";
import { MockSandbox } from "../sandbox/mock-sandbox";
import { AgentRunner } from "../execution/runner";
import { CriticalActionDetector } from "../trace/detector";
import { LLMJudge } from "../judge/judge";
import { SeverityEngine } from "../judge/severity";
import { ScorecardBuilder } from "../judge/scorecard";
import { FindingsExtractor } from "../judge/findings";
import { saveTrace, saveVerdict } from "../../db";
import { join } from "path";
import { readFileSync } from "fs";

export interface AuditRunOptions {
  agentPreset?: string;
  agentConfig?: AgentConfig;
  onEvent?: (event: WSMessage) => void;
}

export class AuditService {
  private riskAnalyzer = new RiskAnalyzer();
  private scenarioGenerator = new ScenarioGenerator();
  private agentRunner = new AgentRunner();
  private criticalActionDetector = new CriticalActionDetector();
  private judge = new LLMJudge();
  private severityEngine = new SeverityEngine();
  private scorecardBuilder = new ScorecardBuilder();
  private findingsExtractor = new FindingsExtractor();

  /**
   * Loads an agent preset configuration from disk.
   */
  public loadAgentPreset(presetName: string = "support"): AgentConfig {
    const agentsDir = join(import.meta.dir, "../../../agents");
    const filePath = join(agentsDir, `${presetName}.json`);

    try {
      const content = readFileSync(filePath, "utf-8");
      return JSON.parse(content) as AgentConfig;
    } catch (err) {
      throw new Error(
        `Failed to load agent preset '${presetName}' from ${filePath}: ${err}`
      );
    }
  }

  /**
   * Executes the complete audit pipeline:
   *
   * AgentConfig
   *   → Risk Analysis
   *   → Scenario Generation
   *   → Adaptive Red Team + Sandbox Execution
   *   → Trace Capture
   *   → Deterministic Findings
   *   → LLM Judge (or fallback)
   *   → Severity Engine
   *   → Scorecard
   */
  public async runAudit(options: AuditRunOptions = {}): Promise<AuditResult> {
    const auditId = `audit-${Date.now()}`;
    const notify = (msg: WSMessage) => {
      if (options.onEvent) options.onEvent(msg);
    };

    // ── 1. Resolve AgentConfig ───────────────────────────────────────────────
    const agent =
      options.agentConfig ||
      this.loadAgentPreset(options.agentPreset || "support");

    notify({
      type: "AUDIT_STATUS",
      payload: { auditId, status: "analyzing_risk", agentId: agent.id },
    });

    // ── 2. Risk Analysis ─────────────────────────────────────────────────────
    const riskProfile = this.riskAnalyzer.analyze(agent);

    notify({
      type: "AUDIT_STATUS",
      payload: {
        auditId,
        status: "generating_scenario",
        riskCategories: riskProfile.categories,
      },
    });

    // ── 3. Scenario Generation ───────────────────────────────────────────────
    const scenario = await this.scenarioGenerator.generateScenario(
      agent,
      riskProfile
    );

    notify({
      type: "AUDIT_STATUS",
      payload: {
        auditId,
        status: "executing_sandbox",
        scenarioId: scenario.id,
        targetTools: scenario.targetTools,
      },
    });

    // ── 4. Adaptive Red Team + Sandbox Execution ─────────────────────────────
    const sandbox = new MockSandbox();
    const trace = await this.agentRunner.runScenario(
      agent,
      scenario,
      sandbox,
      riskProfile
    );

    notify({
      type: "AUDIT_STATUS",
      payload: {
        auditId,
        status: "detecting_critical_actions",
        turnsCount: trace.turns.length,
      },
    });

    // ── 5. Deterministic Findings + Critical Action Detection ─────────────────
    const criticalActions = this.criticalActionDetector.detect(trace, riskProfile);
    trace.criticalActions = criticalActions;

    const findings = this.findingsExtractor.extract(trace, criticalActions, riskProfile);

    notify({
      type: "AUDIT_STATUS",
      payload: {
        auditId,
        status: "judging",
        findingsCount: findings.length,
        criticalActionsCount: criticalActions.length,
      },
    });

    // ── 6. LLM Judge ─────────────────────────────────────────────────────────
    const verdict: JudgeVerdict = await this.judge.judge(
      trace,
      scenario,
      riskProfile,
      findings,
      criticalActions
    );

    notify({
      type: "VERDICT",
      payload: {
        auditId,
        passed: verdict.passed,
        failureCategory: verdict.failureCategory,
        judgeMode: verdict.judgeMode,
      },
    });

    // ── 7. Deterministic Severity ─────────────────────────────────────────────
    const severity: SeverityDetail = this.severityEngine.compute(
      verdict,
      criticalActions,
      riskProfile,
      trace
    );

    notify({
      type: "SEVERITY",
      payload: {
        auditId,
        level: severity.level,
        criticalTool: severity.criticalTool,
        impact: severity.impact,
      },
    });

    // ── 8. Build Scorecard ────────────────────────────────────────────────────
    // Extract tactic sequence from attack events
    const tacticsUsed: AttackTactic[] = Array.from(
      new Set(trace.attackEvents?.map((e) => e.tactic) ?? [])
    );

    const scenarioResult: ScenarioResult = {
      scenarioId: scenario.id,
      traceId: trace.id,
      verdict,
      severity,
      criticalActionsCount: criticalActions.length,
      tacticsUsed,
    };

    const scorecard: AuditScorecard = this.scorecardBuilder.build(auditId, agent.id, [
      scenarioResult,
    ]);

    // ── 9. Persist Trace + Verdict ────────────────────────────────────────────
    saveTrace(trace);
    saveVerdict(trace.id, scenario.id, verdict, severity, scorecard.overallScore);


    const destructiveActionsDetected = criticalActions.length > 0;

    const result: AuditResult = {
      auditId,
      agentId: agent.id,
      riskProfile,
      scenario,
      trace,
      criticalActions,
      destructiveActionsDetected,
      verdict,
      severity,
      scorecard,
    };

    notify({
      type: "AUDIT_STATUS",
      payload: {
        auditId,
        status: "completed",
        destructiveActionsDetected,
        criticalActionsCount: criticalActions.length,
        passed: verdict.passed,
        severityLevel: severity.level,
        overallScore: scorecard.overallScore,
      },
    });

    return result;
  }
}
