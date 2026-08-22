import React from 'react';
import { Scenario, Trace, WSMessage } from '@agentbreak/shared';
import { Target, ArrowDown, Crosshair } from 'lucide-react';

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
      <div className="panel p-6 flex flex-col items-center justify-center min-h-[160px] border-l-4 border-l-slate-600">
        <Target className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
        <div className="text-slate-400 font-mono text-xs uppercase tracking-wider">Synthesizing Adaptive Attack...</div>
      </div>
    );
  }

  const attackEvents = trace?.attackEvents || [];

  return (
    <div className="panel border-l-4 border-l-agentbreak-s3">
      <div className="bg-slate-800/60 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-slate-400" />
          <h3 className="font-semibold text-xs tracking-wider uppercase text-slate-200">Adaptive Red Team</h3>
        </div>
        {selectedTactic && (
          <button
            onClick={() => onSelectTactic?.(null)}
            className="text-[10px] text-slate-400 hover:text-white uppercase underline"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Objective */}
      <div className="p-4 border-b border-slate-800 bg-agentbreak-darker/50">
        <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">Target Objective</p>
        <p className="text-xs text-slate-300 leading-relaxed">{scenario.objective}</p>

        <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-800/80">
          <Crosshair className="w-3.5 h-3.5 text-agentbreak-s4 flex-shrink-0" />
          <span className="text-[11px] font-mono text-slate-400 uppercase">Target Tool:</span>
          <span className="font-mono text-xs font-bold text-agentbreak-s4">
            {scenario.targetTools.map(t => `${t}()`).join(', ')}
          </span>
        </div>
      </div>

      {/* Tactic Transition Flow */}
      <div className="p-4 bg-agentbreak-darker/30">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Tactic Progression Flow
          </p>
          <span className="text-[10px] text-slate-500 font-mono">Click tactic to jump to trace</span>
        </div>

        {attackEvents.length === 0 ? (
          <div className="text-slate-500 font-mono text-xs p-3 bg-slate-900/50 rounded border border-slate-800 animate-pulse">
            Executing initial vector...
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {attackEvents.map((ev, i) => {
              const isSelected = selectedTactic === ev.tactic;

              return (
                <React.Fragment key={i}>
                  <div
                    onClick={() => onSelectTactic?.(isSelected ? null : ev.tactic)}
                    className={`cursor-pointer p-2.5 rounded border transition-all ${
                      isSelected
                        ? 'bg-amber-950/40 border-agentbreak-s3 shadow-[0_0_10px_rgba(249,115,22,0.2)]'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-agentbreak-s3 uppercase">
                        {ev.tactic.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                        Turn {ev.turnIndex}
                      </span>
                    </div>
                    {ev.reason && (
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{ev.reason}</p>
                    )}
                  </div>

                  {i < attackEvents.length - 1 && (
                    <div className="flex flex-col items-center gap-0.5 my-0.5">
                      <ArrowDown className="w-3.5 h-3.5 text-slate-600" />
                      <span className="text-[9px] font-mono text-slate-400 uppercase bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                        Agent: {ev.agentBehavior.replace(/_/g, ' ')}
                      </span>
                      <ArrowDown className="w-3.5 h-3.5 text-slate-600" />
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
