export default function PatternPanel() {
    return (
      <div
        aria-hidden="true"
        className="relative w-full aspect-[14/10] rounded-[28px] overflow-hidden"
        style={{
          // Base navy background from the screenshot
          backgroundColor: "#1f2433",
          // Subtle tiled pattern via layered repeating conic gradients
          backgroundImage: [
            // primary checker layer (very faint)
            "repeating-conic-gradient(rgba(255,255,255,0.022) 0% 25%, transparent 0% 50%)",
            // offset layer to avoid a rigid grid feel
            "repeating-conic-gradient(rgba(255,255,255,0.016) 0% 25%, transparent 0% 50%)",
            // minute color lift to match the cool tone in tiles
            "repeating-linear-gradient(0deg, rgba(39,48,73,0.04) 0 1px, transparent 1px 128px)",
          ].join(", "),
          backgroundSize: "128px 128px, 128px 128px, 128px 128px",
          backgroundPosition: "0 0, 64px 64px, 0 0",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: [
              // subtle center lift from top to center
              "radial-gradient(120% 80% at 50% -20%, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0) 60%)",
              // general edge darkening
              "radial-gradient(120% 120% at 50% 110%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 60%)",
            ].join(", "),
          }}
        />
        {/* ultra-subtle inner border to mimic polished edge */}
        <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-white/5" />
      </div>
    )
  }