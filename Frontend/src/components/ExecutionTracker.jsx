import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, PlayCircle } from 'lucide-react';

export const ExecutionTracker = ({ logs, activeStage }) => {
  const workflowStages = [
    { key: 'START', label: 'Initialization', desc: 'Starting multi-agent stock memo compiler...' },
    { key: 'RESOLVE', label: 'Ticker Resolution', desc: 'Parsing name index and locating correct ticker' },
    { key: 'FETCH_DATA', label: 'Financial Extraction', desc: 'Downloading sheets, profiles, and chart data' },
    { key: 'FETCH_NEWS', label: 'Sentiment Classifying', desc: 'Analyzing news vectors and sentiment weights' },
    { key: 'ANALYZE', label: 'SWOT Analysis', desc: 'Compiling core metrics and strategic positioning' },
    { key: 'DECIDE', label: 'Final Resolution', desc: 'Synthesizing recommendations and writing thesis' }
  ];

  const getStageStatus = (stageKey) => {
    const hasError = logs.some((l) => l.stage === 'ERROR');
    const isStageLogged = logs.some((l) => l.stage === stageKey);
    const isCurrentActive = activeStage === stageKey;

    if (hasError && isCurrentActive) return 'error';
    if (isStageLogged && !isCurrentActive) return 'completed';
    if (isCurrentActive) return 'active';
    return 'pending';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'active':
        return <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
      default:
        return <PlayCircle className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col space-y-4">
      <div className="border-b border-white/5 pb-3">
        <h3 className="font-semibold text-slate-200 text-sm tracking-wider uppercase">Agent Execution Stream</h3>
        <p className="text-[11px] text-slate-400 mt-0.5">LangGraph StateGraph Execution Pipeline</p>
      </div>

      <div className="relative border-l border-white/5 ml-3 pl-6 space-y-6 my-2">
        {workflowStages.map((stage, idx) => {
          const status = getStageStatus(stage.key);
          const icon = getStatusIcon(status);

          return (
            <div key={idx} className="relative group">
              <span className="absolute -left-[35px] top-0 bg-[#05060b] p-1 rounded-full border border-white/5">
                {icon}
              </span>
              <div className={`transition-all ${status === 'active' ? 'text-white' : status === 'completed' ? 'text-slate-300' : 'text-slate-500'}`}>
                <h4 className={`text-xs font-bold ${status === 'active' ? 'text-cyan-400' : status === 'error' ? 'text-rose-500' : ''}`}>
                  {stage.label}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{stage.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {logs.length > 0 && (
        <div className="bg-slate-950/80 rounded-xl border border-white/5 p-3 font-mono text-[10px] text-slate-400 max-h-40 overflow-y-auto space-y-1.5">
          {logs.map((log, i) => (
            <div key={i} className="flex space-x-2">
              <span className="text-cyan-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
              <span className={`font-bold text-[9px] uppercase px-1.5 py-0.25 rounded-md inline-block ${log.stage === 'ERROR' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-300'}`}>
                {log.stage}
              </span>
              <span className="text-slate-300">{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default ExecutionTracker;
