"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import React from "react"

// ArrowRight component
const ArrowRight = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
)

export default function LaunchHero() {
  const router = useRouter()

  const handleGetStartedClick = () => {
    router.push("/launch-projects")
  }

  return (
    <section className="relative text-white py-12 md:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative w-full max-w-[958px] h-[361px] mx-auto">
          <div className="relative w-full h-full">
            
            {/* Left side - Text and Button */}
            <div className="absolute w-[588px] h-[358px] top-px left-0">
              <h1 className="absolute top-0 left-0 font-moonhouse font-normal text-white text-[60px] sm:text-[80px] lg:text-[100px] tracking-[4.04px] leading-[0.8]">
                LAUNCH
                <br />
                YOUR
                <br />
                PROJECT
              </h1>
              
              {/* Option 1: Button with onClick handler */}
              <button
                className="flex w-[269px] h-[70px] items-center justify-center gap-5 px-[30px] py-2.5 absolute top-72 left-0 rounded-[50px] border-2 border-solid border-white hover:bg-white hover:text-black transition-colors duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent group"
                onClick={handleGetStartedClick}
                aria-label="Get started with launching your project"
              >
                <span className="relative w-fit font-outfit font-normal text-white text-[21px] tracking-[0] leading-[27.3px] whitespace-nowrap group-hover:text-black transition-colors duration-300">
                  Get Started
                </span>
                <ArrowRight className="relative w-7 h-7 transition-colors duration-300 group-hover:text-black" />
              </button>

              {/* Option 2: Link styled as button (alternative - uncomment to use instead)
              <Link
                href="/launch-projects"
                className="flex w-[269px] h-[70px] items-center justify-center gap-5 px-[30px] py-2.5 absolute top-72 left-0 rounded-[50px] border-2 border-solid border-white hover:bg-white hover:text-black transition-colors duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent group"
                aria-label="Get started with launching your project"
              >
                <span className="relative w-fit font-outfit font-normal text-white text-[21px] tracking-[0] leading-[27.3px] whitespace-nowrap group-hover:text-black transition-colors duration-300">
                  Get Started
                </span>
                <ArrowRight className="relative w-7 h-7 transition-colors duration-300 group-hover:text-black" />
              </Link>
              */}
            </div>
            
            {/* Right side - 3D Image */}
            <div className="absolute w-[306px] h-[361px] top-0 left-[652px] hidden lg:block">
              <Image
                src="/preview.png"
                alt="3D black chrome decorative shape element"
                fill
                className="object-cover"
                priority
              />
            </div>
            
          </div>
        </div>
      </div>
    </section>
  )
}