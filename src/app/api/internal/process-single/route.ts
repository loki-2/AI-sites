// ===========================================
// Internal API: Process Single Approved Item
// ===========================================
// Called by background function to process one item

import { NextRequest, NextResponse } from "next/server";
import { updateProcessedItem } from "@/lib/notion/operations";
import { writeArticle } from "@/lib/agents/writer";  // Now uses structured writer
import { notion } from "@/lib/notion/client";

// Verify internal secret
function verifySecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return authHeader === `Bearer ${secret}`;
}

export async function POST(request: NextRequest) {
  if (!verifySecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { notionPageId } = await request.json();

    if (!notionPageId) {
      return NextResponse.json({ error: "Missing notionPageId" }, { status: 400 });
    }

    console.log(`[Process Single] Processing: ${notionPageId}`);

    // ✅ UPDATE NOTION CHECKBOX IMMEDIATELY for instant feedback
    // This happens BEFORE article generation so user sees the checkmark right away
    await updateProcessedItem(notionPageId, {
      slackApproved: true,
    });
    console.log(`[Process Single] ✅ Updated SlackApproved checkbox in Notion`);

    // Fetch the item from Notion
    const page = await notion.pages.retrieve({ page_id: notionPageId }) as any;
    const props = page.properties;

    const item = {
      id: notionPageId,
      notionPageId: notionPageId,
      title: props.Title?.title?.[0]?.text?.content || "",
      originalUrl: props.OriginalURL?.url || "",
      summary: props.Summary?.rich_text?.[0]?.text?.content || "",
      tags: props.Tags?.multi_select?.map((t: any) => t.name) || [],
      category: (props.Category?.select?.name as "news" | "actionable") || "news",
      relevanceScore: props.RelevanceScore?.number || 0,
      whyItMatters: props.Summary?.rich_text?.[0]?.text?.content || "",
      slackApproved: true,
      readyToPublish: false,
    };

    console.log(`[Process Single] Writing article for: ${item.title}`);

    // Generate article with new structured writer (3-section format)
    const articleContent = await writeArticle(item);

    console.log(`[Process Single] Article complete!`);
    console.log(`[Process Single] Word count: ${articleContent.split(/\s+/).length}`);

    // Save article content to Notion (checkbox already updated above)
    await updateProcessedItem(notionPageId, {
      articleContent: articleContent,
    });

    console.log(`[Process Single] Saved to Notion!`);

    return NextResponse.json({
      success: true,
      wordCount: articleContent.split(/\s+/).length,
    });
  } catch (error) {
    console.error("[Process Single] Error:", error);
    return NextResponse.json(
      { error: "Processing failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}
