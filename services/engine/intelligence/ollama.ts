import { IntelligenceProvider, IntelligenceContext } from "./base";

export class OllamaProvider implements IntelligenceProvider {
    id = 'ollama';
    name = 'Ollama (Local)';
    description = 'Runs locally on your machine (Privacy-focused)';
    
    // Defaulting to a common model, usually the user should be able to configure this
    private model = 'llama3'; 
    private baseUrl = 'http://localhost:11434/api/generate';

    isConfigured() {
        return true; // Assumed true for local, connection check happens at runtime
    }

    async explain(ctx: IntelligenceContext): Promise<string> {
        try {
            const prompt = `
            Analyze this ${ctx.language} code behavior.
            Code: ${ctx.code}
            Complexity: ${ctx.complexity}
            Observed: ${ctx.runtimeSummary}
            Explain WHY this happens in 3 sentences.
            `;

            const response = await this.callOllama(prompt);
            return response;
        } catch (error) {
            console.error("Ollama Error:", error);
            return "Failed to connect to Ollama. Ensure it is running (localhost:11434) and CORS is enabled.";
        }
    }

    async suggest(ctx: IntelligenceContext): Promise<string[]> {
        try {
            const prompt = `
            Suggest optimizations for this ${ctx.language} code.
            Code: ${ctx.code}
            Complexity: ${ctx.complexity}
            Return ONLY a JSON array of strings. 
            Example: ["Use Set", "Map lookup"]
            `;

            // Note: 'format: json' is supported by newer Ollama versions/models
            const response = await this.callOllama(prompt, true);
            
            try {
                // Attempt to parse array from response if model chats around it
                const match = response.match(/\[.*\]/s);
                if (match) return JSON.parse(match[0]);
                return JSON.parse(response);
            } catch (e) {
                return [response]; // Fallback if not valid JSON
            }
        } catch (error) {
            return ["Ollama connection failed."];
        }
    }

    private async callOllama(prompt: string, jsonMode = false): Promise<string> {
        const res = await fetch(this.baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                prompt: prompt,
                stream: false,
                format: jsonMode ? "json" : undefined
            })
        });

        if (!res.ok) throw new Error(`Ollama status: ${res.status}`);
        const data = await res.json();
        return data.response;
    }
}