import { useEffect, useRef } from 'react';
import { CriticalAction, Trace, WSMessage } from '@agentbreak/shared';
import { Terminal, User, Bot, Wrench, AlertOctagon, ShieldAlert, Sparkles } from 'lucide-react';

interface Props {
  trace?: Trace;
  criticalActions: CriticalAction[];
  messages?: WSMessage[];
  isComplete: boolean;
  focusedTurnIndex?: number | null;
  focusedTactic?: string | null;
  focusedTool?: string | null;
  onClearFocus?: () => void;
}

export function TraceViewer({
  trace,
  criticalActions,
  isComplete,
  focusedTurnIndex,
  focusedTactic,
  focusedTool,
  onClearFocus,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const turns = trace?.turns || [];

  useEffect(() => {
    if (focusedTurnIndex !== null && focusedTurnIndex !== undefined) {
      const el = document.getElementById(`trace-turn-${focusedTurnIndex}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [focusedTurnIndex]);

  useEffect(() => {
    if (focusedTactic) {
      const matchingTurn = turns.find(t => t.attackMeta?.tactic === focusedTactic);
      if (matchingTurn && matchingTurn.turnIndex !== undefined) {
        const el = document.getElementById(`trace-turn-${matchingTurn.turnIndex}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [focusedTactic, turns]);

  useEffect(() => {
    if (focusedTool) {
      const matchingTurn = turns.find(t => t.toolCalls?.some(tc => tc.name === focusedTool));
      if (matchingTurn && matchingTurn.turnIndex !== undefined) {
        const el = document.getElementById(`trace-turn-${matchingTurn.turnIndex}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [focusedTool, turns]);

  useEffect(() => {
    if (scrollRef.current && focusedTurnIndex === null && !focusedTactic && !focusedTool) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns.length, focusedTurnIndex, focusedTactic, focusedTool]);

  if (!trace && turns.length === 0) {
    return (
      <div className="panel-neon h-96 flex flex-col items-center justify-center border-l-2 border-l-agentbreak-primary/60">
        <Terminal className="w-8 h-8 text-agentbreak-primary/30 mb-3 animate-pulse" />
        <div className="text-agentbreak-primary/50 font-mono text-xs uppercase tracking-[0.2em]">
          {'>'} Awaiting Execution Trace...
        </div>
        <div className="mt-2 flex gap-1">
          {[0,1,2].map(i => (
            <span key={i} className="w-1 h-1 bg-agentbreak-primary/40 animate-pulse" style={{animationDelay: `${i * 200}ms`}} />
          ))}
        </div>
      </div>
    );
  }

  const hasFilter = Boolean(focusedTurnIndex !== null || focusedTactic || focusedTool);

  return (
    <div className="panel-neon flex flex-col h-[650px] border-l-2 border-l-agentbreak-primary/60">
      {/* Header */}
      <div className="bg-agentbreak-darker/80 px-4 py-3 border-b border-agentbreak-primary/20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-agentbreak-primary/70" />
          <h3 className="font-mono font-bold text-xs tracking-[0.15em] uppercase text-agentbreak-primary/80">
            Execution_Trajectory_Trace
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {hasFilter && (
            <button
              onClick={onClearFocus}
              className="text-[10px] font-mono text-agentbreak-primary/70 hover:text-agentbreak-primary border border-agentbreak-primary/30 hover:border-agentbreak-primary/60 bg-agentbreak-primary/5 px-2 py-0.5 tracking-wider uppercase transition-all"
            >
              Reset_View
            </button>
          )}

          <div className="flex items-center gap-2">
            {!isComplete && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full bg-agentbreak-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 bg-agentbreak-primary shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
              </span>
            )}
            <span className="font-mono text-[10px] text-slate-500 bg-agentbreak-darker px-2 py-0.5 border border-slate-800 tracking-wider">
              {turns.length} TURNS
            </span>
          </div>
        </div>
      </div>

      {/* Active filter banner */}
      {hasFilter && (
        <div className="bg-agentbreak-primary/5 border-b border-agentbreak-primary/20 px-4 py-1.5 flex items-center gap-2 text-xs text-agentbreak-primary/70 font-mono">
          <Sparkles className="w-3 h-3 text-agentbreak-primary/50" />
          <span className="tracking-wider">
            FILTER::{focusedTurnIndex !== null && focusedTurnIndex !== undefined ? `TURN_${focusedTurnIndex}` : ''}
            {focusedTactic ? `TACTIC::${focusedTactic.replace(/_/g, '_')}` : ''}
            {focusedTool ? `TOOL::${focusedTool}()` : ''}
          </span>
        </div>
      )}

      {/* Trace Stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-agentbreak-darker/50 font-mono text-sm">
        {turns.map((turn, i) => {
          const turnIdx = turn.turnIndex !== undefined ? turn.turnIndex : i;
          const isTurnFocused = focusedTurnIndex === turnIdx;
          const isTacticFocused = focusedTactic && turn.attackMeta?.tactic === focusedTactic;
          const isToolFocused = focusedTool && turn.toolCalls?.some(tc => tc.name === focusedTool);
          const isHighlighted = isTurnFocused || isTacticFocused || isToolFocused;

          if (turn.role === 'user') {
            return (
              <div
                key={i}
                id={`trace-turn-${turnIdx}`}
                className={`flex gap-3.5 transition-all p-2 ${
                  isHighlighted ? 'bg-agentbreak-s4/5 ring-1 ring-agentbreak-s4/50 shadow-[0_0_15px_rgba(255,0,60,0.1)]' : ''
                }`}
              >
                <div className="flex-shrink-0 w-8 h-8 bg-agentbreak-s4/10 border border-agentbreak-s4/40 flex items-center justify-center text-agentbreak-s4">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="font-bold text-[10px] text-agentbreak-s4 tracking-[0.15em] uppercase">ADVERSARIAL_ATTACKER</span>
                    <span className="text-[10px] text-slate-600 font-mono">T:{turnIdx}</span>
                    {turn.attackMeta && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-agentbreak-s3/10 text-agentbreak-s3 border border-agentbreak-s3/30 tracking-wider">
                        [{turn.attackMeta.tactic.replace(/_/g, '_').toUpperCase()}]
                      </span>
                    )}
                  </div>
                  <div className="bg-agentbreak-darker/80 p-3.5 text-slate-300 text-xs leading-relaxed whitespace-pre-wrap border border-agentbreak-s4/20 border-l-2 border-l-agentbreak-s4/60 select-text">
                    {turn.content}
                  </div>
                </div>
              </div>
            );
          }

          if (turn.role === 'assistant') {
            return (
              <div
                key={i}
                id={`trace-turn-${turnIdx}`}
                className={`flex gap-3.5 flex-row-reverse transition-all p-2 ${
                  isHighlighted ? 'bg-agentbreak-primary/5 ring-1 ring-agentbreak-primary/50 shadow-[0_0_15px_rgba(0,240,255,0.08)]' : ''
                }`}
              >
                <div className="flex-shrink-0 w-8 h-8 bg-agentbreak-primary/10 flex items-center justify-center border border-agentbreak-primary/40 text-agentbreak-primary">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col items-end">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] text-slate-600 font-mono">T:{turnIdx}</span>
                    <span className="font-bold text-[10px] text-agentbreak-primary tracking-[0.15em] uppercase">TARGET_AGENT</span>
                  </div>

                  {turn.content && (
                    <div className="bg-agentbreak-darker/80 p-3.5 text-slate-300 text-xs leading-relaxed whitespace-pre-wrap border border-agentbreak-primary/20 border-r-2 border-r-agentbreak-primary/60 text-left w-full max-w-2xl select-text">
                      {turn.content}
                    </div>
                  )}

                  {turn.toolCalls && turn.toolCalls.map((tc, idx) => {
                    const criticalAction = criticalActions.find(
                      ca => ca.turnIndex === turnIdx && (ca.toolName === tc.name || ca.tool === tc.name)
                    );

                    return (
                      <div
                        key={idx}
                        className={`mt-3 w-full max-w-2xl text-left overflow-hidden ${
                          criticalAction
                            ? 'border border-agentbreak-s4/60 shadow-[0_0_20px_rgba(255,0,60,0.15)]'
                            : 'border border-slate-700/60 bg-agentbreak-darker/80'
                        }`}
                      >
                        {criticalAction && (
                          <div className="bg-agentbreak-s4/20 border-b border-agentbreak-s4/40 text-agentbreak-s4 px-3.5 py-2 flex items-center justify-between font-mono font-bold text-[10px] uppercase tracking-[0.15em] animate-pulse">
                            <div className="flex items-center gap-2">
                              <AlertOctagon className="w-3.5 h-3.5" />
                              <span>S4_CRITICAL_ACTION_EXECUTED</span>
                            </div>
                            <span className="bg-agentbreak-s4/20 px-2 py-0.5 border border-agentbreak-s4/30 text-agentbreak-s4">
                              VIOLATION
                            </span>
                          </div>
                        )}

                        <div className={`p-3.5 ${criticalAction ? 'bg-agentbreak-s4/5' : 'bg-agentbreak-darker/80'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-agentbreak-s2 font-bold text-xs">
                              <Wrench className="w-3.5 h-3.5" />
                              <span>{tc.name}()</span>
                            </div>
                            <span className="text-[10px] text-slate-600 font-mono tracking-wider">TOOL_CALL</span>
                          </div>

                          <pre className="text-xs text-slate-400 bg-agentbreak-darker p-3 border border-slate-800/60 overflow-x-auto whitespace-pre-wrap break-all select-text leading-relaxed">
                            {JSON.stringify(tc.arguments, null, 2)}
                          </pre>

                          {criticalAction && (
                            <div className="mt-3 text-xs text-agentbreak-s4/80 font-mono bg-agentbreak-s4/5 p-2.5 border border-agentbreak-s4/20 leading-relaxed">
                              <div className="font-bold text-agentbreak-s4 uppercase tracking-wider mb-0.5 flex items-center gap-1 text-[10px]">
                                <ShieldAlert className="w-3 h-3" />
                                CRITICAL_IMPACT_RATIONALE::
                              </div>
                              {criticalAction.riskReason || "Unauthorized destructive capability invoked under adversarial prompt pressure."}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          if (turn.role === 'tool') {
            return (
              <div
                key={i}
                id={`trace-turn-${turnIdx}`}
                className={`flex gap-3.5 transition-all p-2 ${
                  isHighlighted ? 'bg-agentbreak-primary/5 ring-1 ring-agentbreak-primary/30' : ''
                }`}
              >
                <div className="flex-shrink-0 w-8 h-8 bg-slate-900 flex items-center justify-center border border-slate-700/60 text-slate-500">
                  <Wrench className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-bold text-[10px] text-slate-500 tracking-[0.15em] uppercase">SANDBOX_ENV_RESULT</span>
                    <span className="text-[10px] text-slate-600 font-mono">T:{turnIdx}</span>
                  </div>
                  <pre className="bg-agentbreak-darker p-3 text-xs text-slate-400 border border-slate-800/60 overflow-x-auto whitespace-pre-wrap break-all select-text">
                    {turn.content}
                  </pre>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
