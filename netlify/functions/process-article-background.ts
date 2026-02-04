// ===========================================
// Background Function: Process Approved Article
// ===========================================
// Runs for up to 15 minutes - triggered when user approves in Slack

import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Parse the request body
  const body = JSON.parse(event.body || "{}");
  const { notionPageId, itemTitle } = body;

  if (!notionPageId) {
    console.error("[Background] No notionPageId provided");
    return { statusCode: 400, body: "Missing notionPageId" };
  }

  console.log(`[Background] Starting article processing for: ${itemTitle || notionPageId}`);

  try {
    // Call the main app's process endpoint
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.URL || "https://vibecoders-news.netlify.app";
    
    const response = await fetch(`${appUrl}/api/internal/process-single`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.CRON_SECRET}`,
      },
      body: JSON.stringify({ notionPageId }),
    });

    const result = await response.json();
    console.log(`[Background] Processing complete:`, result);

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error(`[Background] Error processing article:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};

export { handler };
