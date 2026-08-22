import { AuditScorecard, ScenarioResult } from '@agentbreak/shared';
import { BarChart, ShieldCheck, AlertOctagon } from 'lucide-react';

interface Props {
  scorecard: AuditScorecard;
  onSelectFinding?: (scenarioResult: ScenarioResult) => void;
}

export function ScorecardView({ scorecard, onSelectFinding }: Props) {
  const severities = ['S4', 'S3', 'S2', 'S1', 'S0'] as const;

  return (
    <div className="panel border-t-4 border-t-agentbreak-primary shadow-xl">
      <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BarChart className="w-5 h-5 text-agentbreak-primary" />
          <h3 className="font-bold text-sm tracking-wider uppercase text-slate-100">Audit Reliability Scorecard</h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
          Formula: {scorecard.scoreFormula || '100 - sum(penalties)'}
        </span>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Score & Pass Rate */}
        <div className="flex flex-col items-center justify-center border-r border-slate-800/80 pr-4">
          <div className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wider mb-1 text-center">
            Single Audit Score
          </div>
          <p className="text-[10px] text-slate-500 mb-3">Individual scenario evaluation</p>
          <div className="text-6xl font-black text-white tracking-tight mb-3">
            {scorecard.overallScore}
            <span className="text-2xl text-slate-500 font-normal">/100</span>
          </div>

          <div className="flex gap-5 mt-2 pt-4 border-t border-slate-800 w-full justify-center">
            <div className="text-center">
              <div className="text-xl font-bold text-agentbreak-s0 font-mono">
                {(scorecard.passRate * 100).toFixed(0)}%
              </div>
              <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">Pass Rate</div>
            </div>
            <div className="w-px bg-slate-800" />
            <div className="text-center">
              <div
                className={`text-xl font-bold font-mono ${
                  scorecard.criticalFailureCount > 0 ? 'text-agentbreak-s4' : 'text-slate-400'
                }`}
              >
                {scorecard.criticalFailureCount}
              </div>
              <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">
                Critical Violations
              </div>
            </div>
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="flex flex-col justify-center border-r border-slate-800/80 pr-4">
          <div className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wider mb-3 text-center">
            Severity Breakdown
          </div>
          <div className="flex flex-col gap-2 w-full max-w-xs mx-auto">
            {severities.map(sev => {
              const count = scorecard.severityDistribution[sev] || 0;
              const total = Math.max(1, scorecard.totalScenarios || scorecard.results.length || 1);
              const pct = (count / total) * 100;

              return (
                <div key={sev} className="flex items-center gap-2.5">
                  <span className={`w-7 font-mono font-bold text-xs text-agentbreak-${sev.toLowerCase()}`}>{sev}</span>
                  <div className="flex-1 h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full bg-agentbreak-${sev.toLowerCase()} transition-all`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <span className="w-6 font-mono text-xs text-slate-400 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Worst Findings */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wider">
              Worst Vulnerabilities
            </div>
            {scorecard.worstScenarios.length > 0 && (
              <span className="text-[10px] text-slate-500 font-mono">Click to inspect</span>
            )}
          </div>

          {scorecard.worstScenarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-agentbreak-s0 gap-2 h-full py-4 bg-emerald-950/20 rounded border border-emerald-800/30">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
              <span className="font-bold text-xs uppercase tracking-wider">No Critical Failures</span>
              <span className="text-[10px] text-emerald-500 font-mono">All safety policies adhered to</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {scorecard.worstScenarios.slice(0, 2).map((w, i) => (
                <div
                  key={i}
                  onClick={() => onSelectFinding?.(w)}
                  className="bg-slate-900/90 rounded p-3 border border-slate-800 hover:border-agentbreak-primary/80 cursor-pointer transition-all hover:bg-slate-800/80"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`badge badge-${w.severity.level.toLowerCase()} text-[10px]`}>
                      {w.severity.level} Critical
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                      <AlertOctagon className="w-3 h-3 text-agentbreak-s4" />
                      {w.verdict.failureCategory.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{w.severity.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
