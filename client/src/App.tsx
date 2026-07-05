import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGameStore } from './store/gameStore';
import { useScreenStore } from './store/screenStore';
import { MenuPrincipal } from './components/Menu/MenuPrincipal';
import { LoginScreen } from './components/Menu/LoginScreen';
import { MenuScreen } from './components/Menu/MenuScreen';
import { PackOpeningFlow } from './components/PackOpening/PackOpeningFlow';
import { AlbumScreen } from './components/Album/AlbumScreen';
import { OptionsScreen } from './components/UI/OptionsScreen';
import { TeamSelectScreen } from './components/Battle/TeamSelectScreen';
import { BattleScreen } from './components/Battle/BattleScreen';
import { MissionsScreen } from './components/Missions/MissionsScreen';
import { SaveSlotsScreen } from './components/Menu/SaveSlotsScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Spinner } from './components/UI/Spinner';
import { useSaveSlotsStore } from './store/saveSlotsStore';

function App() {
  const { token, user, fetchProfile, fetchCards, fetchPacks, error, switchToken } = useGameStore();
  const current = useScreenStore((s) => s.current);
  const navigate = useScreenStore((s) => s.navigate);
  const prevScreenRef = useRef(current);
  const curtainRef = useRef<HTMLDivElement>(null);
  const [transitioning, setTransitioning] = useState(false);
  const startupDone = useRef(false);

  // Auto-detect active slot on first mount
  useEffect(() => {
    if (startupDone.current) return;
    startupDone.current = true;
    const { activeSlot, slots } = useSaveSlotsStore.getState();
    if (activeSlot !== null && slots[activeSlot]?.token) {
      switchToken(slots[activeSlot].token!);
      navigate('menu');
    }
  }, [switchToken, navigate]);

  useEffect(() => {
    if (token && !user) {
      fetchProfile();
    }
    if (token) {
      fetchCards();
      fetchPacks();
    }
  }, [token, user, fetchProfile, fetchCards, fetchPacks]);

  // Glass shatter transition between screens
  useEffect(() => {
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
  }, [current]);

  // Screen router
  const publicScreens = ['mainmenu', 'login', 'saveSlots', 'options'];
  const needsAuth = !publicScreens.includes(current);
  if (needsAuth && !user) {
    if (error) {
      return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', background: '#011367', color: '#9ca3af' }}>
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
  const screen = (() => {
    try {
      switch (current) {
        case 'mainmenu':
          return <MenuPrincipal />;
        case 'login':
          return <LoginScreen />;
        case 'saveSlots':
          return <SaveSlotsScreen />;
        case 'menu':
          return <MenuScreen />;
        case 'pack':
          return <PackOpeningFlow />;
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
          return <MenuPrincipal />;
      }
    } catch {
      return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#011367', color: '#ef4444' }}>
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
      <div>
        {/* Coins bar - hidden on public screens and battle */}
        <div
          ref={curtainRef}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: '#011367',
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
