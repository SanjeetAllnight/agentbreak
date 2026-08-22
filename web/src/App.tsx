import { useState } from 'react';
import { AgentSelector } from './components/AgentSelector';
import { AuditLayout, AuditState } from './components/AuditLayout';
import { ShieldAlert, Info, Server } from 'lucide-react';
import { MOCK_AUDIT_RESULT, MOCK_DEVOPS_AUDIT_RESULT, MOCK_REPAIR_RESULT } from './fixtures/mockData';
import { AuditResult, RepairVerificationResult } from '@agentbreak/shared';
import { runAudit, runRepair } from './api';

function App() {
  const [state, setState] = useState<AuditState>('IDLE');
  const [demoMode, setDemoMode] = useState(false);
  const [agentPreset, setAgentPreset] = useState<string>('support');
  const [auditPhase, setAuditPhase] = useState<string>('Analyzing agent...');
  const [repairPhase, setRepairPhase] = useState<string>('Synthesizing guardrail...');
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [repairResult, setRepairResult] = useState<RepairVerificationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRunAudit = async (preset: string) => {
    setAgentPreset(preset);
    setAuditResult(null);
    setRepairResult(null);
    setErrorMessage(null);
    setState('RUNNING');
    setAuditPhase('Analyzing agent risk surface & tools...');

    if (demoMode) {
      // Simulate authentic multi-stage red team attack pipeline in Demo Mode
      setTimeout(() => {
        setAuditPhase('Synthesizing targeted adversarial attack...');
      }, 700);

      setTimeout(() => {
        setAuditPhase('Adaptive red team attacking sandbox...');
      }, 1400);

      setTimeout(() => {
        setAuditPhase('Evaluating trajectory with LLM failure judge...');
      }, 2100);

      setTimeout(() => {
        const fixture = preset === 'devops' ? MOCK_DEVOPS_AUDIT_RESULT : MOCK_AUDIT_RESULT;
        setAuditResult(fixture);
        setState('AUDIT_COMPLETE');
      }, 2800);
    } else {
      try {
        setAuditPhase('Connecting to audit engine & sandbox...');
        const result = await runAudit(preset);
        setAuditResult(result);
        setState('AUDIT_COMPLETE');
      } catch (err: any) {
        console.error('Audit execution error:', err);
        setErrorMessage(err?.message || 'Failed to complete audit. Backend may be offline.');
        setState('ERROR');
      }
    }
  };

  const handleVerifyRepair = async () => {
    setState('REPAIR_VERIFYING');
    setRepairPhase('Synthesizing security guardrail for candidate agent...');

    if (demoMode) {
      setTimeout(() => {
        setRepairPhase('Re-running identical 5-scenario suite against candidate agent...');
      }, 800);

      setTimeout(() => {
        setRepairPhase('Calculating deterministic before/after delta & checking regressions...');
      }, 1600);

      setTimeout(() => {
        setRepairResult(MOCK_REPAIR_RESULT);
        setState('REPAIR_COMPLETE');
      }, 2400);
    } else {
      try {
        setRepairPhase('Executing automated candidate suite retest on backend...');
        const result = await runRepair(agentPreset);
        setRepairResult(result);
        setState('REPAIR_COMPLETE');
      } catch (err: any) {
        console.error('Repair verification error:', err);
        setErrorMessage(err?.message || 'Repair verification failed.');
        setState('ERROR');
      }
    }
  };

  const handleRunNewAudit = () => {
    setAuditResult(null);
    setRepairResult(null);
    setErrorMessage(null);
    setState('IDLE');
  };

  return (
    <div className="min-h-screen flex flex-col bg-agentbreak-darker text-slate-200 selection:bg-blue-600 selection:text-white">
      {/* Global Header */}
      <header className="border-b border-slate-800 bg-agentbreak-panel/90 backdrop-blur px-6 py-3.5 flex justify-between items-center sticky top-0 z-50">
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={handleRunNewAudit}
        >
          <div className="p-1.5 bg-blue-950/80 rounded border border-blue-800/60 group-hover:border-agentbreak-primary transition">
            <ShieldAlert className="w-5 h-5 text-agentbreak-primary" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wider uppercase text-white flex items-center gap-2">
              <span>AgentBreak</span>
              <span className="text-[10px] font-mono font-normal bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">
                v1.0-audit
              </span>
            </h1>
          </div>
        </div>

        {/* Right controls: Demo/Live Toggle and Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono">
            {demoMode ? (
              <span className="badge bg-amber-950/60 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                <Info className="w-3 h-3" />
                DEMO MODE (FIXTURES)
              </span>
            ) : (
              <span className="badge bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                <Server className="w-3 h-3" />
                LIVE MODE (PORT 3000)
              </span>
            )}
          </div>

          <button
            onClick={() => setDemoMode(!demoMode)}
            className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-all ${
              demoMode
                ? 'bg-amber-950/40 text-amber-300 border-amber-700/60 hover:bg-amber-900/60'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            Switch to {demoMode ? 'Live Mode' : 'Demo Mode'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full">
        {state === 'IDLE' ? (
          <AgentSelector onSelect={handleRunAudit} demoMode={demoMode} />
        ) : (
          <AuditLayout
            preset={agentPreset}
            demoMode={demoMode}
            state={state}
            auditPhase={auditPhase}
            repairPhase={repairPhase}
            result={auditResult}
            repairResult={repairResult}
            errorMessage={errorMessage}
            onVerifyRepair={handleVerifyRepair}
            onRunNewAudit={handleRunNewAudit}
            onRetry={() => handleRunAudit(agentPreset)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-3 px-6 text-center text-[11px] font-mono text-slate-500 bg-agentbreak-darker">
        AgentBreak • Cold-Start Adaptive Red Teaming & Reliability Engineering for Tool-Using AI Agents
      </footer>
    </div>
  );
}

export default App;
