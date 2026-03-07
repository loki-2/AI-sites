// ===========================================
// Test Notion Connection
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { requireDevAuth } from "@/lib/utils/dev-auth";

export async function GET(request: NextRequest) {
  const authError = requireDevAuth(request);
  if (authError) return authError;
  try {
    const apiKey = process.env.NOTION_API_KEY;
    const rawDbId = process.env.NOTION_RAW_DB_ID;
    const processedDbId = process.env.NOTION_PROCESSED_DB_ID;
    const publishedDbId = process.env.NOTION_PUBLISHED_DB_ID;

    // Check env vars
    if (!apiKey) {
      return NextResponse.json({ error: "NOTION_API_KEY not set" }, { status: 500 });
    }

    const notion = new Client({ auth: apiKey });

    const results: Record<string, unknown> = {
      envVars: {
        apiKey: apiKey ? "Set" : "NOT SET",
        rawDbId: rawDbId ? "Set" : "NOT SET",
        processedDbId: processedDbId ? "Set" : "NOT SET",
        publishedDbId: publishedDbId ? "Set" : "NOT SET",
      },
      databases: {},
    };

    // Test each database
    const dbConfigs = [
      { name: "raw", id: rawDbId },
      { name: "processed", id: processedDbId },
      { name: "published", id: publishedDbId },
    ];

    for (const { name, id } of dbConfigs) {
      if (!id) {
        (results.databases as Record<string, unknown>)[name] = { error: "ID not set" };
        continue;
      }

      try {
        const db = await notion.databases.retrieve({ database_id: id });
        // Log raw response for debugging
        console.log(`[Notion] ${name} DB raw:`, JSON.stringify(db, null, 2));
        const props = (db as any).properties || {};
        (results.databases as Record<string, unknown>)[name] = {
          title: (db as any).title?.[0]?.plain_text || "Untitled",
          propertyCount: Object.keys(props).length,
          properties: Object.entries(props).map(([propName, propValue]: [string, any]) => ({
            name: propName,
            type: propValue.type,
          })),
          rawProperties: props, // Include raw for debugging
        };
      } catch (err) {
        (results.databases as Record<string, unknown>)[name] = {
          error: (err as Error).message
        };
      }
    }

    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    console.error("[Test Notion] Error:", error);
    return NextResponse.json(
      { error: "Notion test failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}
