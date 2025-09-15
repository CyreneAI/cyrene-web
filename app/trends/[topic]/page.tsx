type Analysis = {
  description?: string;
  stats?: {
    user_base?: string;
    available_states?: string;
    recent_highlights?: string;
    engagement?: string;
    total_tweets?: number;
    trend_duration_hrs?: number;
  };
  metadata?: Record<string, unknown>;
  scores?: { viral_chance?: number; sustainability_index?: number };
  token_analysis?: string;
};

import { getTrendsCollection } from '@/lib/mongo';

type TrendDoc = {
  _id: string;
  rank: number;
  trending_topic: string;
  top_position?: number;
  tweet_count?: number;
  duration_hrs?: number;
  analysis?: Analysis;
  country?: string;
};

async function getTrend(topic: string): Promise<TrendDoc | null> {
  const col = await getTrendsCollection();
  const name = decodeURIComponent(topic).replace(/_/g, ' ').replace(/-/g, ' ').trim();
  const doc = await col.findOne({ trending_topic: name });
  return (doc as unknown as TrendDoc) || null;
}

export default async function TrendDetail({ params }: { params: Promise<{ topic: string }> }) {
  const { topic: rawTopic } = await params;
  const topic = decodeURIComponent(rawTopic);
  const doc = await getTrend(topic);

  if (!doc) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-white">
        <h1 className="text-2xl font-bold">Trend not found</h1>
      </div>
    );
  }

  const a = doc.analysis || {};

  return (
  <div className="max-w-3xl mx-auto px-4 pt-40 pb-10 text-white">
      <div className="bg-[#0b1238]/60 border border-white/10 rounded-2xl p-6 shadow-xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{doc.trending_topic}</h1>
          {doc.country && <div className="opacity-70 mt-1">{doc.country}</div>}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-sm opacity-70">Rank</div>
            <div className="text-2xl font-bold">{doc.rank}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-sm opacity-70">Best Position</div>
            <div className="text-2xl font-bold">{doc.top_position ?? '-'}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-sm opacity-70">Total Tweets</div>
            <div className="text-2xl font-bold">{doc.tweet_count?.toLocaleString?.() ?? '-'}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-sm opacity-70">Trending for</div>
            <div className="text-2xl font-bold">{doc.duration_hrs ?? '-'} hours</div>
          </div>
        </div>

        {a && Object.keys(a).length > 0 ? (
          <div className="space-y-6">
            {a.description && (
              <p className="bg-white/5 rounded-xl p-4 leading-relaxed">{a.description}</p>
            )}

            {a.stats && (
              <div className="bg-white/5 rounded-xl p-4 space-y-2">
                <div className="font-semibold mb-2">Highlights</div>
                {a.stats.user_base && <div><span className="opacity-70">User Base:</span> {a.stats.user_base}</div>}
                {a.stats.available_states && <div><span className="opacity-70">Available States:</span> {a.stats.available_states}</div>}
                {a.stats.recent_highlights && <div><span className="opacity-70">Recent:</span> {a.stats.recent_highlights}</div>}
                {a.stats.engagement && <div><span className="opacity-70">Engagement:</span> {a.stats.engagement}</div>}
              </div>
            )}

            {a.scores && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="opacity-70 text-sm">Viral Chance</div>
                  <div className="text-3xl font-bold">{a.scores.viral_chance ?? '-'}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="opacity-70 text-sm">Sustainability</div>
                  <div className="text-3xl font-bold">{a.scores.sustainability_index ?? '-'}</div>
                </div>
              </div>
            )}

            {a.token_analysis && (
              <div className="bg-white/5 rounded-xl p-4">
                <div className="font-semibold mb-2">Token Analysis</div>
                <div>{a.token_analysis}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">Analysis not available yet.</div>
        )}

        <div className="mt-6 flex gap-3">
          <a
            href={`https://x.com/search?q=${encodeURIComponent(doc.trending_topic)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-[#4D84EE] text-white hover:opacity-90"
          >
            View Tweets on X
          </a>
          <a
            href={`https://x.com/intent/tweet?text=${encodeURIComponent(doc.trending_topic + ' is trending on CyreneAI')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10"
          >
            Share on X
          </a>
        </div>
      </div>
    </div>
  );
}
