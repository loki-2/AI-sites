// ===========================================
// Supabase Client Configuration
// ===========================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { PublishedArticle } from "@/types";

// Initialize Supabase client (lazy initialization to handle build time)
let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase environment variables are not configured");
  }

  _supabase = createClient(supabaseUrl, supabaseServiceKey);
  return _supabase;
}

// Export getter for supabase client
export const supabase = {
  get client() {
    return getSupabase();
  },
};

// -------------------------------------------
// Article Operations
// -------------------------------------------

export async function insertArticle(article: {
  title: string;
  slug: string;
  content: string;
  summary?: string;
  coverImage?: string;
  originalUrl?: string;
  source?: string;
  tags?: string[];
  category?: string;
}): Promise<{ id: string } | null> {
  const { data, error } = await supabase.client
    .from("articles")
    .insert({
      title: article.title,
      slug: article.slug,
      content: article.content,
      summary: article.summary,
      cover_image: article.coverImage,
      original_url: article.originalUrl,
      source: article.source,
      tags: article.tags,
      category: article.category,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error inserting article:", error);
    return null;
  }

  return data;
}

export async function getArticleBySlug(
  slug: string
): Promise<PublishedArticle | null> {
  // Handle build time when env vars may not be set
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("Supabase not configured");
    return null;
  }

  try {
    const { data, error } = await supabase.client
      .from("articles")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      console.error("Error fetching article:", error);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      content: data.content,
      summary: data.summary,
      coverImage: data.cover_image,
      originalUrl: data.original_url,
      source: data.source,
      tags: data.tags,
      publishedAt: new Date(data.published_at),
      createdAt: new Date(data.created_at),
    };
  } catch (error) {
    console.error("Error fetching article:", error);
    return null;
  }
}

export async function getLatestArticles(
  limit = 20,
  offset = 0
): Promise<PublishedArticle[]> {
  // Handle build time when env vars may not be set
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("Supabase not configured, returning empty articles");
    return [];
  }

  try {
    const { data, error } = await supabase.client
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching articles:", error);
      return [];
    }

    return data.map((article) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      content: article.content,
      summary: article.summary,
      coverImage: article.cover_image,
      originalUrl: article.original_url,
      source: article.source,
      category: article.category,
      tags: article.tags,
      publishedAt: new Date(article.published_at),
      createdAt: new Date(article.created_at),
    }));
  } catch (error) {
    console.error("Error fetching articles:", error);
    return [];
  }
}

export async function slugExists(slug: string): Promise<boolean> {
  const { data } = await supabase.client
    .from("articles")
    .select("id")
    .eq("slug", slug)
    .single();

  return !!data;
}

export async function getArticleCount(): Promise<number> {
  const { count, error } = await supabase.client
    .from("articles")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Error fetching article count:", error);
    return 0;
  }

  return count || 0;
}
