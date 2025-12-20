import React, { useState } from 'react';
import { Play, SkipBack, SkipForward, X, RefreshCw, Eye } from 'lucide-react';
import { TraceResult, TraceStep, Language } from '../types';
import { getExecutionTrace } from '../services/geminiService';

interface Props {
  code: string;
  language: Language;
  onClose: () => void;
}

export const DataVisualizer: React.FC<Props> = ({ code, language, onClose }) => {
  const [input, setInput] = useState('[1, 2, 3, 2, 1, 4]');
  const [trace, setTrace] = useState<TraceResult | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleGenerateTrace = async () => {
    setLoading(true);
    const result = await getExecutionTrace(code, input, language);
    setTrace(result);
    setCurrentStepIndex(0);
    setLoading(false);
  };

  const currentStep: TraceStep | null = trace?.steps ? trace.steps[currentStepIndex] : null;

  const renderArray = (data: any[], pointers: Record<string, number> = {}) => {
    return (
      <div className="flex flex-wrap gap-4 justify-center py-10">
        {data.map((val, idx) => {
          // Find pointers pointing to this index
          const pointingVars = Object.entries(pointers)
            .filter(([_, pIdx]) => pIdx === idx)
            .map(([name]) => name);

          return (
            <div key={idx} className="relative flex flex-col items-center">
              {/* Pointers above */}
              <div className="absolute -top-12 flex flex-col items-center space-y-1">
                 {pointingVars.map(v => (
                   <div key={v} className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm animate-bounce">
                     {v}
                   </div>
                 ))}
                 {pointingVars.length > 0 && <div className="w-0.5 h-4 bg-indigo-600"></div>}
              </div>

              {/* Data Box */}
              <div className={`
                w-16 h-16 flex items-center justify-center 
                bg-white border-2 text-xl font-mono font-bold shadow-sm rounded-lg transition-all duration-300
                ${pointingVars.length > 0 ? 'border-indigo-500 scale-110 shadow-indigo-200' : 'border-slate-200 text-slate-700'}
              `}>
                {val}
              </div>

              {/* Index below */}
              <span className="mt-2 text-xs text-slate-400 font-mono">{idx}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[95vw] h-[90vh] bg-slate-50 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-800">
        
        {/* Header */}
        <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
                <Eye className="text-indigo-600" size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Data Structure Visualizer ({language})</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Main Layout */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar: Controls */}
          <div className="w-80 bg-white border-r border-slate-200 p-6 flex flex-col">
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Test Case Input (JSON)</label>
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <button 
              onClick={handleGenerateTrace}
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-lg shadow-indigo-200 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <RefreshCw className="animate-spin" size={18} />
              ) : (
                <Play size={18} />
              )}
              <span>{loading ? "Tracing..." : "Visualize Execution"}</span>
            </button>

            {trace && !trace.error && (
              <div className="mt-8 flex-1 flex flex-col">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Step Controller</div>
                
                <div className="flex items-center justify-between bg-slate-100 p-2 rounded-lg mb-4">
                  <button 
                    onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                    className="p-2 hover:bg-white rounded shadow-sm text-slate-600 disabled:opacity-30"
                    disabled={currentStepIndex === 0}
                  >
                    <SkipBack size={20} />
                  </button>
                  <span className="font-mono text-sm font-bold text-indigo-600">
                    {currentStepIndex + 1} / {trace.steps.length}
                  </span>
                  <button 
                    onClick={() => setCurrentStepIndex(Math.min(trace.steps.length - 1, currentStepIndex + 1))}
                    className="p-2 hover:bg-white rounded shadow-sm text-slate-600 disabled:opacity-30"
                    disabled={currentStepIndex === trace.steps.length - 1}
                  >
                    <SkipForward size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="text-xs font-bold text-slate-400 mb-2">CURRENT VARS</p>
                  {currentStep && currentStep.variables && (
                    <div className="space-y-1">
                      {Object.entries(currentStep.variables).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-xs font-mono">
                          <span className="text-slate-600">{k}:</span>
                          <span className="text-indigo-600 font-bold">{JSON.stringify(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Canvas */}
          <div className="flex-1 bg-slate-50 relative flex flex-col">
            {/* Pattern Background */}
            <div className="absolute inset-0 opacity-[0.03]" 
                 style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>

            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                 <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-indigo-600 font-medium animate-pulse">Analyzing pointers...</p>
                 </div>
              </div>
            )}

            {!trace && !loading && (
               <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                  <Eye size={64} className="mb-4 opacity-50" />
                  <p className="text-lg font-medium">Ready to visualize.</p>
                  <p className="text-sm">Enter inputs and click Trace to see the structure.</p>
               </div>
            )}

            {currentStep && (
               <div className="flex-1 flex flex-col z-0">
                  {/* Step Description */}
                  <div className="p-6 text-center">
                     <span className="inline-block px-4 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wide mb-3">
                        Step {currentStep.step}
                     </span>
                     <h3 className="text-xl font-medium text-slate-700">{currentStep.description}</h3>
                  </div>

                  {/* Render Area */}
                  <div className="flex-1 flex items-center justify-center overflow-auto p-10">
                      {Array.isArray(currentStep.data) ? (
                        renderArray(currentStep.data, currentStep.pointers)
                      ) : (
                        <pre className="bg-white p-6 rounded-lg shadow-md border border-slate-200 font-mono text-sm text-slate-700">
                          {JSON.stringify(currentStep.data, null, 2)}
                        </pre>
                      )}
                  </div>
               </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};