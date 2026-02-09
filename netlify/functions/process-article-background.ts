// ===========================================
// Background Function: Process Approved Article
// ===========================================
// NETLIFY BACKGROUND FUNCTION - Has 15-minute timeout
// The "-background" suffix in the filename tells Netlify to run async
// 
// This directly calls the API route instead of importing code
// to avoid bundling issues with Netlify Functions

import type { Handler, HandlerEvent } from "@netlify/functions";

// -------------------------------------------
// API Helpers
// -------------------------------------------

async function updateNotionPage(pageId: string, properties: Record<string, unknown>): Promise<void> {
  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${process.env.NOTION_API_KEY}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({ properties }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Notion API error: ${error}`);
  }
}

async function getNotionPage(pageId: string): Promise<any> {
  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    headers: {
      "Authorization": `Bearer ${process.env.NOTION_API_KEY}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Notion API error: ${error}`);
  }

  return response.json();
}

async function updateSlackMessage(
  channelId: string,
  messageTs: string,
  text: string,
  blocks: unknown[]
): Promise<void> {
  const response = await fetch("https://slack.com/api/chat.update", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ channel: channelId, ts: messageTs, text, blocks }),
  });

  const result = await response.json();
  if (!result.ok) {
    console.error(`Slack API error:`, result.error);
  }
}

// -------------------------------------------
// Retry Wrapper
// -------------------------------------------

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  context: string = "Operation"
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        console.error(`[Background] ${context} failed after ${maxRetries + 1} attempts`);
        throw lastError;
      }

      const delay = 1000 * Math.pow(2, attempt);
      console.warn(`[Background] ${context} failed (attempt ${attempt + 1}), retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  throw lastError!;
}

// -------------------------------------------
// Main Handler
// -------------------------------------------

const handler: Handler = async (event: HandlerEvent) => {
  const body = JSON.parse(event.body || "{}");
  const { notionPageId, itemTitle, slack } = body;

  if (!notionPageId) {
    console.error("[Background] No notionPageId provided");
    return { statusCode: 400, body: "Missing notionPageId" };
  }

  console.log(`[Background] ===== Starting article processing =====`);
  console.log(`[Background] Item: ${itemTitle || notionPageId}`);
  console.log(`[Background] Page ID: ${notionPageId}`);

  const startTime = Date.now();

  try {
    // Step 1: Update Slack to show processing
    if (slack?.channelId && slack?.messageTs) {
      await updateSlackMessage(
        slack.channelId,
        slack.messageTs,
        `⏳ Processing: ${itemTitle}`,
        [{
          type: "section",
          text: {
            type: "mrkdwn",
            text: `⏳ *${itemTitle}*\n_Article generation in progress..._`,
          },
        }]
      );
      console.log(`[Background] Step 1: Slack status updated`);
    }

    // Step 2: Call the internal API to generate article with retry
    console.log(`[Background] Step 2: Generating article...`);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.URL || "https://vibecoders-news.netlify.app";

    const result = await withRetry(async () => {
      const response = await fetch(`${appUrl}/api/internal/process-single`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({ notionPageId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error (${response.status}): ${errorText}`);
      }

      return response.json();
    }, 3, "Article generation");

    const duration = Date.now() - startTime;
    console.log(`[Background] ✅ Article generated in ${duration}ms`);
    console.log(`[Background] Word count: ${result.wordCount}`);

    // Step 3: Update Slack with success
    if (slack?.channelId && slack?.messageTs) {
      await updateSlackMessage(
        slack.channelId,
        slack.messageTs,
        `✅ Article ready: ${itemTitle}`,
        [{
          type: "section",
          text: {
            type: "mrkdwn",
            text: `✅ *${itemTitle}*\n_Article generated! (${result.wordCount} words)_`,
          },
        }]
      );
      console.log(`[Background] Step 3: Slack updated with success`);
    }

    console.log(`[Background] ===== Completed successfully =====`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        wordCount: result.wordCount,
        duration: `${duration}ms`,
      }),
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Background] ❌ Error after ${duration}ms:`, error);

    // Update Slack with failure
    if (slack?.channelId && slack?.messageTs) {
      await updateSlackMessage(
        slack.channelId,
        slack.messageTs,
        `❌ Failed: ${itemTitle}`,
        [{
          type: "section",
          text: {
            type: "mrkdwn",
            text: `❌ *${itemTitle}*\n_Article generation failed: ${(error as Error).message}_`,
          },
        }]
      );
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};

export { handler };
