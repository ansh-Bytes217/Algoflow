import React from 'react';
import { PipelineStage, AnalysisResult } from '../types';
import { BenchmarkChart } from './BenchmarkChart';
import { CheckCircle2, AlertTriangle, Terminal, Cpu, Activity, Lightbulb, Scale } from 'lucide-react';

interface Props {
  stage: PipelineStage;
  result: AnalysisResult;
}

export const NodeDetails: React.FC<Props> = ({ stage, result }) => {
  
  const renderContent = () => {
    switch (stage) {
      case PipelineStage.IDLE:
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                <Terminal className="w-12 h-12 opacity-20" />
                <p>Enter your algorithm code and start the pipeline.</p>
            </div>
        );

      case PipelineStage.PARSING:
      case PipelineStage.STATIC_ANALYSIS:
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center space-x-3 pb-4 border-b border-gray-800">
                    <Cpu className="text-blue-400" />
                    <h2 className="text-lg font-semibold">Static Analysis</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-gray-900 rounded border border-gray-800">
                        <span className="text-xs text-gray-500 uppercase">Structure</span>
                        <div className="mt-1 text-xl font-mono text-white">{result.astSummary || "Analyzing..."}</div>
                     </div>
                     <div className="p-4 bg-gray-900 rounded border border-gray-800">
                        <span className="text-xs text-gray-500 uppercase">Estimated Complexity</span>
                        <div className="mt-1 text-xl font-mono text-purple-400">{result.complexityEstimation || "Calculating..."}</div>
                     </div>
                </div>
            </div>
        );

      case PipelineStage.BENCHMARKING:
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                 <div className="flex items-center space-x-3 pb-4 border-b border-gray-800">
                    <Activity className="text-cyan-400" />
                    <h2 className="text-lg font-semibold">Runtime Benchmark</h2>
                </div>
                <BenchmarkChart data={result.benchmarkData || []} />
                <div className="text-xs text-gray-500 font-mono">
                    Measuring execution time across variable input sizes (N=10 to N=1000).
                </div>
            </div>
        );
      
      case PipelineStage.JUDGMENT:
        return (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center space-x-3 pb-4 border-b border-gray-800">
                    <Scale className="text-orange-400" />
                    <h2 className="text-lg font-semibold">Judgment</h2>
                </div>
                
                <div className={`p-6 rounded-lg border ${result.judgement?.match ? 'bg-green-900/10 border-green-800' : 'bg-red-900/10 border-red-800'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-400">Verdict</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${result.judgement?.match ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                            {result.judgement?.verdict || "Pending"}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                         <span className="text-sm text-gray-400">Confidence</span>
                         <div className="flex items-center space-x-2">
                            <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{width: `${(result.judgement?.confidence || 0) * 100}%`}}></div>
                            </div>
                            <span className="text-xs font-mono">{(result.judgement?.confidence || 0) * 100}%</span>
                         </div>
                    </div>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                    Correlation analysis between static complexity prediction <span className="font-mono text-purple-400">{result.complexityEstimation}</span> and observed runtime slope.
                </p>
            </div>
        );

      case PipelineStage.EXPLANATION:
      case PipelineStage.SUGGESTION:
      case PipelineStage.COMPLETE:
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                
                {/* Explanation Section */}
                <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-indigo-400">
                         <Terminal className="w-4 h-4" />
                         <span className="text-xs font-bold uppercase tracking-wider">Analysis</span>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg">
                        <p className="text-gray-300 leading-relaxed text-sm">
                            {result.explanation || "Generating explanation..."}
                        </p>
                    </div>
                </div>

                {/* Suggestions Section */}
                <div className="space-y-3">
                     <div className="flex items-center space-x-2 text-yellow-400">
                         <Lightbulb className="w-4 h-4" />
                         <span className="text-xs font-bold uppercase tracking-wider">Optimization Suggestions</span>
                    </div>
                    {result.suggestions && result.suggestions.length > 0 ? (
                        <div className="space-y-2">
                            {result.suggestions.map((s, i) => (
                                <div key={i} className="flex items-start space-x-3 bg-yellow-900/10 border border-yellow-900/30 p-3 rounded hover:border-yellow-700/50 transition-colors cursor-default">
                                    <div className="mt-1 min-w-[16px]">
                                        <div className="w-4 h-4 rounded-full bg-yellow-900/50 flex items-center justify-center text-[10px] text-yellow-500 font-mono border border-yellow-800">
                                            {i + 1}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-300">{s}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 border border-dashed border-gray-800 rounded text-center text-gray-600 text-sm">
                            Generating AI suggestions based on measurements...
                        </div>
                    )}
                </div>

                {result.suggestions && (
                    <div className="pt-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
                        <span>Generative Agent: gemini-3-flash-preview</span>
                        <div className="flex items-center space-x-1">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span>Grounded in Measurement</span>
                        </div>
                    </div>
                )}
            </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto pr-2">
        {renderContent()}
      </div>
    </div>
  );
};