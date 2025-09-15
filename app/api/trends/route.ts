import { NextRequest, NextResponse } from 'next/server';
import { getTrendsCollection } from '@/lib/mongo';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
  const analyzed = searchParams.get('analyzed');
  const country = searchParams.get('country');

  const col = await getTrendsCollection();
  const filter: Record<string, unknown> = {};
    if (analyzed === 'true') filter.analysis = { $exists: true };
  if (country) filter.country = country;

    const cursor = col
      .find(filter, {
        projection: { trending_topic: 1, rank: 1, top_position: 1, tweet_count: 1, duration_hrs: 1, country: 1 },
      })
      .sort({ rank: 1 })
      .limit(Math.max(1, Math.min(500, limit)));

    const items = await cursor.toArray();
    return NextResponse.json({ items });
  } catch (err) {
    console.error('GET /api/trends error', err);
    return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
  }
}
