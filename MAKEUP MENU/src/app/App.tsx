import { useState, useEffect } from "react";
import { motion } from "motion/react";

const MENU_ITEMS = [
  "SKILL",
  "ITEM",
  "EQUIP",
  "PERSONA",
  "STATS",
  "QUEST",
  "SOCIAL LINK",
  "CALENDAR",
  "SYSTEM",
];

const ITEM_DESCRIPTIONS: Record<string, string> = {
  SKILL: "Use a registered skill in battle",
  ITEM: "Use an item from your bag",
  EQUIP: "Change your equipment",
  PERSONA: "Switch or manage your Persona",
  STATS: "View your current parameters",
  QUEST: "View your active quests",
  "SOCIAL LINK": "Check Social Link status",
  CALENDAR: "View today's schedule",
  SYSTEM: "Game configuration",
};

const ITEM_ACTIONS: Record<string, string> = {
  SKILL: "Use a Skill",
  ITEM: "Use an Item",
  EQUIP: "Equip",
  PERSONA: "Switch Persona",
  STATS: "View Stats",
  QUEST: "View Quests",
  "SOCIAL LINK": "Social Link",
  CALENDAR: "Calendar",
  SYSTEM: "System",
};

function getItemFontSize(index: number): string {
  // Uniform base size — items don't shrink going down, matching the reference
  const base = 2.9 + index * 0.06;
  return `clamp(2rem, ${base}vw, ${(base * 0.9).toFixed(2)}rem)`;
}

function AigisCharacter() {
  return (
    <motion.div
      style={{
        position: "absolute",
        left: "6%",
        bottom: "-2%",
        width: "88%",
        height: "92%",
        zIndex: 5,
        pointerEvents: "none",
      }}
      animate={{ y: [0, -15, 0] }}
      transition={{
        duration: 5.5,
        ease: "easeInOut",
        repeat: Infinity,
      }}
    >
      <svg
        viewBox="0 0 300 620"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", filter: "drop-shadow(0 8px 30px rgba(0,150,255,0.15))" }}
      >
        {/* Floating ribbons – behind body */}
        <path
          d="M148 255 Q88 340 48 435 Q18 505 52 545 Q82 525 68 488 Q100 420 150 335Z"
          fill="#0A0A0A"
          opacity="0.92"
        />
        <path
          d="M152 255 Q214 340 254 435 Q284 505 248 545 Q218 525 232 488 Q200 420 150 335Z"
          fill="#151515"
          opacity="0.78"
        />
        <path
          d="M52 510 Q25 565 32 605"
          stroke="#0A0A0A"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M248 510 Q275 560 268 600"
          stroke="#111"
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
        />

        {/* Left arm */}
        <path
          d="M97 278 Q52 328 40 400"
          stroke="white"
          strokeWidth="30"
          strokeLinecap="round"
          fill="none"
        />
        {/* Right arm */}
        <path
          d="M203 278 Q248 328 260 400"
          stroke="white"
          strokeWidth="30"
          strokeLinecap="round"
          fill="none"
        />

        {/* Body / torso */}
        <path
          d="M97 260 Q76 330 82 430 L218 430 Q224 330 203 260 Q175 275 150 277 Q125 275 97 260Z"
          fill="white"
        />
        {/* Skirt / lower body */}
        <path
          d="M84 428 Q72 498 77 585 L127 585 Q124 510 148 476 Q152 510 172 585 L223 585 Q228 498 216 428Z"
          fill="white"
        />

        {/* Mechanical wrist cuffs */}
        <rect x="26" y="393" width="30" height="20" rx="10" fill="#D4D4D4" stroke="#A8A8A8" strokeWidth="1.5" />
        <line x1="32" y1="403" x2="50" y2="403" stroke="#999" strokeWidth="1" />
        <rect x="244" y="393" width="30" height="20" rx="10" fill="#D4D4D4" stroke="#A8A8A8" strokeWidth="1.5" />
        <line x1="250" y1="403" x2="268" y2="403" stroke="#999" strokeWidth="1" />

        {/* Hair – back mass */}
        <ellipse cx="150" cy="178" rx="74" ry="84" fill="#A4DCF8" />

        {/* Hair spikes */}
        <path d="M76 155 Q62 68 98 140" fill="#88C8EC" />
        <path d="M96 140 Q84 48 120 128" fill="#9DCEF4" />
        <path d="M120 128 Q114 38 142 118" fill="#A4DCF8" />
        <path d="M162 118 Q168 38 186 126" fill="#A4DCF8" />
        <path d="M186 128 Q198 52 218 138" fill="#9DCEF4" />
        <path d="M214 148 Q234 68 234 148" fill="#88C8EC" />

        {/* Face base */}
        <ellipse cx="150" cy="192" rx="55" ry="60" fill="#FFF0E2" />

        {/* Eyebrows */}
        <path d="M120 174 Q131 169 143 174" stroke="#8B7355" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M157 174 Q168 169 180 174" stroke="#8B7355" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* Eyes – white sclera */}
        <ellipse cx="133" cy="191" rx="13" ry="14" fill="white" />
        <ellipse cx="167" cy="191" rx="13" ry="14" fill="white" />
        {/* Iris */}
        <ellipse cx="133" cy="192" rx="9" ry="10" fill="#5FC8E8" />
        <ellipse cx="167" cy="192" rx="9" ry="10" fill="#5FC8E8" />
        {/* Pupil */}
        <ellipse cx="133" cy="193" rx="5.5" ry="6.5" fill="#0A3E5C" />
        <ellipse cx="167" cy="193" rx="5.5" ry="6.5" fill="#0A3E5C" />
        {/* Highlight */}
        <circle cx="137" cy="189" r="3" fill="rgba(255,255,255,0.85)" />
        <circle cx="171" cy="189" r="3" fill="rgba(255,255,255,0.85)" />
        {/* Eye glow */}
        <ellipse cx="133" cy="191" rx="13" ry="14" fill="rgba(100,210,255,0.12)" />
        <ellipse cx="167" cy="191" rx="13" ry="14" fill="rgba(100,210,255,0.12)" />

        {/* Eyelashes top */}
        <path d="M120 182 Q133 176 146 182" stroke="#333" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M154 182 Q167 176 180 182" stroke="#333" strokeWidth="2.2" fill="none" strokeLinecap="round" />

        {/* Nose */}
        <path d="M146 212 Q150 217 154 212" stroke="#DDAA88" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Mouth */}
        <path d="M141 224 Q150 231 159 224" stroke="#CC8888" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Neck */}
        <rect x="138" y="244" width="24" height="20" rx="8" fill="#FFF0E2" />

        {/* Collar / chest */}
        <path d="M100 260 L132 272 L150 276 L168 272 L200 260 L176 252 Q150 264 124 252Z" fill="#DCDCE8" />
        {/* Blue uniform accent */}
        <path d="M126 258 L150 275 L174 258 L167 248 Q150 260 133 248Z" fill="#1A4A8A" opacity="0.22" />
      </svg>
    </motion.div>
  );
}

