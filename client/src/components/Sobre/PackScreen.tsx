import { useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { useScreenStore } from '../../store/screenStore';
import { useGameStore } from '../../store/gameStore';
import { useInputManager, type GameAction } from '../../hooks/useInputManager';
import { useSound } from '../../hooks/useSound';
import { PlaceholderCard } from '../UI/PlaceholderCard';
import { PackScene3D } from './PackScene3D';

export function PackScreen() {
  const back = useScreenStore((s) => s.back);
  const { user, openPack } = useGameStore();
  const flashRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);

  const [lastResult, setLastResult] = useState<{
    card: { id: string; name: string; rarity: string };
    isNew: boolean;
  } | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hypeRarity, setHypeRarity] = useState<string | null>(null);
  const [sceneKey, setSceneKey] = useState(0);

  const [cardRarity, setCardRarity] = useState<string | null>(null);
  const [cardName, setCardName] = useState<string | null>(null);
  const [skip, setSkip] = useState(false);

  const isOpeningRef = useRef(false);
  const skipOpeningRef = useRef(false);
  const coinsRef = useRef(user?.coins ?? 0);
  coinsRef.current = user?.coins ?? 0;
  const { play } = useSound();

  const handleAction = useCallback((action: GameAction) => {
    if (action === 'BACK' && !isOpeningRef.current) {
      if (lastResult) {
        handleReset();
      } else {
        back();
      }
    }
    if (action === 'CONFIRM' && !isOpeningRef.current && coinsRef.current >= 100 && !lastResult) {
      handleOpen();
    }
  }, [back, lastResult]);

  useInputManager(handleAction);

  const doHype = (rarity: string) => {
    if (rarity !== 'EPICO' && rarity !== 'LEGENDARIO') return;

    setHypeRarity(rarity);
    play('cardReveal', rarity);

    if (flashRef.current) {
      const color = rarity === 'LEGENDARIO' ? 'rgba(250,204,21,0.5)' : 'rgba(96,165,250,0.4)';
      gsap.fromTo(flashRef.current,
        { backgroundColor: color, opacity: 0.7 },
        { opacity: 0, duration: rarity === 'LEGENDARIO' ? 1.2 : 0.8, ease: 'power2.out' },
      );
    }

    if (skipRef.current) {
      gsap.to(skipRef.current, { opacity: 0, pointerEvents: 'none', duration: 0.2 });
    }
  };

  const handleReset = () => {
    setLastResult(null);
    setHypeRarity(null);
    setCardRarity(null);
    setCardName(null);
    setSkip(false);
    setSceneKey((k) => k + 1);
  };

  const handleOpen = async () => {
    if (isOpeningRef.current) return;
    isOpeningRef.current = true;
    skipOpeningRef.current = false;
    setIsOpening(true);
    setError(null);
    setHypeRarity(null);
    play('packOpen');

    await new Promise((r) => setTimeout(r, 300));
    if (skipOpeningRef.current) { setIsOpening(false); isOpeningRef.current = false; return; }

    const result = await openPack();

    if (!result) {
      isOpeningRef.current = false;
      setIsOpening(false);
      setError('Error al abrir el sobre. Intentalo de nuevo.');
      return;
    }

    if (skipOpeningRef.current) {
      doHype(result.card.rarity);
      setLastResult({ card: result.card, isNew: result.isNew });
      if (!result.isNew) play('duplicate');
      setCardRarity(result.card.rarity);
      setCardName(result.card.name);
      setHypeRarity(null);
      isOpeningRef.current = false;
      setIsOpening(false);
      return;
    }

    doHype(result.card.rarity);
    setLastResult({ card: result.card, isNew: result.isNew });
    if (!result.isNew) play('duplicate');
    setCardRarity(result.card.rarity);
    setCardName(result.card.name);
    setTimeout(() => setHypeRarity(null), 800);

    isOpeningRef.current = false;
    setIsOpening(false);
  };

  const handleSkip = () => {
    skipOpeningRef.current = true;
    setSkip(true);
    setHypeRarity(null);
    if (skipRef.current) {
      gsap.to(skipRef.current, { opacity: 0, pointerEvents: 'none', duration: 0.2 });
    }
  };

  const card = lastResult?.card;
  const showCard = card && !hypeRarity;
  const hypeIsLegendary = hypeRarity === 'LEGENDARIO';

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        background: '#0f0f1a',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <PackScene3D
        key={sceneKey}
        cardRarity={cardRarity}
        cardName={cardName}
        skip={skip}
      />

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            ref={flashRef}
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
            }}
          />

          {hypeRarity && (
            <div
              style={{
                position: 'absolute',
                top: '30%',
                pointerEvents: 'none',
              }}
            >
              <span
                style={{
                  fontSize: '3rem',
                  fontWeight: 900,
                  color: hypeIsLegendary ? '#facc15' : '#60a5fa',
                  textShadow: hypeIsLegendary
                    ? '0 0 40px rgba(250,204,21,0.8), 0 0 80px rgba(250,204,21,0.4)'
                    : '0 0 40px rgba(96,165,250,0.8), 0 0 80px rgba(96,165,250,0.4)',
                  letterSpacing: '0.3em',
                  opacity: 0,
                  transform: 'scale(0.5)',
                }}
                ref={(el) => {
                  if (el) {
                    gsap.fromTo(el,
                      { opacity: 0, scale: 0.5, rotation: -10 },
                      {
                        opacity: 1, scale: 1.2, rotation: 0,
                        duration: 0.4, ease: 'back.out(2)',
                        yoyo: true, repeat: 1,
                      },
                    );
                  }
                }}
              >
                {hypeIsLegendary ? '★ LEGENDARIO ★' : '▲ ÉPICO'}
              </span>
            </div>
          )}

          <button
            onClick={() => {
              if (lastResult) {
                handleReset();
              } else {
                back();
              }
            }}
            style={{
              position: 'absolute',
              top: '1.5rem',
              left: '1.5rem',
              background: 'transparent',
              border: '1px solid #4b5563',
              color: '#d1d5db',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              pointerEvents: 'auto',
              zIndex: 20,
            }}
          >
            {lastResult ? '← MENÚ' : '← VOLVER'}
          </button>

          <div
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              color: '#facc15',
              fontSize: '1.5rem',
              fontWeight: 900,
              pointerEvents: 'auto',
              zIndex: 20,
              textShadow: '0 0 12px rgba(250,204,21,0.6)',
            }}
          >
            🪙 {user?.coins ?? 0}
          </div>

          {!lastResult && !error && (
            <>
              {isOpening && (
                <button
                  ref={skipRef}
                  onClick={handleSkip}
                  style={{
                    position: 'absolute',
                    bottom: '4rem',
                    padding: '0.5rem 1.5rem',
                    background: 'transparent',
                    border: '1px solid #6b7280',
                    color: '#9ca3af',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    letterSpacing: '0.2em',
                    opacity: 0.7,
                    transition: 'opacity 0.2s',
                    pointerEvents: 'auto',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; }}
                >
                  SALTAR ▶▶
                </button>
              )}

              {!isOpening && (
                <p
                  style={{
                    position: 'absolute',
                    bottom: '4rem',
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    letterSpacing: '0.2em',
                  }}
                >
                  PRESIONA ENTER O HAZ CLIC
                </p>
              )}
            </>
          )}

          {error && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', pointerEvents: 'auto', zIndex: 20, position: 'relative' }}>
              <p style={{ color: '#ef4444', fontSize: '1rem', fontWeight: 600 }}>{error}</p>
              <button
                onClick={() => setError(null)}
                style={{
                  padding: '0.75rem 2rem',
                  background: 'transparent',
                  border: '1px solid #60a5fa',
                  color: '#60a5fa',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                REINTENTAR
              </button>
            </div>
          )}

          {showCard && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', pointerEvents: 'auto', zIndex: 20, position: 'relative' }}>
              <PlaceholderCard rarity={card.rarity} name={card.name} />
              {!lastResult?.isNew && (
                <p style={{ color: '#facc15', fontWeight: 700, fontSize: '1.125rem', textShadow: '0 0 8px rgba(250,204,21,0.4)' }}>
                  ⚡ DUPLICADO +25 monedas
                </p>
              )}
              <button
                onClick={handleReset}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem 2rem',
                  background: 'transparent',
                  border: '1px solid #60a5fa',
                  color: '#60a5fa',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                ABRIR OTRO
              </button>
            </div>
          )}

          {(user?.coins ?? 0) < 100 && !lastResult && !error && (
            <p style={{ position: 'absolute', bottom: '6rem', color: '#ef4444', fontSize: '0.875rem', fontWeight: 600 }}>
              MONEDAS INSUFICIENTES
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
