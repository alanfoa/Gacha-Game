import { useRef, useEffect, useState, useCallback } from 'react';
import gsap from 'gsap';
import { useScreenStore } from '../../store/screenStore';
import { useInputManager, type GameAction } from '../../hooks/useInputManager';
import { useSound } from '../../hooks/useSound';
import { BGM } from '../../audio/sounds';
import { MusicPlayer } from '../UI/MusicPlayer';

const OPTIONS = [
  { label: 'NUEVA PARTIDA', screen: 'saveSlots' as const },
  { label: 'CARGAR PARTIDA', screen: 'saveSlots' as const },
  { label: 'OPCIONES', screen: 'options' as const },
];

export function MenuPrincipal() {
  const navigate = useScreenStore((s) => s.navigate);
  const [focus, setFocus] = useState(0);
  const focusRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!containerRef.current) return;
    try {
      gsap.set('.mp-option', { opacity: 0.15 });
      gsap.timeline({ defaults: { duration: 0.15, ease: 'power2.out' } })
        .to('.mp-option', { skewX: 0, opacity: 1, stagger: 0.08 });
    } catch { /* GSAP no disponible */ }
  }, []);

  return (
    <div
      ref={containerRef}
      onClick={unlockBGM}
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: '#011367',
        cursor: 'default',
      }}
    >
      {/* Radial glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '800px',
          height: '800px',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Geometric background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(135deg, rgba(30,64,175,0.15) 0%, transparent 50%),
            linear-gradient(225deg, rgba(59,130,246,0.1) 0%, transparent 50%)
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

      {/* Logo */}
      <div style={{ position: 'relative', zIndex: 20, marginBottom: '4rem', textAlign: 'center' }}>
        <h1 style={{
          fontSize: '5rem',
          fontWeight: 900,
          letterSpacing: '-0.05em',
          transform: 'skewX(-12deg)',
          color: '#ffffff',
          textShadow: '0 0 40px rgba(96,165,250,0.15)',
          margin: 0,
          lineHeight: 1.1,
        }}>
          FATE
        </h1>
        <h1 style={{
          fontSize: '5rem',
          fontWeight: 900,
          letterSpacing: '-0.05em',
          transform: 'skewX(-12deg)',
          color: '#60a5fa',
          textShadow: '0 0 40px rgba(96,165,250,0.3)',
          margin: 0,
          lineHeight: 1.1,
        }}>
          PROTOCOL
        </h1>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', zIndex: 10 }}>
          {OPTIONS.map((opt, i) => (
            <button
              key={opt.label}
              className="mp-option"
              onClick={() => {
                unlockBGM();
                play('confirm');
                navigate(opt.screen);
              }}
              onMouseEnter={() => { focusRef.current = i; setFocus(i); }}
              style={{
                opacity: i === focus ? 1 : 0.9,
                transform: 'skewX(-15deg)',
                background: i === focus ? 'rgba(59,130,246,0.12)' : 'transparent',
                border: i === focus ? '1px solid #60a5fa' : '1px solid transparent',
                padding: '0.9rem 3rem',
                cursor: 'pointer',
                textAlign: 'left',
                minWidth: '360px',
                position: 'relative',
                transition: 'background 0.3s ease, border-color 0.3s ease',
                outline: 'none',
              }}
            >
              <span style={{
                fontSize: '2.2rem',
                fontWeight: 900,
                color: i === focus ? '#ffffff' : '#9ca3af',
                letterSpacing: '0.05em',
                textShadow: i === focus ? '0 0 20px rgba(96,165,250,0.3)' : 'none',
              }}>
                {opt.label}
              </span>
              {i === focus && (
                <span style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#60a5fa',
                  fontSize: '1.5rem',
                  textShadow: '0 0 10px rgba(96,165,250,0.5)',
                }}>
                  ▶
                </span>
              )}
            </button>
          ))}
      </div>

      <MusicPlayer />
    </div>
  );
}
