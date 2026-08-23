import React from 'react';
import { Scenario, Trace, WSMessage } from '@agentbreak/shared';
import { Target, ChevronDown, Crosshair } from 'lucide-react';

interface Props {
  scenario?: Scenario;
  trace?: Trace;
  messages?: WSMessage[];
  selectedTactic?: string | null;
  onSelectTactic?: (tactic: string | null) => void;
}

export function AttackPanel({ scenario, trace, selectedTactic, onSelectTactic }: Props) {
  if (!scenario) {
    return (
      <div className="panel-neon p-6 flex flex-col items-center justify-center min-h-[160px] border-l-2 border-l-slate-700">
        <Target className="w-7 h-7 text-slate-700 mb-2 animate-pulse" />
        <div className="text-slate-600 font-mono text-[10px] uppercase tracking-[0.2em]">
          {'>'} Synthesizing_Adaptive_Attack...
        </div>
      </div>
    );
  }

  const attackEvents = trace?.attackEvents || [];

  return (
    <div className="panel-neon border-l-2 border-l-agentbreak-s3/60">
      {/* Header */}
      <div className="panel-header">
        <div className="panel-header-title">
          <Target className="w-3.5 h-3.5 text-agentbreak-s3/70" />
          <span>Adaptive_Red_Team</span>
        </div>
        {selectedTactic && (
          <button
            onClick={() => onSelectTactic?.(null)}
            className="text-[10px] text-agentbreak-primary/60 hover:text-agentbreak-primary font-mono uppercase tracking-wider border border-agentbreak-primary/20 hover:border-agentbreak-primary/50 px-2 py-0.5 transition-all"
          >
            Clear_Filter
          </button>
        )}
      </div>

      {/* Objective */}
      <div className="p-4 border-b border-slate-800/60 bg-agentbreak-darker/30">
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.15em] mb-1.5">Target_Objective</p>
        <p className="text-xs text-slate-400 leading-relaxed">{scenario.objective}</p>

        <div className="mt-3 flex items-center gap-2 pt-2.5 border-t border-slate-800/60">
          <Crosshair className="w-3 h-3 text-agentbreak-s4/60 flex-shrink-0" />
          <span className="text-[10px] font-mono text-slate-600 uppercase">Target_Tool:</span>
          <span className="font-mono text-xs font-bold text-agentbreak-s4/80">
            {scenario.targetTools.map(t => `${t}()`).join(', ')}
          </span>
        </div>
      </div>

      {/* Tactic Flow */}
      <div className="p-4 bg-agentbreak-darker/20">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.15em]">
            Tactic_Progression
          </p>
          <span className="text-[10px] text-slate-700 font-mono">click to jump</span>
        </div>

        {attackEvents.length === 0 ? (
          <div className="text-slate-700 font-mono text-[11px] p-3 bg-agentbreak-darker/60 border border-slate-800/60 flex items-center gap-2">
            <span className="animate-pulse">{'>'}</span>
            <span>Executing initial vector...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {attackEvents.map((ev, i) => {
              const isSelected = selectedTactic === ev.tactic;

              return (
                <React.Fragment key={i}>
                  <div
                    onClick={() => onSelectTactic?.(isSelected ? null : ev.tactic)}
                    className={`cursor-pointer p-2.5 border transition-all duration-200 relative overflow-hidden ${
                      isSelected
                        ? 'bg-agentbreak-s3/10 border-agentbreak-s3/60 shadow-[0_0_12px_rgba(255,102,0,0.1)]'
                        : 'bg-agentbreak-darker/60 border-slate-800/60 hover:border-slate-600'
                    }`}
                  >
                    {/* Top accent */}
                    <div className={`absolute top-0 left-0 w-full h-px transition-all ${isSelected ? 'bg-agentbreak-s3' : 'bg-transparent'}`} />

                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-[11px] font-bold uppercase tracking-[0.1em] ${isSelected ? 'text-agentbreak-s3' : 'text-agentbreak-s3/60'}`}>
                        {ev.tactic.replace(/_/g, '_')}
                      </span>
                      <span className="text-[10px] font-mono text-slate-600 bg-agentbreak-darker px-1.5 py-0.5 border border-slate-800">
                        T:{ev.turnIndex}
                      </span>
                    </div>
                    {ev.reason && (
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">{ev.reason}</p>
                    )}
                  </div>

                  {i < attackEvents.length - 1 && (
                    <div className="flex flex-col items-center gap-0.5 my-0.5">
                      <ChevronDown className="w-3 h-3 text-slate-700" />
                      <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wider bg-agentbreak-darker px-2 py-0.5 border border-slate-800/60">
                        {ev.agentBehavior.replace(/_/g, ' ')}
                      </span>
                      <ChevronDown className="w-3 h-3 text-slate-700" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
