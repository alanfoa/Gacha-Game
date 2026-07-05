import { useRef, useEffect, useState, useCallback } from 'react';
import { useScreenStore } from '../../store/screenStore';
import { useInputManager, type GameAction } from '../../hooks/useInputManager';
import { useSound } from '../../hooks/useSound';
import { BGM } from '../../audio/sounds';
import { MusicPlayer } from '../UI/MusicPlayer';
import { FateProtocolSeal } from '../UI/FateProtocolSeal';

const CYAN = "rgba(160, 230, 255, 0.92)";
const PINK = "#FF2255";
const BG = "#041565";

const OPTIONS = [
  { label: 'NUEVA PARTIDA', screen: 'saveSlots' as const },
  { label: 'CARGAR PARTIDA', screen: 'saveSlots' as const },
  { label: 'OPCIONES', screen: 'options' as const },
];

function MenuButton({ label, index, active, onClick }: { label: string; index: number; active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const highlighted = hovered || active;
  const staggerX = index * 22;
  const staggerY = index * -7;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        display: "block",
        marginLeft: `${staggerX}px`,
        marginTop: index === 0 ? 0 : `${staggerY}px`,
        transform: highlighted ? "translateX(14px) scaleX(1.14)" : "translateX(0px) scaleX(1)",
        transformOrigin: "left center",
        transition: "transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease",
        background: highlighted ? "#ffffff" : "transparent",
        border: "none",
        cursor: "pointer",
        padding: "0",
        outline: "none",
      }}
    >
      <span style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: highlighted ? "5px" : "0px",
        background: PINK,
        transition: "width 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)",
        display: "block",
      }} />

      <span style={{
        display: "block",
        transform: highlighted ? "skewX(-7deg)" : "skewX(0deg)",
        transition: "transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)",
        paddingLeft: highlighted ? "22px" : "6px",
        paddingRight: "32px",
        paddingTop: "6px",
        paddingBottom: "6px",
        fontFamily: "'Barlow Condensed', sans-serif",
        fontStyle: "italic",
        fontWeight: 900,
        fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
        letterSpacing: "0.08em",
        color: highlighted ? "#0a0a1a" : CYAN,
        textShadow: highlighted ? "none" : `0 0 18px rgba(160, 230, 255, 0.7), 0 0 40px rgba(80, 180, 255, 0.35)`,
        whiteSpace: "nowrap",
      }}>
        {label}
      </span>
    </button>
  );
}

export function MenuPrincipal() {
  const navigate = useScreenStore((s) => s.navigate);
  const [focus, setFocus] = useState(0);
  const focusRef = useRef(0);
  const bgmStarted = useRef(false);
  const mountedAt = useRef(Date.now());
  const { play } = useSound();

  const unlockBGM = useCallback(() => {
    if (bgmStarted.current) return;
    bgmStarted.current = true;
    BGM.start(0.25);
  }, []);

  const handleAction = useCallback((action: GameAction) => {
    const elapsed = Date.now() - mountedAt.current;
    if (elapsed < 300) return;

    if (action === 'NAV_UP' || action === 'NAV_LEFT') {
      const newIdx = (focusRef.current - 1 + OPTIONS.length) % OPTIONS.length;
      focusRef.current = newIdx;
      setFocus(newIdx);
      play('nav');
    }
    if (action === 'NAV_DOWN' || action === 'NAV_RIGHT') {
      const newIdx = (focusRef.current + 1) % OPTIONS.length;
      focusRef.current = newIdx;
      setFocus(newIdx);
      play('nav');
    }
    if (action === 'CONFIRM') {
      unlockBGM();
      play('confirm');
      const opt = OPTIONS[focusRef.current];
      navigate(opt.screen);
    }
    if (action === 'BACK') {
      play('back');
    }
  }, [navigate, unlockBGM, play]);

  useInputManager(handleAction);

  return (
    <div
      onClick={unlockBGM}
      style={{
        width: "100%",
        height: "100vh",
        backgroundColor: BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "0 clamp(32px, 8vw, 120px)",
        boxSizing: "border-box",
        fontFamily: "'Barlow Condensed', sans-serif",
      }}
    >
      <div style={{ marginBottom: "clamp(40px, 8vh, 72px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(16px, 3vw, 28px)", marginBottom: "10px" }}>
          <FateProtocolSeal size={96} />

          <div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontStyle: "italic",
              fontWeight: 900,
              fontSize: "clamp(3.2rem, 9vw, 6.4rem)",
              lineHeight: 0.88,
              color: "#ffffff",
              letterSpacing: "0.06em",
              textShadow: `0 0 30px rgba(160, 230, 255, 0.25), 0 0 80px rgba(80, 160, 255, 0.15)`,
            }}>
              FATE
            </div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontStyle: "italic",
              fontWeight: 900,
              fontSize: "clamp(1.4rem, 3.8vw, 2.6rem)",
              lineHeight: 1,
              color: CYAN,
              letterSpacing: "0.28em",
              textShadow: `0 0 16px rgba(160, 230, 255, 0.6), 0 0 40px rgba(80, 180, 255, 0.3)`,
              marginTop: "2px",
            }}>
              PROTOCOL
            </div>
          </div>
        </div>

        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: "clamp(0.55rem, 1.2vw, 0.72rem)",
          color: "rgba(160, 230, 255, 0.38)",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          marginLeft: "4px",
          marginTop: "8px",
        }}>
          {"// v0.9.1-alpha  ·  TURN-BASED · GACHA · DARK ANIME"}
        </div>

        <div style={{
          marginTop: "20px",
          width: "clamp(200px, 40vw, 420px)",
          height: "1px",
          background: `linear-gradient(to right, ${PINK}, rgba(160, 230, 255, 0.3), transparent)`,
        }} />
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "0px" }} aria-label="Menú principal">
        {OPTIONS.map((opt, i) => (
          <MenuButton
            key={opt.label}
            label={opt.label}
            index={i}
            active={focus === i}
            onClick={() => {
              unlockBGM();
              play('confirm');
              navigate(opt.screen);
            }}
          />
        ))}
      </nav>

      <div style={{
        position: "fixed",
        bottom: "28px",
        right: "32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "4px",
      }}>
        <FateProtocolSeal size={32} />
        <span style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: "0.55rem",
          color: "rgba(160, 230, 255, 0.25)",
          letterSpacing: "0.2em",
        }}>
          FATE.PROTOCOL
        </span>
      </div>

      <div style={{
        position: "fixed",
        left: "16px",
        top: "50%",
        transform: "translateY(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
      }}>
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} style={{
            width: i % 3 === 1 ? "8px" : "3px",
            height: "1px",
            background: `rgba(160, 230, 255, ${i % 3 === 1 ? 0.4 : 0.15})`,
          }} />
        ))}
      </div>

      <MusicPlayer />
    </div>
  );
}
