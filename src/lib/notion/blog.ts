// ===========================================
// Notion Blog → Supabase Sync
// ===========================================
// Reads manually-written blogs from the publisheddb Notion database,
// parses each page's rich block content into markdown, and upserts
// to Supabase's articles table.

import { Client } from "@notionhq/client";
import slugifyLib from "slugify";
import { supabase } from "@/lib/supabase/client";

let _notion: Client | null = null;
function getNotion(): Client {
    if (!_notion) {
        _notion = new Client({ auth: process.env.NOTION_API_KEY });
    }
    return _notion;
}

// -------------------------------------------
// Block → Markdown converter
// -------------------------------------------

type RichTextItem = {
    plain_text: string;
    annotations?: {
        bold?: boolean;
        italic?: boolean;
        code?: boolean;
        strikethrough?: boolean;
    };
    href?: string | null;
};

function richTextToMarkdown(richText: RichTextItem[]): string {
    return richText
        .map((t) => {
            let text = t.plain_text;
            if (!text) return "";
            if (t.annotations?.code) text = `\`${text}\``;
            if (t.annotations?.bold) text = `**${text}**`;
            if (t.annotations?.italic) text = `*${text}*`;
            if (t.annotations?.strikethrough) text = `~~${text}~~`;
            if (t.href) text = `[${text}](${t.href})`;
            return text;
        })
        .join("");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function blockToMarkdown(block: any): string {
    const type = block.type;
    const data = block[type];
    if (!data) return "";

    switch (type) {
        case "heading_1":
            return `# ${richTextToMarkdown(data.rich_text)}\n`;
        case "heading_2":
            return `## ${richTextToMarkdown(data.rich_text)}\n`;
        case "heading_3":
            return `### ${richTextToMarkdown(data.rich_text)}\n`;
        case "paragraph":
            return richTextToMarkdown(data.rich_text) + "\n";
        case "bulleted_list_item":
            return `- ${richTextToMarkdown(data.rich_text)}\n`;
        case "numbered_list_item":
            return `1. ${richTextToMarkdown(data.rich_text)}\n`;
        case "quote":
            return `> ${richTextToMarkdown(data.rich_text)}\n`;
        case "code":
            return `\`\`\`${data.language || ""}\n${richTextToMarkdown(data.rich_text)}\n\`\`\`\n`;
        case "divider":
            return `---\n`;
        case "callout":
            return `> ${data.icon?.emoji || "💡"} ${richTextToMarkdown(data.rich_text)}\n`;
        case "image": {
            const url =
                data.type === "external" ? data.external?.url : data.file?.url;
            const caption = data.caption?.length
                ? richTextToMarkdown(data.caption)
                : "image";
            return url ? `![${caption}](${url})\n` : "";
        }
        case "toggle":
            return `<details><summary>${richTextToMarkdown(data.rich_text)}</summary>\n</details>\n`;
        default:
            return "";
    }
}

// -------------------------------------------
// Fetch all blocks for a page (handles pagination)
// -------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getPageBlocks(pageId: string): Promise<any[]> {
    const notion = getNotion();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blocks: any[] = [];
    let cursor: string | undefined = undefined;

    do {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: any = await notion.blocks.children.list({
            block_id: pageId,
            start_cursor: cursor,
            page_size: 100,
        });
        blocks.push(...res.results);
        cursor = res.next_cursor ?? undefined;
    } while (cursor);

    return blocks;
}

// -------------------------------------------
// Fetch all pages from publisheddb
// -------------------------------------------

interface NotionBlogPage {
    id: string;
    title: string;
    createdAt: string;
    coverImage?: string;
    summary: string;
}

