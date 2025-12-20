import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, TraceResult, Language } from '../types';

const apiKey = process.env.API_KEY || '';

// Initialize specific models
const ai = new GoogleGenAI({ apiKey });

export const getExplanation = async (code: string, complexity: string, benchmarkSummary: string, language: Language = 'javascript'): Promise<string> => {
  if (!apiKey) return "API Key missing. Cannot generate explanation.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        You are an algorithmic analysis expert. 
        Analyze the following ${language} code and the provided performance metrics.
        
        Code:
        \`\`\`${language}
        ${code}
        \`\`\`
        
        Estimated Complexity: ${complexity}
        Observed Runtime Behavior: ${benchmarkSummary}
        
        Explain strictly WHY the code exhibits this behavior. 
        Do not suggest fixes yet. Focus on the mechanics causing the latency or efficiency.
        Keep it concise (max 3 sentences).
      `,
    });
    return response.text || "No explanation generated.";
  } catch (error) {
    console.error("Gemini Explanation Error:", error);
    return "Failed to generate explanation.";
  }
};

export const getSuggestions = async (code: string, analysis: AnalysisResult, language: Language = 'javascript'): Promise<string[]> => {
  if (!apiKey) return ["API Key missing."];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        You are an algorithmic optimization engine.
        Your goal is to suggest improvements based on "Suggestion, not action".
        
        Code:
        \`\`\`${language}
        ${code}
        \`\`\`
        
        Analysis:
        - Static Complexity: ${analysis.complexityEstimation}
        - Runtime Verdict: ${analysis.judgement?.verdict}
        
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
    return ["Failed to generate suggestions."];
  }
};

export const getExecutionTrace = async (code: string, input: string, language: Language = 'javascript'): Promise<TraceResult> => {
  if (!apiKey) return { steps: [], error: "API Key missing." };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        You are a code execution tracer.
        Execute the following ${language} code MENTALLY step-by-step with the provided input.
        Return a JSON object containing an array of 'steps'.
        
        Code:
        \`\`\`${language}
        ${code}
        \`\`\`
        
        Input: ${input}

        Rules:
        - 'data': The current state of the main array/structure (array of strings/numbers).
        - 'pointers': Identify variables used as index pointers (e.g. i, j). Return as an array of objects: { varName: string, index: number }.
        - 'variables': Return other relevant variables as an array of objects: { key: string, value: string }.
        
        Limit to max 20 steps.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  step: { type: Type.INTEGER },
                  description: { type: Type.STRING },
                  variables: { 
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            key: { type: Type.STRING },
                            value: { type: Type.STRING }
                        }
                    }
                  },
                  data: { type: Type.ARRAY, items: { type: Type.STRING } },
                  pointers: { 
                    type: Type.ARRAY, 
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            varName: { type: Type.STRING },
                            index: { type: Type.INTEGER }
                        }
                    },
                    nullable: true
                  } 
                },
                required: ["step", "description", "data", "variables"]
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return { steps: [], error: "No trace generated." };
    
    const rawData = JSON.parse(text);
    
    // Transform array-of-objects back to key-value Records for the frontend
    const steps = rawData.steps.map((s: any) => ({
        step: s.step,
        description: s.description,
        data: s.data,
        variables: s.variables?.reduce((acc: any, curr: any) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {}) || {},
        pointers: s.pointers?.reduce((acc: any, curr: any) => {
            acc[curr.varName] = curr.index;
            return acc;
        }, {}) || {}
    }));

    return { steps };
  } catch (error) {
    console.error("Gemini Trace Error:", error);
    return { steps: [], error: "Failed to generate trace." };
  }
}