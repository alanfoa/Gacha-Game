import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

// ─── Types ──────────────────────────────────────────────────────────────────

type Screen = "shop" | "anticipation" | "opening" | "results" | "detail";
type Rarity = "COMUN" | "RARO" | "EPICO" | "LEGENDARIO";
type El = "FUEGO" | "AGUA" | "TIERRA" | "VIENTO" | "LUZ" | "SOMBRA";

interface Pack { id: string; name: string; count: number; price: number; rarity: Rarity; }
interface Card { id: number; name: string; rarity: Rarity; element: El; atk: number; def: number; mag: number; spd: number; lck: number; }

// ─── Constants ───────────────────────────────────────────────────────────────

const PACKS: Pack[] = [
  { id: "basico",     name: "BÁSICO",     count: 1, price: 100,  rarity: "COMUN"     },
  { id: "deluxe",     name: "DELUXE",     count: 3, price: 300,  rarity: "RARO"      },
  { id: "premium",    name: "PREMIUM",    count: 5, price: 600,  rarity: "EPICO"     },
  { id: "legendario", name: "LEGENDARIO", count: 7, price: 1000, rarity: "LEGENDARIO"},
];

const CARDS: Card[] = [
  { id: 1, name: "Ryuken Kage",      rarity: "LEGENDARIO", element: "FUEGO",  atk: 98, def: 45, mag: 72, spd: 88, lck: 65 },
  { id: 2, name: "Mira Celestia",    rarity: "EPICO",      element: "LUZ",    atk: 55, def: 70, mag: 95, spd: 62, lck: 78 },
  { id: 3, name: "Zeth Ironbane",    rarity: "RARO",       element: "TIERRA", atk: 75, def: 88, mag: 30, spd: 45, lck: 55 },
  { id: 4, name: "Nyx Shadowborn",   rarity: "RARO",       element: "SOMBRA", atk: 70, def: 50, mag: 80, spd: 75, lck: 40 },
  { id: 5, name: "Aqua Seraphim",    rarity: "COMUN",      element: "AGUA",   atk: 40, def: 60, mag: 55, spd: 70, lck: 50 },
  { id: 6, name: "Stormcaller Vex",  rarity: "EPICO",      element: "VIENTO", atk: 65, def: 42, mag: 85, spd: 92, lck: 60 },
  { id: 7, name: "Terra Golem",      rarity: "COMUN",      element: "TIERRA", atk: 55, def: 95, mag: 20, spd: 25, lck: 45 },
];

const R: Record<Rarity, { label: string; color: string; glow: string; dim: string }> = {
  COMUN:     { label: "COMÚN",     color: "#94a3b8", glow: "rgba(148,163,184,0.35)", dim: "#475569" },
  RARO:      { label: "RARO",      color: "#3b82f6", glow: "rgba(59,130,246,0.45)",  dim: "#1d4ed8" },
  EPICO:     { label: "ÉPICO",     color: "#a855f7", glow: "rgba(168,85,247,0.55)",  dim: "#7e22ce" },
  LEGENDARIO:{ label: "LEGENDARIO",color: "#f59e0b", glow: "rgba(245,158,11,0.65)",  dim: "#b45309" },
};

const E: Record<El, { color: string; sec: string; icon: string; label: string; bg: string }> = {
  FUEGO:  { color: "#ef4444", sec: "#f97316", icon: "△", label: "FUEGO",  bg: "#450a0a" },
  AGUA:   { color: "#06b6d4", sec: "#3b82f6", icon: "◎", label: "AGUA",   bg: "#083344" },
  TIERRA: { color: "#84cc16", sec: "#ca8a04", icon: "◇", label: "TIERRA", bg: "#1a2e05" },
  VIENTO: { color: "#cbd5e1", sec: "#94a3b8", icon: "≋", label: "VIENTO", bg: "#0f172a" },
  LUZ:    { color: "#fde68a", sec: "#f59e0b", icon: "✦", label: "LUZ",    bg: "#2d1a00" },
  SOMBRA: { color: "#8b5cf6", sec: "#6d28d9", icon: "◐", label: "SOMBRA", bg: "#1a0533" },
};

const BURST_COLORS: Record<Rarity, string[]> = {
  COMUN:     ["#94a3b8","#e2e8f0","#ffffff"],
  RARO:      ["#3b82f6","#60a5fa","#dbeafe","#ffffff"],
  EPICO:     ["#a855f7","#c084fc","#ede9fe","#ffffff","#d946ef"],
  LEGENDARIO:["#f59e0b","#fbbf24","#ef4444","#fde68a","#ffffff","#f97316"],
};

// Pre-computed fan positions for 1-7 cards
const CARD_FAN: Array<Array<{ r: number; x: number; y: number }>> = [
  [{ r: 0, x: 0, y: 0 }],
  [{ r: -10, x: -44, y: 8 }, { r: 10, x: 44, y: 8 }],
  [{ r: -12, x: -70, y: 14 }, { r: 0, x: 0, y: 0 }, { r: 12, x: 70, y: 14 }],
  [{ r: -15, x: -88, y: 18 }, { r: -5, x: -28, y: 4 }, { r: 5, x: 28, y: 4 }, { r: 15, x: 88, y: 18 }],
  [{ r: -16, x: -105, y: 22 }, { r: -8, x: -52, y: 8 }, { r: 0, x: 0, y: 0 }, { r: 8, x: 52, y: 8 }, { r: 16, x: 105, y: 22 }],
  [{ r: -18, x: -118, y: 26 }, { r: -10, x: -70, y: 12 }, { r: -3, x: -24, y: 2 }, { r: 3, x: 24, y: 2 }, { r: 10, x: 70, y: 12 }, { r: 18, x: 118, y: 26 }],
  [{ r: -20, x: -130, y: 30 }, { r: -13, x: -84, y: 16 }, { r: -6, x: -38, y: 5 }, { r: 0, x: 0, y: 0 }, { r: 6, x: 38, y: 5 }, { r: 13, x: 84, y: 16 }, { r: 20, x: 130, y: 30 }],
];

