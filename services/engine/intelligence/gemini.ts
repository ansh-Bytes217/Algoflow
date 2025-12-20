import { GoogleGenAI, Type } from "@google/genai";
import { IntelligenceProvider, IntelligenceContext } from "./base";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export class GeminiProvider implements IntelligenceProvider {
    id = 'gemini';
    name = 'Google Gemini';
    description = 'Hosted via Google AI Studio (Fast, Reliable)';

    isConfigured() {
        return !!apiKey;
    }

    async explain(ctx: IntelligenceContext): Promise<string> {
        if (!this.isConfigured()) return "API Key missing. Cannot generate explanation.";

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `
        You are an algorithmic analysis expert. 
        Analyze the following ${ctx.language} code and the provided performance metrics.
        
        Code:
        \`\`\`${ctx.language}
        ${ctx.code}
        \`\`\`
        
        Estimated Complexity: ${ctx.complexity}
        Observed Runtime Behavior: ${ctx.runtimeSummary}
        
        Explain strictly WHY the code exhibits this behavior. 
        Do not suggest fixes yet. Focus on the mechanics causing the latency or efficiency.
        Keep it concise (max 3 sentences).
                `,
            });
            return response.text || "No explanation generated.";
        } catch (error) {
            console.error("Gemini Explanation Error:", error);
            return "Failed to generate explanation via Gemini.";
        }
    }

    async suggest(ctx: IntelligenceContext): Promise<string[]> {
        if (!this.isConfigured()) return ["API Key missing."];

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `
        You are an algorithmic optimization engine.
        Your goal is to suggest improvements based on "Suggestion, not action".
        
        Code:
        \`\`\`${ctx.language}
        ${ctx.code}
        \`\`\`
        
        Analysis:
        - Static Complexity: ${ctx.analysisResult.complexityEstimation}
        - Runtime Verdict: ${ctx.analysisResult.judgement?.verdict}
        
        Provide 1 to 3 specific, actionable suggestions to improve performance.
        Format them as a JSON array of strings.
        Example: ["Use a Set for O(1) lookups.", "Avoid nested loops."]
                `,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                }
            });

            const jsonText = response.text || "[]";
            return JSON.parse(jsonText);
        } catch (error) {
            console.error("Gemini Suggestion Error:", error);
            return ["Failed to generate suggestions via Gemini."];
        }
    }
}