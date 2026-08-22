import { RiskProfile } from '@agentbreak/shared';
import { AlertTriangle, Shield, CheckCircle } from 'lucide-react';

interface Props {
  riskProfile?: RiskProfile;
  selectedTool?: string | null;
  onSelectTool?: (toolName: string | null) => void;
}

export function RiskPanel({ riskProfile, selectedTool, onSelectTool }: Props) {
  if (!riskProfile) {
    return (
      <div className="panel p-6 flex flex-col items-center justify-center min-h-[160px] border-l-4 border-l-slate-600">
        <Shield className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
        <div className="text-slate-400 font-mono text-xs uppercase tracking-wider">Analyzing Risk Surface...</div>
      </div>
    );
  }

  const highRiskTools = riskProfile.highRiskTools || [];

  return (
    <div className="panel border-l-4 border-l-agentbreak-s4">
      <div className="bg-slate-800/60 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-slate-400" />
          <h3 className="font-semibold text-xs tracking-wider uppercase text-slate-200">Risk Surface</h3>
        </div>
        {selectedTool && (
          <button
            onClick={() => onSelectTool?.(null)}
            className="text-[10px] text-slate-400 hover:text-white uppercase underline"
          >
            Clear Filter
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Identified Categories */}
        <div>
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Attack Categories</p>
          <div className="flex flex-wrap gap-1.5">
            {riskProfile.categories.map(cat => (
              <span key={cat} className="badge bg-slate-800 text-slate-300 border border-slate-700 uppercase text-[10px]">
                {cat.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* High Risk Tools */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-agentbreak-s4" />
              High-Risk Capabilities
            </p>
            <span className="text-[10px] text-slate-500 font-mono">Click tool to highlight in trace</span>
          </div>

          {highRiskTools.length === 0 ? (
            <div className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 p-3 rounded flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>No critical irreversible capabilities exposed.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {highRiskTools.map(tool => {
                const tr = (riskProfile.toolRisks || []).find(t => t.toolName === tool);
                const isSelected = selectedTool === tool;

                return (
                  <div
                    key={tool}
                    onClick={() => onSelectTool?.(isSelected ? null : tool)}
                    className={`cursor-pointer border p-3 rounded transition-all ${
                      isSelected
                        ? 'bg-blue-950/40 border-agentbreak-primary shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                        : 'bg-agentbreak-darker/80 border-slate-700/80 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-agentbreak-primary">
                        {tool}()
                      </span>
                      {tr && (
                        <span className={`badge badge-${tr.severityPotential.toLowerCase()} text-[10px]`}>
                          {tr.severityPotential} Potential
                        </span>
                      )}
                    </div>
                    {tr && (
                      <>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug line-clamp-2">{tr.riskReason}</p>
                        <div className="flex gap-2 text-[10px] font-mono uppercase mt-2 pt-2 border-t border-slate-800">
                          <span className={tr.reversible ? "text-agentbreak-s0" : "text-agentbreak-s4 font-bold"}>
                            {tr.reversible ? "REVERSIBLE" : "IRREVERSIBLE"}
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400">{tr.scope.replace(/_/g, ' ')}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400">{tr.riskCategory}</span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
