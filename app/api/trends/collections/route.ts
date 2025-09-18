import { NextResponse } from 'next/server';
import { getTrendsCollectionNames, invalidateTrendsCollectionCache, getTrendsCollection } from '@/lib/mongo';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const refresh = url.searchParams.get('refresh');
    if (refresh === '1') {
      invalidateTrendsCollectionCache();
    }
    const collections = await getTrendsCollectionNames();
    const latest = collections[0] || 'daily_trends';
    if (refresh === '1') {
      // Force open to ensure it exists; ignore result
      await getTrendsCollection(true);
    }
    return NextResponse.json({
      latest_collection: latest,
      all_collections: collections,
      total_count: collections.length,
      refreshed: refresh === '1'
    });
  } catch (error) {
    console.error('Error fetching collection info:', error);
    return NextResponse.json({ error: 'Failed to fetch collection info' }, { status: 500 });
  }
}