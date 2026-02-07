// ===========================================
// Crawler Sources Configuration
// ===========================================
// Easy to add/remove/configure crawl sources
// Just edit this file to change what gets crawled

// -------------------------------------------
// Type Definitions
// -------------------------------------------

export type SourceType = 'rss' | 'reddit';
export type ContentCategory =
    | 'ai_tools'      // AI coding tools, LLMs, assistants
    | 'no_code'       // No-code/low-code platforms
    | 'dev_workflow'  // Developer workflows, productivity
    | 'startup'       // Startup news, launches, funding
    | 'tutorials'     // Tutorials, guides, how-tos
    | 'trends';       // Industry trends, analysis

export interface RSSSourceConfig {
    id: string;
    name: string;
    url: string;
    enabled: boolean;
    category: ContentCategory;
    description?: string;
}

export interface RedditSourceConfig {
    id: string;
    subreddit: string;
    enabled: boolean;
    category: ContentCategory;
    minScore?: number;      // Minimum upvotes to include
    description?: string;
}

export interface CrawlerSourcesConfig {
    rss: RSSSourceConfig[];
    reddit: RedditSourceConfig[];
}

// -------------------------------------------
// Source Configuration
// -------------------------------------------
// Add or remove sources here. Set enabled: false to disable.

export const SOURCES_CONFIG: CrawlerSourcesConfig = {
    // =========================================
    // RSS Feeds
    // =========================================
    rss: [
        {
            id: 'techcrunch_ai',
            name: 'TechCrunch AI',
            url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
            enabled: true,
            category: 'ai_tools',
            description: 'AI-focused news from TechCrunch',
        },
        // -------------------------------------------
        // Add more RSS sources below (disabled by default)
        // -------------------------------------------
        {
            id: 'openai_blog',
            name: 'OpenAI Blog',
            url: 'https://openai.com/blog/rss.xml',
            enabled: true, // Enable when needed
            category: 'ai_tools',
            description: 'Official OpenAI announcements',
        },
        {
            id: 'anthropic_blog',
            name: 'Anthropic Blog',
            url: 'https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_news.xml',
            enabled: true,
            category: 'ai_tools',
            description: 'Claude AI updates and research',
        },
        {
            id: 'vercel_blog',
            name: 'Vercel Blog',
            url: 'https://vercel.com/atom',
            enabled: false,
            category: 'dev_workflow',
            description: 'Vercel platform and Next.js updates',
        },
    ],

    // =========================================
    // Reddit Subreddits
    // =========================================
    reddit: [
        {
            id: 'vibecoding',
            subreddit: 'vibecoding',
            enabled: true,
            category: 'dev_workflow',
            minScore: 5, // Lower threshold for niche community
            description: 'Vibe coding community discussions',
        },
        // -------------------------------------------
        // Add more subreddits below (disabled by default)
        // -------------------------------------------
        {
            id: 'cursor',
            subreddit: 'cursor',
            enabled: false,
            category: 'ai_tools',
            minScore: 10,
            description: 'Cursor AI editor discussions',
        },
        {
            id: 'ClaudeAI',
            subreddit: 'ClaudeAI',
            enabled: false,
            category: 'ai_tools',
            minScore: 20,
            description: 'Claude AI community',
        },
        {
            id: 'LocalLLaMA',
            subreddit: 'LocalLLaMA',
            enabled: false,
            category: 'ai_tools',
            minScore: 50,
            description: 'Local LLM enthusiasts',
        },
    ],
};

// -------------------------------------------
// Helper Functions
// -------------------------------------------

export function getEnabledRSSSources(): RSSSourceConfig[] {
    return SOURCES_CONFIG.rss.filter(s => s.enabled);
}

export function getEnabledRedditSources(): RedditSourceConfig[] {
    return SOURCES_CONFIG.reddit.filter(s => s.enabled);
}

export function isAnyCrawlerEnabled(): boolean {
    return (
        getEnabledRSSSources().length > 0 ||
        getEnabledRedditSources().length > 0
    );
}

// -------------------------------------------
// Get stats about configured sources
// -------------------------------------------

export function getSourcesStats() {
    return {
        rss: {
            total: SOURCES_CONFIG.rss.length,
            enabled: getEnabledRSSSources().length,
            sources: getEnabledRSSSources().map(s => s.name),
        },
        reddit: {
            total: SOURCES_CONFIG.reddit.length,
            enabled: getEnabledRedditSources().length,
            sources: getEnabledRedditSources().map(s => `r/${s.subreddit}`),
        },
    };
}
