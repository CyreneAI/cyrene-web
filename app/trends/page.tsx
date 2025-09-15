import Link from 'next/link';
import { getTrendsCollection } from '@/lib/mongo';

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

  return (
    <div className="max-w-5xl mx-auto px-4 pt-40 pb-10 text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Trends (Last 24h)</h1>
        <form action="/trends" method="get" className="flex items-center gap-2">
          <label className="mr-2 opacity-80 text-sm">Country</label>
          <select
            name="country"
            className="bg-[#0b1238]/60 border border-white/10 rounded-lg px-3 py-2 text-sm"
            defaultValue={selected || ''}
          >
            <option value="">All</option>
            {countries.filter(Boolean).sort().map((c) => (
              <option key={c} value={String(c)}>
                {String(c)}
              </option>
            ))}
          </select>
          <button type="submit" className="px-3 py-2 text-sm rounded-lg border border-white/10 hover:bg-white/10">Apply</button>
        </form>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0b1238]/40">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left">Rank</th>
              <th className="px-4 py-3 text-left">Trend</th>
              <th className="px-4 py-3 text-left">Best Pos</th>
              <th className="px-4 py-3 text-left">Tweets</th>
              <th className="px-4 py-3 text-left">Duration (hrs)</th>
              <th className="px-4 py-3 text-left">Country</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t._id ? String(t._id) : `${t.country}-${t.rank}-${t.trending_topic}`} className="border-t border-white/10 hover:bg-white/5">
                <td className="px-4 py-3 font-semibold">{t.rank}</td>
                <td className="px-4 py-3">
                  <Link href={`/trends/${encodeURIComponent(t.trending_topic)}`} className="text-[#4D84EE] hover:underline">
                    {t.trending_topic}
                  </Link>
                </td>
                <td className="px-4 py-3">{t.top_position ?? '-'}</td>
                <td className="px-4 py-3">{t.tweet_count?.toLocaleString?.() ?? '-'}</td>
                <td className="px-4 py-3">{t.duration_hrs ?? '-'}</td>
                <td className="px-4 py-3">{t.country ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
