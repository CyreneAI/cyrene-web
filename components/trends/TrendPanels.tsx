"use client";
import React, { useMemo } from 'react';
import Link from 'next/link';
import type { TrendItem } from './TrendsCloud';

interface TrendPanelsProps {
  items: TrendItem[];
}

// Helper to build a ranked list safely
function takeSorted(items: TrendItem[], key: (t: TrendItem) => number, limit: number, filter?: (t: TrendItem) => boolean) {
  return items
    .filter(t => (filter ? filter(t) : true))
    .map(t => ({ t, v: key(t) }))
    .filter(x => Number.isFinite(x.v))
    .sort((a, b) => b.v - a.v)
    .slice(0, limit)
    .map(x => x.t);
}

const Panel: React.FC<{ title: string; children: React.ReactNode; subtitle?: string }>= ({ title, children, subtitle }) => (
  <div className="relative group rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-white/[0.01] hover:from-white/[0.07] hover:via-white/[0.03] hover:to-white/[0.015] transition-colors overflow-hidden p-5 flex flex-col gap-4 min-h-[300px]">
    <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_30%_30%,rgba(120,160,255,0.18),transparent_65%)]" />
    <div className="relative z-10">
      <h3 className="text-lg font-semibold tracking-tight text-white">{title}</h3>
      {subtitle && <p className="text-xs mt-1 text-white/50">{subtitle}</p>}
    </div>
    <div className="relative z-10 grid grid-cols-1 gap-2 text-sm">
      {children}
    </div>
  </div>
);

const TopicRow: React.FC<{ topic: TrendItem; metricLabel: string; metricValue: string | number }> = ({ topic, metricLabel, metricValue }) => (
  <Link
    prefetch={false}
    href={`/trends/${encodeURIComponent(topic.trending_topic)}`}
    className="flex items-center justify-between gap-3 group/item rounded-lg px-3 py-2 bg-white/4 hover:bg-white/10 transition-colors border border-white/10 hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-white/30"
  >
    <span className="truncate font-medium text-white group-hover/item:text-white">{topic.trending_topic}</span>
    <span className="ml-auto shrink-0 text-[11px] font-semibold rounded-md px-2 py-1 bg-gradient-to-br from-indigo-400/30 via-indigo-500/20 to-blue-500/20 text-indigo-100 border border-indigo-300/30 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
      {metricValue}<span className="opacity-55 ml-1 font-normal tracking-wide uppercase">{metricLabel}</span>
    </span>
  </Link>
);

const TrendPanels: React.FC<TrendPanelsProps> = ({ items }) => {
  const { longest, mostTweets, newest } = useMemo(() => {
    const longest = takeSorted(items, t => t.duration_hrs ?? 0, 12, t => (t.duration_hrs ?? 0) > 0);
    const mostTweets = takeSorted(items, t => t.tweet_count ?? 0, 12, t => (t.tweet_count ?? 0) > 0);
    // New Trends: shortest duration (include those with 0 / 0.5 / 1 hour) - sort ascending duration then by rank
    const recentPool = items
      .filter(t => (t.duration_hrs ?? 0) <= 1.5) // threshold
      .sort((a, b) => (a.duration_hrs ?? 0) - (b.duration_hrs ?? 0) || (a.rank ?? 999) - (b.rank ?? 999))
      .slice(0, 12);
    return { longest, mostTweets, newest: recentPool };
  }, [items]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <Panel title="Longest Trending" subtitle="Most sustained presence (hrs)">
        {longest.length === 0 && <div className="text-white/40 text-xs">No data</div>}
        {longest.map(t => (
          <TopicRow key={t.trending_topic} topic={t} metricLabel="h" metricValue={(t.duration_hrs ?? 0).toFixed(1)} />
        ))}
      </Panel>
      <Panel title="Trends with Maximum Tweets" subtitle="Highest tweet volume">
        {mostTweets.length === 0 && <div className="text-white/40 text-xs">No data</div>}
        {mostTweets.map(t => (
          <TopicRow key={t.trending_topic} topic={t} metricLabel="tw" metricValue={(t.tweet_count ?? 0).toLocaleString()} />
        ))}
      </Panel>
      <Panel title="New Trends" subtitle="Fresh / emerging (≤ ~1.5h)">
  {newest.length === 0 && <div className="text-white/40 text-xs">None detected</div>}
        {newest.map(t => (
          <TopicRow key={t.trending_topic} topic={t} metricLabel="h" metricValue={(t.duration_hrs ?? 0).toFixed(1)} />
        ))}
      </Panel>
    </div>
  );
};

export default TrendPanels;
