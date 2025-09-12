"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import StarCanvas from "@/components/StarCanvas";
import { Github, Globe, FileText, Users, Lightbulb, Rocket, Wallet, Linkedin, Twitter, Github as GithubIcon, ArrowLeft, Heart, UserPlus } from "lucide-react";

// Read-only Investor View (Design-only)
// This page showcases a project's information and team in a clean, attractive layout.
// NOTE: No data fetching. All values are placeholders to demonstrate the structure and style.
export default function ProjectPreviewPage() {
  // UI demo state (design-only)
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(128);
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(542);

  const toggleLike = () => {
    setLiked((prev) => {
      const next = !prev;
      setLikesCount((c) => c + (next ? 1 : -1));
      return next;
    });
  };

  const toggleFollow = () => {
    setFollowing((prev) => {
      const next = !prev;
      setFollowersCount((c) => c + (next ? 1 : -1));
      return next;
    });
  };
  // Placeholder data (design only)
  const team = Array.from({ length: 6 }).map((_, i) => ({
    name: `Member ${i + 1}`,
    role: i === 0 ? "Founder & CEO" : i === 1 ? "CTO" : i === 2 ? "Lead Engineer" : "Contributor",
    wallet: "5Jf3...A9Zk3x1Qp",
    bio: "Experienced builder with a background in web3, AI, and distributed systems.",
    linkedin: "#",
    twitter: "#",
    github: "#",
  }));

  const isCooking = true; // toggle for stage badge demo

  return (
    <>
      {/* Background Image */}
      <div className="fixed inset-0 w-full h-full -z-20">
        <Image
          src="/abstract-luxury-gradient-blue-background-smooth-dark-blue-with-black-vignette-studio-banner 2 (1).png"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* CYRENE outline text */}
      <div className="absolute top-0 left-0 w-full overflow-hidden -z-10 pointer-events-none">
        <div className="w-[2661px] text-[370px] opacity-10 tracking-[24.96px] leading-[70%] font-moonhouse text-transparent text-left inline-block [-webkit-text-stroke:3px_#c8c8c8] [paint-order:stroke_fill] mix-blend-overlay">
          CYRENE
        </div>
      </div>

      <StarCanvas />

      <div className="min-h-screen text-white py-20 px-4 mt-24">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Back link */}
          <div className="flex items-center">
            <a href="/explore-projects" className="inline-flex items-center gap-2 bg-white text-black rounded-full px-5 py-2 hover:bg-gray-100 transition">
              <ArrowLeft className="w-4 h-4" />
              Back to Explore
            </a>
          </div>

          {/* Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Title + Meta */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <h1 className="text-4xl md:text-5xl font-bold">Project Orion</h1>
                <p className="text-gray-300 mt-3 max-w-3xl">
                  A next-gen autonomous AI agent platform enabling decentralized compute and incentive-aligned collaboration across the open internet.
                </p>
              </motion.div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-600/50 bg-gray-800/40 px-4 py-2 text-sm">
                  Category: <span className="font-medium text-white">AI Agents</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-600/50 bg-gray-800/40 px-4 py-2 text-sm">
                  Industry: <span className="font-medium text-white">Infrastructure</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-600/50 px-4 py-2 text-sm bg-white text-black">
                  {isCooking ? <Rocket className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
                  {isCooking ? "Cooking" : "Ideation"}
                </span>
              </div>

              {/* Links */}
              <div className="flex flex-wrap gap-3 pt-2">
                <a className="inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-2 hover:bg-gray-100 transition" href="#">
                  <Github className="w-4 h-4" /> GitHub
                </a>
                <a className="inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-2 hover:bg-gray-100 transition" href="#">
                  <Globe className="w-4 h-4" /> Website
                </a>
                <a className="inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-2 hover:bg-gray-100 transition" href="#">
                  <FileText className="w-4 h-4" /> Whitepaper
                </a>
              </div>

              {/* Engagement Stats */}
              <div className="flex items-center gap-3 pt-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-gray-600/50 bg-gray-800/40 px-4 py-2 text-sm">
                  <Heart className="w-4 h-4 text-rose-400" />
                  <span className="font-medium text-white">{likesCount.toLocaleString()} likes</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-gray-600/50 bg-gray-800/40 px-4 py-2 text-sm">
                  <Users className="w-4 h-4 text-blue-300" />
                  <span className="font-medium text-white">{followersCount.toLocaleString()} followers</span>
                </div>
              </div>
            </div>

            {/* Right: Hero image / poster */}
            <div className="lg:col-span-1">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-800/40 border border-gray-600/50">
                <Image
                  src="/Cyrene cover_85 2.png"
                  alt="Project cover"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* Glass Container */}
          <div className="relative">
            <div className="absolute inset-0 bg-[#434a6033] rounded-[32px] backdrop-blur-[30px]" />
            <div className="relative z-10 p-6 md:p-10 space-y-10">
              {/* Project Overview */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  <h2 className="text-2xl font-bold">Overview</h2>
                  <p className="text-gray-300 leading-relaxed">
                    Orion enables developers to launch, manage, and scale autonomous agents with built-in incentive mechanisms and transparent, tokenized economics. The platform prioritizes security, composability, and verifiable execution.
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    This is a design-only preview. Replace this content with real project information from the Project Information tab when wiring data.
                  </p>
                </div>

                {/* Snapshot */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Snapshot</h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center justify-between rounded-xl bg-gray-800/40 border border-gray-600/50 px-4 py-3">
                      <span className="text-gray-400">Project Name</span>
                      <span className="text-white font-medium">Project Orion</span>
                    </li>
                    <li className="flex items-center justify-between rounded-xl bg-gray-800/40 border border-gray-600/50 px-4 py-3">
                      <span className="text-gray-400">Category</span>
                      <span className="text-white font-medium">AI Agents</span>
                    </li>
                    <li className="flex items-center justify-between rounded-xl bg-gray-800/40 border border-gray-600/50 px-4 py-3">
                      <span className="text-gray-400">Industry</span>
                      <span className="text-white font-medium">Infrastructure</span>
                    </li>
                    <li className="flex items-center justify-between rounded-xl bg-gray-800/40 border border-gray-600/50 px-4 py-3">
                      <span className="text-gray-400">Stage</span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white text-black px-3 py-1 text-xs font-medium">
                        {isCooking ? <Rocket className="w-3 h-3" /> : <Lightbulb className="w-3 h-3" />}
                        {isCooking ? "Cooking" : "Ideation"}
                      </span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Divider */}
              <div className="border-t border-gray-600/60" />

              {/* Team Section */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <Users className="w-6 h-6 text-blue-400" />
                  <h2 className="text-2xl font-bold">Team</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {team.map((m, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.25, delay: idx * 0.03 }}
                      className="rounded-2xl bg-gray-800/40 border border-gray-600/50 p-5 flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-600/60" />
                          <div>
                            <div className="text-white font-semibold">{m.name}</div>
                            <div className="text-sm text-blue-300">{m.role}</div>
                          </div>
                        </div>
                        <div className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-700/60 border border-gray-600/50">
                          <Wallet className="w-3 h-3 text-gray-300" />
                          <span className="font-mono text-gray-300">{m.wallet}</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-300 leading-relaxed line-clamp-3">{m.bio}</p>

                      <div className="flex items-center gap-3 pt-1">
                        <a href={m.linkedin} className="text-blue-400 hover:text-blue-300" aria-label="LinkedIn">
                          <Linkedin className="w-4 h-4" />
                        </a>
                        <a href={m.twitter} className="text-blue-400 hover:text-blue-300" aria-label="Twitter">
                          <Twitter className="w-4 h-4" />
                        </a>
                        <a href={m.github} className="text-blue-400 hover:text-blue-300" aria-label="GitHub">
                          <GithubIcon className="w-4 h-4" />
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* CTA for investors (design only) */}
              <div className="pt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={toggleLike}
                    className={`inline-flex items-center gap-2 rounded-full px-6 py-3 transition font-medium ${liked ? 'bg-gray-200 text-black' : 'bg-white text-black hover:bg-gray-100'}`}
                    aria-pressed={liked}
                  >
                    <Heart className={`w-4 h-4 ${liked ? 'text-rose-600' : 'text-black'}`} fill={liked ? 'currentColor' : 'none'} />
                    {liked ? 'Liked' : 'Like'} · {likesCount.toLocaleString()}
                  </button>
                  <button
                    onClick={toggleFollow}
                    className={`inline-flex items-center gap-2 rounded-full px-6 py-3 transition font-medium ${following ? 'bg-gray-200 text-black' : 'bg-white text-black hover:bg-gray-100'}`}
                    aria-pressed={following}
                  >
                    <UserPlus className="w-4 h-4" />
                    {following ? 'Following' : 'Follow'} · {followersCount.toLocaleString()}
                  </button>
                  <button className="bg-white text-black rounded-full px-6 py-3 hover:bg-gray-100 transition font-medium">Contact Team</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
