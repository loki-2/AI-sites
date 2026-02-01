# VibeCoders News

AI-curated daily news digest for vibe coders - builders who use AI tools to ship products fast.

## Features

- **Automated News Crawling**: Pulls from HackerNews, TechCrunch, Reddit, and AI company blogs
- **AI-Powered Curation**: LangGraph agents deduplicate, score, and filter the most relevant content
- **Slack Approval Workflow**: Human-in-the-loop approval before publishing
- **AI Article Writing**: Generates concise 150-250 word articles in builder-first tone
- **Modern Frontend**: TechCrunch-inspired design with Next.js and shadcn/ui

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **AI Agents**: LangGraph.js with Gemini/OpenAI
- **Database**: Supabase (PostgreSQL)
- **Content Management**: Notion (3 databases for pipeline stages)
- **Notifications**: Slack bot with interactive messages
- **Deployment**: Netlify with scheduled functions

## Architecture

```
[Crawlers] → [Notion Raw DB] → [Aggregation Agent] → [Sorting Agent]
                                                          ↓
[Website] ← [Supabase] ← [Publish Cron] ← [Notion Processed DB]
                                                          ↑
                              [Reviewer Agent] ← [Writer Agent] ← [Slack Approval]
```

## Setup

### 1. Clone and Install

```bash
git clone <repo-url>
cd vibecodersnews
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required services:
- **Google AI** (Gemini): Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Notion**: Create integration at [Notion Integrations](https://www.notion.so/my-integrations)
- **Supabase**: Create project at [Supabase](https://supabase.com)
- **Slack**: Create app at [Slack API](https://api.slack.com/apps)

### 3. Set Up Notion Databases

Create 3 databases in Notion with these properties:

**Raw Items Database:**
- Title (title)
- URL (url)
- Source (select)
- Content (rich_text)
- CrawledAt (date)
- Score (number)

**Processed Database:**
- Title (title)
- OriginalURL (url)
- Summary (rich_text)
- Tags (multi_select)
- RelevanceScore (number)
- SlackApproved (checkbox)
- ArticleContent (rich_text)
- ReviewedContent (rich_text)
- ReadyToPublish (checkbox)

**Published Database:**
- Title (title)
- Slug (rich_text)
- Content (rich_text)
- PublishedAt (date)
- SupabaseID (rich_text)

### 4. Set Up Supabase

Run this SQL in Supabase SQL Editor:

```sql
create table articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  content text not null,
  summary text,
  original_url text,
  source text,
  tags text[],
  published_at timestamptz default now(),
  created_at timestamptz default now()
);

create index idx_articles_slug on articles(slug);
create index idx_articles_published_at on articles(published_at desc);
```

### 5. Set Up Slack App

1. Go to [Slack API](https://api.slack.com/apps) and create a new app
2. Add Bot Token Scopes: `chat:write`, `channels:read`
3. Enable Event Subscriptions with URL: `https://your-site.netlify.app/api/slack/events`
4. Enable Interactivity with URL: `https://your-site.netlify.app/api/slack/interactions`
5. Install app to workspace

### 6. Run Locally

```bash
npm run dev
```

### 7. Deploy to Netlify

1. Push to GitHub
2. Connect repo in Netlify
3. Add all environment variables
4. Deploy!

## API Endpoints

- `POST /api/cron/crawl` - Trigger crawl pipeline manually
- `POST /api/cron/publish` - Trigger publish pipeline manually
- `POST /api/slack/events` - Slack event subscriptions
- `POST /api/slack/interactions` - Slack button interactions

## Scheduled Functions

- **scheduled-crawl**: Runs at 11am and 11pm UTC daily
- **scheduled-publish**: Runs at 12pm UTC daily

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

## License

MIT
