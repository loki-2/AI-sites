// Direct Gemini API client (bypasses LangChain issues)

export interface GeminiConfig {
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GeminiResponse {
  text: string;
  finishReason: string;
}

export async function callGemini(
  prompt: string,
  systemPrompt?: string,
  config: GeminiConfig = {}
): Promise<GeminiResponse> {
  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY not set");
  }

  const { temperature = 0.5, maxOutputTokens = 2048 } = config;

  // Build the contents array
  const contents = [];
  
  if (systemPrompt) {
    contents.push({
      role: "user",
      parts: [{ text: systemPrompt }],
    });
    contents.push({
      role: "model",
      parts: [{ text: "Understood. I will follow these instructions." }],
    });
  }
  
  contents.push({
    role: "user",
    parts: [{ text: prompt }],
  });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens,
        },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Gemini API error: ${JSON.stringify(data)}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const finishReason = data.candidates?.[0]?.finishReason || "UNKNOWN";

  return { text, finishReason };
}

// Helper to call Gemini and parse JSON response
export async function callGeminiJSON<T>(
  prompt: string,
  systemPrompt?: string,
  config: GeminiConfig = {}
): Promise<T> {
  const { text } = await callGemini(prompt, systemPrompt, config);
  
  // Extract JSON from response
  let jsonStr = text.trim();
  
  // Remove markdown code blocks if present
  if (jsonStr.includes("```json")) {
    jsonStr = jsonStr.split("```json")[1].split("```")[0].trim();
  } else if (jsonStr.includes("```")) {
    jsonStr = jsonStr.split("```")[1].split("```")[0].trim();
  }
  
  // Extract JSON object or array
  const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
  const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
  
  if (objectMatch) {
    jsonStr = objectMatch[0];
  } else if (arrayMatch) {
    jsonStr = arrayMatch[0];
  }
  
  return JSON.parse(jsonStr);
}
