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
    <div className="flex items-center gap-3">
      <div
        aria-hidden
        className="flex h-8 w-8 items-center justify-center rounded-lg border bg-[#405084]/40 border-[#405084] text-[#ffffff]"
      >
        {icon}
      </div>
      <h3 className="text-[#ffffff] text-lg font-semibold">{title}</h3>
    </div>
  )
}

function Wordmark() {
  return (
    <div className="mb-4">
      <Image
        src='/CyreneAI_logo-text.png'
        alt='Cyrene AI'
        width={180}
        height={60}
        className='object-contain'
      />
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
              <p className="text-[#7282b6] leading-relaxed max-w-md">
                Decentralized Launchpad fueling Internet Capital Markets, where AI Agents empower cutting-edge projects with tokenized funding.
              </p>

              <div className="mt-10 flex items-center gap-6">
                <Link 
                  aria-label="Follow on X" 
                  href="https://x.com/CyreneAI" 
                  target="_blank"
                  className="text-[#ffffff] transition-opacity hover:opacity-80"
                >
                  <SiX size={28} />
                </Link>
                <Link
                  aria-label="Join us on Telegram"
                  href="https://t.me/CyreneAI"
                  target="_blank"
                  className="text-[#ffffff] transition-opacity hover:opacity-80"
                >
                  <SiTelegram size={28} />
                </Link>
                <Link
                  aria-label="Join our Discord"
                  href="https://discord.gg/qJ98QZ6EBx"
                  target="_blank"
                  className="text-[#ffffff] transition-opacity hover:opacity-80"
                >
                  <SiDiscord size={28} />
                </Link>
              </div>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-2">
              <SectionHeader icon={<Link2 className="h-4 w-4" />} title="Quick Links" />
              <ul className="mt-4 space-y-3">
                <li>
                  <Link 
                    href="https://docs.netsepio.com/latest/cyreneai" 
                    target="_blank"
                    className="text-[#ffffff] text-lg hover:underline underline-offset-4"
                  >
                    Docs
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div className="md:col-span-3">
              <SectionHeader icon={<BookOpen className="h-4 w-4" />} title="Resources" />
              <ul className="mt-4 space-y-3">
                <li>
                  <Link 
                    href="https://play.google.com/store/apps/details?id=com.erebrus.app" 
                    target="_blank"
                    className="text-[#ffffff] text-lg hover:underline underline-offset-4"
                  >
                    Erebrus Android
                  </Link>
                </li>
                <li>
                  <Link 
                    href="https://testflight.apple.com/join/BvdARC75" 
                    target="_blank"
                    className="text-[#ffffff] text-lg hover:underline underline-offset-4"
                  >
                    Erebrus iOS*
                  </Link>
                </li>
                <li>
                  <Link 
                    href="" 
                    className="text-[#ffffff] text-lg hover:underline underline-offset-4"
                  >
                    Browser Extension
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="md:col-span-2">
              <SectionHeader icon={<Mail className="h-4 w-4" />} title="Contact" />
              <div className="mt-4">
                <Link
                  href="mailto:support@cyreneai.com"
                  className="text-[#ffffff] text-lg hover:underline underline-offset-4"
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
            <p className="text-[#7282b6]">© 2025 CyreneAI. All rights reserved.</p>

            <div className="flex items-center gap-3 text-[#7282b6]">
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
              <Link href="/privacy" className="text-[#ffffff] hover:underline underline-offset-4">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-[#ffffff] hover:underline underline-offset-4">
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