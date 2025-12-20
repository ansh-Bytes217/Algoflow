import { IntelligenceProvider, IntelligenceContext } from "./base";

export class HuggingFaceProvider implements IntelligenceProvider {
    id = 'hf';
    name = 'HuggingFace (Inference API)';
    description = 'Serverless inference for open models';

    isConfigured() {
        return false; // Not implemented yet
    }

    async explain(ctx: IntelligenceContext): Promise<string> {
        return "HuggingFace provider is not yet implemented.";
    }

    async suggest(ctx: IntelligenceContext): Promise<string[]> {
        return ["HuggingFace provider is not yet implemented."];
    }
}