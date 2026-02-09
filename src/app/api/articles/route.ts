import { NextResponse } from 'next/server';
import { getLatestArticles } from '@/lib/supabase/client';

export async function GET() {
    try {
        const articles = await getLatestArticles(20);
        return NextResponse.json(articles);
    } catch (error) {
        console.error('Error fetching articles:', error);
        return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
    }
}
