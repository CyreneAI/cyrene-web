"use client";
import React, { useMemo, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export interface TrendItem {
  trending_topic: string;
  tweet_count?: number;
  rank?: number;
  country?: string;
  duration_hrs?: number;
}

interface TrendsCloudProps {
  items: TrendItem[];
  maxWords?: number;
  fullWidth?: boolean; // when true we assume a wider container for layout estimation
}

// Utility: scale a value to a font size range
function scaleFont(value: number, min: number, max: number, outMin: number, outMax: number) {
  if (!isFinite(value)) return (outMin + outMax) / 2;
  if (max === min) return (outMin + outMax) / 2;
  const t = (value - min) / (max - min);
  return outMin + t * (outMax - outMin);
}

export const TrendsCloud: React.FC<TrendsCloudProps> = ({ items, maxWords = 160, fullWidth = false }) => {
  // Client placement: absolute canvas
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [placed, setPlaced] = useState<{
    text: string;
    left: number;
    top: number;
    size: number;
    rankClass?: string;
  }[]>([]);
  const [measured, setMeasured] = useState<{ text: string; w: number; h: number; size: number; rankClass?: string }[] | null>(null);
  const [scalePass, setScalePass] = useState(0); // increments when we shrink everything to fit
  const measureRef = useRef<HTMLDivElement | null>(null);

  // Prepare processed items (dedupe, ordering, tiers) - same as before but without jitter
  const processed = useMemo(() => {
    const limited = items.slice(0, maxWords);
    const seen = new Set<string>();
    const deduped: typeof limited = [];
    for (const it of limited) {
      const key = (it.trending_topic || '').trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(it);
      }
    }
    const ordered = [...deduped].sort((a, b) => {
      const da = (b.duration_hrs ?? 0) - (a.duration_hrs ?? 0);
      if (da !== 0) return da;
      return (a.rank ?? 9999) - (b.rank ?? 9999);
    });
    const tiers = [64, 56, 48, 40, 32, 26, 22, 18, 16, 14];
    const withSizes = ordered.map((it, idx) => {
      const tierIndex = Math.floor(idx / 5);
      const baseSize = tiers[tierIndex] ?? tiers[tiers.length - 1];
      const rankClass = it.rank && it.rank <= 5 ? 'font-extrabold' : it.rank && it.rank <= 15 ? 'font-bold' : 'font-medium';
      return { text: it.trending_topic, size: baseSize, rankClass };
    });
    // Interleave tiers
    const tiersMap: Record<number, typeof withSizes> = {};
    withSizes.forEach((it, idx) => {
      const tier = Math.floor(idx / 5);
      if (!tiersMap[tier]) tiersMap[tier] = [];
      tiersMap[tier].push(it);
    });
    const interleaved: typeof withSizes = [];
    const maxBucket = Math.max(...Object.keys(tiersMap).map(k => Number(k)));
    for (let i = 0; i <= maxBucket; i++) {
      for (let t = 0; t <= maxBucket; t++) {
        const arr = tiersMap[t];
        if (arr && arr.length) {
          const el = arr.shift();
          if (el) interleaved.push(el);
        }
      }
    }
    return interleaved;
  }, [items, maxWords]);

  // Measure actual rendered sizes (off-screen) then place precisely
  useEffect(() => {
    const measEl = measureRef.current;
    if (!measEl) return;
    measEl.innerHTML = '';
    const fr = document.createDocumentFragment();
    const measures: { text: string; w: number; h: number; size: number; rankClass?: string }[] = [];
    processed.forEach((p) => {
      const span = document.createElement('span');
      span.textContent = p.text;
      span.style.fontSize = p.size + 'px';
      span.style.fontWeight = p.rankClass?.includes('extrabold') ? '800' : p.rankClass?.includes('bold') ? '600' : '500';
      span.style.position = 'absolute';
      span.style.visibility = 'hidden';
      span.style.whiteSpace = 'nowrap';
      fr.appendChild(span);
      measures.push({ text: p.text, w: 0, h: 0, size: p.size, rankClass: p.rankClass });
    });
    measEl.appendChild(fr);
    // now read sizes
    Array.from(measEl.children).forEach((child, i) => {
      const rect = (child as HTMLElement).getBoundingClientRect();
      measures[i].w = rect.width;
      measures[i].h = rect.height;
    });
    setMeasured(measures);
  }, [processed, scalePass]);

  useEffect(() => {
    if (!measured) return;
    const el = containerRef.current;
    if (!el) return;
  const cw = el.clientWidth;
  const MAX_HEIGHT = 480; // fixed height target (no scrolling)
  const ch = MAX_HEIGHT;
    const placedBoxes: { l: number; t: number; r: number; b: number }[] = [];
    const out: typeof placed = [];
    const padding = 8; // slightly larger now
    const centerX = cw / 2;
  const centerY = ch / 2;
    function overlaps(l: number, t: number, w: number, h: number) {
      const r = l + w;
      const b = t + h;
      return placedBoxes.some(p => !(r + padding < p.l || l - padding > p.r || b + padding < p.t || t - padding > p.b));
    }
    // Place larger first (already sorted by size tiers)
    for (let i = 0; i < measured.length; i++) {
      const m = measured[i];
      const w = m.w;
      const h = m.h;
      let pos: { x: number; y: number } | null = null;
      const maxRadius = Math.max(cw, ch) * 1.5;
      for (let r = 0; r < maxRadius && !pos; r += 18) {
        const steps = Math.max(10, Math.floor((r + 40) / 8));
        for (let a = 0; a < steps; a++) {
          const theta = (a / steps) * Math.PI * 2;
            const x = centerX + r * Math.cos(theta) - w / 2;
            const y = centerY + r * Math.sin(theta) - h / 2;
            const margin = 24;
            const lx = Math.max(margin, Math.min(cw - w - margin, x));
            const ty = Math.max(margin, Math.min(ch - h - margin, y));
            if (!overlaps(lx, ty, w, h)) {
              pos = { x: lx, y: ty };
              placedBoxes.push({ l: lx, t: ty, r: lx + w, b: ty + h });
              break;
            }
        }
      }
      if (!pos) {
        // If we cannot place within fixed height, trigger a scale reduction
        // Only attempt a few times
        if (scalePass < 6) {
          // reduce all base sizes by 8%
          processed.forEach(p => { p.size = Math.max(10, Math.round(p.size * 0.92)); });
          setScalePass(sp => sp + 1);
          return; // abort this placement cycle; measurement effect will re-run
        } else {
          pos = { x: centerX - w / 2, y: centerY - h / 2 };
        }
      }
      out.push({ text: m.text, left: pos.x, top: pos.y, size: m.size, rankClass: m.rankClass });
    }
    el.style.height = ch + 'px';
    setPlaced(out);
  }, [measured, scalePass, processed]);

  return (
    <div className="relative w-full py-2 overflow-hidden">
      <div ref={containerRef} className="relative w-full h-[480px] overflow-hidden transition-[height] duration-300 bg-[radial-gradient(circle_at_20%_35%,#eaf4ff22,transparent_70%),radial-gradient(circle_at_80%_65%,#e6f7ff18,transparent_70%)]">
        {placed.map((p, i) => (
          <Link
            key={`${p.text}-${i}`}
            prefetch={false}
            href={`/trends/${encodeURIComponent(p.text)}`}
            className={`absolute whitespace-nowrap leading-tight ${p.rankClass} hover:scale-[1.04] transition-transform`}
            style={{ left: p.left, top: p.top, fontSize: p.size, color: '#ffffff' }}
          >
            {p.text}
          </Link>
        ))}
      </div>
      {/* hidden measurement layer */}
      <div ref={measureRef} aria-hidden="true" className="pointer-events-none fixed -left-[5000px] top-0" />
      {placed.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">No trends available.</div>
      )}
    </div>
  );
};

export default TrendsCloud;
