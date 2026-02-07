// ===========================================
// Simplified Crawl Pipeline v2
// ===========================================
// Workflow: Crawl (with relevance filtering) → Headline Writer → Processed DB → Slack

import { NextRequest, NextResponse } from "next/server";
import { crawlAllSources, getSourcesStats } from "@/lib/crawlers";
import { generateHeadlines } from "@/lib/agents/headline";
import { addProcessedItem } from "@/lib/notion/operations";
import { postItemsForApproval, postNotification } from "@/lib/slack/messages";

// -------------------------------------------
// Auth Verification
// -------------------------------------------

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn("[Cron] CRON_SECRET not set, allowing request");
    return true;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

// -------------------------------------------
// Main Pipeline
// -------------------------------------------

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("\n[Pipeline] ========================================");
    console.log("[Pipeline] Starting vibe coder news pipeline...");
    const startTime = Date.now();

    // Log source configuration
    const sourceStats = getSourcesStats();
    console.log("[Pipeline] Sources:", JSON.stringify(sourceStats));

    // Step 1: Crawl with relevance filtering
    console.log("\n[Pipeline] Step 1: Crawling sources...");
    const crawlResult = await crawlAllSources({
      hoursBack: 24,
      minRelevanceScore: 30, // Only vibe-coder-relevant content
      maxTotalItems: 30,     // Limit to top 30 items
    });

    const { items: scoredItems, stats: crawlStats } = crawlResult;

    console.log(`[Pipeline] Crawled: ${crawlStats.totals.rawItems} raw → ${crawlStats.totals.finalItems} filtered`);

    if (scoredItems.length === 0) {
      await postNotification(
        `⚠️ Crawl completed but no relevant items found.\n` +
        `• Sources checked: ${crawlStats.totals.sourcesEnabled}\n` +
        `• Raw items: ${crawlStats.totals.rawItems}\n` +
        `• Min score required: 30`
      );
      return NextResponse.json({
        success: true,
        message: "No relevant items found",
        stats: {
          crawled: crawlStats.totals.rawItems,
          filtered: 0,
          sources: crawlStats.totals.sourcesEnabled,
        },
      });
    }

    // Convert ScoredItems to RawItems for headline generator
    // The scored items already have good metadata
    const rawItems = scoredItems.map(item => ({
      id: item.id,
      title: item.title,
      url: item.url,
      source: item.source,
      content: item.content,
      score: item.relevanceScore, // Use relevance score
      crawledAt: item.crawledAt,
      author: item.author,
      commentCount: item.commentCount,
    }));

    // Step 2: Generate headlines with AI
    console.log("\n[Pipeline] Step 2: Generating headlines...");
    const headlineItems = await generateHeadlines(rawItems);
    console.log(`[Pipeline] Generated ${headlineItems.length} headlines`);

    if (headlineItems.length === 0) {
      await postNotification(
        `⚠️ No headlines generated.\n` +
        `• Items crawled: ${scoredItems.length}\n` +
        `• Headlines generated: 0\n` +
        `• Check Gemini API logs`
      );
      return NextResponse.json({
        success: true,
        message: "No headlines generated",
        stats: {
          crawled: crawlStats.totals.rawItems,
          filtered: scoredItems.length,
          headlines: 0
        },
      });
    }

    // Step 3: Save to Processed DB
    console.log("\n[Pipeline] Step 3: Saving to Processed DB...");
    const savedItems = [];
    for (const item of headlineItems) {
      try {
        const pageId = await addProcessedItem(item);
        savedItems.push({ ...item, notionPageId: pageId });
      } catch (err) {
        console.error(`[Pipeline] Failed to save item: ${item.title}`, err);
      }
    }
    console.log(`[Pipeline] Saved ${savedItems.length}/${headlineItems.length} items to Notion`);

    // Step 4: Post to Slack
    console.log("\n[Pipeline] Step 4: Posting to Slack...");
    await postItemsForApproval(savedItems);

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n[Pipeline] ========================================`);
    console.log(`[Pipeline] Complete in ${duration}s`);
    console.log(`[Pipeline] ========================================\n`);

    // Send summary notification
    await postNotification(
      `✅ Vibe coder news ready for review!\n` +
      `• ${crawlStats.totals.rawItems} items crawled\n` +
      `• ${scoredItems.length} passed relevance filter\n` +
      `• ${savedItems.length} headlines generated\n` +
      `• Sources: ${sourceStats.rss.sources.join(', ') || 'None'}, ${sourceStats.reddit.sources.join(', ') || 'None'}`
    );

    return NextResponse.json({
      success: true,
      stats: {
        sources: crawlStats.totals.sourcesEnabled,
        rawItems: crawlStats.totals.rawItems,
        filtered: scoredItems.length,
        headlines: savedItems.length,
        duration: `${duration}s`,
      },
    });
  } catch (error) {
    console.error("[Pipeline] Error:", error);
    await postNotification(`❌ Pipeline failed: ${(error as Error).message}`);
    return NextResponse.json(
      { error: "Pipeline failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Support GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request);
}
