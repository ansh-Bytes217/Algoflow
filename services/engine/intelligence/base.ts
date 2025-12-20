import { AnalysisResult, Language } from '../../../types';

export interface IntelligenceContext {
    code: string;
    language: Language;
    complexity: string;
    runtimeSummary: string;
    analysisResult: AnalysisResult;
}

export interface IntelligenceProvider {
    id: string;
    name: string;
    description: string;
    isConfigured: () => boolean;
    explain(context: IntelligenceContext): Promise<string>;
    suggest(context: IntelligenceContext): Promise<string[]>;
}