const ASYMMETRY = [2.5, -3, 1, -2, 4, -1.5, 3];

// ─── Sub-components ──────────────────────────────────────────────────────────

function ElementArtwork({ el, uid }: { el: El; uid: string }) {
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
  // SOMBRA
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

function StatBar({ label, value, color, delay = 0 }: { label: string; value: number; color: string; delay?: number }) {
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

function AnimeCard({ card, onClick, dimmed }: { card: Card; onClick?: () => void; dimmed?: boolean }) {
  const uid = useRef(Math.random().toString(36).slice(2)).current;
  const rar = R[card.rarity];
  const el = E[card.element];
  const isLeg = card.rarity === "LEGENDARIO";
  const isEpic = card.rarity === "EPICO";

  return (
    <div onClick={onClick} className="relative flex-shrink-0 cursor-pointer select-none" style={{
      width: 190, height: 292, borderRadius: 10, overflow: "hidden",
      border: `1.5px solid ${rar.color}${isLeg ? "88" : "44"}`,
      boxShadow: `0 0 ${isLeg ? 36 : isEpic ? 22 : 12}px ${rar.glow}, 0 14px 32px rgba(0,0,0,0.72)`,
      opacity: dimmed ? 0.45 : 1, background: el.bg,
      transition: "opacity 0.4s",
    }}>
      {/* Art area */}
      <div className="absolute top-0 left-0 right-0" style={{ height: "55%" }}>
        <ElementArtwork el={card.element} uid={uid}/>
        <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)" }}/>
      </div>

      {/* Element + Rarity badges */}
      <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-10">
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: el.color + "22", border: `1px solid ${el.color}55` }}>
          <span style={{ fontSize: 9, color: el.color }}>{el.icon}</span>
          <span style={{ fontSize: 8, color: el.color, fontFamily: "Rajdhani, sans-serif", fontWeight: 700, letterSpacing: 0.5 }}>{el.label}</span>
        </div>
        <div className="px-1.5 py-0.5 rounded" style={{ background: rar.dim + "cc" }}>
          <span style={{ fontSize: 7.5, color: rar.color, fontFamily: "Rajdhani, sans-serif", fontWeight: 800, letterSpacing: 0.5 }}>{rar.label}</span>
        </div>
      </div>

      {/* Info panel */}
      <div className="absolute left-0 right-0 bottom-0 p-2.5 flex flex-col gap-1.5" style={{
        top: "55%",
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
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ borderRadius: 10 }}>
          <div style={{
            position: "absolute", top: 0, left: "-100%", width: "55%", height: "100%",
            background: `linear-gradient(105deg, transparent, ${isLeg ? "rgba(255,210,80,0.15)" : "rgba(210,150,255,0.12)"}, transparent)`,
            animation: "shimmer 3.2s ease-in-out infinite",
          }}/>
        </div>
      )}

      {/* Inner rim glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        borderRadius: 10,
        boxShadow: `inset 0 0 ${isLeg ? 22 : 10}px ${rar.color}${isLeg ? "28" : "15"}`,
      }}/>
    </div>
  );
}

function PackEnvelope({ pack, size = "md" }: { pack: Pack; size?: "sm" | "md" | "lg" }) {
  const rar = R[pack.rarity];
  const sz = { sm: { w: 72, h: 104, f: 7.5, glyph: 16 }, md: { w: 112, h: 160, f: 9.5, glyph: 24 }, lg: { w: 172, h: 248, f: 13, glyph: 36 } }[size];
  const PACK_BG = { COMUN:"#0e1522", RARO:"#0c1a30", EPICO:"#160825", LEGENDARIO:"#1c0a02" }[pack.rarity];
  const GLYPH = { COMUN:"◇", RARO:"◆", EPICO:"◈", LEGENDARIO:"⚜" }[pack.rarity];
  const silCount = Math.min(pack.count, 6);

  return (
    <div className="relative flex items-center justify-center" style={{ width: sz.w + 52, height: sz.h + 32 }}>
      {/* Stacked silhouettes */}
      {Array.from({ length: silCount }, (_, i) => (
        <div key={i} className="absolute rounded" style={{
          width: sz.w - 10, height: sz.h - 14,
          background: PACK_BG,
          border: `1px solid ${rar.color}18`,
          transform: `rotate(${(i - silCount / 2) * 7}deg) translateX(${(i - silCount / 2) * 5}px)`,
          zIndex: i, opacity: 0.4 + i * 0.08,
        }}/>
      ))}

      {/* Main pack */}
      <div className="relative z-10 flex flex-col items-center justify-between overflow-hidden" style={{
        width: sz.w, height: sz.h, borderRadius: 8,
        background: `linear-gradient(148deg, ${PACK_BG} 0%, #050510 100%)`,
        border: `1.5px solid ${rar.color}44`,
        boxShadow: `0 0 28px ${rar.glow}, 0 8px 28px rgba(0,0,0,0.65)`,
        padding: sz.f * 1.1,
      }}>
        <div className="flex flex-col items-center gap-0.5 w-full">
          <div style={{ fontFamily: "Rajdhani, sans-serif", color: rar.color, fontSize: sz.f - 1, fontWeight: 800, letterSpacing: 1.5 }}>ANIME·CLASH</div>
          <div style={{ width: "100%", height: 1, background: `linear-gradient(90deg, transparent, ${rar.color}55, transparent)` }}/>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div style={{ fontSize: sz.glyph, color: rar.color, opacity: 0.72, lineHeight: 1 }}>{GLYPH}</div>
          <div style={{ fontFamily: "Rajdhani, sans-serif", color: rar.color, fontSize: sz.f, fontWeight: 800, letterSpacing: 2 }}>{pack.name}</div>
        </div>

        <div className="flex gap-0.5 items-center">
          {Array.from({ length: pack.count }, (_, i) => (
            <div key={i} className="rounded-sm" style={{ width: Math.max(sz.f * 0.55, 4), height: Math.max(sz.f * 0.8, 6), background: rar.color, opacity: 0.62 }}/>
          ))}
        </div>

        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(255,255,255,0.018) 4px, rgba(255,255,255,0.018) 5px)" }}/>
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 50%, ${rar.color}10 0%, transparent 68%)` }}/>
      </div>
    </div>
  );
}

// ─── Screens ─────────────────────────────────────────────────────────────────

function ShopScreen({ onSelect }: { onSelect: (p: Pack) => void }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeIdxRef = useRef(0);
  const activePack   = PACKS[activeIdx];
  const activeRar    = R[activePack.rarity];

  const PACK_SUBTITLES: Record<string, string> = {
    basico:     "Una carta del pool completo",
    deluxe:     "3 cartas · garantía 1 RARO",
    premium:    "5 cartas · garantía 1 ÉPICO",
    legendario: "7 cartas · 1 LEGENDARIO asegurado",
  };

  useEffect(() => { activeIdxRef.current = activeIdx; }, [activeIdx]);

  const navigate = useCallback((delta: -1 | 1) => {
    setActiveIdx(prev => {
      const next = prev + delta;
      return next < 0 || next >= PACKS.length ? prev : next;
    });
  }, []);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowLeft","ArrowRight","Enter"," "].includes(e.key)) e.preventDefault();
      if (e.key === "ArrowLeft"  || e.key === "a") navigate(-1);
      if (e.key === "ArrowRight" || e.key === "d") navigate(1);
      if (e.key === "Enter" || e.key === " ") onSelect(PACKS[activeIdxRef.current]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, onSelect]);

  // ── Gamepad ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let rafId: number;
    let lastMoveAt = 0;
    const COOLDOWN = 220;
    const poll = (t: number) => {
      const gps = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const gp of gps) {
        if (!gp) continue;
        const left  = gp.buttons[14]?.pressed || (gp.axes[0] ?? 0) < -0.5;
        const right = gp.buttons[15]?.pressed || (gp.axes[0] ?? 0) >  0.5;
        if ((left || right) && t - lastMoveAt > COOLDOWN) {
          navigate(left ? -1 : 1);
          lastMoveAt = t;
        }
        if (gp.buttons[0]?.pressed) onSelect(PACKS[activeIdxRef.current]);
      }
      rafId = requestAnimationFrame(poll);
    };
    rafId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(rafId);
  }, [navigate, onSelect]);

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden" style={{ background: "linear-gradient(158deg, #06060f 0%, #0c0720 100%)" }}>

      {/* Ambient glow — color shifts with the focused pack's rarity */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: 1 }}
        style={{ background: `radial-gradient(ellipse at 50% 68%, ${activeRar.color}0d 0%, transparent 60%)` }}
        key={activeIdx}
        initial={{ opacity: 0 }}
        transition={{ duration: 0.55, ease: "easeInOut" }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(124,58,237,0.18)" }}>
        <div>
          <div className="font-black text-2xl" style={{ fontFamily: "Rajdhani, sans-serif", color: "#fff", letterSpacing: 4 }}>
            ANIME<span style={{ color: "#7c3aed" }}>·CLASH</span>
          </div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", letterSpacing: 4, fontFamily: "Rajdhani, sans-serif" }}>TIENDA DE SOBRES</div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.22)" }}>
          <span className="text-lg">🪙</span>
          <span className="font-black text-xl" style={{ fontFamily: "Rajdhani, sans-serif", color: "#f59e0b" }}>1 850</span>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-7">
            <h1 className="font-black text-3xl text-white" style={{ fontFamily: "Rajdhani, sans-serif", letterSpacing: 5 }}>
              ELIGE TU{" "}
              <motion.span
                animate={{ color: activeRar.color }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                SOBRE
              </motion.span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, letterSpacing: 3, marginTop: 4 }}>NUEVOS PERSONAJES TE ESPERAN</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {PACKS.map((pack, i) => {
              const rar      = R[pack.rarity];
              const isActive = i === activeIdx;
              return (
                <motion.div
                  key={pack.id}
                  initial={{ opacity: 0, y: 32 }}
                  animate={{
                    opacity: 1,
                    y:       isActive ? -12 : 0,
                    scale:   isActive ? 1.06 : 0.965,
                  }}
                  transition={{
                    opacity: { duration: 0.4, delay: i * 0.09 },
                    y:       { type: "spring", stiffness: 340, damping: 28 },
                    scale:   { type: "spring", stiffness: 320, damping: 26 },
                  }}
                  whileTap={{ scale: isActive ? 1.02 : 0.94 }}
                  onClick={() => onSelect(pack)}
                  onMouseEnter={() => setActiveIdx(i)}
                  className="relative rounded-2xl cursor-pointer overflow-hidden"
                  style={{
                    background: "linear-gradient(152deg, #0c0c1e 0%, #080810 100%)",
                    border: `1px solid ${rar.color}${isActive ? "88" : "28"}`,
                    boxShadow: isActive ? `0 0 32px ${rar.glow}, 0 10px 28px rgba(0,0,0,0.55)` : "none",
                    transition: "border-color 0.28s ease, box-shadow 0.38s ease",
                  }}
                >
                  {/* Top accent line — brighter when active */}
                  <div className="absolute top-0 left-0 right-0 h-px" style={{
                    background: `linear-gradient(90deg, transparent, ${rar.color}${isActive ? "ff" : "44"}, transparent)`,
                    transition: "background 0.3s ease",
                  }}/>

                  {/* Active glow fill */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    animate={{ opacity: isActive ? 1 : 0 }}
                    transition={{ duration: 0.32 }}
                    style={{ background: `radial-gradient(circle at 50% 22%, ${rar.color}10 0%, transparent 70%)` }}
                  />

                  {/* Expanding pulse ring on switch */}
                  {isActive && (
                    <motion.div
                      key={`sring-${activeIdx}`}
                      className="absolute pointer-events-none"
                      style={{ inset: -5, borderRadius: 22, border: `2px solid ${rar.color}` }}
                      initial={{ scale: 1, opacity: 0.85 }}
                      animate={{ scale: 1.14, opacity: 0 }}
                      transition={{ duration: 0.52, ease: "easeOut" }}
                    />
                  )}

                  {/* Thin persistent active outline */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none rounded-2xl"
                    animate={{ opacity: isActive ? 1 : 0, boxShadow: isActive ? `inset 0 0 18px ${rar.color}18` : "inset 0 0 0px transparent" }}
                    transition={{ duration: 0.28 }}
                  />

                  <div className="flex justify-center pt-5 pb-0">
                    <PackEnvelope pack={pack} size="md"/>
                  </div>

                  <div className="px-4 pb-4">
                    <div className="font-black text-center text-white" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 17, letterSpacing: 2 }}>
                      {pack.name}
                    </div>
                    <div className="text-center font-bold mb-2.5" style={{ color: rar.color, fontSize: 10, letterSpacing: 1.5 }}>
                      {pack.count} {pack.count === 1 ? "CARTA" : "CARTAS"}
                    </div>
                    <div className="text-center mb-3" style={{ color: "rgba(255,255,255,0.3)", fontSize: 9.5, letterSpacing: 0.3 }}>
                      {PACK_SUBTITLES[pack.id]}
                    </div>
                    <button
                      className="w-full py-2.5 rounded-xl font-black text-white tracking-wider"
                      style={{
                        fontFamily: "Rajdhani, sans-serif", letterSpacing: 2, fontSize: 13,
                        background: `linear-gradient(90deg, ${rar.color}88, ${rar.color}cc)`,
                        border: `1px solid ${rar.color}55`,
                        opacity: isActive ? 1 : 0.6,
                        transition: "opacity 0.28s ease",
                      }}
                    >
                      🪙 {pack.price.toLocaleString()}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Navigation dots + arrows */}
          <div className="flex items-center justify-center gap-2.5 mt-6">
            <button onClick={() => navigate(-1)} disabled={activeIdx === 0}
              className="select-none transition-colors duration-150"
              style={{ color: activeIdx===0 ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.52)", fontSize:22, background:"none", border:"none", cursor:activeIdx===0?"default":"pointer", padding:"0 4px", lineHeight:1, fontFamily:"sans-serif" }}>
              ‹
            </button>
            {PACKS.map((_, i) => (
              <motion.div key={i} onClick={() => setActiveIdx(i)} className="cursor-pointer rounded-full"
                style={{ height:5, background: i===activeIdx ? R[PACKS[activeIdx].rarity].color : "rgba(255,255,255,0.2)" }}
                animate={{ width: i===activeIdx ? 26 : 5, opacity: i===activeIdx ? 1 : 0.5 }}
                transition={{ type:"spring", stiffness:420, damping:28 }}
              />
            ))}
            <button onClick={() => navigate(1)} disabled={activeIdx === PACKS.length - 1}
              className="select-none transition-colors duration-150"
              style={{ color: activeIdx===PACKS.length-1 ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.52)", fontSize:22, background:"none", border:"none", cursor:activeIdx===PACKS.length-1?"default":"pointer", padding:"0 4px", lineHeight:1, fontFamily:"sans-serif" }}>
              ›
            </button>
          </div>

          <div className="text-center mt-3" style={{ color:"rgba(255,255,255,0.18)", fontSize:10, letterSpacing:3, fontFamily:"Rajdhani, sans-serif" }}>
            ← → NAVEGAR · ENTER CONFIRMAR
          </div>
        </div>
      </div>
    </div>
  );
}

function AnticipationScreen({ pack, onOpen }: { pack: Pack; onOpen: () => void }) {
  const [phase, setPhase] = useState(0);
  const rar = R[pack.rarity];

  useEffect(() => {
    const t = [
      setTimeout(() => setPhase(1), 700),
      setTimeout(() => setPhase(2), 2000),
      // crack animation finishes ~1.4s after phase 2 starts, then auto-open
      setTimeout(() => onOpen(), 3600),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  const CRACK_LINES = [
    { x2: 145, y2: 128 }, { x2: 856, y2: 102 },
    { x2: 192, y2: 592 }, { x2: 914, y2: 568 },
    { x2: 42, y2: 374 }, { x2: 962, y2: 326 },
    { x2: 502, y2: 52 }, { x2: 498, y2: 648 },
  ];

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "#04040d" }}>

      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at center, ${rar.color}09 0%, transparent 55%)` }}/>

      {/* Energy rings */}
      {phase >= 1 && [1, 2, 3].map(i => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none"
          style={{ border: `1px solid ${rar.color}`, left: "50%", top: "50%", width: 88*i, height: 88*i, marginLeft: -44*i, marginTop: -44*i }}
          animate={{ scale: [1, 1.95, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 1.7 + i*0.45, repeat: Infinity, delay: i*0.22 }}/>
      ))}

      {/* SVG crack lines */}
      {phase >= 2 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid meet">
          {CRACK_LINES.map((c, i) => (
            <motion.path key={i} d={`M 500 350 L ${c.x2} ${c.y2}`} stroke={rar.color}
              strokeWidth={i % 3 === 0 ? 2.8 : 1.6} fill="none" strokeOpacity="0.72"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.72 }}
              transition={{ duration: 0.58, delay: i * 0.11, ease: "easeOut" }}/>
          ))}
          {[[295,228,258,196],[704,213,742,175],[348,492,306,534]].map(([x1,y1,x2,y2], i) => (
            <motion.path key={`b${i}`} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke={rar.color}
              strokeWidth="1.1" fill="none" strokeOpacity="0.4"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 0.38, delay: 0.92 + i*0.1 }}/>
          ))}
        </svg>
      )}

      {/* Pack — animated */}
      <motion.div
        animate={
          phase === 1 ? { x:[0,-6,6,-10,10,-6,6,0], rotate:[0,-1.5,1.5,-2.2,2.2,-1.5,1.5,0] } :
          phase === 2 ? { x:[0,-12,12,-18,18,-12,12,0], rotate:[0,-3.5,3.5,-5,5,-3.5,3.5,0], scale:[1,1.03,0.97,1.05,0.95,1.02,0.98,1] } :
          {}
        }
        transition={phase > 0 ? { duration: 1.38, repeat: Infinity, ease: "easeInOut" } : {}}
        style={{ filter: phase >= 2 ? `drop-shadow(0 0 30px ${rar.color}) drop-shadow(0 0 65px ${rar.color}55)` : undefined }}
      >
        <PackEnvelope pack={pack} size="lg"/>
      </motion.div>

      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 36%, rgba(0,0,0,0.84) 100%)" }}/>
      <div className="absolute bottom-7 text-center" style={{ color: "rgba(255,255,255,0.22)", fontSize: 10, fontFamily: "Rajdhani, sans-serif", letterSpacing: 3 }}>
        SOBRE {pack.name} · {pack.count} {pack.count === 1 ? "CARTA" : "CARTAS"} · 🪙 {pack.price}
      </div>
    </div>
  );
}

