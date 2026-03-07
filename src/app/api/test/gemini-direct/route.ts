// Direct Gemini API test without LangChain
import { NextRequest, NextResponse } from "next/server";
import { requireDevAuth } from "@/lib/utils/dev-auth";

export async function GET(request: NextRequest) {
  const authError = requireDevAuth(request);
  if (authError) return authError;

  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_API_KEY not set" }, { status: 500 });
  }

  const prompt = `Transform this news item into a headline. Respond with ONLY valid JSON, no markdown.

Title: Show HN: I built a tool to generate API docs automatically
Source: hackernews

JSON format:
{"headline": "your headline", "summary": "one line", "whyItMatters": "why builders care", "tags": ["tag1", "tag2"]}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: "Gemini API error", details: data }, { status: 500 });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Try to parse
    let parsed = null;
    let parseError = null;

    try {
      // Extract JSON from response
      let jsonStr = text.trim();
      if (jsonStr.includes("```json")) {
        jsonStr = jsonStr.split("```json")[1].split("```")[0].trim();
      } else if (jsonStr.includes("```")) {
        jsonStr = jsonStr.split("```")[1].split("```")[0].trim();
      }
      const match = jsonStr.match(/\{[\s\S]*\}/);
      if (match) jsonStr = match[0];
      parsed = JSON.parse(jsonStr);
    } catch (err) {
      parseError = (err as Error).message;
    }

    return NextResponse.json({
      success: parsed !== null,
      rawResponse: text,
      parsed,
      parseError,
      finishReason: data.candidates?.[0]?.finishReason,
      tokenCount: data.usageMetadata,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Request failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}
