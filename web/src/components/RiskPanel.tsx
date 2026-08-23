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
      <div className="panel-neon p-6 flex flex-col items-center justify-center min-h-[160px] border-l-2 border-l-slate-700">
        <Shield className="w-7 h-7 text-slate-700 mb-2 animate-pulse" />
        <div className="text-slate-600 font-mono text-[10px] uppercase tracking-[0.2em]">
          {'>'} Analyzing_Risk_Surface...
        </div>
      </div>
    );
  }

  const highRiskTools = riskProfile.highRiskTools || [];

  return (
    <div className="panel-neon border-l-2 border-l-agentbreak-s4/60">
      {/* Header */}
      <div className="panel-header">
        <div className="panel-header-title">
          <Shield className="w-3.5 h-3.5 text-agentbreak-s4/70" />
          <span>Risk_Surface</span>
        </div>
        {selectedTool && (
          <button
            onClick={() => onSelectTool?.(null)}
            className="text-[10px] text-agentbreak-primary/60 hover:text-agentbreak-primary font-mono uppercase tracking-wider border border-agentbreak-primary/20 hover:border-agentbreak-primary/50 px-2 py-0.5 transition-all"
          >
            Clear_Filter
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Attack Categories */}
        <div>
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.15em] mb-2">Attack_Categories</p>
          <div className="flex flex-wrap gap-1.5">
            {riskProfile.categories.map(cat => (
              <span key={cat} className="text-[10px] font-mono px-2 py-0.5 bg-slate-900/60 text-slate-500 border border-slate-800 uppercase tracking-wider">
                {cat.replace(/_/g, '_')}
              </span>
            ))}
          </div>
        </div>

        {/* High Risk Tools */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.15em] flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-agentbreak-s4/60" />
              High-Risk_Capabilities
            </p>
            <span className="text-[10px] text-slate-700 font-mono">click to highlight</span>
          </div>

          {highRiskTools.length === 0 ? (
            <div className="text-xs text-agentbreak-s0 bg-agentbreak-s0/5 border border-agentbreak-s0/20 p-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0 text-agentbreak-s0" />
              <span className="font-mono text-[11px]">No critical capabilities exposed.</span>
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
                    className={`cursor-pointer border p-3 transition-all duration-200 relative overflow-hidden ${
                      isSelected
                        ? 'bg-agentbreak-primary/5 border-agentbreak-primary/60 shadow-[0_0_15px_rgba(0,240,255,0.1)]'
                        : 'bg-agentbreak-darker/60 border-slate-800/60 hover:border-slate-600'
                    }`}
                  >
                    {/* Left accent */}
                    <div className={`absolute top-0 left-0 w-0.5 h-full transition-all ${isSelected ? 'bg-agentbreak-primary' : 'bg-slate-700'}`} />

                    <div className="flex items-center justify-between mb-1 pl-2">
                      <span className={`font-mono font-bold text-xs ${isSelected ? 'text-agentbreak-primary' : 'text-agentbreak-primary/70'}`}>
                        {tool}()
                      </span>
                      {tr && (
                        <span className={`badge badge-${tr.severityPotential.toLowerCase()} text-[9px]`}>
                          {tr.severityPotential}
                        </span>
                      )}
                    </div>
                    {tr && (
                      <>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2 pl-2">{tr.riskReason}</p>
                        <div className="flex gap-2 text-[10px] font-mono uppercase mt-2 pt-2 border-t border-slate-800/60 pl-2">
                          <span className={tr.reversible ? "text-agentbreak-s0/70" : "text-agentbreak-s4/80 font-bold"}>
                            {tr.reversible ? "REVERSIBLE" : "IRREVERSIBLE"}
                          </span>
                          <span className="text-slate-700">·</span>
                          <span className="text-slate-600">{tr.scope.replace(/_/g, ' ')}</span>
                          <span className="text-slate-700">·</span>
                          <span className="text-slate-600">{tr.riskCategory}</span>
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
