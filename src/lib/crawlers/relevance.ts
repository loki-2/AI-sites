// ===========================================
// Relevance Scoring Engine for Vibe Coders
// ===========================================
// Scores content based on how relevant it is to our target audience:
// 1. Non-technical builders (Cursor, Claude Code, no-code tools)
// 2. Trend-aware folks (funding, launches, market trends)
// 3. Technical coders (APIs, frameworks, dev tools)

import type { RawItem } from '@/types';
import type { ContentCategory } from './sources.config';

// -------------------------------------------
// Keyword Configuration
// -------------------------------------------
// Organized by tier (priority) and category

interface KeywordTier {
    keywords: string[];
    score: number;
}

// Tier 1: High-priority vibe coder keywords (+30 each)
const TIER_1_KEYWORDS: KeywordTier = {
    score: 30,
    keywords: [
        // AI coding assistants (expanded)
        'cursor', 'cursor ai', 'cursor.sh',
        'claude code', 'claude-code',
        'chatgpt', 'gpt-4', 'gpt-5',
        'copilot', 'github copilot',
        'codeium', 'tabnine', 'supermaven',
        'windsurf', 'aider', 'cline',
        'continue.dev', 'continue dev',
        'sourcegraph cody', 'cody ai',
        'amazon q', 'aws codewhisperer',

        // Vibe coding culture
        'vibe coding', 'vibecoding', 'vibe coder',
        'ai coding', 'ai-assisted', 'ai assisted coding',
        'pair programming with ai', 'coding with ai',
        'ship fast', 'build fast', 'shipping fast',
        'built in a day', 'built in a weekend', 'weekend project',
        '24-hour build', 'day of building', '48 hour build',
        'side project', 'side hustle',
        'indie hacker', 'indiehacker', 'indie maker',
        'solo founder', 'solopreneur', 'maker',
        'building in public', 'build in public',

        // No-code / low-code platforms (comprehensive)
        'no-code', 'nocode', 'low-code', 'lowcode',
        'webflow', 'bubble', 'bubble.io',
        'retool', 'airtable',
        'v0', 'v0.dev', 'vercel v0',
        'bolt', 'bolt.new', 'bolt.diy',
        'lovable', 'lovable.dev',
        'replit', 'repl.it',
        'framer', 'glide', 'glideapps',
        'softr', 'pory', 'notion',
        'make.com', 'zapier', 'n8n',
        'buildship', 'flutterflow',
        'adalo', 'thunkable',

        // Building & shipping
        'prototype', 'mvp', 'minimum viable product',
        'launch', 'launched', 'shipped', 'shipping',
        'built with', 'made with', 'powered by',
        'quick build', 'rapid prototyping',

        // Dev productivity & workflow
        'dev productivity', 'developer productivity',
        'coding workflow', 'dev workflow',
        'automation tool', 'automate',
    ],
};

// Tier 2: Medium-priority keywords (+20 each)
const TIER_2_KEYWORDS: KeywordTier = {
    score: 20,
    keywords: [
        // Startup ecosystem
        'startup', 'founder', 'funding', 'raised',
        'acquired', 'acquisition', 'yc', 'y combinator',
        'product hunt', 'producthunt',

        // Developer experience
        'developer experience', 'dx', 'devtools', 'dev tools',
        'workflow', 'productivity', 'automation',
        'open source', 'oss', 'github',

        // AI/LLM general
        'llm', 'large language model', 'gpt', 'gpt-4', 'gpt-5',
        'claude', 'anthropic', 'openai', 'gemini',
        'ai agent', 'ai agents', 'agentic',
        'prompt', 'prompt engineering',

        // APIs and tools
        'api', 'sdk', 'saas', 'tool', 'library',
    ],
};

// Tier 3: Lower-priority but relevant (+10 each)
const TIER_3_KEYWORDS: KeywordTier = {
    score: 10,
    keywords: [
        // Languages & frameworks
        'typescript', 'javascript', 'python', 'rust',
        'react', 'next.js', 'nextjs', 'node', 'deno', 'bun',
        'svelte', 'vue', 'tailwind',

        // Platforms
        'supabase', 'vercel', 'netlify', 'railway', 'render',
        'cloudflare', 'aws', 'firebase', 'planetscale',

        // General tech
        'tutorial', 'guide', 'how to', 'learn',
        'benchmark', 'performance', 'comparison',
    ],
};

// Negative keywords (-50 each) - content we DON'T want
const NEGATIVE_KEYWORDS: KeywordTier = {
    score: -50,
    keywords: [
        // Crypto/blockchain (unless specifically about AI)
        'crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'nft',
        'blockchain', 'web3', 'defi', 'token',

        // Politics/regulation (unless about AI regulation directly)
        'regulation', 'lawsuit', 'sued', 'court',
        'congress', 'senate', 'government',

        // Finance/business (unless startup-related)
        'earnings', 'stock price', 'ipo', 'quarterly',
        'layoffs', 'laid off', // Controversial - may want these

        // Irrelevant tech
        'gaming', 'console', 'playstation', 'xbox',
        'smartphone', 'iphone', 'android phone',
    ],
};

// -------------------------------------------
// Category Bonus Configuration
// -------------------------------------------
// Extra points if content matches source category

