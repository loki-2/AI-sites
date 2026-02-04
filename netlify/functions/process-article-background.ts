// ===========================================
// Background Function: Process Approved Article
// ===========================================
// Runs for up to 15 minutes - triggered when user approves in Slack
// Handles: 1) Notion checkbox update, 2) Slack message update, 3) Article generation
// Uses direct API calls for reliability (no SDK imports)

import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

// Direct Notion API call (no SDK)
async function updateNotionCheckbox(pageId: string): Promise<void> {
  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${process.env.NOTION_API_KEY}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({
      properties: {
        "SlackApproved\t": { checkbox: true },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Notion API error: ${error}`);
  }
}

// Direct Slack API call (no SDK)
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
    body: JSON.stringify({
      channel: channelId,
      ts: messageTs,
      text,
      blocks,
    }),
  });

  const result = await response.json();
  if (!result.ok) {
    console.error(`Slack API error:`, result.error);
  }
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const body = JSON.parse(event.body || "{}");
  const { notionPageId, itemTitle, slack } = body;

  if (!notionPageId) {
    console.error("[Background] No notionPageId provided");
    return { statusCode: 400, body: "Missing notionPageId" };
  }

  console.log(`[Background] Starting for: ${itemTitle || notionPageId}`);

  try {
    // Step 1: Update Notion checkbox
    console.log(`[Background] Step 1: Updating Notion checkbox...`);
    await updateNotionCheckbox(notionPageId);
    console.log(`[Background] Notion checkbox updated!`);

    // Step 2: Update Slack message (if slack info provided)
    if (slack?.channelId && slack?.messageTs) {
      console.log(`[Background] Step 2: Updating Slack message...`);
      await updateSlackMessage(
        slack.channelId,
        slack.messageTs,
        `✅ Approved: ${itemTitle}`,
        [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `✅ *${itemTitle}*\n_Approved by <@${slack.userId}>. Article is being generated..._`,
            },
          },
        ]
      );
      console.log(`[Background] Slack message updated!`);
    }

    // Step 3: Generate article via internal API
    console.log(`[Background] Step 3: Generating article...`);
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
    console.log(`[Background] Article generation complete:`, result);

    // Step 4: Update Slack with completion
    if (slack?.channelId && slack?.messageTs && result.success) {
      await updateSlackMessage(
        slack.channelId,
        slack.messageTs,
        `✅ Article ready: ${result.title || itemTitle}`,
        [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `✅ *${result.title || itemTitle}*\n_Article generated! (${result.wordCount} words, score: ${result.reviewerScore}/10)_`,
            },
          },
        ]
      );
      console.log(`[Background] Final Slack update done!`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, ...result }),
    };
  } catch (error) {
    console.error(`[Background] Error:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};

export { handler };
