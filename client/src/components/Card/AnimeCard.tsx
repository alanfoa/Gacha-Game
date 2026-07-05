import { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { loadCardImage, getCachedImage } from "../../utils/cardImage";

// ─── Types ──────────────────────────────────────────────────────────────────

export type Rarity = "COMUN" | "RARO" | "EPICO" | "LEGENDARIO";
export type El = "FUEGO" | "AGUA" | "TIERRA" | "VIENTO" | "LUZ" | "SOMBRA";

export interface Card {
  id: number;
  name: string;
  rarity: Rarity;
  element: El;
  atk: number;
  def: number;
  mag: number;
  spd: number;
  lck: number;
  imageId?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const R: Record<Rarity, { label: string; color: string; glow: string; dim: string }> = {
  COMUN:     { label: "COMÚN",     color: "#94a3b8", glow: "rgba(148,163,184,0.35)", dim: "#475569" },
  RARO:      { label: "RARO",      color: "#3b82f6", glow: "rgba(59,130,246,0.45)",  dim: "#1d4ed8" },
  EPICO:     { label: "ÉPICO",     color: "#a855f7", glow: "rgba(168,85,247,0.55)",  dim: "#7e22ce" },
  LEGENDARIO:{ label: "LEGENDARIO",color: "#f59e0b", glow: "rgba(245,158,11,0.65)",  dim: "#b45309" },
};

export const E: Record<El, { color: string; sec: string; icon: string; label: string; bg: string }> = {
  FUEGO:  { color: "#ef4444", sec: "#f97316", icon: "△", label: "FUEGO",  bg: "#450a0a" },
  AGUA:   { color: "#06b6d4", sec: "#3b82f6", icon: "◎", label: "AGUA",   bg: "#083344" },
  TIERRA: { color: "#84cc16", sec: "#ca8a04", icon: "◇", label: "TIERRA", bg: "#1a2e05" },
  VIENTO: { color: "#cbd5e1", sec: "#94a3b8", icon: "≋", label: "VIENTO", bg: "#0f172a" },
  LUZ:    { color: "#fde68a", sec: "#f59e0b", icon: "✦", label: "LUZ",    bg: "#2d1a00" },
  SOMBRA: { color: "#8b5cf6", sec: "#6d28d9", icon: "◐", label: "SOMBRA", bg: "#1a0533" },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

export function ElementArtwork({ el, uid }: { el: El; uid: string }) {
  const gid = `g${el}${uid}`;
  if (el === "FUEGO") return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <defs>
        <radialGradient id={gid} cx="50%" cy="75%" r="60%">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.7" />
          <stop offset="60%" stopColor="#ef4444" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill={`url(#${gid})`} />
      <path d="M100,158 C70,126 60,96 82,64 C87,88 94,76 100,52 C107,76 114,88 120,64 C140,96 130,126 100,158Z" fill="#f97316" opacity="0.55"/>
      <path d="M100,142 C82,118 76,100 90,80 C95,97 102,85 100,68 C104,85 112,97 116,80 C126,100 120,118 100,142Z" fill="#fed7aa" opacity="0.58"/>
      <path d="M100,122 C89,106 86,95 95,85 C98,97 103,90 100,80 C103,90 109,97 106,85 C115,95 112,106 100,122Z" fill="#fff" opacity="0.28"/>
    </svg>
  );
  if (el === "AGUA") return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <defs>
        <radialGradient id={gid} cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#083344" stopOpacity="0.1" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill={`url(#${gid})`} />
      {[1,2,3,4].map(i => <circle key={i} cx="100" cy="100" r={18*i} fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity={0.65/i}/>)}
      <path d="M100,52 C82,76 72,94 72,112 C72,132 85,145 100,145 C115,145 128,132 128,112 C128,94 118,76 100,52Z" fill="#06b6d4" opacity="0.62"/>
      <path d="M100,70 C88,90 82,104 82,116 C82,130 90,138 100,138 C110,138 118,130 118,116 C118,104 112,90 100,70Z" fill="#67e8f9" opacity="0.38"/>
    </svg>
  );
  if (el === "TIERRA") return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <defs>
        <radialGradient id={gid} cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#84cc16" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#1a2e05" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill={`url(#${gid})`} />
      <polygon points="100,44 136,64 136,104 100,124 64,104 64,64" fill="#84cc16" opacity="0.22" stroke="#84cc16" strokeWidth="1.5"/>
      <polygon points="100,62 124,76 124,104 100,118 76,104 76,76" fill="#a3e635" opacity="0.22" stroke="#a3e635" strokeWidth="1"/>
      <polygon points="100,78 116,88 116,104 100,114 84,104 84,88" fill="#bef264" opacity="0.38"/>
      <polygon points="100,90 108,95 108,107 100,112 92,107 92,95" fill="#d9f99d" opacity="0.48"/>
    </svg>
  );
  if (el === "VIENTO") return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <rect width="200" height="200" fill="none"/>
      {[0,72,144,216,288].map(a => (
        <line key={a} x1="100" y1="100" x2={100+74*Math.cos(a*Math.PI/180)} y2={100+74*Math.sin(a*Math.PI/180)} stroke="#cbd5e1" strokeWidth="0.8" opacity="0.2"/>
      ))}
      <path d="M100,55 C138,55 158,76 145,100 C132,124 100,114 100,100 C100,86 128,80 142,68 C155,57 140,44 118,55" fill="none" stroke="#e2e8f0" strokeWidth="2.2" opacity="0.52"/>
      <path d="M100,74 C128,74 144,90 136,106 C128,122 100,112 100,102 C100,92 122,88 133,78" fill="none" stroke="#f1f5f9" strokeWidth="1.6" opacity="0.38"/>
      <path d="M100,90 C116,90 126,99 120,108 C114,117 100,110 100,104" fill="none" stroke="#fff" strokeWidth="1.1" opacity="0.3"/>
      <circle cx="100" cy="100" r="5" fill="#e2e8f0" opacity="0.68"/>
    </svg>
  );
  if (el === "LUZ") return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <defs>
        <radialGradient id={gid} cx="50%" cy="50%" r="45%">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.85" />
          <stop offset="55%" stopColor="#f59e0b" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#78350f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill={`url(#${gid})`} />
      {Array.from({length:12},(_,i) => {
        const a=(i/12)*Math.PI*2, inner=20, outer=i%3===0?80:54;
        return <line key={i} x1={100+inner*Math.cos(a)} y1={100+inner*Math.sin(a)} x2={100+outer*Math.cos(a)} y2={100+outer*Math.sin(a)} stroke="#fde68a" strokeWidth={i%3===0?2.2:1.1} opacity={i%3===0?0.72:0.38}/>;
      })}
      <circle cx="100" cy="100" r="17" fill="#fef3c7" opacity="0.9"/>
      <circle cx="100" cy="100" r="10" fill="#fde68a"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <defs>
        <radialGradient id={gid} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#1a0533" stopOpacity="0.1" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill={`url(#${gid})`} />
      <circle cx="100" cy="100" r="50" fill="none" stroke="#8b5cf6" strokeWidth="1.2" opacity="0.32"/>
      <circle cx="100" cy="100" r="35" fill="#0d0020" opacity="0.9"/>
      <path d="M100,50 A50,50 0 0,1 150,100 A50,50 0 0,0 100,50" fill="#8b5cf6" opacity="0.42"/>
      {[0,60,120,180,240,300].map(a => (
        <line key={a} x1="100" y1="100" x2={100+60*Math.cos(a*Math.PI/180)} y2={100+60*Math.sin(a*Math.PI/180)} stroke="#8b5cf6" strokeWidth="1" opacity="0.17"/>
      ))}
    </svg>
  );
}

