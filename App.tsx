import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Box, Code as CodeIcon, Zap, Activity, Scale, MessageSquare, Lightbulb, Settings, Check, X, Server, Eye, PenTool, ChevronDown } from 'lucide-react';
import { PipelineStage, AnalysisResult, NodeStatus, Language } from './types';
import { NodeDetails } from './components/NodeDetails';
import { DataVisualizer } from './components/DataVisualizer';
import { Whiteboard } from './components/Whiteboard';
import { simulateStaticAnalysis, simulateBenchmark, simulateJudgment } from './services/mockEngine';
import { getProvider, getAvailableProviders } from './services/engine/intelligence/factory';

const INITIAL_CODE_JS = `function findDuplicates(arr) {
  const duplicates = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j] && !duplicates.includes(arr[i])) {
        duplicates.push(arr[i]);
      }
    }
  }
  return duplicates;
}`;

const INITIAL_CODE_PY = `def find_duplicates(arr):
    duplicates = []
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):
            if arr[i] == arr[j] and arr[i] not in duplicates:
                duplicates.append(arr[i])
    return duplicates`;

const INITIAL_CODE_JAVA = `import java.util.ArrayList;
import java.util.List;

public class Algorithm {
    public static List<Integer> findDuplicates(int[] arr) {
        List<Integer> duplicates = new ArrayList<>();
        for (int i = 0; i < arr.length; i++) {
            for (int j = i + 1; j < arr.length; j++) {
                if (arr[i] == arr[j] && !duplicates.contains(arr[i])) {
                    duplicates.add(arr[i]);
                }
            }
        }
        return duplicates;
    }
}`;

const NODES_CONFIG = [
  { id: 'parse', label: 'Parse', icon: <CodeIcon size={16} />, associatedStage: PipelineStage.PARSING },
  { id: 'static', label: 'Static Analysis', icon: <Box size={16} />, associatedStage: PipelineStage.STATIC_ANALYSIS },
  { id: 'runtime', label: 'Runtime Benchmark', icon: <Activity size={16} />, associatedStage: PipelineStage.BENCHMARKING },
  { id: 'judge', label: 'Judgment', icon: <Scale size={16} />, associatedStage: PipelineStage.JUDGMENT },
  { id: 'explain', label: 'Explain', icon: <MessageSquare size={16} />, associatedStage: PipelineStage.EXPLANATION },
  { id: 'suggest', label: 'Suggest', icon: <Lightbulb size={16} />, associatedStage: PipelineStage.SUGGESTION },
];

