import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { useScreenStore } from '../../store/screenStore';
import { useInputManager, type GameAction } from '../../hooks/useInputManager';
import { useSound } from '../../hooks/useSound';
import { useGameStore } from '../../store/gameStore';
import { MusicPlayer } from '../UI/MusicPlayer';
import { BGM, DEFAULT_MENU_VOLUME } from '../../audio/sounds';

const OPTIONS = [
  { label: 'BATALLA', screen: 'teamSelect' as const },
  { label: 'TIENDA', screen: 'pack' as const },
  { label: 'MISIONES', screen: 'missions' as const },
  { label: 'MI ÁLBUM', screen: 'album' as const },
  { label: 'OPCIONES', screen: 'options' as const },
  { label: 'CERRAR SESIÓN', action: 'logout' as const },
] as const;

const OPTION_DESCRIPTIONS: Record<string, string> = {
  BATALLA: 'Enfréntate a otros jugadores',
  TIENDA: 'Compra sobres de cartas',
  MISIONES: 'Completa misiones diarias',
  'MI ÁLBUM': 'Revisa tu colección',
  OPCIONES: 'Configuración del juego',
  'CERRAR SESIÓN': 'Volver al menú principal',
};

function getItemFontSize(index: number): string {
  const base = 2.9 + index * 0.06;
  return `clamp(2rem, ${base}vw, ${(base * 0.9).toFixed(2)}rem)`;
}

function MenuOption({
  label,
  isSelected,
  index,
  onClick,
}: {
  label: string;
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
        {label}
      </span>
    </motion.div>
  );
}

export function MenuScreen() {
  const navigate = useScreenStore((s) => s.navigate);
  const logout = useGameStore((s) => s.logout);
  const user = useGameStore((s) => s.user);
  const [focus, setFocus] = useState(0);
  const focusRef = useRef(0);
  const mountedAt = useRef(Date.now());
  const { play } = useSound();

  const handleAction = useCallback((action: GameAction) => {
    const elapsed = Date.now() - mountedAt.current;
    if (elapsed < 300) return;

    if (action === 'NAV_UP' || action === 'NAV_LEFT') {
      focusRef.current = (focusRef.current - 1 + OPTIONS.length) % OPTIONS.length;
      setFocus(focusRef.current);
      play('nav');
    }
    if (action === 'NAV_DOWN' || action === 'NAV_RIGHT') {
      focusRef.current = (focusRef.current + 1) % OPTIONS.length;
      setFocus(focusRef.current);
      play('nav');
    }
    if (action === 'CONFIRM') {
      play('confirm');
      const opt = OPTIONS[focusRef.current];
      if ('screen' in opt) {
        navigate(opt.screen);
      } else if (opt.action === 'logout') {
        logout();
        BGM.switchToMenu();
        navigate('mainmenu');
      }
    }
    if (action === 'BACK') {
      navigate('mainmenu');
    }
  }, [navigate, play, logout]);

  useInputManager(handleAction);

  useEffect(() => {
    if (!BGM.isPlaying()) {
      BGM.start(DEFAULT_MENU_VOLUME);
    }
  }, []);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) {
        focusRef.current = (focusRef.current + 1) % OPTIONS.length;
        setFocus(focusRef.current);
        play('nav');
      } else {
        focusRef.current = (focusRef.current - 1 + OPTIONS.length) % OPTIONS.length;
        setFocus(focusRef.current);
        play('nav');
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [play]);

  const currentOption = OPTIONS[focus];

  return (
    <div className="w-full h-screen overflow-hidden relative" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
      <video
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
      >
        <source src="/videos/persona_3_remake_loop.mp4" type="video/mp4" />
      </video>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      <motion.div
        style={{ position: 'absolute', top: '5.5%', left: '3%', zIndex: 20 }}
        initial={{ x: -260, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 255, damping: 26, delay: 0.5 }}
      >
        <div
          style={{
            background: 'white',
            border: '2.5px solid #111',
            padding: '8px 18px 8px 14px',
            minWidth: '148px',
          }}
        >
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '1.65rem',
              fontWeight: 700,
              color: '#0A0A0A',
              lineHeight: 1.1,
              letterSpacing: '0.01em',
            }}
          >
            ¥ {user?.coins?.toLocaleString() ?? '0'}
          </div>
          <div
            style={{
              fontSize: '0.62rem',
              color: '#555',
              marginTop: '2px',
              letterSpacing: '0.08em',
            }}
          >
            current wallet
          </div>
        </div>
      </motion.div>

      <div
        style={{
          position: 'absolute',
          left: '47%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {OPTIONS.map((opt, i) => (
            <MenuOption
              key={opt.label}
              label={opt.label}
              isSelected={focus === i}
              index={i}
              onClick={() => {
                const elapsed = Date.now() - mountedAt.current;
                if (elapsed < 300) return;
                play('confirm');
                if ('screen' in opt) {
                  navigate(opt.screen);
                } else if (opt.action === 'logout') {
                  logout();
                  BGM.switchToMenu();
                  navigate('mainmenu');
                }
              }}
            />
          ))}
        </div>
      </div>

      <motion.div
        key={focus}
        style={{
          position: 'absolute',
          top: '7%',
          right: '4%',
          textAlign: 'right',
          zIndex: 20,
        }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
      >
        <div
          style={{
            color: 'rgba(255,255,255,0.65)',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '0.82rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            maxWidth: '220px',
            textShadow: '0 2px 8px rgba(0,0,0,0.7)',
          }}
        >
          {OPTION_DESCRIPTIONS[currentOption.label]}
        </div>
      </motion.div>

      <div
        style={{
          position: 'absolute',
          bottom: '4%',
          right: '3%',
          textAlign: 'right',
          zIndex: 20,
        }}
      >
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            color: 'white',
            fontSize: '1.1rem',
            letterSpacing: '0.03em',
            textShadow: '0 2px 8px rgba(0,0,0,0.7)',
          }}
        >
          CONFIRMAR
        </div>
        <div
          style={{
            color: 'rgba(255,255,255,0.45)',
            fontSize: '0.6rem',
            letterSpacing: '0.35em',
            marginTop: '3px',
            marginBottom: '7px',
            textShadow: '0 2px 8px rgba(0,0,0,0.7)',
          }}
        >
          Command ───────────────
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '18px',
            alignItems: 'center',
          }}
        >
          {[
            { label: 'A', text: 'Confirm' },
            { label: 'B', text: 'Cerrar' },
          ].map(({ label, text }) => (
            <span
              key={label}
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <span
                style={{
                  background: 'white',
                  color: '#0A0A1A',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  flexShrink: 0,
                }}
              >
                {label}
              </span>
              <span
                style={{
                  color: 'white',
                  fontSize: '0.88rem',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 600,
                  textShadow: '0 2px 8px rgba(0,0,0,0.7)',
                }}
              >
                {text}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '4%',
          left: '3%',
          color: 'rgba(255,255,255,0.45)',
          fontSize: '0.72rem',
          fontFamily: "'Barlow Condensed', sans-serif",
          letterSpacing: '0.15em',
          zIndex: 20,
          textShadow: '0 2px 8px rgba(0,0,0,0.7)',
        }}
      >
        ↑ ↓  NAVEGAR  •  SCROLL
      </div>

      <MusicPlayer />
    </div>
  );
}
