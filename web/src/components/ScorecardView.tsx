import { AuditScorecard, ScenarioResult } from '@agentbreak/shared';
import { BarChart2, ShieldCheck, AlertOctagon } from 'lucide-react';

interface Props {
  scorecard: AuditScorecard;
  onSelectFinding?: (scenarioResult: ScenarioResult) => void;
}

export function ScorecardView({ scorecard, onSelectFinding }: Props) {
  const severities = ['S4', 'S3', 'S2', 'S1', 'S0'] as const;
  const sevColors: Record<string, string> = {
    S4: 'bg-agentbreak-s4',
    S3: 'bg-agentbreak-s3',
    S2: 'bg-agentbreak-s2',
    S1: 'bg-agentbreak-s1',
    S0: 'bg-agentbreak-s0',
  };

  const score = scorecard.overallScore;
  const scoreColor = score >= 80 ? 'text-agentbreak-s0' : score >= 50 ? 'text-agentbreak-s2' : 'text-agentbreak-s4';
  const scoreGlow = score >= 80 
    ? 'drop-shadow-[0_0_12px_rgba(0,255,157,0.6)]' 
    : score >= 50 
    ? 'drop-shadow-[0_0_12px_rgba(255,204,0,0.6)]' 
    : 'drop-shadow-[0_0_12px_rgba(255,0,60,0.6)]';

  return (
    <div className="panel-neon border-t-2 border-t-agentbreak-primary/60">
      {/* Header */}
      <div className="panel-header">
        <div className="panel-header-title">
          <BarChart2 className="w-3.5 h-3.5 text-agentbreak-primary/70" />
          <span>Audit_Reliability_Scorecard</span>
        </div>
        <span className="text-[10px] font-mono text-slate-600 bg-agentbreak-darker px-2.5 py-1 border border-slate-800 tracking-wider">
          {scorecard.scoreFormula || '100 - sum(penalties)'}
        </span>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Score Display */}
        <div className="flex flex-col items-center justify-center border-r border-slate-800/60 pr-4">
          <div className="text-[10px] text-slate-600 font-mono tracking-[0.2em] uppercase mb-1">
            Audit_Score
          </div>
          <div className={`text-7xl font-black font-mono tracking-tight ${scoreColor} ${scoreGlow} mb-3`}>
            {scorecard.overallScore}
            <span className="text-2xl text-slate-600 font-normal ml-1">/100</span>
          </div>

          <div className="flex gap-6 mt-2 pt-4 border-t border-slate-800/60 w-full justify-center">
            <div className="text-center">
              <div className="text-xl font-bold font-mono text-agentbreak-s0">
                {(scorecard.passRate * 100).toFixed(0)}%
              </div>
              <div className="text-[10px] text-slate-600 font-mono uppercase tracking-wider mt-0.5">Pass_Rate</div>
            </div>
            <div className="w-px bg-slate-800" />
            <div className="text-center">
              <div className={`text-xl font-bold font-mono ${scorecard.criticalFailureCount > 0 ? 'text-agentbreak-s4' : 'text-slate-600'}`}>
                {scorecard.criticalFailureCount}
              </div>
              <div className="text-[10px] text-slate-600 font-mono uppercase tracking-wider mt-0.5">Violations</div>
            </div>
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="flex flex-col justify-center border-r border-slate-800/60 pr-4">
          <div className="text-[10px] text-slate-600 font-mono tracking-[0.2em] uppercase mb-3 text-center">
            Severity_Breakdown
          </div>
          <div className="flex flex-col gap-2.5 w-full max-w-xs mx-auto">
            {severities.map(sev => {
              const count = scorecard.severityDistribution[sev] || 0;
              const total = Math.max(1, scorecard.totalScenarios || scorecard.results.length || 1);
              const pct = (count / total) * 100;

              return (
                <div key={sev} className="flex items-center gap-2.5">
                  <span className={`w-7 font-mono font-bold text-xs text-agentbreak-${sev.toLowerCase()}`}>{sev}</span>
                  <div className="flex-1 h-2 bg-agentbreak-darker border border-slate-800/60 overflow-hidden">
                    <div
                      className={`h-full ${sevColors[sev]} transition-all duration-700`}
                      style={{ width: `${Math.min(100, pct)}%`, boxShadow: pct > 0 ? `0 0 6px currentColor` : 'none' }}
                    />
                  </div>
                  <span className="w-5 font-mono text-[11px] text-slate-500 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Worst Findings */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] text-slate-600 font-mono tracking-[0.2em] uppercase">
              Worst_Vulnerabilities
            </div>
            {scorecard.worstScenarios.length > 0 && (
              <span className="text-[10px] text-slate-700 font-mono">click to inspect</span>
            )}
          </div>

          {scorecard.worstScenarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-agentbreak-s0 gap-2 h-full py-4 bg-agentbreak-s0/5 border border-agentbreak-s0/20">
              <ShieldCheck className="w-8 h-8 text-agentbreak-s0/60" />
              <span className="font-mono font-bold text-[11px] uppercase tracking-wider">No_Critical_Failures</span>
              <span className="text-[10px] text-agentbreak-s0/50 font-mono">All safety policies adhered to</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {scorecard.worstScenarios.slice(0, 2).map((w, i) => (
                <div
                  key={i}
                  onClick={() => onSelectFinding?.(w)}
                  className="bg-agentbreak-darker/60 p-3 border border-slate-800/60 hover:border-agentbreak-s4/40 cursor-pointer transition-all duration-200 hover:bg-agentbreak-s4/5 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-0.5 h-full bg-agentbreak-s4/40" />
                  <div className="flex items-center justify-between mb-1.5 pl-2">
                    <span className={`badge badge-${w.severity.level.toLowerCase()} text-[9px]`}>
                      {w.severity.level} Critical
                    </span>
                    <span className="text-[10px] font-mono text-slate-600 bg-agentbreak-darker px-2 py-0.5 border border-slate-800/60 flex items-center gap-1">
                      <AlertOctagon className="w-2.5 h-2.5 text-agentbreak-s4/60" />
                      {w.verdict.failureCategory.replace(/_/g, '_')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed pl-2">{w.severity.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
