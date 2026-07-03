import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGameStore } from './store/gameStore';
import { useScreenStore } from './store/screenStore';
import { MenuScreen } from './components/Menu/MenuScreen';
import { PackScreen } from './components/Sobre/PackScreen';
import { AlbumScreen } from './components/Album/AlbumScreen';
import { OptionsScreen } from './components/UI/OptionsScreen';
import { TeamSelectScreen } from './components/Battle/TeamSelectScreen';
import { BattleScreen } from './components/Battle/BattleScreen';
import { MissionsScreen } from './components/Missions/MissionsScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Spinner } from './components/UI/Spinner';
import { useSound } from './hooks/useSound';
import { BGM } from './audio/sounds';

function App() {
  const { token, user, fetchProfile, fetchCards, fetchPacks, loading, error, register } = useGameStore();
  const current = useScreenStore((s) => s.current);
  const { startBGM } = useSound();
  const [name, setName] = useState('');
  const bgmStarted = useRef(false);
  const autoRegistering = useRef(false);
  const prevScreenRef = useRef(current);
  const curtainRef = useRef<HTMLDivElement>(null);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (token && !user) {
      fetchProfile();
    }
    if (token) {
      fetchCards();
      fetchPacks();
    }
  }, [token, user, fetchProfile, fetchCards, fetchPacks]);

  useEffect(() => {
    if (user && !bgmStarted.current) {
      bgmStarted.current = true;
      startBGM(0.25);
    }
    if (!token) {
      bgmStarted.current = false;
      try { BGM.stop(); } catch {}
    }
  }, [user, token, startBGM]);

  // Glass shatter transition between screens
  useEffect(() => {
    if (!user) { prevScreenRef.current = current; return; }
    if (prevScreenRef.current === current) return;
    setTransitioning(true);
    const curtain = curtainRef.current;
    if (curtain) {
      gsap.set(curtain, { clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' });
      gsap.to(curtain, {
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
        duration: 0.2, ease: 'power2.out',
        onComplete: () => {
          prevScreenRef.current = current;
          gsap.to(curtain, {
            clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)',
            duration: 0.25, ease: 'power2.in',
            onComplete: () => setTransitioning(false),
          });
        },
      });
    }
  }, [current, user]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !autoRegistering.current) {
      autoRegistering.current = true;
      register(name.trim()).finally(() => { autoRegistering.current = false; });
    }
  };

  // Login screen
  if (!token) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f0f1a',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}>
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
        <h1 style={{ fontSize: '4rem', fontWeight: 900, letterSpacing: '-0.05em', marginBottom: '0.5rem', transform: 'skewX(-10deg)', color: '#ffffff', textShadow: '0 0 30px rgba(96,165,250,0.15)' }}>
          GACHA
        </h1>
        <h1 style={{ fontSize: '4rem', fontWeight: 900, letterSpacing: '-0.05em', marginBottom: '2rem', transform: 'skewX(-10deg)', color: '#60a5fa', textShadow: '0 0 30px rgba(96,165,250,0.3)' }}>
          PERSONA
        </h1>
        <p style={{ marginBottom: '2rem', color: '#9ca3af', fontSize: '0.875rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Ingresa tu nombre para comenzar
        </p>
        <form onSubmit={handleRegister} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre..."
            style={{
              padding: '0.75rem 1rem',
              fontSize: '1rem',
              borderRadius: '4px',
              border: '1px solid #4b5563',
              background: '#1e1e3a',
              color: 'white',
              outline: 'none',
              width: '250px',
            }}
          />
          <button
            type="submit"
            disabled={loading || !name.trim()}
            style={{
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              fontWeight: 700,
              background: loading || !name.trim() ? '#374151' : '#2563eb',
              color: 'white',
              border: '2px solid #60a5fa',
              borderRadius: '4px',
              cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
              transform: 'skewX(-10deg)',
            }}
          >
            {loading ? '...' : 'JUGAR'}
          </button>
        </form>
        {error && <p style={{ marginTop: '1rem', color: '#ef4444', fontSize: '0.875rem' }}>{error}</p>}
      </div>
    );
  }

  // Loading profile
  if (!user) {
    if (error) {
      return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', background: '#0f0f1a', color: '#9ca3af' }}>
          <p style={{ color: '#ef4444' }}>{error}</p>
          <button
            onClick={fetchProfile}
            style={{
              padding: '0.75rem 2rem',
              background: 'transparent',
              border: '1px solid #60a5fa',
              color: '#60a5fa',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            REINTENTAR
          </button>
        </div>
      );
    }
    return <Spinner text="CONECTANDO" />;
  }

  // Screen router
  const screen = (() => {
    try {
      switch (current) {
        case 'menu':
          return <MenuScreen />;
        case 'pack':
          return <PackScreen />;
        case 'album':
          return <AlbumScreen />;
        case 'options':
          return <OptionsScreen />;
        case 'teamSelect':
          return <TeamSelectScreen />;
        case 'battle':
          return <BattleScreen />;
        case 'missions':
          return <MissionsScreen />;
        default:
          return <MenuScreen />;
      }
    } catch {
      return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a', color: '#ef4444' }}>
          <p>Error al cargar la pantalla</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.75rem 2rem', background: 'transparent', border: '1px solid #60a5fa', color: '#60a5fa', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
            REINTENTAR
          </button>
        </div>
      );
    }
  })();

  return (
    <ErrorBoundary>
      <div style={{ position: 'relative' }}>
        {/* Coins bar - hidden during battle */}
        {current !== 'battle' && (
          <div
            style={{
              position: 'fixed', top: '1rem', right: '1.5rem',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              color: '#facc15',
              fontSize: '1.3rem',
              fontWeight: 900,
              zIndex: 9000,
              textShadow: '0 0 12px rgba(250,204,21,0.6)',
              pointerEvents: 'none',
            }}
          >
            🪙 {user?.coins ?? 0}
          </div>
        )}

        <div
          ref={curtainRef}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: '#0f0f1a',
            pointerEvents: transitioning ? 'auto' : 'none',
            clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)',
          }}
        />
        {screen}
      </div>
    </ErrorBoundary>
  );
}

export default App;