async function getPublishedDbPages(): Promise<NotionBlogPage[]> {
    const notion = getNotion();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pages: any[] = [];
    let cursor: string | undefined = undefined;

    do {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: any = await (notion as any).databases.query({
            database_id: process.env.NOTION_PUBLISHED_DB_ID!,
            start_cursor: cursor,
            page_size: 100,
        });
        pages.push(...res.results);
        cursor = res.next_cursor ?? undefined;
    } while (cursor);

    return pages.map((page) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const titleProp = Object.values(page.properties as Record<string, any>).find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (p: any) => p.type === "title"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ) as any;

        const title: string =
            titleProp?.title?.[0]?.plain_text ?? "Untitled";

        // Date from Notion Published column
        const dateProp = Object.values(page.properties as Record<string, any>).find(
            (p: any) => p.type === "date"
        ) as any;
        const publishedDate = dateProp?.date?.start;

        // Cover image from Notion page cover
        const pageCover: string | undefined =
            page.cover?.type === "external"
                ? page.cover.external?.url
                : page.cover?.type === "file"
                    ? page.cover.file?.url
                    : undefined;

        const coverProp = (page.properties as any)["Cover"];
        const columnCover: string | undefined = 
            coverProp?.type === "files" && coverProp.files?.length > 0
                ? (coverProp.files[0].type === "external" ? coverProp.files[0].external?.url : coverProp.files[0].file?.url)
                : undefined;

        const summaryProp = (page.properties as any)["Summary"];
        const summaryText: string =
            summaryProp?.type === "rich_text" && summaryProp.rich_text?.length > 0
                ? summaryProp.rich_text.map((r: any) => r.plain_text).join("")
                : "";

        return {
            id: page.id,
            title,
            createdAt: publishedDate || page.created_time,
            coverImage: columnCover || pageCover,
            summary: summaryText,
        };
    });
}

// -------------------------------------------
// Main sync function
// -------------------------------------------

export interface SyncResult {
    synced: number;
    skipped: number;
    errors: string[];
}

export async function syncNotionBlogsToSupabase(): Promise<SyncResult> {
    const result: SyncResult = { synced: 0, skipped: 0, errors: [] };
    const pages = await getPublishedDbPages();

    for (const page of pages) {
        try {
            // Check if already synced by notion_page_id
            const { data: existing } = await supabase.client
                .from("articles")
                .select("id")
                .eq("notion_page_id", page.id)
                .maybeSingle();

            if (existing) {
                // Update existing record with the latest cover and date instead of purely skipping
                await supabase.client
                    .from("articles")
                    .update({
                        cover_image: page.coverImage ?? null,
                        published_at: page.createdAt,
                        summary: page.summary,
                    })
                    .eq("id", existing.id);

                result.skipped++;
                continue;
            }

            // Parse blocks to markdown
            const blocks = await getPageBlocks(page.id);
            const contentParts: string[] = [];

            for (const block of blocks) {
                const md = blockToMarkdown(block);
                if (md) contentParts.push(md);
            }

            const content = contentParts.join("\n");

            // Build slug from title
            const baseSlug = slugifyLib(page.title, { lower: true, strict: true });
            let slug = baseSlug;
            let attempt = 0;

            // Ensure slug uniqueness
            while (true) {
                const { data: slugCheck } = await supabase.client
                    .from("articles")
                    .select("id")
                    .eq("slug", slug)
                    .maybeSingle();

                if (!slugCheck) break;
                attempt++;
                slug = `${baseSlug}-${attempt}`;
            }

            // Use the extracted summary from the Notion column
            const summary = page.summary;

            const { error } = await supabase.client.from("articles").insert({
                title: page.title,
                slug,
                content,
                summary,
                cover_image: page.coverImage ?? null,
                source: "notion-manual",
                category: "news",
                tags: [],
                notion_page_id: page.id,
                published_at: page.createdAt,
            });

            if (error) {
                result.errors.push(`${page.title}: ${error.message}`);
            } else {
                result.synced++;
            }
        } catch (err) {
            result.errors.push(`${page.title}: ${String(err)}`);
        }
    }

    return result;
}
