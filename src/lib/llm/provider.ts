// ===========================================
// LLM Provider Abstraction
// ===========================================

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

// -------------------------------------------
// LLM Provider Types
// -------------------------------------------

export type LLMProvider = "gemini" | "openai";

export interface LLMConfig {
  provider?: LLMProvider;
  temperature?: number;
  maxTokens?: number;
}

// -------------------------------------------
// Get LLM instance based on configuration
// -------------------------------------------

export function getLLM(config: LLMConfig = {}): BaseChatModel {
  const provider = config.provider || (process.env.LLM_PROVIDER as LLMProvider) || "gemini";
  const temperature = config.temperature ?? 0.7;
  const maxTokens = config.maxTokens ?? 4096;

  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }
    return new ChatOpenAI({
      model: "gpt-4o",
      temperature,
      maxTokens,
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // Default to Gemini
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is not set");
  }

  return new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature,
    maxOutputTokens: maxTokens,
    apiKey: process.env.GOOGLE_API_KEY,
  });
}

// -------------------------------------------
// Get a cheaper/faster LLM for simple tasks
// -------------------------------------------

export function getFastLLM(config: LLMConfig = {}): BaseChatModel {
  const provider = config.provider || (process.env.LLM_PROVIDER as LLMProvider) || "gemini";
  const temperature = config.temperature ?? 0.3;

  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }
    return new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature,
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // Default to Gemini Flash
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is not set");
  }

  return new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature,
    apiKey: process.env.GOOGLE_API_KEY,
  });
}

// -------------------------------------------
// Validate LLM configuration
// -------------------------------------------

export function validateLLMConfig(): boolean {
  const provider = process.env.LLM_PROVIDER || "gemini";

  if (provider === "openai" && !process.env.OPENAI_API_KEY) {
    console.error("LLM_PROVIDER is 'openai' but OPENAI_API_KEY is not set");
    return false;
  }

  if (provider === "gemini" && !process.env.GOOGLE_API_KEY) {
    console.error("LLM_PROVIDER is 'gemini' but GOOGLE_API_KEY is not set");
    return false;
  }

  return true;
}
