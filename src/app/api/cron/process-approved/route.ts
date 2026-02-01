// ===========================================
// Process Approved Items - Generate Articles
// ===========================================
// Run this after approving items in Slack to generate articles

import { NextRequest, NextResponse } from "next/server";
import { getApprovedItemsForWriting, updateProcessedItem } from "@/lib/notion/operations";
import { writeArticle } from "@/lib/agents/writer";
import { reviewArticle } from "@/lib/agents/reviewer";

// Verify cron secret for security
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn("[Process] CRON_SECRET not set, allowing request");
    return true;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Process] Finding approved items without articles...");
    
    // Get items that are approved but don't have articles yet
    const items = await getApprovedItemsForWriting();
    console.log(`[Process] Found ${items.length} items to process`);

    if (items.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No approved items to process",
        processed: 0,
      });
    }

    const results = [];

    for (const item of items) {
      try {
        console.log(`[Process] Writing article for: ${item.title}`);
        
        // Write article
        const articleContent = await writeArticle(item);
        console.log(`[Process] Article written (${articleContent.split(/\s+/).length} words)`);

        // Review article
        console.log(`[Process] Reviewing article...`);
        const reviewed = await reviewArticle(item, articleContent);
        console.log(`[Process] Review complete: "${reviewed.title}"`);

        // Update Notion with the article
        await updateProcessedItem(item.notionPageId!, {
          title: reviewed.title,
          articleContent: articleContent,
        });

        results.push({
          title: reviewed.title,
          status: "success",
          wordCount: articleContent.split(/\s+/).length,
        });

        console.log(`[Process] ✅ Saved: ${reviewed.title}`);

        // Small delay between items
        if (items.indexOf(item) < items.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (itemError) {
        console.error(`[Process] Error processing "${item.title}":`, itemError);
        results.push({
          title: item.title,
          status: "error",
          error: (itemError as Error).message,
        });
      }
    }

    const successful = results.filter((r) => r.status === "success").length;
    console.log(`[Process] Complete: ${successful}/${items.length} articles generated`);

    return NextResponse.json({
      success: true,
      processed: items.length,
      successful,
      results,
    });
  } catch (error) {
    console.error("[Process] Error:", error);
    return NextResponse.json(
      { error: "Processing failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
