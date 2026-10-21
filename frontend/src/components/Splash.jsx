import { useEffect, useState } from "react";
import { Mark } from "./Logo.jsx";

const WORD = "Copperleaf";

export default function Splash({ onDone }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const leave = setTimeout(() => setLeaving(true), 2300);
    return () => clearTimeout(leave);
  }, []);

  return (
    <div
      role="presentation"
      onClick={() => setLeaving(true)}
      onAnimationEnd={(e) => e.animationName === "splash-out" && onDone()}
      className={`grain fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-forest-900 text-paper ${leaving ? "splash-exit" : ""}`}
    >
      <div className="shine pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-copper-500/30 blur-3xl" />
      <div className="coin-stage relative">
        <div className="coin drop-shadow-[0_20px_40px_rgba(194,112,61,.45)]">
          <Mark className="h-28 w-28 sm:h-32 sm:w-32" />
        </div>
      </div>
      <h1 className="relative mt-8 font-display text-6xl tracking-tight sm:text-7xl" aria-label={WORD}>
        {WORD.split("").map((ch, i) => (
          <span key={i} className="splash-letter" style={{ animationDelay: `${0.9 + i * 0.05}s` }}>
            {ch}
          </span>
        ))}
      </h1>
      <p
        className="relative mt-3 animate-rise font-display text-xl italic text-copper-200"
        style={{ animationDelay: "1.5s" }}
      >
        Banking, minted fresh.
      </p>
      <p className="absolute bottom-8 animate-fade font-mono text-[10px] uppercase tracking-[0.3em] text-paper/40" style={{ animationDelay: "1.8s" }}>
        Educational simulation · tap to continue
      </p>
    </div>
  );
}