export function StatBar({ label, value, color, delay = 0 }: { label: string; value: number; color: string; delay?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-7 text-right font-mono font-bold flex-shrink-0" style={{ fontSize: 9, color, letterSpacing: 0.5 }}>{label}</span>
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 4, background: "rgba(255,255,255,0.08)" }}>
        <motion.div className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, delay, ease: "easeOut" }}
        />
      </div>
      <span className="font-mono flex-shrink-0" style={{ fontSize: 9, color: "rgba(255,255,255,0.55)", width: 20, textAlign: "right" }}>{value}</span>
    </div>
  );
}

export function AnimeCard({ card, onClick, dimmed, size = "md" }: {
  card: Card;
  onClick?: () => void;
  dimmed?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const uid = useRef(Math.random().toString(36).slice(2)).current;
  const rar = R[card.rarity];
  const el = E[card.element];
  const isLeg = card.rarity === "LEGENDARIO";
  const isEpic = card.rarity === "EPICO";
  const [img, setImg] = useState<HTMLImageElement | null>(() => {
    if (!card.imageId) return null;
    return getCachedImage(card.imageId) ?? null;
  });

  useEffect(() => {
    if (!card.imageId || img) return;
    let cancelled = false;
    loadCardImage(card.imageId).then((loaded) => {
      if (!cancelled && loaded) setImg(loaded);
    });
    return () => { cancelled = true; };
  }, [card.imageId, img]);

  const S = size === "sm" ? 0.6 : size === "lg" ? 1.36 : 1;
  const w = 190 * S;
  const h = 292 * S;
  const innerScale = S;

  return (
    <div onClick={onClick} className="relative flex-shrink-0 cursor-pointer select-none" style={{
      width: w, height: h, borderRadius: 10 * S, overflow: "hidden",
      border: `${1.5 * S}px solid ${rar.color}${isLeg ? "88" : "44"}`,
      boxShadow: `0 0 ${(isLeg ? 36 : isEpic ? 22 : 12) * S}px ${rar.glow}, 0 ${14 * S}px ${32 * S}px rgba(0,0,0,0.72)`,
      opacity: dimmed ? 0.45 : 1, background: el.bg,
      transition: "opacity 0.4s",
    }}>
      <div className="relative" style={{ transform: `scale(${innerScale})`, transformOrigin: "top left", width: 190, height: 292 }}>
        {/* Full background image */}
        {img ? (
          <div className="absolute inset-0" style={{
            backgroundImage: `url(${img.src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}>
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)" }}/>
          </div>
        ) : (
          <div className="absolute inset-0">
            <ElementArtwork el={card.element} uid={uid}/>
          </div>
        )}

        {/* Floating badges (top bar with dark bg) */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between" style={{ height: 26, background: "rgba(0,0,0,0.55)", zIndex: 10 }}>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: el.color + "22", border: `1px solid ${el.color}55` }}>
            <span style={{ fontSize: 9, color: el.color }}>{el.icon}</span>
            <span style={{ fontSize: 8, color: el.color, fontFamily: "Rajdhani, sans-serif", fontWeight: 700, letterSpacing: 0.5 }}>{el.label}</span>
          </div>
          <div className="pl-1.5 pr-2.5 py-0.5 rounded" style={{ background: rar.dim + "cc" }}>
            <span style={{ fontSize: 7.5, color: rar.color, fontFamily: "Rajdhani, sans-serif", fontWeight: 800, letterSpacing: 0.5 }}>{rar.label}</span>
          </div>
        </div>

        {/* Info panel (bottom 45%) */}
        <div className="absolute left-0 right-0 bottom-0 flex flex-col gap-1.5" style={{
          top: "55%", zIndex: 10, padding: 10,
          background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.92) 22%, rgba(0,0,0,0.97) 100%)",
        }}>
          <div className="font-black leading-none mb-0.5" style={{
            fontFamily: "Rajdhani, sans-serif", fontSize: 13.5, color: "#fff",
            textShadow: `0 0 14px ${rar.color}99`, letterSpacing: 1,
          }}>
            {card.name.toUpperCase()}
          </div>
          <StatBar label="ATK" value={card.atk} color="#f87171" delay={0.1}/>
          <StatBar label="DEF" value={card.def} color="#60a5fa" delay={0.15}/>
          <StatBar label="MAG" value={card.mag} color="#c084fc" delay={0.2}/>
          <StatBar label="SPD" value={card.spd} color="#22d3ee" delay={0.25}/>
          <StatBar label="LCK" value={card.lck} color="#fcd34d" delay={0.3}/>
        </div>

        {/* Holographic shimmer */}
        {(isEpic || isLeg) && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 20 }}>
            <div style={{
              position: "absolute", top: 0, left: "-100%", width: "55%", height: "100%",
              background: `linear-gradient(105deg, transparent, ${isLeg ? "rgba(255,210,80,0.15)" : "rgba(210,150,255,0.12)"}, transparent)`,
              animation: "shimmer 3.2s ease-in-out infinite",
            }}/>
          </div>
        )}

        {/* Inner rim glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          zIndex: 20,
          boxShadow: `inset 0 0 ${isLeg ? 22 : 10}px ${rar.color}${isLeg ? "28" : "15"}`,
        }}/>
      </div>
    </div>
  );
}
