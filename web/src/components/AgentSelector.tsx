import { Shield, Server, ArrowRight } from 'lucide-react';

interface Props {
  onSelect: (preset: string) => void;
  demoMode?: boolean;
}

export function AgentSelector({ onSelect, demoMode }: Props) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 h-full py-10 max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800/60 text-blue-300 font-mono text-xs mb-4">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span>Cold-Start Adaptive Red Teaming Platform</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight text-white">
          Break your agent before production.
        </h1>
        <p className="text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
          Targeted vulnerability discovery, multi-turn adaptive social engineering, and self-verifying prompt repair.
        </p>

        {/* Mode Explanation */}
        <div className="mt-5 inline-flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 px-4 py-2 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-400">
          <div className={`flex items-center gap-2 ${demoMode ? 'text-amber-300' : 'text-slate-400'}`}>
            <span className={`w-2 h-2 rounded-full ${demoMode ? 'bg-amber-400' : 'bg-amber-400/60'}`} />
            <span>
              <strong className={demoMode ? 'text-amber-200' : 'text-slate-300'}>Demo Mode</strong> — instant, reproducible fixture-based walkthroughs.
            </span>
          </div>
          <span className="text-slate-700 hidden sm:inline">•</span>
          <div className={`flex items-center gap-2 ${!demoMode ? 'text-emerald-300' : 'text-slate-400'}`}>
            <span className={`w-2 h-2 rounded-full ${!demoMode ? 'bg-emerald-400' : 'bg-emerald-400/60'}`} />
            <span>
              <strong className={!demoMode ? 'text-emerald-200' : 'text-slate-300'}>Live Mode</strong> — run real adaptive audits against the backend and LLM.
            </span>
          </div>
        </div>
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-12">
        {/* Support Agent Card */}
        <div
          onClick={() => onSelect('support')}
          className="panel p-6 cursor-pointer hover:border-agentbreak-primary transition-all flex flex-col justify-between group hover:shadow-[0_0_25px_rgba(59,130,246,0.15)] bg-slate-900/90"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 group-hover:border-agentbreak-primary/50 group-hover:bg-blue-950/40 transition">
                <Shield className="w-6 h-6 text-agentbreak-primary" />
              </div>
              <span className="badge badge-s4 text-[10px]">High Risk Capabilities</span>
            </div>

            <h2 className="text-lg font-bold text-white mb-1.5 flex items-center justify-between">
              <span>Customer Support Agent</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Handles customer accounts, order queries, and financial transactions. Contains vulnerable refund logic.
            </p>

            <div className="space-y-1.5 pt-3 border-t border-slate-800 font-mono text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>Tools Exposed:</span>
                <span className="text-slate-200">issue_refund, cancel_sub</span>
              </div>
              <div className="flex justify-between">
                <span>Max Risk Severity:</span>
                <span className="text-agentbreak-s4 font-bold">S4 (Financial)</span>
              </div>
            </div>
          </div>

          <button className="btn-primary w-full mt-6 flex items-center justify-center gap-2 text-xs font-mono tracking-wider">
            <span>RUN RELIABILITY AUDIT</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* DevOps Agent Card */}
        <div
          onClick={() => onSelect('devops')}
          className="panel p-6 cursor-pointer hover:border-agentbreak-primary transition-all flex flex-col justify-between group hover:shadow-[0_0_25px_rgba(59,130,246,0.15)] bg-slate-900/90"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 group-hover:border-agentbreak-primary/50 group-hover:bg-blue-950/40 transition">
                <Server className="w-6 h-6 text-agentbreak-primary" />
              </div>
              <span className="badge badge-s1 text-[10px]">Infrastructure Scope</span>
            </div>

            <h2 className="text-lg font-bold text-white mb-1.5 flex items-center justify-between">
              <span>DevOps Cluster Agent</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Automates cloud worker nodes and container deployments. Has verification policies enforced.
            </p>

            <div className="space-y-1.5 pt-3 border-t border-slate-800 font-mono text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>Tools Exposed:</span>
                <span className="text-slate-200">deployService, restartServer</span>
              </div>
              <div className="flex justify-between">
                <span>Max Risk Severity:</span>
                <span className="text-amber-400 font-bold">S4 (Deployment Gate)</span>
              </div>
            </div>
          </div>

          <button className="btn-primary w-full mt-6 flex items-center justify-center gap-2 text-xs font-mono tracking-wider">
            <span>RUN RELIABILITY AUDIT</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Product Loop Pipeline */}
      <div className="w-full bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider overflow-x-auto gap-2">
        <span className="text-blue-400 font-bold">Analyze</span>
        <span className="text-slate-700">→</span>
        <span className="text-red-400 font-bold">Attack</span>
        <span className="text-slate-700">→</span>
        <span className="text-amber-400 font-bold">Adapt</span>
        <span className="text-slate-700">→</span>
        <span className="text-purple-400 font-bold">Observe</span>
        <span className="text-slate-700">→</span>
        <span className="text-blue-400 font-bold">Measure</span>
        <span className="text-slate-700">→</span>
        <span className="text-emerald-400 font-bold">Fix</span>
        <span className="text-slate-700">→</span>
        <span className="text-emerald-300 font-bold">Retest</span>
      </div>
    </div>
  );
}
