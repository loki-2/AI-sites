// ===========================================
// Dynamic Sitemap
// ===========================================
// Generates sitemap.xml for search engines

import { MetadataRoute } from "next";
import { getLatestArticles } from "@/lib/supabase/client";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getvibecoderz.com";

    // Get all published articles
    const articles = await getLatestArticles(1000);
    const blogs = articles.filter((a) => a.source === "notion-manual");

    const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
        url: `${baseUrl}/article/${article.slug}`,
        lastModified: new Date(article.publishedAt),
        changeFrequency: "weekly" as const,
        priority: 0.8,
    }));

    const blogEntries: MetadataRoute.Sitemap = blogs.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.publishedAt),
        changeFrequency: "weekly" as const,
        priority: 0.9,
    }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "daily" as const,
            priority: 1.0,
        },
        {
            url: `${baseUrl}/blog`,
            lastModified: new Date(),
            changeFrequency: "daily" as const,
            priority: 0.9,
        },
        ...blogEntries,
        ...articleEntries,
    ];
}
