// Test full pipeline: Crawl → Headlines → Writer → Reviewer
import { NextResponse } from "next/server";
import { crawlAllSources } from "@/lib/crawlers";
import { generateHeadlines } from "@/lib/agents/headline";
import { writeArticle } from "@/lib/agents/writer";
import { reviewArticle } from "@/lib/agents/reviewer";

export async function GET() {
  try {
    console.log("[Full Pipeline Test] Starting...");
    const startTime = Date.now();

    // Step 1: Crawl (just 5 items for testing)
    console.log("[Full Pipeline Test] Step 1: Crawling...");
    const crawlResult = await crawlAllSources({ hoursBack: 24 });
    const rawItems = crawlResult.items;
    const testItems = rawItems.slice(0, 3); // Only 3 for quick test
    console.log(`[Full Pipeline Test] Using ${testItems.length} items`);

    // Step 2: Generate headlines
    console.log("[Full Pipeline Test] Step 2: Headlines...");
    const headlines = await generateHeadlines(testItems);
    console.log(`[Full Pipeline Test] Generated ${headlines.length} headlines`);

    if (headlines.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No headlines generated",
        stats: { crawled: rawItems.length, tested: testItems.length },
      });
    }

    // Step 3: Write article for first headline
    console.log("[Full Pipeline Test] Step 3: Writing article...");
    const firstItem = headlines[0];
    const article = await writeArticle(firstItem);
    console.log(`[Full Pipeline Test] Article written (${article.split(/\s+/).length} words)`);

    // Step 4: Review article
    console.log("[Full Pipeline Test] Step 4: Reviewing article...");
    const reviewed = await reviewArticle(firstItem, article);
    console.log(`[Full Pipeline Test] Article reviewed`);

    const duration = Math.round((Date.now() - startTime) / 1000);

    return NextResponse.json({
      success: true,
      duration: `${duration}s`,
      stats: {
        crawled: rawItems.length,
        tested: testItems.length,
        headlines: headlines.length,
      },
      sample: {
        headline: firstItem.title,
        summary: firstItem.summary,
        tags: firstItem.tags,
        originalArticle: article.substring(0, 500) + "...",
        reviewedTitle: reviewed.title,
        reviewedArticle: reviewed.content.substring(0, 500) + "...",
      },
    });
  } catch (error) {
    console.error("[Full Pipeline Test] Error:", error);
    return NextResponse.json(
      { error: "Pipeline failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}