export default function App() {
  const [language, setLanguage] = useState<Language>('javascript');
  const [code, setCode] = useState(INITIAL_CODE_JS);
  const [stage, setStage] = useState<PipelineStage>(PipelineStage.IDLE);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult>({ code: INITIAL_CODE_JS });
  
  // Settings & Visualizer State
  const [showSettings, setShowSettings] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [activeProviderId, setActiveProviderId] = useState('gemini');

  // To prevent scrolling code execution if user clicks multiple times
  const isRunning = useRef(false);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    if (lang === 'javascript') setCode(INITIAL_CODE_JS);
    if (lang === 'python') setCode(INITIAL_CODE_PY);
    if (lang === 'java') setCode(INITIAL_CODE_JAVA);
    setStage(PipelineStage.IDLE);
    setResult({ code: '' }); // Clear result
    setActiveNodeId(null);
  };

  const runPipeline = async () => {
    if (isRunning.current) return;
    isRunning.current = true;
    setStage(PipelineStage.PARSING);
    setActiveNodeId('parse');
    
    // Reset Results
    setResult({ code, language });

    try {
        // Step 1: Parsing & Static Analysis (Phase 0)
        await new Promise(r => setTimeout(r, 600)); // Visual delay
        setStage(PipelineStage.STATIC_ANALYSIS);
        setActiveNodeId('static');
        
        const staticRes = await simulateStaticAnalysis(code, language);
        setResult(prev => ({ ...prev, astSummary: staticRes.ast, complexityEstimation: staticRes.complexity }));

        // Step 2: Runtime Benchmark (Phase 0)
        setStage(PipelineStage.BENCHMARKING);
        setActiveNodeId('runtime');
        const metrics = await simulateBenchmark(staticRes.complexity);
        setResult(prev => ({ ...prev, benchmarkData: metrics }));

        // Step 3: Judgment (Phase 0)
        setStage(PipelineStage.JUDGMENT);
        setActiveNodeId('judge');
        const judgement = await simulateJudgment(staticRes.complexity, metrics);
        setResult(prev => ({ ...prev, judgement }));

        // INTELLIGENCE ENGINE (Phase 1)
        const provider = getProvider(activeProviderId);
        
        const runtimeSummary = judgement.match 
          ? `Consistent with ${staticRes.complexity} behavior.` 
          : `Unexpectedly slower/faster than ${staticRes.complexity}.`;
        
        const intelligenceContext = {
            code,
            language,
            complexity: staticRes.complexity,
            runtimeSummary,
            analysisResult: { ...result, complexityEstimation: staticRes.complexity, judgement, benchmarkData: metrics }
        };

        // Step 4: Explanation
        setStage(PipelineStage.EXPLANATION);
        setActiveNodeId('explain');
        const explanation = await provider.explain(intelligenceContext);
        setResult(prev => ({ ...prev, explanation }));

        // Step 5: Suggestions
        setStage(PipelineStage.SUGGESTION);
        setActiveNodeId('suggest');
        const suggestions = await provider.suggest(intelligenceContext);
        setResult(prev => ({ ...prev, suggestions }));

        setStage(PipelineStage.COMPLETE);

    } catch (e) {
        console.error(e);
        setStage(PipelineStage.ERROR);
    } finally {
        isRunning.current = false;
    }
  };

  const handleNodeClick = (nodeId: string) => {
    const nodeIndex = NODES_CONFIG.findIndex(n => n.id === nodeId);
    const currentIndex = NODES_CONFIG.findIndex(n => n.associatedStage === stage);
    
    if (stage === PipelineStage.COMPLETE || nodeIndex <= currentIndex) {
         setActiveNodeId(nodeId);
    }
  };

  const getStageForNodeId = (id: string): PipelineStage => {
      const node = NODES_CONFIG.find(n => n.id === id);
      return node ? node.associatedStage : PipelineStage.IDLE;
  };

  return (
    <div className="flex h-screen w-full bg-canvas text-gray-300 font-sans selection:bg-blue-500/30">
      
      {/* Left Sidebar: Navigation/Status */}
      <div className="w-16 flex flex-col items-center py-6 border-r border-gray-800 bg-gray-950/50 z-20">
        <div className="mb-8 p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
          <Zap className="text-white" size={24} />
        </div>
        <div className="flex-1 space-y-6 flex flex-col w-full px-2">
            {/* Visualizer Button */}
            <button 
                onClick={() => setShowVisualizer(true)}
                className="w-full aspect-square flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 transition-colors rounded-lg mb-2 group relative"
                title="Visualize Data Structure"
            >
                <Eye size={20} />
                <span className="absolute left-14 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    Visualize
                </span>
            </button>

             {/* Whiteboard Button */}
             <button 
                onClick={() => setShowWhiteboard(true)}
                className="w-full aspect-square flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 transition-colors rounded-lg mb-2 group relative"
                title="Whiteboard"
            >
                <PenTool size={20} />
                <span className="absolute left-14 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    Whiteboard
                </span>
            </button>

            {/* Settings Button */}
            <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`w-full aspect-square flex items-center justify-center transition-colors rounded-lg ${showSettings ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}
                title="Settings"
            >
                <Settings size={20} />
            </button>
        </div>
      </div>

      {/* Overlays */}
      {showVisualizer && (
        <DataVisualizer code={code} language={language} onClose={() => setShowVisualizer(false)} />
      )}

      {showWhiteboard && (
        <Whiteboard onClose={() => setShowWhiteboard(false)} />
      )}

      {/* Settings Panel Overlay */}
      {showSettings && (
          <div className="absolute left-16 top-0 bottom-0 w-80 bg-gray-900 border-r border-gray-800 z-30 p-6 shadow-2xl animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-semibold text-white">Engine Settings</h2>
                  <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-white"><X size={16} /></button>
              </div>

              <div className="space-y-6">
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Intelligence Provider</label>
                      <div className="space-y-2">
                          {getAvailableProviders().map(p => (
                              <button
                                key={p.id}
                                onClick={() => setActiveProviderId(p.id)}
                                className={`w-full flex flex-col items-start p-3 rounded border text-left transition-all ${activeProviderId === p.id ? 'bg-blue-900/20 border-blue-500' : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'}`}
                              >
                                  <div className="flex items-center justify-between w-full mb-1">
                                      <span className={`text-sm font-medium ${activeProviderId === p.id ? 'text-blue-400' : 'text-gray-300'}`}>{p.name}</span>
                                      {activeProviderId === p.id && <Check size={14} className="text-blue-400" />}
                                  </div>
                                  <span className="text-xs text-gray-500 leading-tight">{p.description}</span>
                              </button>
                          ))}
                      </div>
                  </div>
                  
                  {activeProviderId === 'ollama' && (
                      <div className="p-3 bg-yellow-900/10 border border-yellow-900/30 rounded text-xs text-yellow-500 leading-relaxed">
                          <span className="font-bold">Note:</span> Ensure Ollama is running at <code className="bg-black/30 px-1 rounded">localhost:11434</code> and allows CORS.
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Main Workflow Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Header */}
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center space-x-4">
                <h1 className="text-white font-semibold tracking-tight">Optimization Pipeline <span className="text-gray-500 text-sm font-normal ml-2">v2.0</span></h1>
                <div className="flex items-center space-x-2 px-3 py-1 bg-gray-800/50 rounded-full border border-gray-700/50">
                    <Server size={12} className="text-gray-400" />
                    <span className="text-xs text-gray-400 font-mono">{getProvider(activeProviderId).name}</span>
                </div>
            </div>
            <div className="flex items-center space-x-4">
                 <button 
                    onClick={() => { 
                        setStage(PipelineStage.IDLE); 
                        setActiveNodeId(null);
                        // Reset to current language default
                        if(language === 'javascript') setCode(INITIAL_CODE_JS);
                        if(language === 'python') setCode(INITIAL_CODE_PY);
                        if(language === 'java') setCode(INITIAL_CODE_JAVA);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 rounded text-sm font-medium text-gray-400 hover:text-white transition-colors"
                 >
                    <RotateCcw size={16} />
                    <span>Reset</span>
                 </button>
                 <button 
                    onClick={runPipeline}
                    disabled={stage !== PipelineStage.IDLE && stage !== PipelineStage.COMPLETE && stage !== PipelineStage.ERROR}
                    className={`flex items-center space-x-2 px-5 py-2 rounded shadow-lg transition-all ${
                        stage === PipelineStage.IDLE || stage === PipelineStage.COMPLETE || stage === PipelineStage.ERROR
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20' 
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                 >
                    <Play size={16} fill="currentColor" />
                    <span>{stage === PipelineStage.IDLE ? "Run Analysis" : "Running..."}</span>
                 </button>
            </div>
        </header>

        {/* Content Grid */}
        <div className="flex-1 flex overflow-hidden">
            
            {/* CODE EDITOR */}
            <div className="w-1/3 border-r border-gray-800 flex flex-col bg-[#0d1117]">
                <div className="px-6 py-3 border-b border-gray-800 bg-gray-900/30 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Input Algorithm</span>
                    
                    {/* Language Selector */}
                    <div className="relative group">
                        <button className="flex items-center space-x-1 text-[10px] text-gray-400 font-mono bg-gray-800 px-2 py-1 rounded hover:bg-gray-700 transition-colors">
                            <span>{language.toUpperCase()}</span>
                            <ChevronDown size={10} />
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-24 bg-gray-800 border border-gray-700 rounded shadow-xl hidden group-hover:block z-50">
                            {['javascript', 'python', 'java'].map((lang) => (
                                <button 
                                    key={lang}
                                    onClick={() => handleLanguageChange(lang as Language)}
                                    className={`w-full text-left px-3 py-2 text-xs font-mono hover:bg-gray-700 block ${language === lang ? 'text-blue-400 font-bold' : 'text-gray-400'}`}
                                >
                                    {lang.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex-1 relative">
                    <textarea 
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full h-full bg-transparent p-6 text-sm font-mono text-gray-300 resize-none focus:outline-none leading-relaxed"
                        spellCheck={false}
                    />
                    {/* Line numbers visual hack */}
                    <div className="absolute top-6 left-2 w-4 text-right text-gray-700 text-sm font-mono select-none pointer-events-none opacity-50">
                        {code.split('\n').map((_, i) => <div key={i} className="leading-relaxed">{i+1}</div>)}
                    </div>
                </div>
            </div>

            {/* VISUAL PIPELINE & DETAILS */}
            <div className="flex-1 flex flex-col bg-canvas relative">
                
                {/* Workflow Graph Canvas */}
                <div className="h-1/2 border-b border-gray-800 p-8 relative overflow-hidden flex flex-col items-center justify-center">
                    
                    {/* Connecting Line */}
                    <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-gray-800 -translate-y-1/2 z-0"></div>

                    <div className="relative z-10 flex justify-between w-full max-w-4xl">
                        {NODES_CONFIG.map((node, index) => {
                            // Determine status
                            const nodeIndex = NODES_CONFIG.findIndex(n => n.id === node.id);
                            const activeIndex = NODES_CONFIG.findIndex(n => n.associatedStage === stage);
                            const isActive = activeNodeId === node.id;
                            const isPast = activeIndex > nodeIndex || stage === PipelineStage.COMPLETE;
                            const isCurrent = activeIndex === nodeIndex && stage !== PipelineStage.COMPLETE;
                            
                            // Visual classes
                            let borderClass = 'border-gray-700 bg-gray-900';
                            let iconClass = 'text-gray-500';
                            
                            if (isActive) {
                                borderClass = 'border-blue-500 bg-blue-900/20 ring-2 ring-blue-500/30';
                                iconClass = 'text-blue-400';
                            } else if (isCurrent) {
                                borderClass = 'border-blue-500/50 bg-gray-900 animate-pulse';
                                iconClass = 'text-blue-400';
                            } else if (isPast) {
                                borderClass = 'border-green-500/50 bg-gray-900';
                                iconClass = 'text-green-500';
                            }

                            return (
                                <div key={node.id} className="group relative flex flex-col items-center cursor-pointer" onClick={() => handleNodeClick(node.id)}>
                                    <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${borderClass} shadow-xl z-10 hover:scale-105`}>
                                        <div className={iconClass}>
                                            {node.icon}
                                        </div>
                                    </div>
                                    <div className={`mt-4 text-xs font-semibold tracking-wide uppercase transition-colors ${isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                        {node.label}
                                    </div>
                                    
                                    {/* Connection Progress highlight */}
                                    {index < NODES_CONFIG.length - 1 && isPast && (
                                        <div className="absolute top-1/2 left-full w-[calc((100vw-40rem)/6)] h-0.5 bg-green-500 -translate-y-1/2 -z-10 origin-left scale-x-[200%]"></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="absolute bottom-4 right-6 text-[10px] text-gray-700 uppercase tracking-widest font-bold">
                        Phase 0 Pipeline Active
                    </div>
                </div>

                {/* Details Panel */}
                <div className="flex-1 bg-gray-950/30 p-8 overflow-hidden flex flex-col">
                    <div className="h-full border border-gray-800/50 rounded-xl bg-gray-900/20 p-6 backdrop-blur-sm relative">
                        {activeNodeId ? (
                            <NodeDetails stage={getStageForNodeId(activeNodeId)} result={result} />
                        ) : (
                             <div className="flex flex-col items-center justify-center h-full text-gray-600 space-y-4">
                                <Activity className="w-16 h-16 opacity-10" />
                                <p className="text-sm">Select a node in the workflow to inspect details.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
}