'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'

declare global {
  interface Window { lottie?: { loadAnimation: (opts: {
    container: Element;
    renderer: 'svg' | 'canvas' | 'html';
    loop?: boolean;
    autoplay?: boolean;
    path: string;
    rendererSettings?: Record<string, unknown>;
  }) => { destroy: () => void } } }
}

const loadLottie = () => new Promise<void>((resolve, reject) => {
  if (typeof window === 'undefined') return resolve()
  if (window.lottie) return resolve()
  const existing = document.getElementById('lottie-web-js') as HTMLScriptElement | null
  if (existing) {
    existing.addEventListener('load', () => resolve())
    existing.addEventListener('error', () => reject(new Error('lottie script failed')))
    return
  }
  const script = document.createElement('script')
  script.id = 'lottie-web-js'
  script.src = 'https://unpkg.com/lottie-web/build/player/lottie.min.js'
  script.async = true
  script.onload = () => resolve()
  script.onerror = () => reject(new Error('lottie script failed'))
  document.body.appendChild(script)
})

export default function WhyCyrene() {
  const animRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
  let anim: { destroy: () => void } | null = null
    let mounted = true
    ;(async () => {
      try {
        await loadLottie()
        if (!mounted || !animRef.current || !window.lottie) return
        anim = window.lottie.loadAnimation({
          container: animRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: '/cyrene.json',
          rendererSettings: { 
            preserveAspectRatio: 'xMidYMid meet',
            progressiveLoad: true
          }
        })
      } catch (e) {
        // no-op; animation is optional
      }
    })()
    return () => {
      mounted = false
      if (anim) anim.destroy()
    }
  }, [])

  const Feature = ({
    img,
    titleLeft,
    titleRight,
    desc,
  }: { img: string; titleLeft: string; titleRight: string; desc: string }) => (
    <div className="flex items-center gap-6">
      <div className="shrink-0">
        <Image 
          src={img} 
          alt="icon" 
          width={130} 
          height={130} 
          className="w-[100px] h-[100px] md:w-[120px] md:h-[120px] lg:w-[130px] lg:h-[130px] rounded-2xl object-contain" 
        />
      </div>
      <div>
        <h3 className="font-outfit text-2xl md:text-[32px] lg:text-[36px] font-normal leading-tight text-white mb-2">
          <span>{titleLeft} </span>
          <span className="text-[#4d84ee]">{titleRight}</span>
        </h3>
        <p className="font-outfit text-base md:text-lg lg:text-[21px] leading-relaxed text-[#9daad7]">
          {desc}
        </p>
      </div>
    </div>
  )

  return (
    <section aria-labelledby="why-cyrene" className="py-16 md:py-20 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 md:mb-14 text-center">
          <h2 id="why-cyrene" className="font-moonhouse text-[28px] md:text-[32px] tracking-[6px] uppercase text-white">Why CyreneAI?</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto mt-4 rounded-full" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Animation - no container box, full visibility */}
          <div className="relative w-full min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
            <div 
              ref={animRef} 
              className="absolute inset-0 w-full h-full" 
              aria-label="Decorative animation"
              style={{ transform: 'scale(1.1)', transformOrigin: 'center center' }}
            />
          </div>

          {/* Right: Features list */}
          <div className="space-y-12 md:space-y-16 lg:space-y-20">
            <Feature
              img="/whycyrene1.png"
              titleLeft="Earn from"
              titleRight="Day 1"
              desc="Get 1% of trading volume as fees — no upfront cost."
            />
            <Feature
              img="/why2.png"
              titleLeft="Aligned"
              titleRight="Incentives"
              desc="10% team tokens, 6-month cliff, 1-year vesting for long-term growth."
            />
            <Feature
              img="/why3.png"
              titleLeft="Internet"
              titleRight="Capital Markets"
              desc="Launch early, build community, raise seed — all on-chain, with full control."
            />
          </div>
        </div>
      </div>
    </section>
  )
}
