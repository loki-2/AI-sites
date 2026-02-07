// ===========================================
// Notion Database Operations
// ===========================================

import { Client } from "@notionhq/client";
import { NOTION_DATABASES } from "./client";
import type { RawItem, ProcessedItem } from "@/types";

// Lazy initialization of Notion client
let _notion: Client | null = null;

function getNotion(): Client {
  if (!_notion) {
    _notion = new Client({
      auth: process.env.NOTION_API_KEY,
    });
  }
  return _notion;
}

// Type-safe wrapper for querying databases
// The Notion SDK v5 types are incomplete, so we use any for the query method
async function queryDatabase(params: {
  database_id: string;
  filter?: unknown;
  sorts?: unknown;
  page_size?: number;
}): Promise<{ results: Array<{ id: string; properties: Record<string, unknown> }> }> {
  const notion = getNotion();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (notion as any).databases.query(params);
}

// -------------------------------------------
// Helper: Truncate text for Notion rich_text (max 2000 chars)
// -------------------------------------------
function truncateForNotion(text: string, maxLength = 2000): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

// -------------------------------------------
// Raw Items Database Operations
// -------------------------------------------

export async function addRawItem(item: RawItem): Promise<string> {
  const notion = getNotion();
  const response = await notion.pages.create({
    parent: { database_id: NOTION_DATABASES.raw },
    properties: {
      Title: {
        title: [{ text: { content: item.title } }],
      },
      URL: {
        url: item.url,
      },
      Source: {
        select: { name: item.source },
      },
      Content: {
        rich_text: [{ text: { content: truncateForNotion(item.content || "") } }],
      },
      CrawledAt: {
        date: { start: item.crawledAt.toISOString() },
      },
      Score: {
        number: item.score || 0,
      },
    },
  });

  return response.id;
}

export async function addRawItemsBatch(items: RawItem[]): Promise<string[]> {
  // Notion doesn't support batch creates, so we process in parallel with rate limiting
  const results: string[] = [];
  const batchSize = 3; // Process 3 at a time to avoid rate limits

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(addRawItem));
    results.push(...batchResults);

    // Small delay between batches to avoid rate limits
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
  }

  return results;
}

export async function getRawItemsFromLast24Hours(): Promise<RawItem[]> {
  const oneDayAgo = new Date();
  oneDayAgo.setHours(oneDayAgo.getHours() - 24);

  const response = await queryDatabase({
    database_id: NOTION_DATABASES.raw,
    filter: {
      property: "CrawledAt",
      date: {
        after: oneDayAgo.toISOString(),
      },
    },
    sorts: [
      {
        property: "CrawledAt",
        direction: "descending",
      },
    ],
  });

  return response.results.map((page) => {
    const props = (page as any).properties;
    return {
      id: page.id,
      title: props.Title?.title?.[0]?.text?.content || "",
      url: props.URL?.url || "",
      source: props.Source?.select?.name || "",
      content: props.Content?.rich_text?.[0]?.text?.content || "",
      crawledAt: new Date(props.CrawledAt?.date?.start || new Date()),
      score: props.Score?.number || 0,
    };
  });
}

// -------------------------------------------
// Processed Items Database Operations
// -------------------------------------------

export async function addProcessedItem(item: ProcessedItem): Promise<string> {
  const notion = getNotion();
  const response = await notion.pages.create({
    parent: { database_id: NOTION_DATABASES.processed },
    properties: {
      Title: {
        title: [{ text: { content: item.title } }],
      },
      OriginalURL: {
        url: item.originalUrl,
      },
      Summary: {
        rich_text: [{ text: { content: truncateForNotion(item.summary) } }],
      },
      Tags: {
        multi_select: item.tags.map((tag) => ({ name: tag })),
      },
      Category: {
        select: { name: item.category },
      },
      RelevanceScore: {
        number: item.relevanceScore,
      },
      // Using actual property names from Notion (with tabs)
      "SlackApproved\t": {
        checkbox: item.slackApproved,
      },
      "Article Content": {
        rich_text: [{ text: { content: truncateForNotion(item.articleContent || "") } }],
      },
      "ReadyToPublish\t": {
        checkbox: item.readyToPublish,
      },
    },
  });

  return response.id;
}

