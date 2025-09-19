import Link from 'next/link';
import { getTrendsCollection } from '@/lib/mongo';
import TrendsCloud from '@/components/trends/TrendsCloud';
import TrendPanels from '@/components/trends/TrendPanels';

type Trend = {
  _id?: string;
  rank: number;
  trending_topic: string;
  top_position?: number;
  tweet_count?: number;
  duration_hrs?: number;
  country?: string;
};

async function getTrends(selectedCountry?: string): Promise<Trend[]> {
  const col = await getTrendsCollection();
  const filter = selectedCountry ? { country: selectedCountry } : {};
  const docs = await col
    .find(filter, { projection: { _id: 1, trending_topic: 1, rank: 1, top_position: 1, tweet_count: 1, duration_hrs: 1, country: 1 } })
    .sort({ rank: 1 })
    .limit(200)
    .toArray();
  
  // Ensure no duplicates in the results (should already be handled by backend, but just to be safe)
  const uniqueDocs = Array.from(
    docs.reduce((map, item) => {
      const key = item.trending_topic.toLowerCase();
      if (!map.has(key) || (item.rank < map.get(key).rank)) {
        map.set(key, item);
      }
      return map;
    }, new Map()).values()
  );
  
  return uniqueDocs as unknown as Trend[];
}

export default async function TrendsPage({ searchParams }: { searchParams?: Promise<{ country?: string }> }) {
  const resolved = (await searchParams) || {};
  const selected = resolved.country || '';
  const items = await getTrends(selected || undefined);
  const col = await getTrendsCollection();
  const countries = await col.distinct('country');
  const maxCount = items.reduce((m, t) => Math.max(m, t.tweet_count || 0), 0);
  const total = items.length;
  return (
    <div className="pt-40 pb-20 text-white w-full">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/6 text-sm">← Back</Link>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-[#b5ccff] to-[#6aa2ff] bg-clip-text text-transparent">Global Trends </h1>
          </div>
          <form action="/trends" method="get" className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-3 py-2 rounded-2xl border border-white/10 self-start">
            <label className="opacity-70 text-xs uppercase tracking-wide">Country</label>
            <select
              name="country"
              className="bg-[#0b1238]/60 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
              defaultValue={selected || ''}
            >
              <option value="">All</option>
              {countries.filter(Boolean).sort().map((c) => (
                <option key={c} value={String(c)}>
                  {String(c)}
                </option>
              ))}
            </select>
            <button type="submit" className="px-3 py-2 text-sm rounded-lg bg-[#1b2b5e] hover:bg-[#26407f] border border-white/10 transition-colors">Apply</button>
          </form>
        </div>
      </div>
      {/* Divider and extra spacing to separate header from cloud */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="mt-6 border-t border-white/6" />
      </div>
      <div className="mt-8 w-full px-4 sm:px-6 md:px-10 lg:px-14">
        <div className="pt-8">
          <TrendsCloud items={items} fullWidth />
        </div>
        <div className="mt-14 max-w-7xl mx-auto">
          <div className="mb-6 flex items-center gap-4">
            <h2 className="text-2xl font-semibold tracking-tight">Highlights</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
          </div>
          <TrendPanels items={items} />
        </div>
      </div>
    </div>
  );
}