function OpeningScreen({ pack, onDone }: { pack: Pack; onDone: () => void }) {
  const [phase, setPhase] = useState<"flash"|"explode"|"burst"|"out">("flash");
  const rar = R[pack.rarity];
  const colors = BURST_COLORS[pack.rarity];

  useEffect(() => {
    const t = [
      setTimeout(() => setPhase("explode"), 240),
      setTimeout(() => setPhase("burst"), 580),
      setTimeout(() => { setPhase("out"); onDone(); }, 2050),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  const particles = Array.from({ length: 44 }, (_, i) => {
    const angle = (i / 44) * Math.PI * 2 + (i % 5) * 0.14;
    const dist = 145 + (i % 7) * 40;
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, color: colors[i % colors.length], size: 3 + (i % 5) * 2.8, delay: (i % 6) * 0.038 };
  });

  return (
    <div className="w-full h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "#04040d" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 50%, ${rar.color}18 0%, transparent 55%)` }}/>

      <AnimatePresence>
        {phase === "flash" && (
          <motion.div className="absolute inset-0 z-50 pointer-events-none" style={{ background: "#fff" }}
            initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.7, 0] }} transition={{ duration: 0.32 }}/>
        )}
      </AnimatePresence>

      {(phase === "flash" || phase === "explode") && (
        <motion.div className="absolute"
          animate={phase === "explode" ? { scale:[1, 1.9, 3.8], opacity:[1, 0.7, 0], filter:["brightness(1)","brightness(4.5)","brightness(14)"] } : {}}
          transition={{ duration: 0.42, ease: "easeOut" }}>
          <PackEnvelope pack={pack} size="lg"/>
        </motion.div>
      )}

      {(phase === "explode" || phase === "burst") && (
        <>
          <motion.div className="absolute rounded-full pointer-events-none"
            style={{ border: `3px solid ${rar.color}`, left:"50%", top:"50%" }}
            initial={{ width:0, height:0, marginLeft:0, marginTop:0, opacity:1 }}
            animate={{ width:720, height:720, marginLeft:-360, marginTop:-360, opacity:0 }}
            transition={{ duration: 1.05, ease: "easeOut" }}/>
          <motion.div className="absolute rounded-full pointer-events-none"
            style={{ border: `1.5px solid ${rar.color}77`, left:"50%", top:"50%" }}
            initial={{ width:0, height:0, marginLeft:0, marginTop:0, opacity:1 }}
            animate={{ width:460, height:460, marginLeft:-230, marginTop:-230, opacity:0 }}
            transition={{ duration: 0.72, ease: "easeOut", delay: 0.14 }}/>
        </>
      )}

      {phase === "burst" && (
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((p, i) => (
            <motion.div key={i} className="absolute rounded-full"
              style={{ left:"50%", top:"50%", width:p.size, height:p.size, background:p.color, boxShadow:`0 0 ${p.size*2.5}px ${p.color}`, marginLeft:-p.size/2, marginTop:-p.size/2 }}
              initial={{ x:0, y:0, opacity:1, scale:1 }}
              animate={{ x:p.x, y:p.y, opacity:0, scale:0 }}
              transition={{ duration:1.15, delay:p.delay, ease:"easeOut" }}/>
          ))}
        </div>
      )}

      {phase === "burst" && (
        <motion.div className="absolute inset-x-0 bottom-20 text-center pointer-events-none"
          initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.88, duration:0.42 }}>
          <div className="font-black tracking-widest" style={{ fontFamily:"Rajdhani, sans-serif", color:rar.color, fontSize:24, letterSpacing:9 }}>
            CARTAS OBTENIDAS
          </div>
        </motion.div>
      )}
    </div>
  );
}

