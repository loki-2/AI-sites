// Simple headline test with 1 item
import { NextResponse } from "next/server";
import { getLLM } from "@/lib/llm/provider";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { extractAndParseJSON } from "@/lib/utils/json-parser";

export async function GET() {
  try {
    console.log("[Simple Headline Test] Starting...");
    
    const llm = getLLM({ temperature: 0.5, maxTokens: 1024 });
    
    const testItem = {
      title: "Show HN: I built a tool to generate API docs automatically",
      url: "https://example.com/api-docs",
      source: "hackernews",
    };

    const prompt = `Transform this news item into a compelling headline for vibe coders:

Original Title: ${testItem.title}
Source: ${testItem.source}

IMPORTANT: Respond with ONLY valid JSON. No markdown, no code blocks, no extra text. Just the JSON object.

{
  "headline": "Your headline here",
  "summary": "One-line summary",
  "whyItMatters": "Why builders care",
  "tags": ["tag1", "tag2"]
}`;

    console.log("[Simple Headline Test] Calling LLM...");
    const response = await llm.invoke([
      new SystemMessage("You are a headline writer for tech builders."),
      new HumanMessage(prompt),
    ]);

    const content = response.content as string;
    console.log("[Simple Headline Test] Got response:", content);

    // Return raw response for debugging
    let parsed = null;
    let parseError = null;
    
    try {
      parsed = extractAndParseJSON(content);
    } catch (err) {
      parseError = (err as Error).message;
    }

    return NextResponse.json({
      success: parsed !== null,
      original: testItem,
      rawResponse: content,
      parsed,
      parseError,
    });
  } catch (error) {
    console.error("[Simple Headline Test] Error:", error);
    return NextResponse.json(
      {
        error: "Test failed",
        details: (error as Error).message,
        stack: (error as Error).stack,
      },
      { status: 500 }
    );
  }
}
