// ===========================================
// Test LLM Connection
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { getLLM } from "@/lib/llm/provider";
import { HumanMessage } from "@langchain/core/messages";
import { requireDevAuth } from "@/lib/utils/dev-auth";

export async function GET(request: NextRequest) {
  const authError = requireDevAuth(request);
  if (authError) return authError;
  try {
    console.log("[Test LLM] Testing Gemini API...");
    console.log("[Test LLM] GOOGLE_API_KEY set:", !!process.env.GOOGLE_API_KEY);
    console.log("[Test LLM] LLM_PROVIDER:", process.env.LLM_PROVIDER);

    const llm = getLLM({ temperature: 0.3 });

    const response = await llm.invoke([
      new HumanMessage("Say 'Hello, LLM is working!' and nothing else."),
    ]);

    console.log("[Test LLM] Response:", response.content);

    return NextResponse.json({
      success: true,
      provider: process.env.LLM_PROVIDER || "gemini",
      response: response.content,
    });
  } catch (error: any) {
    console.error("[Test LLM] Error:", error);
    return NextResponse.json(
      {
        error: "LLM test failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
