// ===========================================
// Test LLM Connection
// ===========================================

import { NextResponse } from "next/server";
import { getLLM } from "@/lib/llm/provider";
import { HumanMessage } from "@langchain/core/messages";

export async function GET() {
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
        stack: error.stack?.split("\n").slice(0, 5),
      },
      { status: 500 }
    );
  }
}
