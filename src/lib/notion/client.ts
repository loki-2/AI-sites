// ===========================================
// Notion Client Configuration
// ===========================================

import { Client } from "@notionhq/client";

// Initialize Notion client
export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// Database IDs from environment
export const NOTION_DATABASES = {
  raw: process.env.NOTION_RAW_DB_ID!,
  processed: process.env.NOTION_PROCESSED_DB_ID!,
  published: process.env.NOTION_PUBLISHED_DB_ID!,
} as const;

// Validate environment variables
export function validateNotionConfig(): boolean {
  const required = [
    "NOTION_API_KEY",
    "NOTION_RAW_DB_ID",
    "NOTION_PROCESSED_DB_ID",
    "NOTION_PUBLISHED_DB_ID",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`Missing Notion config: ${missing.join(", ")}`);
    return false;
  }

  return true;
}
