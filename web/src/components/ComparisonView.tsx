import { RepairComparisonResult, AuditScorecard } from '@agentbreak/shared';
import { ArrowRight, CheckCircle2, AlertOctagon, ShieldCheck, RefreshCw } from 'lucide-react';

interface Props {
  comparison: RepairComparisonResult;
  scorecardAfter?: AuditScorecard;
  onRunNewAudit?: () => void;
}

export function ComparisonView({ comparison, onRunNewAudit }: Props) {
  const isImproved = comparison.improved;

  return (
    <div className={`panel border-t-4 ${isImproved ? 'border-t-agentbreak-s0' : 'border-t-agentbreak-s4'} shadow-2xl`}>
      {/* Header */}
      <div
        className={`${
          isImproved
            ? 'bg-agentbreak-s0/15 border-b border-agentbreak-s0/30'
            : 'bg-agentbreak-s4/15 border-b border-agentbreak-s4/30'
        } px-6 py-4 flex items-center justify-between flex-wrap gap-4`}
      >
        <div className="flex items-center gap-3">
          {isImproved ? (
            <div className="p-2 bg-emerald-950/80 rounded border border-emerald-800/60">
              <ShieldCheck className="w-5 h-5 text-agentbreak-s0" />
            </div>
          ) : (
            <div className="p-2 bg-red-950/80 rounded border border-red-800/60">
              <AlertOctagon className="w-5 h-5 text-agentbreak-s4" />
            </div>
          )}
          <div>
            <h3 className="font-bold text-sm tracking-wider uppercase text-white flex items-center gap-2">
              <span>{isImproved ? 'Repair Verified — Reliability Improved' : 'Repair Inconclusive / Regression'}</span>
              <span className={`badge ${isImproved ? 'badge-s0' : 'badge-s4'} text-[10px]`}>
                {isImproved ? 'PASS' : 'FAIL'}
              </span>
            </h3>
            <p className="text-xs text-slate-300 font-mono mt-0.5">
              Controlled before/after evaluation using identical scenario suite: <span className="text-blue-400 font-bold">{comparison.suiteId || 'standard-suite-v1'}</span>
            </p>
          </div>
        </div>

        {onRunNewAudit && (
          <button
            onClick={onRunNewAudit}
            className="flex items-center gap-2 px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold uppercase tracking-wider transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Run New Audit</span>
          </button>
        )}
      </div>

      <div className="p-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Original Agent Score */}
          <div className="flex flex-col items-center p-5 bg-slate-900/90 rounded-lg border border-slate-800 shadow-inner">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
              Original Agent (Before)
            </span>
            <p className="text-[10px] text-slate-500 mb-2">Suite Pass Rate: {(comparison.beforePassRate * 100).toFixed(0)}%</p>
            <div className="text-5xl font-black text-slate-300 font-mono">{comparison.beforeScore}</div>
            <span className="text-xs text-slate-500 mt-1">/100 points</span>
          </div>

          {/* Delta */}
          <div className="flex flex-col items-center justify-center p-5 bg-slate-950/80 rounded-lg border border-slate-800">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
              Reliability Delta
            </span>
            <div className="flex items-center gap-2 my-1">
              <ArrowRight className="w-5 h-5 text-slate-600" />
              <span
                className={`font-mono text-3xl font-black ${
                  comparison.scoreDelta > 0
                    ? 'text-agentbreak-s0'
                    : comparison.scoreDelta < 0
                    ? 'text-agentbreak-s4'
                    : 'text-slate-400'
                }`}
              >
                {comparison.scoreDelta > 0 ? `+${comparison.scoreDelta}` : comparison.scoreDelta} PTS
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono mt-1">
              Pass Rate: {(comparison.beforePassRate * 100).toFixed(0)}% → {(comparison.afterPassRate * 100).toFixed(0)}%
            </span>
          </div>

          {/* Repaired Candidate Score */}
          <div
            className={`flex flex-col items-center p-5 rounded-lg border shadow-inner ${
              isImproved
                ? 'bg-emerald-950/20 border-emerald-800/40 shadow-[0_0_20px_rgba(16,185,129,0.08)]'
                : 'bg-red-950/20 border-red-800/40'
            }`}
          >
            <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider mb-1">
              Candidate Agent (After)
            </span>
            <p className="text-[10px] text-slate-500 mb-2">Suite Pass Rate: {(comparison.afterPassRate * 100).toFixed(0)}%</p>
            <div className="text-5xl font-black text-white font-mono">{comparison.afterScore}</div>
            <span className="text-xs text-slate-500 mt-1">/100 points</span>
          </div>
        </div>

        {/* Resolved Failures & Regressions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950 p-5 rounded-lg border border-slate-800">
          {/* Resolved Failures */}
          <div>
            <h4 className="text-xs font-mono font-bold text-agentbreak-s0 uppercase tracking-wider mb-3 pb-2 border-b border-agentbreak-s0/20 flex items-center justify-between">
              <span>Resolved Failures</span>
              <span className="badge badge-s0 text-[10px]">{comparison.resolvedFailures.length} fixed</span>
            </h4>
            {comparison.resolvedFailures.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono py-2">No previously failing scenarios were resolved.</div>
            ) : (
              <ul className="flex flex-col gap-2">
                {comparison.resolvedFailures.map(f => (
                  <li
                    key={f}
                    className="text-xs text-slate-200 font-mono bg-emerald-950/30 px-3 py-2 rounded border border-emerald-800/30 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-agentbreak-s0 flex-shrink-0" />
                    <span className="truncate">{f}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Regressions */}
          <div>
            <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-3 pb-2 border-b border-slate-800 flex items-center justify-between">
              <span>Regression Audit</span>
              <span
                className={`badge text-[10px] ${
                  comparison.newFailures.length > 0 ? 'badge-s4' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {comparison.newFailures.length} regressions
              </span>
            </h4>
            {comparison.newFailures.length === 0 &&
            comparison.severityChanges.filter(c => c.severityWorsened || c.overRefusalIntroduced).length === 0 ? (
              <div className="text-xs text-emerald-400 font-mono py-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero regressions detected across all scenarios in suite.</span>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {comparison.newFailures.map(f => (
                  <li
                    key={f}
                    className="text-xs text-red-300 font-mono bg-red-950/30 px-3 py-2 rounded border border-red-800/40 flex items-center gap-2"
                  >
                    <AlertOctagon className="w-4 h-4 text-agentbreak-s4 flex-shrink-0" />
                    <span>{f} (New Failure Introduced)</span>
                  </li>
                ))}
                {comparison.severityChanges
                  .filter(c => c.severityWorsened)
                  .map(c => (
                    <li
                      key={`worse-${c.scenarioId}`}
                      className="text-xs text-amber-300 font-mono bg-amber-950/30 px-3 py-2 rounded border border-amber-800/40 flex items-center gap-2"
                    >
                      <AlertOctagon className="w-4 h-4 text-agentbreak-s3 flex-shrink-0" />
                      <span>{c.scenarioId} (Severity Worsened)</span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>

        {/* Human Readable Explanation */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-300 font-mono bg-slate-900/90 inline-block px-5 py-2.5 rounded-full border border-slate-800 shadow">
            {comparison.explanation}
          </p>
        </div>
      </div>
    </div>
  );
}
