export enum PipelineStage {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  STATIC_ANALYSIS = 'STATIC_ANALYSIS',
  BENCHMARKING = 'BENCHMARKING',
  JUDGMENT = 'JUDGMENT',
  EXPLANATION = 'EXPLANATION',
  SUGGESTION = 'SUGGESTION',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export type Language = 'javascript' | 'python' | 'java';

export interface MetricPoint {
  inputSize: number;
  timeMs: number;
}

export interface AnalysisResult {
  code: string;
  language?: Language;
  astSummary?: string;
  complexityEstimation?: string; // O(n), O(n^2), etc.
  benchmarkData?: MetricPoint[];
  judgement?: {
    verdict: string;
    confidence: number;
    match: boolean; // Does static match runtime?
  };
  explanation?: string;
  suggestions?: string[];
}

export interface NodeStatus {
  id: string;
  label: string;
  stage: PipelineStage;
  isActive: boolean;
  isComplete: boolean;
  hasError: boolean;
  icon: React.ReactNode;
}

export interface TraceStep {
  step: number;
  description: string;
  variables: Record<string, any>; // e.g. { i: 0, j: 1, currentVal: 5 }
  data: any; // The main data structure state, e.g. [1, 2, 3]
  pointers?: Record<string, number>; // e.g. { i: 0, j: 1 } maps variable name to index
}

export interface TraceResult {
  steps: TraceStep[];
  error?: string;
}