const CATEGORY_BONUS: Record<ContentCategory, string[]> = {
    ai_tools: ['cursor', 'copilot', 'claude', 'gpt', 'ai', 'llm', 'chatgpt'],
    no_code: ['no-code', 'nocode', 'webflow', 'bubble', 'retool', 'v0'],
    dev_workflow: ['workflow', 'productivity', 'automation', 'devtools'],
    startup: ['startup', 'founder', 'funding', 'launch', 'product hunt'],
    tutorials: ['tutorial', 'guide', 'how to', 'learn', 'step by step'],
    trends: ['trend', 'future', 'prediction', 'analysis', 'report'],
};

const CATEGORY_BONUS_SCORE = 25;

// -------------------------------------------
// Main Scoring Function
// -------------------------------------------

export interface ScoredItem extends RawItem {
    relevanceScore: number;
    relevanceDetails: {
        tier1Matches: string[];
        tier2Matches: string[];
        tier3Matches: string[];
        negativeMatches: string[];
        categoryBonus: boolean;
    };
}

export function scoreRelevance(
    item: RawItem,
    sourceCategory?: ContentCategory
): ScoredItem {
    const titleLower = (item.title || '').toLowerCase();
    const contentLower = (item.content || '').toLowerCase();
    const combined = `${titleLower} ${contentLower}`;

    let score = 0;
    const details = {
        tier1Matches: [] as string[],
        tier2Matches: [] as string[],
        tier3Matches: [] as string[],
        negativeMatches: [] as string[],
        categoryBonus: false,
    };

    // Helper to check keyword match
    const checkKeywords = (keywords: string[], tier: string[], tierScore: number) => {
        for (const keyword of keywords) {
            // Title match is worth more
            if (titleLower.includes(keyword)) {
                score += tierScore;
                tier.push(keyword);
            } else if (contentLower.includes(keyword)) {
                score += tierScore * 0.5; // Content match is half points
                tier.push(keyword);
            }
        }
    };

    // Score each tier
    checkKeywords(TIER_1_KEYWORDS.keywords, details.tier1Matches, TIER_1_KEYWORDS.score);
    checkKeywords(TIER_2_KEYWORDS.keywords, details.tier2Matches, TIER_2_KEYWORDS.score);
    checkKeywords(TIER_3_KEYWORDS.keywords, details.tier3Matches, TIER_3_KEYWORDS.score);

    // Check negative keywords
    for (const keyword of NEGATIVE_KEYWORDS.keywords) {
        if (combined.includes(keyword)) {
            score += NEGATIVE_KEYWORDS.score;
            details.negativeMatches.push(keyword);
        }
    }

    // Apply category bonus
    if (sourceCategory && CATEGORY_BONUS[sourceCategory]) {
        const categoryKeywords = CATEGORY_BONUS[sourceCategory];
        const hasBonus = categoryKeywords.some(k => combined.includes(k));
        if (hasBonus) {
            score += CATEGORY_BONUS_SCORE;
            details.categoryBonus = true;
        }
    }

    // Minimum score of 0
    score = Math.max(0, score);

    return {
        ...item,
        relevanceScore: score,
        relevanceDetails: details,
    };
}

// -------------------------------------------
// Filter Items by Relevance
// -------------------------------------------

export interface FilterOptions {
    minScore?: number;           // Minimum score to include (default: 30)
    maxItems?: number;           // Maximum items to return
    sortByScore?: boolean;       // Sort by relevance score (default: true)
    requireTier1Match?: boolean; // Require at least one Tier 1 keyword (default: true)
}

export function filterByRelevance(
    items: ScoredItem[],
    options: FilterOptions = {}
): ScoredItem[] {
    const {
        minScore = 30,
        maxItems,
        sortByScore = true,
        requireTier1Match = true, // Default: require Tier 1 match
    } = options;

    // Filter by Tier 1 requirement first (most important filter)
    let filtered = items;
    if (requireTier1Match) {
        filtered = filtered.filter(item =>
            item.relevanceDetails.tier1Matches.length > 0
        );
    }

    // Then filter by minimum score
    filtered = filtered.filter(item => item.relevanceScore >= minScore);

    // Sort by score if requested
    if (sortByScore) {
        filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    // Limit results
    if (maxItems && filtered.length > maxItems) {
        filtered = filtered.slice(0, maxItems);
    }

    return filtered;
}

// -------------------------------------------
// Batch Score and Filter
// -------------------------------------------

export function scoreAndFilterItems(
    items: RawItem[],
    sourceCategory?: ContentCategory,
    options: FilterOptions = {}
): ScoredItem[] {
    // Score all items
    const scored = items.map(item => scoreRelevance(item, sourceCategory));

    // Filter and return
    return filterByRelevance(scored, options);
}

// -------------------------------------------
// Debug: Get keyword stats
// -------------------------------------------

export function getKeywordStats() {
    return {
        tier1Count: TIER_1_KEYWORDS.keywords.length,
        tier2Count: TIER_2_KEYWORDS.keywords.length,
        tier3Count: TIER_3_KEYWORDS.keywords.length,
        negativeCount: NEGATIVE_KEYWORDS.keywords.length,
        categories: Object.keys(CATEGORY_BONUS),
    };
}