function MenuItem({
  item,
  isSelected,
  index,
  onClick,
}: {
  item: string;
  isSelected: boolean;
  index: number;
  onClick: () => void;
}) {
  return (
    <motion.div
      className="relative cursor-pointer select-none flex items-center"
      style={{
        marginLeft: `${index * 22}px`,
        marginTop: index > 0 ? "-7px" : "0",
      }}
      animate={{
        scale: isSelected ? 1.14 : 1,
        x: isSelected ? 14 : 0,
      }}
      transition={{ type: "spring", stiffness: 520, damping: 34 }}
      onClick={onClick}
    >
      {/* White banner background */}
      <motion.div
        style={{
          position: "absolute",
          top: "-5px",
          bottom: "-5px",
          left: "-18px",
          right: "-30px",
          background: "white",
          transform: "skewX(-7deg)",
          transformOrigin: "left center",
          zIndex: 0,
          pointerEvents: "none",
        }}
        animate={{ scaleX: isSelected ? 1 : 0, opacity: isSelected ? 1 : 0 }}
        initial={false}
        transition={{ type: "spring", stiffness: 550, damping: 38 }}
      />

      {/* Pink/red diagonal accent stripe */}
      <motion.div
        style={{
          position: "absolute",
          top: "-5px",
          bottom: "-5px",
          left: "-18px",
          width: "7px",
          background: "linear-gradient(to bottom, #FF2255, #CC001A)",
          transform: "skewX(-7deg)",
          transformOrigin: "left center",
          zIndex: 1,
          pointerEvents: "none",
        }}
        animate={{ scaleX: isSelected ? 1 : 0, opacity: isSelected ? 1 : 0 }}
        initial={false}
        transition={{ type: "spring", stiffness: 550, damping: 38, delay: 0.03 }}
      />

      <span
        style={{
          position: "relative",
          zIndex: 2,
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900,
          fontStyle: "italic",
          lineHeight: 1.05,
          fontSize: getItemFontSize(index),
          color: isSelected ? "#0A0A1A" : "rgba(160, 230, 255, 0.92)",
          textShadow: isSelected
            ? "none"
            : "0 0 28px rgba(0,180,255,0.55), 0 2px 10px rgba(0,0,80,0.9)",
          letterSpacing: "-0.01em",
          padding: "4px 6px",
        }}
      >
        {item}
      </span>
    </motion.div>
  );
}