function ResultsScreen({ pack, cards, onCardClick, onShop }: {
  pack: Pack; cards: Card[]; onCardClick: (c: Card) => void; onShop: () => void;
}) {
  const [revealed, setRevealed]   = useState<Set<number>>(new Set());
  const [activeIdx, setActiveIdx] = useState(0);
  const activeIdxRef              = useRef(0);
  const rar = R[pack.rarity];
  const fan = CARD_FAN[Math.min(cards.length - 1, 6)];
  const allOut = revealed.size === cards.length;

  // Keep ref in sync for stable callbacks
  useEffect(() => { activeIdxRef.current = activeIdx; }, [activeIdx]);

  // Sequential reveal
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      if (i >= cards.length) { clearInterval(t); return; }
      setRevealed(p => new Set([...p, i++]));
    }, 300);
    return () => clearInterval(t);
  }, [cards.length]);

  // Land on center card once all are out
  useEffect(() => {
    if (allOut) setActiveIdx(Math.floor(cards.length / 2));
  }, [allOut, cards.length]);

  const navigate = useCallback((delta: -1 | 1) => {
    setActiveIdx(prev => {
      const next = prev + delta;
      return next < 0 || next >= cards.length ? prev : next;
    });
  }, [cards.length]);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!allOut) return;
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowLeft","ArrowRight","Enter"," "].includes(e.key)) e.preventDefault();
      if (e.key === "ArrowLeft"  || e.key === "a") navigate(-1);
      if (e.key === "ArrowRight" || e.key === "d") navigate(1);
      if (e.key === "Enter" || e.key === " ") onCardClick(cards[activeIdxRef.current]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [allOut, navigate, onCardClick, cards]);

  // ── Gamepad ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!allOut) return;
    let rafId: number;
    let lastMoveAt = 0;
    const COOLDOWN = 220;
    const poll = (t: number) => {
      const gps = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const gp of gps) {
        if (!gp) continue;
        const left  = gp.buttons[14]?.pressed || (gp.axes[0] ?? 0) < -0.5;
        const right = gp.buttons[15]?.pressed || (gp.axes[0] ?? 0) >  0.5;
        if ((left || right) && t - lastMoveAt > COOLDOWN) {
          navigate(left ? -1 : 1);
          lastMoveAt = t;
        }
        if (gp.buttons[0]?.pressed) onCardClick(cards[activeIdxRef.current]);
      }
      rafId = requestAnimationFrame(poll);
    };
    rafId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(rafId);
  }, [allOut, navigate, onCardClick, cards]);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background:"linear-gradient(158deg, #05050e 0%, #0b0620 100%)" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background:`radial-gradient(circle at 50% 40%, ${rar.color}0c 0%, transparent 60%)` }}/>

      {/* Header */}
      <motion.div className="absolute top-5 inset-x-0 text-center" initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }}>
        <div className="font-black text-xl tracking-widest" style={{ fontFamily:"Rajdhani, sans-serif", color:"#fff", letterSpacing:5 }}>
          SOBRE <span style={{ color:rar.color }}>{pack.name}</span>
        </div>
        <div style={{ color:"rgba(255,255,255,0.3)", fontSize:10, letterSpacing:3, fontFamily:"Rajdhani, sans-serif" }}>
          {cards.length} {cards.length === 1 ? "CARTA OBTENIDA" : "CARTAS OBTENIDAS"}
        </div>
      </motion.div>

      {/* Fan */}
      <div className="relative w-full flex items-end justify-center" style={{ height: 380, marginTop: 30 }}>
        {cards.map((card, i) => {
          const pos    = fan[i] || { r:0, x:0, y:0 };
          const asym   = ASYMMETRY[i % ASYMMETRY.length];
          const isOut  = revealed.has(i);
          const isActive = allOut && i === activeIdx;

          return (
            <motion.div key={card.id} className="absolute"
              style={{ transformOrigin:"bottom center", zIndex: isActive ? 80 : i, bottom:24, left:"50%", marginLeft:-95 }}
              initial={{ y:-320, opacity:0, x:0, rotate:0 }}
              animate={{
                // Active: rises above fan, nearly straight, scaled up
                y:       isActive ? pos.y + asym*1.4 - 62 : isOut ? pos.y + asym*1.4 : pos.y*0.18,
                x:       isOut ? pos.x + asym : pos.x*0.08,
                rotate:  isActive ? pos.r * 0.15 : isOut ? pos.r + asym*0.28 : 0,
                scale:   isActive ? 1.1  : isOut ? (allOut ? 0.95 : 1) : 0.88,
                opacity: isOut ? (isActive ? 1 : allOut ? 0.58 : 1) : 0.28,
              }}
              transition={{
                y:       { type:"spring", stiffness:320, damping:26 },
                x:       { type:"spring", stiffness:260, damping:24 },
                rotate:  { type:"spring", stiffness:240, damping:22 },
                scale:   { type:"spring", stiffness:300, damping:24 },
                opacity: { duration:0.24 },
              }}
              onClick={() => {
                if (!isOut) return;
                if (isActive) onCardClick(card);
                else setActiveIdx(i);
              }}
            >
              <AnimeCard card={card} dimmed={!isOut}/>

              {/* Expanding pulse ring — re-mounts every time this card becomes active */}
              {isActive && (
                <motion.div
                  key={`ring-${activeIdx}`}
                  className="absolute pointer-events-none"
                  style={{ inset:-6, borderRadius:16, border:`2px solid ${R[card.rarity].color}` }}
                  initial={{ scale:1, opacity:0.9 }}
                  animate={{ scale:1.5, opacity:0 }}
                  transition={{ duration:0.55, ease:"easeOut" }}
                />
              )}

              {/* Thin persistent active border */}
              {isActive && (
                <motion.div
                  className="absolute pointer-events-none"
                  style={{ inset:-2, borderRadius:12, border:`1.5px solid ${R[card.rarity].color}66` }}
                  initial={{ opacity:0 }}
                  animate={{ opacity:1 }}
                  transition={{ duration:0.2 }}
                />
              )}

              {/* Reveal flash on sequential drop */}
              <AnimatePresence>
                {isOut && revealed.size === i+1 && (
                  <motion.div className="absolute inset-0 pointer-events-none" style={{ borderRadius:10, background:R[card.rarity].color }}
                    initial={{ opacity:0.65 }} animate={{ opacity:0 }} transition={{ duration:0.38 }}/>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Navigation dots + arrows */}
      <AnimatePresence>
        {allOut && cards.length > 1 && (
          <motion.div className="absolute flex items-center gap-2.5" style={{ bottom:104 }}
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.18, duration:0.32 }}>
            <button onClick={() => navigate(-1)} disabled={activeIdx === 0}
              className="select-none transition-colors duration-150"
              style={{ color: activeIdx===0 ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.6)", fontSize:24, background:"none", border:"none", cursor: activeIdx===0 ? "default":"pointer", padding:"0 4px", lineHeight:1, fontFamily:"sans-serif" }}>
              ‹
            </button>

            {cards.map((c, i) => (
              <motion.div key={i} onClick={() => setActiveIdx(i)} className="cursor-pointer rounded-full"
                style={{ height:5, background: i===activeIdx ? R[cards[activeIdx].rarity].color : "rgba(255,255,255,0.2)" }}
                animate={{ width: i===activeIdx ? 26 : 5, opacity: i===activeIdx ? 1 : 0.55 }}
                transition={{ type:"spring", stiffness:420, damping:28 }}
              />
            ))}

            <button onClick={() => navigate(1)} disabled={activeIdx === cards.length - 1}
              className="select-none transition-colors duration-150"
              style={{ color: activeIdx===cards.length-1 ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.6)", fontSize:24, background:"none", border:"none", cursor: activeIdx===cards.length-1 ? "default":"pointer", padding:"0 4px", lineHeight:1, fontFamily:"sans-serif" }}>
              ›
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint text */}
      <div className="absolute text-center" style={{ bottom: allOut ? 76 : 26, color:"rgba(255,255,255,0.22)", fontSize:10, letterSpacing:3, fontFamily:"Rajdhani, sans-serif", transition:"bottom 0.5s ease", pointerEvents:"none" }}>
        {allOut ? "← → NAVEGAR · ENTER / CLICK PARA DETALLE" : "TOCA UNA CARTA PARA VER DETALLES"}
      </div>

      {/* Actions */}
      <AnimatePresence>
        {allOut && (
          <motion.div className="absolute bottom-5 flex gap-3"
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.42 }}>
            <button onClick={onShop}
              className="px-5 py-2.5 rounded-xl font-black text-sm tracking-wider hover:brightness-125 transition-all"
              style={{ fontFamily:"Rajdhani, sans-serif", letterSpacing:2, background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.55)", border:"1px solid rgba(255,255,255,0.1)" }}>
              ← TIENDA
            </button>
            <button onClick={onShop}
              className="px-5 py-2.5 rounded-xl font-black text-sm tracking-wider hover:brightness-115 transition-all"
              style={{ fontFamily:"Rajdhani, sans-serif", letterSpacing:2, background:"linear-gradient(90deg, #7c3aed, #6d28d9)", color:"#fff", border:"1px solid #8b5cf655" }}>
              ABRIR OTRO SOBRE
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailScreen({ card, onBack }: { card: Card; onBack: () => void }) {
  const bgUid = useRef("bg" + Math.random().toString(36).slice(2)).current;
  const rar = R[card.rarity];
  const el = E[card.element];
  const stats = [
    { label:"ATK", value:card.atk, color:"#f87171" },
    { label:"DEF", value:card.def, color:"#60a5fa" },
    { label:"MAG", value:card.mag, color:"#c084fc" },
    { label:"SPD", value:card.spd, color:"#22d3ee" },
    { label:"LCK", value:card.lck, color:"#fcd34d" },
  ];
  const power = stats.reduce((s, x) => s + x.value, 0);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background:"#03030c" }}>
      <div className="absolute inset-0 opacity-[0.07] scale-125 pointer-events-none">
        <ElementArtwork el={card.element} uid={bgUid}/>
      </div>
      <div className="absolute inset-0 pointer-events-none" style={{ background:`radial-gradient(circle at 50% 38%, ${rar.color}14 0%, transparent 62%)` }}/>

      <button onClick={onBack} className="absolute top-5 left-5 font-black text-sm hover:text-white transition-colors"
        style={{ fontFamily:"Rajdhani, sans-serif", color:"rgba(255,255,255,0.38)", letterSpacing:2 }}>
        ← VOLVER
      </button>

      <motion.div className="absolute top-5 inset-x-0 text-center pointer-events-none" initial={{ opacity:0 }} animate={{ opacity:1 }}>
        <div className="font-black tracking-widest" style={{ fontFamily:"Rajdhani, sans-serif", color:rar.color, fontSize:11, letterSpacing:8 }}>
          ✦ {rar.label} ✦
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row items-center gap-10">
        {/* Card scaled up */}
        <motion.div initial={{ scale:0.58, opacity:0, rotateY:-85 }} animate={{ scale:1, opacity:1, rotateY:0 }} transition={{ type:"spring", stiffness:145, damping:17 }}>
          <div style={{ width: 190*1.36, height: 292*1.36 }}>
            <div style={{ transform:"scale(1.36)", transformOrigin:"top left" }}>
              <AnimeCard card={card}/>
            </div>
          </div>
        </motion.div>

        {/* Stats panel */}
        <motion.div initial={{ opacity:0, x:32 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.3, duration:0.48 }}
          className="rounded-2xl overflow-hidden" style={{ width:248, background:"rgba(255,255,255,0.024)", border:"1px solid rgba(255,255,255,0.07)" }}>
          <div className="px-5 py-4" style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
            <div className="font-black text-white leading-tight" style={{ fontFamily:"Rajdhani, sans-serif", fontSize:20, letterSpacing:1 }}>
              {card.name.toUpperCase()}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span style={{ fontSize:10, color:el.color, fontFamily:"Rajdhani, sans-serif", fontWeight:700 }}>{el.icon} {el.label}</span>
              <span style={{ width:1, height:11, display:"inline-block", background:"rgba(255,255,255,0.15)" }}/>
              <span style={{ fontSize:10, color:rar.color, fontFamily:"Rajdhani, sans-serif", fontWeight:700 }}>{rar.label}</span>
            </div>
          </div>

          <div className="px-5 py-4 flex flex-col gap-3.5">
            {stats.map((s, idx) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="font-mono font-bold text-right flex-shrink-0" style={{ fontSize:11, color:s.color, width:28 }}>{s.label}</span>
                <div className="flex-1 rounded-full overflow-hidden" style={{ height:6, background:"rgba(255,255,255,0.06)" }}>
                  <motion.div className="h-full rounded-full" style={{ background:`linear-gradient(90deg, ${s.color}66, ${s.color})` }}
                    initial={{ width:0 }} animate={{ width:`${s.value}%` }}
                    transition={{ duration:0.75, delay:0.52 + idx*0.08, ease:"easeOut" }}/>
                </div>
                <span className="font-black flex-shrink-0 text-right" style={{ fontSize:15, color:"#fff", width:32, fontFamily:"JetBrains Mono, monospace" }}>{s.value}</span>
              </div>
            ))}
          </div>

          <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderTop:"1px solid rgba(255,255,255,0.06)", background:"rgba(255,255,255,0.018)" }}>
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.38)", fontFamily:"Rajdhani, sans-serif", letterSpacing:2 }}>PODER TOTAL</span>
            <span className="font-black" style={{ fontFamily:"Rajdhani, sans-serif", color:rar.color, fontSize:26 }}>{power}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("shop");
  const [pack, setPack] = useState<Pack | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [detail, setDetail] = useState<Card | null>(null);

  const goSelect  = (p: Pack) => { setPack(p); setScreen("anticipation"); };
  const goOpen    = () => setScreen("opening");
  const goDone    = () => { if (!pack) return; setCards(CARDS.slice(0, pack.count)); setScreen("results"); };
  const goDetail  = (c: Card) => { setDetail(c); setScreen("detail"); };
  const goBack    = () => { setDetail(null); setScreen("results"); };
  const goShop    = () => { setPack(null); setCards([]); setDetail(null); setScreen("shop"); };

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { left: -100%; }
          100% { left: 220%; }
        }
        *, *::before, *::after { box-sizing: border-box; }
        html, body, #root { width: 100%; height: 100%; overflow: hidden; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.35); border-radius: 2px; }
      `}</style>
      <AnimatePresence mode="wait">
        {screen === "shop" && (
          <motion.div key="shop" className="w-full h-full" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.25 }}>
            <ShopScreen onSelect={goSelect}/>
          </motion.div>
        )}
        {screen === "anticipation" && pack && (
          <motion.div key="anticipation" className="w-full h-full" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.25 }}>
            <AnticipationScreen pack={pack} onOpen={goOpen}/>
          </motion.div>
        )}
        {screen === "opening" && pack && (
          <motion.div key="opening" className="w-full h-full" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.16 }}>
            <OpeningScreen pack={pack} onDone={goDone}/>
          </motion.div>
        )}
        {screen === "results" && pack && (
          <motion.div key="results" className="w-full h-full" initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }} transition={{ duration:0.36 }}>
            <ResultsScreen pack={pack} cards={cards} onCardClick={goDetail} onShop={goShop}/>
          </motion.div>
        )}
        {screen === "detail" && detail && (
          <motion.div key="detail" className="w-full h-full" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.26 }}>
            <DetailScreen card={detail} onBack={goBack}/>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
