// Direct Gemini API client with retry logic
// Handles transient failures and rate limits

export interface GeminiConfig {
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GeminiResponse {
  text: string;
  finishReason: string;
}

// -------------------------------------------
// Retry Wrapper for API Calls
// -------------------------------------------

async function withApiRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  context: string = "API call"
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const errorMessage = lastError.message.toLowerCase();

      // Don't retry on auth errors or bad requests
      if (errorMessage.includes("api key") || errorMessage.includes("unauthorized")) {
        throw lastError;
      }

      if (attempt === maxRetries) {
        console.error(`[Gemini] ${context} failed after ${maxRetries + 1} attempts`);
        throw lastError;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = 1000 * Math.pow(2, attempt);
      console.warn(`[Gemini] ${context} failed (attempt ${attempt + 1}), retrying in ${delay}ms...`);

      await new Promise(r => setTimeout(r, delay));
    }
  }

  throw lastError || new Error("Unreachable");
}

// -------------------------------------------
// Main Gemini API Call
// -------------------------------------------

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
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

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

  // Retry wrapper for the actual API call
  return withApiRetry(async () => {
    // 25-second timeout for Netlify compatibility
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
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
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Gemini API error (${response.status}): ${JSON.stringify(data)}`);
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const finishReason = data.candidates?.[0]?.finishReason || "UNKNOWN";

      return { text, finishReason };
    } catch (error) {
      clearTimeout(timeoutId);
      if ((error as Error).name === "AbortError") {
        throw new Error("Gemini API request timed out after 25 seconds");
      }
      throw error;
    }
  }, 3, "Gemini generateContent");
}

// -------------------------------------------
// JSON Extraction Helper
// -------------------------------------------

function extractFirstJSON(str: string): string | null {
  const start = str.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < str.length; i++) {
    const char = str[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === "\\") {
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === "{") depth++;
      if (char === "}") depth--;

      if (depth === 0) {
        return str.substring(start, i + 1);
      }
    }
  }
  return null;
}

// -------------------------------------------
// JSON Mode API Call
// -------------------------------------------

export async function callGeminiJSON<T>(
  prompt: string,
  systemPrompt?: string,
  config: GeminiConfig = {}
): Promise<T> {
  const { text, finishReason } = await callGemini(prompt, systemPrompt, config);

  // Log raw response for debugging
  console.log(`[Gemini JSON] Response length: ${text.length}, finishReason: ${finishReason}`);

  // Extract JSON from response
  let jsonStr = text.trim();

  // Remove markdown code blocks if present
  if (jsonStr.includes("```json")) {
    jsonStr = jsonStr.split("```json")[1].split("```")[0].trim();
  } else if (jsonStr.includes("```")) {
    jsonStr = jsonStr.split("```")[1].split("```")[0].trim();
  }

  // Use bracket matching to extract first complete JSON object
  const extracted = extractFirstJSON(jsonStr);
  if (extracted) {
    jsonStr = extracted;
  }

  try {
    return JSON.parse(jsonStr);
  } catch (parseError) {
    // Try to fix common JSON issues
    console.log(`[Gemini JSON] Parse failed, attempting fixes...`);
    console.log(`[Gemini JSON] Raw text (first 500 chars): ${text.substring(0, 500)}`);

    try {
      // Fix 1: Remove trailing commas
      let fixed = jsonStr.replace(/,(\s*[}\]])/g, "$1");

      // Fix 2: Fix unescaped newlines in strings
      fixed = fixed.replace(/(?<!\\)\n/g, "\\n");

      // Fix 3: Try to close incomplete JSON
      const openBraces = (fixed.match(/\{/g) || []).length;
      const closeBraces = (fixed.match(/\}/g) || []).length;
      if (openBraces > closeBraces) {
        fixed += "}".repeat(openBraces - closeBraces);
      }

      return JSON.parse(fixed);
    } catch (fixError) {
      console.error(`[Gemini JSON] Could not fix JSON:`, (fixError as Error).message);
      console.error(`[Gemini JSON] Extracted JSON (first 300 chars): ${jsonStr.substring(0, 300)}`);
      throw parseError; // Throw original error
    }
  }
}