export default function App() {
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp")
        setSelected((prev) => (prev - 1 + MENU_ITEMS.length) % MENU_ITEMS.length);
      if (e.key === "ArrowDown")
        setSelected((prev) => (prev + 1) % MENU_ITEMS.length);
    };
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 0)
        setSelected((prev) => (prev + 1) % MENU_ITEMS.length);
      else
        setSelected((prev) => (prev - 1 + MENU_ITEMS.length) % MENU_ITEMS.length);
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return (
    <div
      className="w-full h-screen overflow-hidden relative flex"
      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
    >
      {/* ─── CSS animations ─── */}
      <style>{`
        @keyframes causticDrift {
          0%, 100% {
            background-position: 0% 0%, 100% 0%, 50% 100%, 25% 55%;
          }
          25% {
            background-position: 35% 20%, 65% 45%, 15% 75%, 75% 15%;
          }
          50% {
            background-position: 65% 45%, 35% 85%, 80% 25%, 10% 85%;
          }
          75% {
            background-position: 20% 80%, 80% 15%, 45% 55%, 90% 35%;
          }
        }

        @keyframes waterSwell {
          0%, 100% { transform: translateX(0) translateY(0) scale(1); opacity: 0.18; }
          33%       { transform: translateX(-10px) translateY(-6px) scale(1.04); opacity: 0.24; }
          66%       { transform: translateX(8px) translateY(5px) scale(0.97); opacity: 0.16; }
        }

        @keyframes topLight {
          0%, 100% { opacity: 0.14; transform: scaleX(1); }
          50%       { opacity: 0.22; transform: scaleX(1.06); }
        }

        .caustic-layer {
          background:
            radial-gradient(ellipse 55% 32% at 18% 22%, rgba(120, 210, 255, 0.22) 0%, transparent 60%),
            radial-gradient(ellipse 38% 22% at 78% 12%, rgba(160, 230, 255, 0.16) 0%, transparent 55%),
            radial-gradient(ellipse 65% 38% at 48% 78%, rgba(60, 150, 255, 0.14) 0%, transparent 58%),
            radial-gradient(ellipse 28% 18% at 88% 62%, rgba(130, 215, 255, 0.12) 0%, transparent 48%);
          background-size: 250% 250%;
          animation: causticDrift 16s ease-in-out infinite;
          pointer-events: none;
        }

        .water-swell {
          animation: waterSwell 10s ease-in-out infinite;
          pointer-events: none;
        }

        .top-light {
          animation: topLight 7s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>

      {/* ─── SVG filter for water-distortion ─── */}
      <svg
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
        aria-hidden="true"
      >
        <defs>
          <filter id="water-warp" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.018 0.011"
              numOctaves="3"
              seed="7"
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                dur="22s"
                values="0.018 0.011;0.024 0.008;0.014 0.017;0.018 0.011"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="26"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* ═══════════════════════════════════════════════
          LEFT PANEL — white character area
      ════════════════════════════════════════════════ */}
      <div
        style={{
          position: "relative",
          width: "41%",
          flexShrink: 0,
          background: "white",
          overflow: "hidden",
        }}
      >
        {/* Subtle left-edge darkening (like the P3R left strip) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to right, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.12) 8%, rgba(255,255,255,0) 30%)",
            zIndex: 6,
            pointerEvents: "none",
          }}
        />

        {/* MAKOTO vertical text */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 7,
          }}
        >
          <span
            style={{
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              transform: "rotate(180deg)",
              fontSize: "clamp(4rem, 8vw, 6.5rem)",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              fontStyle: "italic",
              color: "rgba(0,0,0,0.07)",
              letterSpacing: "-0.05em",
              userSelect: "none",
              whiteSpace: "nowrap",
            }}
          >
            MAKOTO
          </span>
        </div>

        {/* Character */}
        <AigisCharacter />

        {/* Right-edge gradient blending into blue */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: "40px",
            background: "linear-gradient(to right, transparent, rgba(5,30,100,0.18))",
            zIndex: 6,
            pointerEvents: "none",
          }}
        />

        {/* ── Wallet widget ── */}
        <motion.div
          style={{ position: "absolute", top: "5.5%", left: "17%", zIndex: 20 }}
          initial={{ x: -260, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 255, damping: 26, delay: 0.5 }}
        >
          <div
            style={{
              background: "white",
              border: "2.5px solid #111",
              padding: "8px 18px 8px 14px",
              minWidth: "148px",
            }}
          >
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "1.65rem",
                fontWeight: 700,
                color: "#0A0A0A",
                lineHeight: 1.1,
                letterSpacing: "0.01em",
              }}
            >
              ¥ 22,450
            </div>
            <div
              style={{
                fontSize: "0.62rem",
                color: "#555",
                marginTop: "2px",
                letterSpacing: "0.08em",
              }}
            >
              current wallet
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════
          RIGHT PANEL — blue water + menu
      ════════════════════════════════════════════════ */}
      <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
        {/* Base deep-blue gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(155deg, #1460B8 0%, #0D45A0 18%, #0a2d8a 55%, #051860 82%, #020e42 100%)",
          }}
        />

        {/* Caustic light overlay */}
        <div className="caustic-layer" style={{ position: "absolute", inset: 0 }} />

        {/* Water-surface light band at top */}
        <div
          className="top-light"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "32%",
            background:
              "linear-gradient(180deg, rgba(110, 195, 255, 0.18) 0%, transparent 100%)",
            filter: "url(#water-warp)",
          }}
        />

        {/* Mid-depth swell layer */}
        <div
          className="water-swell"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(190deg, rgba(30,90,210,0.22) 0%, transparent 45%, rgba(0,20,100,0.18) 100%)",
            filter: "url(#water-warp)",
          }}
        />

        {/* ── Menu list ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            paddingLeft: "6%",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {MENU_ITEMS.map((item, i) => (
              <MenuItem
                key={item}
                item={item}
                isSelected={selected === i}
                index={i}
                onClick={() => setSelected(i)}
              />
            ))}
          </div>
        </div>

        {/* ── Item description (top-right) ── */}
        <motion.div
          key={selected}
          style={{
            position: "absolute",
            top: "7%",
            right: "4%",
            textAlign: "right",
          }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
        >
          <div
            style={{
              color: "rgba(190, 225, 255, 0.55)",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "0.72rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              maxWidth: "220px",
            }}
          >
            {ITEM_DESCRIPTIONS[MENU_ITEMS[selected]]}
          </div>
        </motion.div>

        {/* ── Controller hints (bottom-right) ── */}
        <div
          style={{
            position: "absolute",
            bottom: "4%",
            right: "3%",
            textAlign: "right",
          }}
        >
          <motion.div
            key={`action-${selected}`}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              color: "white",
              fontSize: "1.1rem",
              letterSpacing: "0.03em",
            }}
          >
            {ITEM_ACTIONS[MENU_ITEMS[selected]]}
          </motion.div>
          <div
            style={{
              color: "rgba(190, 215, 255, 0.4)",
              fontSize: "0.6rem",
              letterSpacing: "0.35em",
              marginTop: "3px",
              marginBottom: "7px",
            }}
          >
            Command ───────────────
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "18px",
              alignItems: "center",
            }}
          >
            {[
              { label: "A", text: "Confirm" },
              { label: "B", text: "Close" },
            ].map(({ label, text }) => (
              <span
                key={label}
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                <span
                  style={{
                    background: "white",
                    color: "#0A0A1A",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    flexShrink: 0,
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    color: "white",
                    fontSize: "0.88rem",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  {text}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* ── Nav hint (bottom-left) ── */}
        <div
          style={{
            position: "absolute",
            bottom: "4%",
            left: "3%",
            color: "rgba(190, 215, 255, 0.35)",
            fontSize: "0.72rem",
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: "0.15em",
          }}
        >
          ↑ ↓  NAVIGATE  •  SCROLL
        </div>
      </div>
    </div>
  );
}
