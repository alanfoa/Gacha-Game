import { useRef, useEffect, useState, useCallback } from 'react';
import gsap from 'gsap';
import { useScreenStore } from '../../store/screenStore';
import { useInputManager, type GameAction } from '../../hooks/useInputManager';
import { useSound } from '../../hooks/useSound';
import { MusicPlayer } from '../UI/MusicPlayer';
import { BGM, DEFAULT_MENU_VOLUME } from '../../audio/sounds';
import { useGameStore } from '../../store/gameStore';

const OPTIONS = [
  { label: 'BATALLA', screen: 'teamSelect' as const },
  { label: 'TIENDA', screen: 'pack' as const },
  { label: 'MISIONES', screen: 'missions' as const },
  { label: 'MI ÁLBUM', screen: 'album' as const },
  { label: 'OPCIONES', screen: 'options' as const },
  { label: 'CERRAR SESIÓN', action: 'logout' as const },
] as const;

export function MenuScreen() {
  const navigate = useScreenStore((s) => s.navigate);
  const logout = useGameStore((s) => s.logout);
  const [focus, setFocus] = useState(0);
  const focusRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Auto-start BGM if not already playing (covers auto-detect flow)
  useEffect(() => {
    if (!BGM.isPlaying()) {
      BGM.start(DEFAULT_MENU_VOLUME);
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    try {
      gsap.timeline({ defaults: { duration: 0.15, ease: 'power2.out' } })
        .to('.menu-option', { skewX: 0, opacity: 1, stagger: 0.08 });
    } catch { /* GSAP no disponible */ }
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: '#0f0f1a',
        willChange: 'transform',
      }}
    >
      {/* Radial glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '600px',
          height: '600px',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Geometric background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(135deg, rgba(30,64,175,0.12) 0%, transparent 50%),
            linear-gradient(225deg, rgba(59,130,246,0.08) 0%, transparent 50%)
          `,
          clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 85%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            repeating-linear-gradient(
              -15deg,
              transparent,
              transparent 40px,
              rgba(59,130,246,0.05) 40px,
              rgba(59,130,246,0.05) 41px
            )
          `,
        }}
      />

      <p
        style={{
          color: '#60a5fa',
          fontSize: '0.875rem',
          fontWeight: 600,
          letterSpacing: '0.5em',
          textTransform: 'uppercase',
          marginBottom: '3rem',
          opacity: 0.9,
          position: 'relative',
          zIndex: 20,
        }}
      >
        GACHA PERSONA
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', zIndex: 10 }}>
        {OPTIONS.map((opt, i) => {
          const handleClick = 'screen' in opt
            ? () => { focusRef.current = i; setFocus(i); play('confirm'); navigate(opt.screen); }
            : () => { focusRef.current = i; setFocus(i); play('confirm'); logout(); BGM.switchToMenu(); navigate('mainmenu'); };
          return (
            <MenuOption
              key={opt.label}
              label={opt.label}
              focused={i === focus}
              onClick={handleClick}
              onHover={() => {
                focusRef.current = i;
                setFocus(i);
              }}
            />
          );
        })}
      </div>

      <p
        style={{
          position: 'absolute',
          bottom: '2rem',
          color: '#6b7280',
          fontSize: '0.75rem',
          letterSpacing: '0.2em',
          zIndex: 20,
        }}
      >
        FLECHAS · ENTER · GAMEPAD
      </p>

      <MusicPlayer />
    </div>
  );
}

function MenuOption({
  label,
  focused,
  onClick,
  onHover,
}: {
  label: string;
  focused: boolean;
  onClick: () => void;
  onHover: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    try {
      if (focused) {
        gsap.to(ref.current, {
          x: 20,
          scaleX: 1.15,
          backgroundColor: 'rgba(59,130,246,0.12)',
          borderColor: '#60a5fa',
          duration: 0.3,
          ease: 'power3.out',
        });
      } else {
        gsap.to(ref.current, {
          x: 0,
          scaleX: 1,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          duration: 0.3,
          ease: 'power3.out',
        });
      }
    } catch { /* GSAP no disponible */ }
  }, [focused]);

  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseEnter={onHover}
      className="menu-option"
      style={{
        opacity: 0,
        transform: 'skewX(-15deg)',
        background: 'transparent',
        border: '1px solid transparent',
        padding: '1rem 3rem',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'none',
        minWidth: '350px',
        position: 'relative',
        willChange: 'transform',
      }}
    >
      <span
        style={{
          fontSize: '2.5rem',
          fontWeight: 900,
          color: focused ? '#ffffff' : '#9ca3af',
          letterSpacing: '0.05em',
          fontFamily: 'system-ui, sans-serif',
          transition: 'color 0.3s ease',
          textShadow: focused ? '0 0 20px rgba(96,165,250,0.3)' : 'none',
        }}
      >
        {label}
      </span>
      {focused && (
        <span
          style={{
            position: 'absolute',
            right: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#60a5fa',
            fontSize: '1.5rem',
            textShadow: '0 0 10px rgba(96,165,250,0.5)',
          }}
        >
          ▶
        </span>
      )}
    </button>
  );
}
