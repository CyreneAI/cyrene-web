'use client'
import Image from 'next/image';
import Link from 'next/link';
import type React from "react"
import { Link2, BookOpen, Mail } from "lucide-react"
import { SiX, SiTelegram, SiDiscord } from "react-icons/si"

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode
  title: string
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div
        aria-hidden
        className="flex h-8 w-8 items-center justify-center rounded-lg border bg-[#405084]/40 border-[#405084] text-[#ffffff]"
      >
        {icon}
      </div>
      <h3 className="text-[#ffffff] text-lg font-outfit font-semibold">{title}</h3>
    </div>
  )
}

function Wordmark() {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-3">
        <Image
          src='/CyreneAI_logo_square.png'
          alt='Cyrene AI Logo'
          width={40}
          height={40}
          className='object-contain'
        />
        <div className="flex">
          <span
            style={{ fontFamily: '"Moonhouse", var(--font-sans, ui-sans-serif)' }}
            className="uppercase tracking-[0.4em] font-semibold leading-none select-none"
          >
            <span className="text-[#ffffff]">CYRENE</span><span className="text-[#4D84EE]">AI</span>
          </span>
        </div>
      </div>
    </div>
  )
}

const Footer = () => {
  return (
    <footer className='relative '>
      {/* Background Image with Gradient Overlay */}


      {/* Content */}
      <div className='relative container mx-auto px-6 py-12'>
        <div className="mx-auto max-w-7xl rounded-3xl bg-[#1c2c66]/90 backdrop-blur-sm border border-[#405084]/30 px-6 py-12 md:px-10 md:py-16">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
            {/* Brand + Description */}
            <div className="md:col-span-5">
              <Wordmark />
              <p className="text-[#7282b6] leading-relaxed max-w-md font-outfit text-base">
                Decentralized Launchpad fueling Internet Capital Markets, where AI Agents empower cutting-edge projects with tokenized funding.
              </p>

              <div className="mt-10 flex items-center gap-6">
                <Link 
                  aria-label="Follow on X" 
                  href="https://x.com/CyreneAI" 
                  target="_blank"
                  className="text-[#ffffff] transition-all duration-300 hover:opacity-80 hover:scale-110"
                >
                  <SiX size={28} />
                </Link>
                <Link
                  aria-label="Join us on Telegram"
                  href="https://t.me/CyreneAI"
                  target="_blank"
                  className="text-[#ffffff] transition-all duration-300 hover:opacity-80 hover:scale-110"
                >
                  <SiTelegram size={28} />
                </Link>
                <Link
                  aria-label="Join our Discord"
                  href="https://discord.gg/qJ98QZ6EBx"
                  target="_blank"
                  className="text-[#ffffff] transition-all duration-300 hover:opacity-80 hover:scale-110"
                >
                  <SiDiscord size={28} />
                </Link>
              </div>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-2">
              <SectionHeader icon={<Link2 className="h-4 w-4" />} title="Quick Links" />
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="https://docs.netsepio.com/latest/cyreneai" 
                    target="_blank"
                    className="text-[#ffffff] font-outfit text-base hover:text-[#7282b6] transition-colors duration-300 hover:underline underline-offset-4"
                  >
                    Docs
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div className="md:col-span-3">
              <SectionHeader icon={<BookOpen className="h-4 w-4" />} title="Resources" />
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="https://play.google.com/store/apps/details?id=com.erebrus.app" 
                    target="_blank"
                    className="text-[#ffffff] font-outfit text-base hover:text-[#7282b6] transition-colors duration-300 hover:underline underline-offset-4"
                  >
                    Erebrus Android
                  </Link>
                </li>
                <li>
                  <Link 
                    href="https://testflight.apple.com/join/BvdARC75" 
                    target="_blank"
                    className="text-[#ffffff] font-outfit text-base hover:text-[#7282b6] transition-colors duration-300 hover:underline underline-offset-4"
                  >
                    Erebrus iOS*
                  </Link>
                </li>
                <li>
                  <Link 
                    href="https://chromewebstore.google.com/detail/netsepio/bbkfclgnbddljhepbfpongcollhocghd?pli=1" 
                    target="_blank"
                    className="text-[#ffffff] font-outfit text-base hover:text-[#7282b6] transition-colors duration-300 hover:underline underline-offset-4"
                  >
                    Browser Extension
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="md:col-span-2">
              <SectionHeader icon={<Mail className="h-4 w-4" />} title="Contact" />
              <div>
                <Link
                  href="mailto:support@cyreneai.com"
                  className="text-[#ffffff] font-outfit text-base hover:text-[#7282b6] transition-colors duration-300 hover:underline underline-offset-4"
                >
                  support@cyreneai.com
                </Link>
              </div>
            </div>
          </div>

          {/* Divider */}
          <hr className="my-10 border-t border-[#405084]" />

          {/* Bottom bar */}
          <div className="flex flex-col items-center justify-between gap-6 text-[#ffffff] md:flex-row">
            <p className="text-[#7282b6] font-outfit text-sm">© 2025 CyreneAI. All rights reserved.</p>

            <div className="flex items-center gap-3 text-[#7282b6] font-outfit text-sm">
              <span>Powered by</span>
              <Link href='https://netsepio.com' target='_blank' rel='noopener noreferrer'>
                <Image
                  src='/Netsepio_logo_white_with_text 3.png'
                  alt='NetSepio'
                  width={100}
                  height={25}
                  className='object-contain hover:opacity-100 transition-opacity'
                />
              </Link>
            </div>

            <div className="flex items-center gap-8">
              <Link href="/privacy" className="text-[#ffffff] font-outfit text-sm hover:text-[#7282b6] transition-colors duration-300 hover:underline underline-offset-4">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-[#ffffff] font-outfit text-sm hover:text-[#7282b6] transition-colors duration-300 hover:underline underline-offset-4">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;