export async function updateProcessedItem(
  pageId: string,
  updates: Partial<ProcessedItem>
): Promise<void> {
  const properties: Record<string, unknown> = {};

  if (updates.slackApproved !== undefined) {
    properties["SlackApproved\t"] = { checkbox: updates.slackApproved };
  }

  if (updates.articleContent !== undefined) {
    properties["Article Content"] = {
      rich_text: [{ text: { content: truncateForNotion(updates.articleContent) } }],
    };
  }

  if (updates.reviewedContent !== undefined) {
    properties["ReviewedContent"] = {
      rich_text: [{ text: { content: truncateForNotion(updates.reviewedContent) } }],
    };
  }

  if (updates.title !== undefined) {
    properties.Title = {
      title: [{ text: { content: updates.title } }],
    };
  }

  if (updates.readyToPublish !== undefined) {
    properties["ReadyToPublish\t"] = { checkbox: updates.readyToPublish };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notion = getNotion();
  await notion.pages.update({
    page_id: pageId,
    properties: properties as any,
  });
}

export async function getApprovedItemsForWriting(): Promise<ProcessedItem[]> {
  const response = await queryDatabase({
    database_id: NOTION_DATABASES.processed,
    filter: {
      and: [
        {
          property: "SlackApproved\t",
          checkbox: { equals: true },
        },
        {
          property: "Article Content",
          rich_text: { is_empty: true },
        },
      ],
    },
  });

  return response.results.map((page) => {
    const props = (page as any).properties;
    return {
      id: page.id,
      notionPageId: page.id,
      title: props.Title?.title?.[0]?.text?.content || "",
      originalUrl: props.OriginalURL?.url || "",
      summary: props.Summary?.rich_text?.[0]?.text?.content || "",
      tags: props.Tags?.multi_select?.map((t: any) => t.name) || [],
      category: (props.Category?.select?.name as "news" | "actionable") || "news",
      relevanceScore: props.RelevanceScore?.number || 0,
      whyItMatters: props.Summary?.rich_text?.[0]?.text?.content || "",
      slackApproved: props["SlackApproved\t"]?.checkbox || false,
      articleContent: props["Article Content"]?.rich_text?.[0]?.text?.content || "",
      reviewedContent: "",
      readyToPublish: props["ReadyToPublish\t"]?.checkbox || false,
    };
  });
}

export async function getItemsReadyToPublish(): Promise<ProcessedItem[]> {
  const response = await queryDatabase({
    database_id: NOTION_DATABASES.processed,
    filter: {
      and: [
        {
          property: "ReadyToPublish\t",
          checkbox: { equals: true },
        },
        {
          property: "Article Content",
          rich_text: { is_not_empty: true },
        },
      ],
    },
  });

  return response.results.map((page) => {
    const props = (page as any).properties;
    return {
      id: page.id,
      notionPageId: page.id,
      title: props.Title?.title?.[0]?.text?.content || "",
      originalUrl: props.OriginalURL?.url || "",
      summary: props.Summary?.rich_text?.[0]?.text?.content || "",
      tags: props.Tags?.multi_select?.map((t: any) => t.name) || [],
      category: (props.Category?.select?.name as "news" | "actionable") || "news",
      relevanceScore: props.RelevanceScore?.number || 0,
      whyItMatters: props.Summary?.rich_text?.[0]?.text?.content || "",
      slackApproved: props["SlackApproved\t"]?.checkbox || false,
      articleContent: props["Article Content"]?.rich_text?.[0]?.text?.content || "",
      reviewedContent: props["ReviewedContent"]?.rich_text?.[0]?.text?.content ||
        props["Article Content"]?.rich_text?.[0]?.text?.content || "",
      readyToPublish: props["ReadyToPublish\t"]?.checkbox || false,
    };
  });
}

// -------------------------------------------
// Published Items Database Operations
// -------------------------------------------

export async function addPublishedItem(
  title: string,
  slug: string,
  content: string,
  supabaseId: string
): Promise<string> {
  const notion = getNotion();
  const response = await notion.pages.create({
    parent: { database_id: NOTION_DATABASES.published },
    properties: {
      Title: {
        title: [{ text: { content: title } }],
      },
      Slug: {
        rich_text: [{ text: { content: slug } }],
      },
      Content: {
        rich_text: [{ text: { content: truncateForNotion(content) } }],
      },
      PublishedAt: {
        date: { start: new Date().toISOString() },
      },
      SupabaseID: {
        rich_text: [{ text: { content: supabaseId } }],
      },
    },
  });

  return response.id;
}

// -------------------------------------------
// Utility: Check if URL already exists in Raw DB
// -------------------------------------------

export async function urlExistsInRawDb(url: string): Promise<boolean> {
  const response = await queryDatabase({
    database_id: NOTION_DATABASES.raw,
    filter: {
      property: "URL",
      url: { equals: url },
    },
    page_size: 1,
  });

  return response.results.length > 0;
}
