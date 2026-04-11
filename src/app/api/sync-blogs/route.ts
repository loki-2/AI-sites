// ===========================================
// POST/GET /api/sync-blogs
// ===========================================
// Syncs manually-written blogs from Notion publisheddb to Supabase.
// Protected by CRON_SECRET query param.
//
// Usage:
//   GET /api/sync-blogs?secret=<CRON_SECRET>
//
// Returns JSON: { synced, skipped, errors }

import { NextRequest, NextResponse } from "next/server";
import { syncNotionBlogsToSupabase } from "@/lib/notion/blog";

export async function GET(req: NextRequest) {
    const secret = req.nextUrl.searchParams.get("secret");

    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const result = await syncNotionBlogsToSupabase();

        return NextResponse.json(
            {
                ok: true,
                synced: result.synced,
                skipped: result.skipped,
                errors: result.errors,
                message: `Synced ${result.synced} blog(s), skipped ${result.skipped} existing.`,
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("Blog sync error:", err);
        return NextResponse.json(
            { ok: false, error: String(err) },
            { status: 500 }
        );
    }
}
