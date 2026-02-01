// ===========================================
// Slack Message Builders
// ===========================================

import { slack, SLACK_CHANNEL_ID } from "./client";
import type { ProcessedItem } from "@/types";
import type { Block, KnownBlock } from "@slack/web-api";

// -------------------------------------------
// Build approval message blocks for a news item
// -------------------------------------------

export function buildApprovalBlocks(
  item: ProcessedItem,
  index: number
): (Block | KnownBlock)[] {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${index + 1}. ${item.title}*\n${item.summary}\n\n_Source: ${new URL(item.originalUrl).hostname} | Score: ${item.relevanceScore}_`,
      },
      accessory: {
        type: "button",
        text: {
          type: "plain_text",
          text: "View",
          emoji: true,
        },
        url: item.originalUrl,
        action_id: `view_${item.id}`,
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Tags: ${item.tags.map((t) => `\`${t}\``).join(" ")} | Why it matters: _${item.whyItMatters}_`,
        },
      ],
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "✅ Approve",
            emoji: true,
          },
          style: "primary",
          action_id: `approve_${item.id}`,
          value: JSON.stringify({
            itemId: item.id,
            notionPageId: item.notionPageId,
          }),
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "❌ Reject",
            emoji: true,
          },
          style: "danger",
          action_id: `reject_${item.id}`,
          value: JSON.stringify({
            itemId: item.id,
            notionPageId: item.notionPageId,
          }),
        },
      ],
    },
    {
      type: "divider",
    },
  ];
}

// -------------------------------------------
// Post news items for approval
// -------------------------------------------

export async function postItemsForApproval(
  items: ProcessedItem[]
): Promise<string | null> {
  if (items.length === 0) {
    console.warn("[Slack] No items to post");
    return null;
  }

  // Build header
  const headerBlocks: (Block | KnownBlock)[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `📰 News Digest - ${new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${items.length} items* ready for review. Approve the ones worth publishing.`,
      },
    },
    {
      type: "divider",
    },
  ];

  // Build blocks for each item (Slack has a 50 block limit per message)
  // Each item uses 4 blocks, so we can fit about 11 items per message
  const maxItemsPerMessage = 11;
  const messages: string[] = [];

  for (let i = 0; i < items.length; i += maxItemsPerMessage) {
    const batch = items.slice(i, i + maxItemsPerMessage);
    const blocks: (Block | KnownBlock)[] =
      i === 0 ? [...headerBlocks] : [];

    for (let j = 0; j < batch.length; j++) {
      blocks.push(...buildApprovalBlocks(batch[j], i + j));
    }

    // Add footer to last message
    if (i + maxItemsPerMessage >= items.length) {
      blocks.push({
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "_Click Approve to send to article writer, or Reject to skip._",
          },
        ],
      });
    }

    try {
      const result = await slack.chat.postMessage({
        channel: SLACK_CHANNEL_ID,
        blocks,
        text: `News Digest: ${batch.length} items for review`,
      });

      if (result.ts) {
        messages.push(result.ts);
      }

      // Small delay between messages
      if (i + maxItemsPerMessage < items.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error("[Slack] Error posting message:", error);
    }
  }

  console.log(`[Slack] Posted ${messages.length} messages with ${items.length} items`);
  return messages[0] || null;
}

// -------------------------------------------
// Update message after approval/rejection
// -------------------------------------------

export async function updateApprovalMessage(
  channelId: string,
  messageTs: string,
  itemId: string,
  approved: boolean,
  userId: string
): Promise<void> {
  // We can't easily update individual buttons in a message
  // So we'll post a thread reply instead
  try {
    await slack.chat.postMessage({
      channel: channelId,
      thread_ts: messageTs,
      text: approved
        ? `✅ Item approved by <@${userId}> - Article will be generated`
        : `❌ Item rejected by <@${userId}>`,
    });
  } catch (error) {
    console.error("[Slack] Error updating message:", error);
  }
}

// -------------------------------------------
// Post a simple notification
// -------------------------------------------

export async function postNotification(message: string): Promise<void> {
  try {
    await slack.chat.postMessage({
      channel: SLACK_CHANNEL_ID,
      text: message,
    });
  } catch (error) {
    console.error("[Slack] Error posting notification:", error);
  }
}

// -------------------------------------------
// Post article ready notification
// -------------------------------------------

export async function postArticleReady(
  title: string,
  notionUrl?: string
): Promise<void> {
  const blocks: (Block | KnownBlock)[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `📝 *Article Ready for Review*\n\n*${title}*\n\nThe article has been written and reviewed. Check Notion to approve for publishing.`,
      },
    },
  ];

  if (notionUrl) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Open in Notion",
            emoji: true,
          },
          url: notionUrl,
          action_id: "open_notion",
        },
      ],
    });
  }

  try {
    await slack.chat.postMessage({
      channel: SLACK_CHANNEL_ID,
      blocks,
      text: `Article ready: ${title}`,
    });
  } catch (error) {
    console.error("[Slack] Error posting article notification:", error);
  }
}
