import { useState } from 'react';
import { AuditResult, RepairVerificationResult, ScenarioResult } from '@agentbreak/shared';
import { useAuditSocket } from '../hooks/useAuditSocket';
import { RiskPanel } from './RiskPanel';
import { AttackPanel } from './AttackPanel';
import { TraceViewer } from './TraceViewer';
import { ScorecardView } from './ScorecardView';
import { RepairView } from './RepairView';
import { ComparisonView } from './ComparisonView';
import { Activity, Zap, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { MOCK_AUDIT_RESULT } from '../fixtures/mockData';

export type AuditState =
  | 'IDLE'
  | 'RUNNING'
  | 'AUDIT_COMPLETE'
  | 'REPAIR_VERIFYING'
  | 'REPAIR_COMPLETE'
  | 'ERROR';

interface Props {
  preset: string;
  demoMode: boolean;
  state: AuditState;
  auditPhase?: string;
  repairPhase?: string;
  result: AuditResult | null;
  repairResult?: RepairVerificationResult | null;
  errorMessage?: string | null;
  onVerifyRepair: () => void;
  onRunNewAudit: () => void;
  onRetry?: () => void;
}

export function AuditLayout({
  preset,
  demoMode,
  state,
  auditPhase,
  repairPhase,
  result,
  repairResult,
  errorMessage,
  onVerifyRepair,
  onRunNewAudit,
  onRetry,
}: Props) {
  const { messages } = useAuditSocket();

  // Interactive focus state
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedTactic, setSelectedTactic] = useState<string | null>(null);
  const [focusedTurnIndex, setFocusedTurnIndex] = useState<number | null>(null);

  // In demo mode, fallback to demo fixture if result is not yet in state
  const displayResult = result || (demoMode ? MOCK_AUDIT_RESULT : null);

  const isFallback = displayResult?.verdict?.judgeMode === 'deterministic_fallback';
  const hasFailures = displayResult?.verdict ? !displayResult.verdict.passed : true;

  const handleSelectFinding = (finding: ScenarioResult) => {
    if (finding.verdict.evidenceTurns && finding.verdict.evidenceTurns.length > 0) {
      setFocusedTurnIndex(finding.verdict.evidenceTurns[0]);
    } else {
      setSelectedTool(finding.severity.criticalTool);
    }
  };

  const handleClearAllFocus = () => {
    setSelectedTool(null);
    setSelectedTactic(null);
    setFocusedTurnIndex(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header / Status Bar */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-4 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-agentbreak-primary" />
            <h2 className="text-xl font-bold tracking-tight text-white">
              Reliability Audit: {preset === 'support' ? 'Customer Support Agent' : 'DevOps Cluster Agent'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Audit ID: <span className="text-slate-300">{displayResult?.auditId || 'INITIALIZING_SESSION...'}</span>
          </p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Status Badge */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400 font-bold uppercase">STATUS:</span>
            {state === 'RUNNING' && (
              <span className="badge bg-amber-950/60 text-amber-400 border border-amber-500/40 animate-pulse uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                {auditPhase || 'RUNNING ATTACK...'}
              </span>
            )}
            {state === 'AUDIT_COMPLETE' && (
              <span className="badge bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 uppercase">
                AUDIT COMPLETED
              </span>
            )}
            {state === 'REPAIR_VERIFYING' && (
              <span className="badge bg-blue-950/60 text-blue-400 border border-blue-500/40 animate-pulse uppercase flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 animate-spin" />
                VERIFYING REPAIR...
              </span>
            )}
            {state === 'REPAIR_COMPLETE' && (
              <span className="badge bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                REPAIR VERIFIED
              </span>
            )}
            {state === 'ERROR' && (
              <span className="badge bg-red-950/60 text-red-400 border border-red-500/40 uppercase">
                AUDIT FAILED
              </span>
            )}
          </div>

          <div className="h-5 w-px bg-slate-700 hidden sm:block" />

          {/* Mode Badge */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400 font-bold uppercase">MODE:</span>
            {isFallback ? (
              <span className="badge bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                DETERMINISTIC FALLBACK
              </span>
            ) : (
              <span className="badge bg-blue-950/60 text-blue-400 border border-blue-500/40 flex items-center gap-1 uppercase">
                <Zap className="w-3 h-3 text-blue-400" />
                LIVE LLM EVALUATION &middot; GEMINI
              </span>
            )}
          </div>

          <div className="h-5 w-px bg-slate-700 hidden sm:block" />

          {/* Run New Audit Action */}
          <button
            onClick={onRunNewAudit}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Audit</span>
          </button>
        </div>
      </div>

      {/* Error state alert */}
      {state === 'ERROR' && (
        <div className="bg-red-950/40 border border-red-800 p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-agentbreak-s4 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-red-300 uppercase">Audit Execution Error</h4>
              <p className="text-xs text-red-200 mt-0.5">{errorMessage || 'An error occurred during audit execution.'}</p>
            </div>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="btn-primary text-xs py-1.5 px-3 bg-red-600 hover:bg-red-500"
            >
              Retry Audit
            </button>
          )}
        </div>
      )}

      {/* Main Execution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Risk Panel & Adaptive Attack Tactic Flow */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <RiskPanel
            riskProfile={displayResult?.riskProfile}
            selectedTool={selectedTool}
            onSelectTool={setSelectedTool}
          />

          <AttackPanel
            scenario={displayResult?.scenario}
            trace={displayResult?.trace}
            messages={demoMode ? [] : messages}
            selectedTactic={selectedTactic}
            onSelectTactic={setSelectedTactic}
          />
        </div>

        {/* Right Column: Execution Trajectory, Scorecard, and Repair/Comparison */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <TraceViewer
            trace={displayResult?.trace}
            criticalActions={displayResult?.criticalActions || []}
            messages={demoMode ? [] : messages}
            isComplete={state !== 'RUNNING'}
            focusedTurnIndex={focusedTurnIndex}
            focusedTactic={selectedTactic}
            focusedTool={selectedTool}
            onClearFocus={handleClearAllFocus}
          />

          {/* Scorecard: Displayed as soon as audit finishes */}
          {(state === 'AUDIT_COMPLETE' || state === 'REPAIR_VERIFYING' || state === 'REPAIR_COMPLETE') &&
            displayResult?.scorecard && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
                <ScorecardView
                  scorecard={displayResult.scorecard}
                  onSelectFinding={handleSelectFinding}
                />
              </div>
            )}

          {/* No repair needed banner if agent passed cleanly with no violations */}
          {(state === 'AUDIT_COMPLETE' || state === 'REPAIR_COMPLETE') &&
            displayResult?.verdict?.passed && (
              <div className="panel p-6 bg-emerald-950/20 border-l-4 border-l-agentbreak-s0 flex items-center gap-4">
                <ShieldCheck className="w-8 h-8 text-agentbreak-s0 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-emerald-300 uppercase tracking-wide">
                    Agent Passed All Verification Gates
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    The target agent appropriately refused adversarial prompt vectors and required standard authorization. No prompt mitigation required.
                  </p>
                </div>
              </div>
            )}

          {/* Repair Recommendation: Displayed if failure detected, until or during repair */}
          {hasFailures &&
            displayResult?.verdict &&
            displayResult.severity &&
            (state === 'AUDIT_COMPLETE' || state === 'REPAIR_VERIFYING') && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both">
                <RepairView
                  verdict={displayResult.verdict}
                  severity={displayResult.severity}
                  isRepairing={state === 'REPAIR_VERIFYING'}
                  repairPhase={repairPhase}
                  onVerify={onVerifyRepair}
                />
              </div>
            )}

          {/* Before/After Comparison: ONLY displayed when state is REPAIR_COMPLETE */}
          {state === 'REPAIR_COMPLETE' && repairResult && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
              <ComparisonView
                comparison={repairResult.comparison}
                scorecardAfter={repairResult.afterScorecard}
                onRunNewAudit={onRunNewAudit}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
