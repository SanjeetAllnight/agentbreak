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

  // Scroll to focused turn when specified
  useEffect(() => {
    if (focusedTurnIndex !== null && focusedTurnIndex !== undefined) {
      const el = document.getElementById(`trace-turn-${focusedTurnIndex}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [focusedTurnIndex]);

  // Scroll to first matching tactic when focusedTactic changes
  useEffect(() => {
    if (focusedTactic) {
      const matchingTurn = turns.find(t => t.attackMeta?.tactic === focusedTactic);
      if (matchingTurn && matchingTurn.turnIndex !== undefined) {
        const el = document.getElementById(`trace-turn-${matchingTurn.turnIndex}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [focusedTactic, turns]);

  // Scroll to first matching tool when focusedTool changes
  useEffect(() => {
    if (focusedTool) {
      const matchingTurn = turns.find(t => t.toolCalls?.some(tc => tc.name === focusedTool));
      if (matchingTurn && matchingTurn.turnIndex !== undefined) {
        const el = document.getElementById(`trace-turn-${matchingTurn.turnIndex}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [focusedTool, turns]);

  // Auto-scroll to bottom on initial load / stream
  useEffect(() => {
    if (scrollRef.current && focusedTurnIndex === null && !focusedTactic && !focusedTool) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns.length, focusedTurnIndex, focusedTactic, focusedTool]);

  if (!trace && turns.length === 0) {
    return (
      <div className="panel h-96 flex flex-col items-center justify-center border-l-4 border-l-agentbreak-primary">
        <Terminal className="w-8 h-8 text-slate-600 mb-3 animate-pulse" />
        <div className="text-slate-400 font-mono text-xs uppercase tracking-wider">Awaiting Execution Trace...</div>
      </div>
    );
  }

  const hasFilter = Boolean(focusedTurnIndex !== null || focusedTactic || focusedTool);

  return (
    <div className="panel flex flex-col h-[650px] border-l-4 border-l-agentbreak-primary shadow-xl">
      {/* Header */}
      <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-400" />
          <h3 className="font-semibold text-xs tracking-wider uppercase text-slate-200">Execution Trajectory Trace</h3>
        </div>

        <div className="flex items-center gap-3">
          {hasFilter && (
            <button
              onClick={onClearFocus}
              className="text-[11px] font-mono text-agentbreak-primary hover:underline bg-slate-900 px-2 py-0.5 rounded border border-slate-700"
            >
              Reset Trace View
            </button>
          )}

          <div className="flex items-center gap-2">
            {!isComplete && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-agentbreak-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-agentbreak-primary"></span>
              </span>
            )}
            <span className="font-mono text-xs text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {turns.length} Turns
            </span>
          </div>
        </div>
      </div>

      {/* Active filter banner if set */}
      {hasFilter && (
        <div className="bg-blue-950/60 border-b border-blue-800/50 px-4 py-1.5 flex items-center justify-between text-xs text-blue-300 font-mono">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>
              FILTERED VIEW: {focusedTurnIndex !== null && focusedTurnIndex !== undefined ? `Turn ${focusedTurnIndex}` : ''}
              {focusedTactic ? `Tactic: ${focusedTactic.replace(/_/g, ' ')}` : ''}
              {focusedTool ? `Tool: ${focusedTool}()` : ''}
            </span>
          </div>
        </div>
      )}

      {/* Trace Stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-agentbreak-dark font-mono text-sm">
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
                className={`flex gap-3.5 transition-all p-2 rounded ${
                  isHighlighted ? 'bg-slate-800/80 ring-2 ring-agentbreak-primary/80' : ''
                }`}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded bg-red-950/60 border border-red-800/50 flex items-center justify-center text-red-400">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="font-bold text-xs text-red-400 tracking-wider">ADVERSARIAL ATTACKER</span>
                    <span className="text-[10px] text-slate-500 font-mono">Turn {turnIdx}</span>
                    {turn.attackMeta && (
                      <span className="badge bg-amber-950/60 text-agentbreak-s3 border border-agentbreak-s3/40 text-[10px] font-mono">
                        TACTIC: {turn.attackMeta.tactic.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  <div className="bg-slate-900 p-3.5 rounded-r-lg rounded-bl-lg text-slate-200 text-xs leading-relaxed whitespace-pre-wrap border border-slate-800 select-text">
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
                className={`flex gap-3.5 flex-row-reverse transition-all p-2 rounded ${
                  isHighlighted ? 'bg-slate-800/80 ring-2 ring-agentbreak-primary/80' : ''
                }`}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded bg-blue-950/60 flex items-center justify-center border border-blue-800/50 text-agentbreak-primary">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col items-end">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] text-slate-500 font-mono">Turn {turnIdx}</span>
                    <span className="font-bold text-xs text-agentbreak-primary tracking-wider">TARGET AGENT</span>
                  </div>

                  {turn.content && (
                    <div className="bg-slate-900/90 p-3.5 rounded-l-lg rounded-br-lg text-slate-200 text-xs leading-relaxed whitespace-pre-wrap border border-blue-900/30 text-left w-full max-w-2xl select-text">
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
                        className={`mt-3 w-full max-w-2xl text-left border rounded-lg overflow-hidden shadow-lg ${
                          criticalAction
                            ? 'border-agentbreak-s4 ring-2 ring-red-500/30'
                            : 'border-slate-700 bg-slate-900'
                        }`}
                      >
                        {criticalAction && (
                          <div className="bg-agentbreak-s4 text-white px-3.5 py-2 flex items-center justify-between font-sans font-bold text-xs uppercase tracking-wider animate-pulse">
                            <div className="flex items-center gap-2">
                              <AlertOctagon className="w-4 h-4" />
                              <span>🚨 S4 Critical Action Executed</span>
                            </div>
                            <span className="text-[10px] bg-red-950 px-2 py-0.5 rounded border border-red-400/40">
                              VIOLATION
                            </span>
                          </div>
                        )}

                        <div className={`p-3.5 ${criticalAction ? 'bg-red-950/20' : 'bg-slate-900'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-agentbreak-s2 font-bold text-xs">
                              <Wrench className="w-3.5 h-3.5" />
                              <span>{tc.name}()</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">Tool Call</span>
                          </div>

                          <pre className="text-xs text-slate-300 bg-agentbreak-darker p-3 rounded border border-slate-800 overflow-x-auto whitespace-pre-wrap break-all select-text">
                            {JSON.stringify(tc.arguments, null, 2)}
                          </pre>

                          {criticalAction && (
                            <div className="mt-3 text-xs text-red-300 font-sans bg-red-950/40 p-2.5 rounded border border-red-800/40 leading-relaxed">
                              <div className="font-bold text-red-400 uppercase tracking-wide mb-0.5 flex items-center gap-1">
                                <ShieldAlert className="w-3.5 h-3.5" />
                                Critical Impact Rationale:
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
                className={`flex gap-3.5 transition-all p-2 rounded ${
                  isHighlighted ? 'bg-slate-800/80 ring-2 ring-agentbreak-primary/80' : ''
                }`}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded bg-slate-800 flex items-center justify-center border border-slate-700 text-slate-400">
                  <Wrench className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-bold text-xs text-slate-400 tracking-wider">SANDBOX ENVIRONMENT RESULT</span>
                    <span className="text-[10px] text-slate-500 font-mono">Turn {turnIdx}</span>
                  </div>
                  <pre className="bg-agentbreak-darker p-3 rounded text-xs text-slate-300 border border-slate-800 overflow-x-auto whitespace-pre-wrap break-all select-text">
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
