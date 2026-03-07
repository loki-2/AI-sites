// ===========================================
// Test Notion Insert
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { requireDevAuth } from "@/lib/utils/dev-auth";

export async function GET(request: NextRequest) {
  const authError = requireDevAuth(request);
  if (authError) return authError;
  try {
    const notion = new Client({ auth: process.env.NOTION_API_KEY });
    const rawDbId = process.env.NOTION_RAW_DB_ID!;

    // Try to insert a test item
    const response = await notion.pages.create({
      parent: { database_id: rawDbId },
      properties: {
        Title: {
          title: [{ text: { content: "Test Item - DELETE ME" } }],
        },
        URL: {
          url: "https://example.com/test",
        },
        Source: {
          select: { name: "hackernews" },
        },
        Content: {
          rich_text: [{ text: { content: "This is a test item" } }],
        },
        CrawledAt: {
          date: { start: new Date().toISOString() },
        },
        Score: {
          number: 100,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Test item created successfully!",
      pageId: response.id,
    });
  } catch (error: any) {
    console.error("[Test Notion Insert] Error:", error);

    // Extract detailed error info
    const errorInfo = {
      message: error.message,
      code: error.code,
      status: error.status,
      body: error.body,
    };

    return NextResponse.json(
      { error: "Insert failed", details: errorInfo },
      { status: 500 }
    );
  }
}
