// ===========================================
// Internal API: Process Single Approved Item
// ===========================================
// Called by background function to process one item

import { NextRequest, NextResponse } from "next/server";
import { updateProcessedItem } from "@/lib/notion/operations";
import { writeArticleWithFeedback } from "@/lib/agents/writer-with-feedback";
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

    // Writer creates draft → Reviewer gives feedback → Writer rewrites once
    const result = await writeArticleWithFeedback(item);

    console.log(`[Process Single] Article complete!`);
    console.log(`[Process Single] Final title: ${result.title}`);
    console.log(`[Process Single] Word count: ${result.content.split(/\s+/).length}`);
    console.log(`[Process Single] Reviewer score: ${result.finalScore}/10`);

    // Save article content to Notion (checkbox already updated above)
    await updateProcessedItem(notionPageId, {
      title: result.title,
      articleContent: result.originalContent,  // Original draft from writer
      reviewedContent: result.content,          // Improved version after reviewer
    });

    console.log(`[Process Single] Saved to Notion!`);

    return NextResponse.json({
      success: true,
      title: result.title,
      wordCount: result.content.split(/\s+/).length,
      reviewerScore: result.finalScore,
    });
  } catch (error) {
    console.error("[Process Single] Error:", error);
    return NextResponse.json(
      { error: "Processing failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}
