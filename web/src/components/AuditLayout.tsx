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
      <div className="glass-panel px-5 py-4 flex items-center justify-between flex-wrap gap-4 rounded-none border-x-0 border-t-0" style={{clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)'}}>
        <div>
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-agentbreak-primary animate-pulse-glow" />
            <h2 className="text-sm font-mono font-bold tracking-[0.1em] uppercase text-white">
              <span className="text-agentbreak-primary/60 mr-2">//</span>
              {preset === 'support' ? 'SYS.001 Customer Support Agent' : 'SYS.002 DevOps Cluster Agent'}
            </h2>
          </div>
          <p className="text-[11px] text-slate-600 font-mono mt-1 pl-7">
            AUD:<span className="text-slate-500 ml-1">{displayResult?.auditId || 'INIT_SESSION_PENDING...'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Badge */}
          {state === 'RUNNING' && (
            <div className="flex items-center gap-2 text-xs font-mono bg-agentbreak-s2/10 border border-agentbreak-s2/40 px-3 py-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 bg-agentbreak-s2 animate-ping shadow-[0_0_6px_rgba(255,204,0,0.8)]" />
              <span className="text-agentbreak-s2 tracking-[0.12em] uppercase">{auditPhase || 'RUNNING_ATTACK...'}</span>
            </div>
          )}
          {state === 'AUDIT_COMPLETE' && (
            <div className="flex items-center gap-2 text-xs font-mono bg-agentbreak-s0/10 border border-agentbreak-s0/40 px-3 py-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-agentbreak-s0" />
              <span className="text-agentbreak-s0 tracking-[0.12em] uppercase">Audit_Complete</span>
            </div>
          )}
          {state === 'REPAIR_VERIFYING' && (
            <div className="flex items-center gap-2 text-xs font-mono bg-agentbreak-primary/10 border border-agentbreak-primary/40 px-3 py-1.5 animate-pulse">
              <Zap className="w-3.5 h-3.5 text-agentbreak-primary animate-spin" />
              <span className="text-agentbreak-primary tracking-[0.12em] uppercase">Verifying_Repair...</span>
            </div>
          )}
          {state === 'REPAIR_COMPLETE' && (
            <div className="flex items-center gap-2 text-xs font-mono bg-agentbreak-s0/10 border border-agentbreak-s0/40 px-3 py-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-agentbreak-s0" />
              <span className="text-agentbreak-s0 tracking-[0.12em] uppercase">Repair_Verified</span>
            </div>
          )}
          {state === 'ERROR' && (
            <div className="flex items-center gap-2 text-xs font-mono bg-agentbreak-s4/10 border border-agentbreak-s4/40 px-3 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-agentbreak-s4" />
              <span className="text-agentbreak-s4 tracking-[0.12em] uppercase">Audit_Failed</span>
            </div>
          )}

          <div className="w-px h-4 bg-slate-700/60 hidden sm:block" />

          {/* Mode indicator */}
          <div className="text-[10px] font-mono text-slate-600 tracking-[0.15em] uppercase">
            {isFallback ? 'DETERMINISTIC' : <span className="text-agentbreak-primary/60">LIVE LLM</span>}
          </div>

          <div className="w-px h-4 bg-slate-700/60 hidden sm:block" />

          <button
            onClick={onRunNewAudit}
            className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300 hover:text-white bg-agentbreak-darker/50 backdrop-blur border border-slate-700 hover:border-agentbreak-primary hover:shadow-glow-primary px-4 py-2 tracking-wider uppercase transition-all duration-300 rounded-md"
          >
            <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
            <span>New_Audit</span>
          </button>
        </div>
      </div>

      {/* Error state alert */}
      {state === 'ERROR' && (
        <div className="bg-agentbreak-s4/5 border border-agentbreak-s4/50 p-4 flex items-center justify-between shadow-[0_0_20px_rgba(255,0,60,0.1)]" style={{clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)'}}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-agentbreak-s4 flex-shrink-0" />
            <div>
              <h4 className="font-mono font-bold text-xs text-agentbreak-s4 uppercase tracking-wider">Audit_Execution_Error</h4>
              <p className="text-xs text-red-300/70 mt-0.5">{errorMessage || 'An error occurred during audit execution.'}</p>
            </div>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-[11px] font-mono text-agentbreak-s4 border border-agentbreak-s4/50 hover:bg-agentbreak-s4/20 px-4 py-1.5 tracking-wider uppercase transition-all"
            >
              Retry_Audit
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
