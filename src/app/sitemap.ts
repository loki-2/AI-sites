// ===========================================
// Dynamic Sitemap
// ===========================================
// Generates sitemap.xml for search engines

import { MetadataRoute } from "next";
import { getLatestArticles } from "@/lib/supabase/client";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vibecoders.news";

    // Get all published articles
    const articles = await getLatestArticles(1000); // Get all articles

    const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
        url: `${baseUrl}/article/${article.slug}`,
        lastModified: new Date(article.publishedAt),
        changeFrequency: "weekly" as const,
        priority: 0.8,
    }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1.0,
        },
        ...articleEntries,
    ];
}
