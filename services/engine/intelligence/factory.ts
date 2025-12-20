import { IntelligenceProvider } from "./base";
import { GeminiProvider } from "./gemini";
import { OllamaProvider } from "./ollama";
import { HuggingFaceProvider } from "./hf";

export const providers: Record<string, IntelligenceProvider> = {
    gemini: new GeminiProvider(),
    ollama: new OllamaProvider(),
    hf: new HuggingFaceProvider(),
};

export const getProvider = (id: string): IntelligenceProvider => {
    return providers[id] || providers['gemini'];
};

export const getAvailableProviders = () => Object.values(providers);