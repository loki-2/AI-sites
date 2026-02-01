// Robust JSON parser for LLM responses

export function extractAndParseJSON(content: string): any {
  let jsonStr = content.trim();
  
  // Remove markdown code blocks if present
  if (content.includes("```json")) {
    const parts = content.split("```json");
    if (parts.length > 1) {
      jsonStr = parts[1].split("```")[0].trim();
    }
  } else if (content.includes("```")) {
    const parts = content.split("```");
    if (parts.length >= 3) {
      jsonStr = parts[1].trim();
    }
  }
  
  // Try to extract JSON object or array
  const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
  const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
  
  if (objectMatch) {
    jsonStr = objectMatch[0];
  } else if (arrayMatch) {
    jsonStr = arrayMatch[0];
  }
  
  // Try to parse
  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    // Try to fix common issues
    try {
      // Remove trailing commas
      const fixed = jsonStr.replace(/,(\s*[}\]])/g, '$1');
      return JSON.parse(fixed);
    } catch (error2) {
      throw new Error(`JSON parse failed: ${(error as Error).message}`);
    }
  }
}
