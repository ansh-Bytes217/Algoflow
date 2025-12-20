import { AnalysisResult, MetricPoint, Language } from '../types';

// In a real app, this would run a sandboxed backend process.
// Here we simulate the "Truth Infrastructure" based on heuristics of the code text
// to provide realistic data for the UI to visualize.

export const simulateStaticAnalysis = async (code: string, language: Language = 'javascript'): Promise<{ ast: string, complexity: string }> => {
  await new Promise(r => setTimeout(r, 800)); // Simulate processing time
  
  const hasNestedLoop = () => {
      const firstFor = code.indexOf('for');
      if (firstFor === -1) return false;
      const secondFor = code.indexOf('for', firstFor + 1);
      return secondFor !== -1 && secondFor > firstFor; // Very naive check
  }

  // Common heuristics
  if (hasNestedLoop()) {
     // rudimentary nested loop detection
     if (code.match(/for.*[\s\S]*for/)) { // loose matching
        return { ast: "Nested Iteration Detected", complexity: "O(n^2)" };
     }
  }
  
  if (language === 'javascript' && (code.includes('reduce') || code.includes('map'))) {
    return { ast: "Linear Iteration Detected", complexity: "O(n)" };
  }
  
  if (language === 'java' && (code.includes('stream') || code.includes('forEach'))) {
      return { ast: "Stream/Iterator Detected", complexity: "O(n)" };
  }
  
  if (code.includes('for') || code.includes('while')) {
    return { ast: "Linear Iteration Detected", complexity: "O(n)" };
  }

  return { ast: "Constant/Logarithmic logic", complexity: "O(1)" };
};

export const simulateBenchmark = async (complexity: string): Promise<MetricPoint[]> => {
  await new Promise(r => setTimeout(r, 1200)); // Simulate runtime execution
  
  const points: MetricPoint[] = [];
  const baseSteps = [10, 50, 100, 200, 500, 1000];
  
  baseSteps.forEach(n => {
    let time = 0;
    // Add some random noise to make it look like real measurement
    const noise = Math.random() * 0.2 + 0.9; 

    if (complexity === "O(n^2)") {
      time = (n * n * 0.0001) * noise;
    } else if (complexity === "O(n)") {
      time = (n * 0.05) * noise;
    } else {
      time = 0.5 * noise;
    }
    points.push({ inputSize: n, timeMs: parseFloat(time.toFixed(3)) });
  });
  
  return points;
};

export const simulateJudgment = async (staticComp: string, points: MetricPoint[]): Promise<{ verdict: string, confidence: number, match: boolean }> => {
    await new Promise(r => setTimeout(r, 600));

    // Simple correlation logic
    const n1 = points[0];
    const nLast = points[points.length - 1];
    const ratio = nLast.timeMs / (n1.timeMs || 0.001);
    
    // If input grew 100x
    // O(n) time should grow ~100x
    // O(n^2) time should grow ~10000x
    
    let observed = "O(1)";
    if (ratio > 5000) observed = "O(n^2)";
    else if (ratio > 50) observed = "O(n)";
    
    const match = staticComp === observed;
    
    return {
        verdict: match ? "Confirmed" : "Divergence Detected",
        confidence: match ? 0.95 : 0.45,
        match
    };
}