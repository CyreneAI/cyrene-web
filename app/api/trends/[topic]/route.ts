import { NextResponse } from 'next/server';
import { getTrendsCollection } from '@/lib/mongo';

// Fix: Update the function signature to match what Next.js expects
export async function GET(
  request: Request,
  context: { params: Promise<{ topic: string }> }
) {
  try {
    const { topic } = await context.params;
    
    if (!topic) {
      return NextResponse.json({ error: 'Topic parameter is required' }, { status: 400 });
    }
    
    const col = await getTrendsCollection();
  const name = decodeURIComponent(topic).replace(/_/g, ' ').replace(/-/g, ' ').trim();
    const doc = await col.findOne({ trending_topic: name });
    
    if (!doc) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }
    
    return NextResponse.json(doc);
  } catch (error) {
    console.error('Error fetching trend:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}