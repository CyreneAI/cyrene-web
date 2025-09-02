"use client"

import Image from "next/image"
import { Map } from "lucide-react"

export default function CtaCard() {
  return (
    <section aria-labelledby="cta-heading" className="w-full bg-transparent py-10 md:py-16">
      <div
        className="mx-auto max-w-6xl rounded-[28px] border-4 border-white/90 p-6 md:p-10"
        role="region"
        aria-label="Get started callout"
      >
        <div className="grid items-center gap-8 md:grid-cols-2">
          {/* Left: Heading, copy, button */}
          <div className="flex flex-col gap-6">
            <h2 id="cta-heading" className="text-pretty font-sans text-2xl font-semibold text-white md:text-3xl">
              Get Started Now
            </h2>

            <p className="max-w-[48ch] text-pretty font-sans text-base leading-relaxed text-[#c7d2fe]">
              AI agent launchpad managing a multi-agent platform and AI coordination layer on NetSepio&apos;s secure and
              decentralized network.
            </p>

            <div>
              <button
                type="button"
                className="inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 font-sans text-[15px] font-medium text-[#0b1024] shadow-sm transition-colors hover:bg-white/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/70"
                aria-label="Explore"
              >
                <span>Explore</span>
                {/* Icon inside the button, as in the mock */}
                <Map size={20} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Right: 3D image */}
          <div className="flex items-center justify-center">
            <Image
              src="/3D_Black_Chrome_Shape18.webp"
              alt="Glossy 3D hexagonal chrome shape"
              width={420}
              height={420}
              className="h-auto w-[280px] md:w-[360px] lg:w-[400px] select-none"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}