// ===========================================
// VibeCodersNews Type Definitions
// ===========================================

import { z } from "zod";

// -------------------------------------------
// Source Types
// -------------------------------------------

export type NewsSource =
  | "hackernews"
  | "techcrunch"
  | "reddit"
  | "openai_blog"
  | "anthropic_blog"
  | "cursor_blog"
  | "indie_hackers";

// -------------------------------------------
// Article Category
// -------------------------------------------

export type ArticleCategory = "news" | "actionable";


// -------------------------------------------
// Raw Item (from crawlers)
// -------------------------------------------

export const RawItemSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  url: z.string().url(),
  source: z.string(),
  content: z.string().optional(),
  coverImage: z.string().url().optional(),
  score: z.number().optional(),
  crawledAt: z.date(),
  author: z.string().optional(),
  commentCount: z.number().optional(),
});

export type RawItem = z.infer<typeof RawItemSchema>;

// -------------------------------------------
// Processed Item (after aggregation/sorting)
// -------------------------------------------

export const ProcessedItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  originalUrl: z.string().url(),
  summary: z.string(),
  coverImage: z.string().url().optional(),
  tags: z.array(z.string()),
  category: z.enum(["news", "actionable"]),
  relevanceScore: z.number().min(0).max(100),
  whyItMatters: z.string(),
  slackApproved: z.boolean().default(false),
  articleContent: z.string().optional(),
  reviewedContent: z.string().optional(),
  readyToPublish: z.boolean().default(false),
  notionPageId: z.string().optional(),
});

export type ProcessedItem = z.infer<typeof ProcessedItemSchema>;

// -------------------------------------------
// Published Article
// -------------------------------------------

export const PublishedArticleSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  summary: z.string().optional(),
  coverImage: z.string().url().optional(),
  originalUrl: z.string().url().optional(),
  source: z.string().optional(),
  category: z.enum(["news", "actionable"]).optional(),
  tags: z.array(z.string()).optional(),
  publishedAt: z.date(),
  createdAt: z.date(),
});

export type PublishedArticle = z.infer<typeof PublishedArticleSchema>;

// -------------------------------------------
// Agent State Types
// -------------------------------------------

export interface AggregationState {
  rawItems: RawItem[];
  aggregatedItems: ProcessedItem[];
  error?: string;
}

export interface SortingState {
  items: ProcessedItem[];
  topItems: ProcessedItem[];
  error?: string;
}

export interface WriterState {
  item: ProcessedItem;
  articleContent: string;
  error?: string;
}

export interface ReviewerState {
  item: ProcessedItem;
  originalContent: string;
  reviewedContent: string;
  improvedTitle: string;
  error?: string;
}

// -------------------------------------------
// Slack Types
// -------------------------------------------

export interface SlackApprovalPayload {
  itemId: string;
  notionPageId: string;
  approved: boolean;
  userId: string;
  timestamp: string;
}

// -------------------------------------------
// API Response Types
// -------------------------------------------

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// -------------------------------------------
// Notion Database Schemas
// -------------------------------------------

export interface NotionRawItem {
  Title: { title: { text: { content: string } }[] };
  URL: { url: string };
  Source: { select: { name: string } };
  Content: { rich_text: { text: { content: string } }[] };
  CrawledAt: { date: { start: string } };
  Score: { number: number };
}

export interface NotionProcessedItem {
  Title: { title: { text: { content: string } }[] };
  OriginalURL: { url: string };
  Summary: { rich_text: { text: { content: string } }[] };
  Tags: { multi_select: { name: string }[] };
  Category: { select: { name: string } };
  RelevanceScore: { number: number };
  SlackApproved: { checkbox: boolean };
  ArticleContent: { rich_text: { text: { content: string } }[] };
  ReviewedContent: { rich_text: { text: { content: string } }[] };
  ReadyToPublish: { checkbox: boolean };
}

export interface NotionPublishedItem {
  Title: { title: { text: { content: string } }[] };
  Slug: { rich_text: { text: { content: string } }[] };
  Content: { rich_text: { text: { content: string } }[] };
  PublishedAt: { date: { start: string } };
  SupabaseID: { rich_text: { text: { content: string } }[] };
}

// -------------------------------------------
// Crawler Config
// -------------------------------------------

export interface CrawlerConfig {
  source: NewsSource;
  enabled: boolean;
  maxItems?: number;
  minScore?: number;
}

export const DEFAULT_CRAWLER_CONFIGS: CrawlerConfig[] = [
  { source: "hackernews", enabled: true, maxItems: 100, minScore: 50 },
  { source: "techcrunch", enabled: true, maxItems: 50 },
  { source: "reddit", enabled: true, maxItems: 100 },
  { source: "openai_blog", enabled: true, maxItems: 20 },
  { source: "anthropic_blog", enabled: true, maxItems: 20 },
  { source: "indie_hackers", enabled: true, maxItems: 30 },
];
