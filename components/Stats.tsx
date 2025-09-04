import PatternPanel from "./PatternPanel"

export default function Stats() {
  return (
    <main className="                <h3 className="text-white text-lg md:text-xl font-outfit font-[400] mb-2">Universal Scalability Layer</h3>
                <p className="mt-2 text-[#8B8B8B] text-sm leading-relaxed max-w-[42ch]">
                  Cross-chain, adaptive, and seamlessly integrative.
                </p>h-screen  flex items-center justify-center p-6 font-outfit">
      <div className="w-full max-w-6xl">
        <div className="w-full relative backdrop-blur-sm rounded-[31.5px] bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 border border-slate-700/30 h-[851.5px]">
          {/* Panel padding to create the thick inner margin seen in the mock */}
          <div className="absolute inset-0 p-6 sm:p-8 md:p-10 lg:p-12 z-[1]">
            <div
              className="grid h-full gap-4 sm:gap-5 md:gap-6 text-slate-900"
              style={{
                gridTemplateColumns: "1fr 1fr 1fr",
                // Row heights tuned to the reference proportions
                gridTemplateRows: "220px 240px 220px",
              }}
            >
              {/* Left tall card (dark) spans two rows */}
              <div
                className="bg-gradient-to-br from-slate-800/90 via-slate-900/95 to-black/90 backdrop-blur-sm border border-slate-700/40 rounded-[20px] md:rounded-[22px] p-6 sm:p-7 md:p-8 flex flex-col relative overflow-hidden shadow-2xl"
                style={{ gridColumn: "1 / span 1", gridRow: "1 / span 2" }}
              >
                <img
                  src="/Cube_Hollow_Shape.webp"
                  alt="Self-Replicating AI icon"
                  className="absolute left-6 top-6 md:left-8 md:top-8 w-24 sm:w-28 md:w-32 h-auto object-contain pointer-events-none select-none opacity-80"
                />
                <div className="mt-auto">
                  <h3 className="text-white text-lg font-outfit font-bold md:text-4xl mb-3 uppercase">AI Agents, Your Launch Partners</h3>
                  <p className="mt-2 text-slate-300/90 leading-relaxed max-w-[34ch] text-base md:text-xl">
                    Fundraise, iterate, and build long-term aligned projects with the power of AI Agents.
                  </p>
                </div>
              </div>

              {/* Top middle card (light) */}
              <div
                className="bg-gradient-to-br from-slate-700/70 via-slate-600/80 to-slate-700/70 backdrop-blur-sm border border-slate-500/30 rounded-[20px] md:rounded-[22px] p-6 sm:p-7 md:p-8 pt-20 md:pt-24 relative overflow-hidden shadow-lg"
                style={{ gridColumn: "2 / span 1", gridRow: "1 / span 1" }}
              >
                <img
                  src="/Round_Abstract_Shape.webp"
                  alt="Hyper Coherent Network icon"
                  className="absolute left-6 top-6 md:left-8 md:top-8 w-12 sm:w-14 md:w-16 h-auto object-contain pointer-events-none select-none opacity-90"
                />
                <h3 className="text-white text-lg md:text-xl font-outfit font-bold mb-2 uppercase">Authentic Communities</h3>
                <p className="mt-2 text-slate-200/80 text-sm leading-relaxed max-w-[40ch]">
                  Grow and engage with communities that share your vision and values.
                </p>
              </div>

              {/* Top right card (light) */}
              <div
                className="bg-gradient-to-br from-slate-700/70 via-slate-600/80 to-slate-700/70 backdrop-blur-sm border border-slate-500/30 rounded-[20px] md:rounded-[22px] p-6 sm:p-7 md:p-8 pt-20 md:pt-24 relative overflow-hidden shadow-lg"
                style={{ gridColumn: "3 / span 1", gridRow: "1 / span 1" }}
              >
                <img
                  src="/Cube_Hollow_Shape.webp"
                  alt="Unstoppable Ecosystem icon"
                  className="absolute left-6 top-6 md:left-8 md:top-8 w-12 sm:w-14 md:w-16 h-auto object-contain pointer-events-none select-none opacity-90"
                />
                <h3 className="text-white text-lg md:text-xl font-outfit font-bold mb-2 uppercase">Internet Capital Markets</h3>
                <p className="mt-2 text-slate-200/80 text-sm leading-relaxed max-w-[40ch]">
                  A new financial frontier where projects and ideas are funded, traded, and scaled globally.
                </p>
              </div>

              {/* Middle wide card (light) spans two columns */}
              <div
                className="bg-gradient-to-br from-slate-700/70 via-slate-600/80 to-slate-700/70 backdrop-blur-sm border border-slate-500/30 rounded-[20px] md:rounded-[22px] p-6 sm:p-7 md:p-8 pt-20 md:pt-24 relative overflow-hidden shadow-lg"
                style={{ gridColumn: "2 / span 2", gridRow: "2 / span 1" }}
              >
                <img
                  src="/Star_Mixer_Abstract_Shape.webp"
                  alt="Decentralized Infrastructure icon"
                  className="absolute left-6 top-6 md:left-8 md:top-8 w-12 sm:w-14 md:w-18 h-auto object-contain pointer-events-none select-none opacity-90"
                />
                <h3 className="text-white text-lg md:text-xl font-outfit font-bold mb-2">Decentralized Infrastructure</h3>
                <p className="mt-2 text-slate-200/80 text-sm leading-relaxed max-w-[60ch]">
                  AI agents and MCP servers are hosted on Erebrus DVPN Nodes for secure and verifiable execution.
                </p>
              </div>

              {/* Bottom wide card (light) spans two columns */}
              <div
                className="bg-gradient-to-br from-slate-700/70 via-slate-600/80 to-slate-700/70 backdrop-blur-sm border border-slate-500/30 rounded-[20px] md:rounded-[22px] p-6 sm:p-7 md:p-8 pt-20 md:pt-24 flex flex-col justify-end relative overflow-hidden shadow-lg"
                style={{ gridColumn: "1 / span 2", gridRow: "3 / span 1" }}
              >
                <img
                  src="/Plus_Abstract_Shape2.webp"
                  alt="Towards Digital, Agentic Future icon"
                  className="absolute left-6 top-6 md:left-8 md:top-8 w-12 sm:w-14 md:w-18 h-auto object-contain pointer-events-none select-none opacity-90"
                />
                <h3 className="text-white text-lg md:text-xl font-outfit font-bold mb-2 uppercase">Towards Digital, Agentic Future</h3>
                <p className="mt-2 text-slate-200/80 text-sm leading-relaxed max-w-[70ch]">
                  Multi-agent platform and AI coordination layer on NetSepio&apos;s secure and decentralized network.
                </p>
              </div>

              {/* Bottom-right small card (dark) */}
              <div
                className="bg-gradient-to-br from-slate-800/90 via-slate-900/95 to-black/90 backdrop-blur-sm border border-slate-700/40 rounded-[20px] md:rounded-[22px] p-6 sm:p-7 md:p-8 pt-20 md:pt-24 flex flex-col justify-end relative overflow-hidden shadow-2xl"
                style={{ gridColumn: "3 / span 1", gridRow: "3 / span 1" }}
              >
                <img
                  src="/Star_Mixer_Abstract_Shape.webp"
                  alt="Universal Scalability Layer icon"
                  className="absolute left-6 top-6 md:left-8 md:top-8 w-12 sm:w-16 md:w-20 h-auto object-contain pointer-events-none select-none opacity-80"
                />
                <h3 className="text-white text-lg md:text-xl font-outfit mb-2">Universal Scalability Layer</h3>
                <p className="mt-2 text-slate-300/90 text-sm leading-relaxed max-w-[42ch]">
                  Cross-chain, adaptive, and seamlessly integrative.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}