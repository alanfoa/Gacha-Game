import { useRef, useState, useCallback, useEffect } from 'react';
import gsap from 'gsap';
import { useScreenStore } from '../../store/screenStore';
import { useGameStore } from '../../store/gameStore';
import type { PackTypeInfo } from '../../store/gameStore';
import { useInputManager, type GameAction } from '../../hooks/useInputManager';
import { useSound } from '../../hooks/useSound';
import { PlaceholderCard } from '../UI/PlaceholderCard';
import { PackScene3D } from './PackScene3D';

type Phase = 'store' | 'opening' | 'revealed' | 'contents';

export function PackScreen() {
  const back = useScreenStore((s) => s.back);
  const navigate = useScreenStore((s) => s.navigate);
  const screenParams = useScreenStore((s) => s.screenParams);
  const { user, packTypes, openPack, fetchPacks } = useGameStore();
  const flashRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const { play } = useSound();
  const autoOpenedRef = useRef(false);
  const wasFreePack = useRef(false);

  const [phase, setPhase] = useState<Phase>('store');
  const [selectedPack, setSelectedPack] = useState<PackTypeInfo | null>(null);
  const [lastResult, setLastResult] = useState<{
    cards: { card: { id: string; name: string; rarity: string; stats: { attack: number; defense: number; magic: number; luck: number; speed: number } }; isNew: boolean }[];
    user: { coins: number };
  } | null>(null);
  const [contentsIndex, setContentsIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hypeRarity, setHypeRarity] = useState<string | null>(null);
  const [skip, setSkip] = useState(false);

  const [focus, setFocus] = useState(0);
  const focusRef = useRef(0);

  const backBtnRef = useRef<HTMLButtonElement>(null);
  const revealBtnRef = useRef<HTMLButtonElement>(null);
  const contentsBtnRef = useRef<HTMLButtonElement>(null);

  const isOpeningRef = useRef(false);
  const skipOpeningRef = useRef(false);

  useEffect(() => {
    if (packTypes.length === 0) fetchPacks();
  }, [packTypes, fetchPacks]);

  useEffect(() => {
    if (screenParams?.freePack && packTypes.length > 0 && !autoOpenedRef.current) {
      autoOpenedRef.current = true;
      wasFreePack.current = true;
      const basic = packTypes.find((p) => p.id === 'basico');
      if (basic) handleOpenPack(basic, true);
    }
  }, [screenParams, packTypes]);

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

  const resetToStore = () => {
    if (wasFreePack.current) {
      wasFreePack.current = false;
      navigate('missions');
      return;
    }
    setPhase('store');
    setSelectedPack(null);
    setLastResult(null);
    setHypeRarity(null);
    setContentsIndex(0);
    setSkip(false);
    setFocus(0);
    focusRef.current = 0;
  };

  const handleOpenPack = async (pack: PackTypeInfo, freePack = false) => {
    if (isOpeningRef.current || (!freePack && (user?.coins ?? 0) < pack.cost)) return;
    isOpeningRef.current = true;
    skipOpeningRef.current = false;
    setSelectedPack(pack);
    setPhase('opening');
    setError(null);
    setHypeRarity(null);
    play('packOpen');

    await new Promise((r) => setTimeout(r, 300));
    if (skipOpeningRef.current) { isOpeningRef.current = false; return; }

    const result = await openPack(pack.id, freePack);
    if (!result) {
      isOpeningRef.current = false;
      setPhase('store');
      setError('Error al abrir el sobre. Intentalo de nuevo.');
      return;
    }

    if (skipOpeningRef.current) {
      const best = getBestCard(result.cards);
      doHype(best.card.rarity);
      setLastResult(result);
      if (!best.isNew) play('duplicate');
      setHypeRarity(null);
      isOpeningRef.current = false;
      setFocus(0);
      focusRef.current = 0;
      setPhase('contents');
      setContentsIndex(0);
      return;
    }

    const best = getBestCard(result.cards);
    doHype(best.card.rarity);
    setLastResult(result);
    if (!best.isNew) play('duplicate');
    setTimeout(() => setHypeRarity(null), 800);

    isOpeningRef.current = false;
    setFocus(0);
    focusRef.current = 0;
    setPhase('revealed');
  };

  const getBestCard = (cards: {
    card: { id: string; name: string; rarity: string; stats: { attack: number; defense: number; magic: number; luck: number; speed: number } };
    isNew: boolean;
  }[]) => {
    const order: Record<string, number> = { LEGENDARIO: 4, EPICO: 3, RARO: 2, COMUN: 1 };
    let best = cards[0];
    for (const c of cards) {
      if ((order[c.card.rarity] ?? 0) > (order[best.card.rarity] ?? 0)) best = c;
    }
    return best;
  };

  const handleSkip = () => {
    skipOpeningRef.current = true;
    setSkip(true);
    setHypeRarity(null);
    if (skipRef.current) {
      gsap.to(skipRef.current, { opacity: 0, pointerEvents: 'none', duration: 0.2 });
    }
  };

  const goToContents = () => {
    setPhase('contents');
    setContentsIndex(0);
    play('confirm');
  };

  const handleAction = useCallback((action: GameAction) => {
    if (phase === 'opening') {
      if (action === 'CONFIRM') handleSkip();
      return;
    }

    if (phase === 'store') {
      const itemCount = packTypes.length + 1;
      if (action === 'NAV_LEFT' || action === 'NAV_UP') {
        focusRef.current = (focusRef.current - 1 + itemCount) % itemCount;
        setFocus(focusRef.current);
        play('nav');
        return;
      }
      if (action === 'NAV_RIGHT' || action === 'NAV_DOWN') {
        focusRef.current = (focusRef.current + 1) % itemCount;
        setFocus(focusRef.current);
        play('nav');
        return;
      }
      if (action === 'CONFIRM') {
        if (focusRef.current < packTypes.length) {
          handleOpenPack(packTypes[focusRef.current]);
          play('confirm');
        } else {
          play('back');
          back();
        }
        return;
      }
      if (action === 'BACK') { back(); return; }
    }

    if (phase === 'revealed') {
      if (action === 'CONFIRM') { goToContents(); return; }
      if (action === 'BACK') { goToContents(); return; }
    }

    if (phase === 'contents') {
      if (!lastResult) return;
      const total = lastResult.cards.length;
      if (action === 'NAV_LEFT') {
        setContentsIndex((prev) => (prev - 1 + total) % total);
        play('nav');
        return;
      }
      if (action === 'NAV_RIGHT') {
        setContentsIndex((prev) => (prev + 1) % total);
        play('nav');
        return;
      }
      if (action === 'CONFIRM') { resetToStore(); play('confirm'); return; }
      if (action === 'BACK') { resetToStore(); return; }
    }
  }, [phase, back, navigate, user?.coins, packTypes, lastResult]);

  useInputManager(handleAction);

  useEffect(() => {
    if (phase !== 'store') return;
    const items = packTypes.length + 1;
    for (let i = 0; i < items; i++) {
      const ref = i < packTypes.length
        ? document.getElementById(`pack-btn-${i}`)
        : backBtnRef.current;
      if (ref) {
        gsap.set(ref, { scale: 1, borderColor: '#4b5563' });
      }
    }
    if (focus < packTypes.length) {
      const el = document.getElementById(`pack-btn-${focus}`);
      if (el) gsap.to(el, { scale: 1.06, borderColor: '#93bbfc', duration: 0.2, ease: 'power2.out' });
    } else {
      if (backBtnRef.current) gsap.to(backBtnRef.current, { scale: 1.06, borderColor: '#93bbfc', duration: 0.2, ease: 'power2.out' });
    }
  }, [focus, phase, packTypes.length]);

  useEffect(() => {
    if (phase !== 'revealed' || !revealBtnRef.current) return;
    gsap.fromTo(revealBtnRef.current, { scale: 1 }, { scale: 1.06, duration: 0.3, ease: 'power2.out', yoyo: true, repeat: -1 });
  }, [phase]);

  const hypeIsLegendary = hypeRarity === 'LEGENDARIO';
  const bestCard = lastResult ? getBestCard(lastResult.cards) : null;

  const packSceneColor = selectedPack?.color ?? '#3b82f6';

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw', overflow: 'hidden', background: '#0f0f1a' }}>
      {/* 3D scene - always mounted, swaps between envelope and fan mode */}
      <PackScene3D
        cardRarity={bestCard?.card.rarity ?? null}
        cardName={bestCard?.card.name ?? null}
        cardId={bestCard?.card.id ?? null}
        cardStats={bestCard?.card.stats ?? null}
        skip={skip}
        packColor={packSceneColor}
        mode={phase === 'contents' ? 'fan' : 'envelope'}
        fanCards={phase === 'contents' && lastResult
          ? lastResult.cards.map(c => ({ id: c.card.id, name: c.card.name, rarity: c.card.rarity, stats: c.card.stats, isNew: c.isNew }))
          : undefined}
        fanSelectedIndex={contentsIndex}
      />

      {/* ═══ STORE VIEW ═══ */}
      {phase === 'store' && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 10,
            background: '#0f0f1a',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '2rem',
            overflow: 'auto',
          }}
        >
          <h1
            style={{
              fontSize: '2.5rem', fontWeight: 900,
              letterSpacing: '-0.04em', transform: 'skewX(-8deg)',
              color: '#60a5fa',
              textShadow: '0 0 20px rgba(96,165,250,0.15)',
              margin: '0 0 2rem',
            }}
          >
            TIENDA
          </h1>

          <style>{`
            @keyframes packShimmer {
              0% { transform: translateX(-100%) skewX(-15deg); opacity: 0; }
              10% { opacity: 0.4; }
              30% { opacity: 0.4; }
              40% { opacity: 0; }
              100% { transform: translateX(200%) skewX(-15deg); opacity: 0; }
            }
            @keyframes packGlow {
              0%, 100% { box-shadow: 0 0 8px color, 0 0 20px color; opacity: 0.3; }
              50% { box-shadow: 0 0 16px color, 0 0 40px color; opacity: 0.6; }
            }
            .pack-shimmer { position: absolute; inset: 0; pointer-events: none; overflow: hidden; border-radius: 12px; }
            .pack-shimmer::after {
              content: ''; position: absolute; top: 0; left: 0; width: 60%; height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
              animation: packShimmer 3s ease-in-out infinite;
            }
            .pack-glow {
              position: absolute; inset: -2px; border-radius: 14px; pointer-events: none;
              opacity: 0.3; transition: opacity 0.3s;
              animation: packGlow 3s ease-in-out infinite;
            }
            .pack-btn:hover .pack-glow { opacity: 0.8; }
          `}</style>

          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '1.25rem',
              justifyContent: 'center',
              alignItems: 'flex-start',
              width: '100%',
            }}
          >
            {packTypes.map((pack, i) => {
              const hasCoins = (user?.coins ?? 0) >= pack.cost;
              const isFocused = focus === i;
              return (
                <button
                  key={pack.id}
                  id={`pack-btn-${i}`}
                  onClick={() => handleOpenPack(pack)}
                  disabled={!hasCoins}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',                     gap: '0.75rem',
                    padding: '1.75rem 1.25rem',
                    width: '275px',
                    background: `linear-gradient(145deg, ${pack.color}22, transparent)`,
                    border: `2px solid ${isFocused ? '#93bbfc' : (hasCoins ? pack.color + '66' : '#374151')}`,
                    borderRadius: '12px',
                    cursor: hasCoins ? 'pointer' : 'not-allowed',
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: hasCoins ? 1 : 0.5,
                  }}
                >
                  {/* Glow behind pack */}
                  <div
                    style={{
                      position: 'absolute', top: '50%', left: '50%',
                      width: '200px', height: '200px',
                      transform: 'translate(-50%, -50%)',
                      background: `radial-gradient(circle, ${pack.color}22 0%, transparent 70%)`,
                      pointerEvents: 'none',
                    }}
                  />
                  {/* Shimmer sweep */}
                  <div className="pack-shimmer" style={{ animationDelay: `${i * 0.6}s` }} />
                  {/* Pulse glow border */}
                  <div
                    className="pack-glow"
                    style={{
                      boxShadow: hasCoins ? `0 0 10px ${pack.color}66, 0 0 25px ${pack.color}33` : 'none',
                      animationDelay: `${i * 0.6}s`,
                      opacity: hasCoins ? 0.3 : 0,
                    }}
                  />

                  {/* Badge */}
                  <div
                    style={{
                      background: pack.color,
                      color: '#0f0f1a',
                      padding: '0.2rem 0.7rem',
                      borderRadius: '999px',
                      fontSize: '0.65rem', fontWeight: 800,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      zIndex: 1,
                    }}
                  >
                    {pack.badgeLabel}
                  </div>

                  {/* Icon */}
                  <div
                    style={{
                      width: '100px', height: '130px',
                      background: `linear-gradient(145deg, ${pack.color}33, ${pack.color}11)`,
                      borderRadius: '8px',
                      border: `1px solid ${pack.color}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      zIndex: 1,
                    }}
                  >
                    <span style={{ fontSize: '2.8rem', transform: 'rotate(-15deg)' }}>📦</span>
                  </div>

                  {/* Info */}
                  <div style={{ textAlign: 'center', zIndex: 1 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e5e7eb', marginBottom: '0.15rem' }}>
                      {pack.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      {pack.cardCount} cartas · {pack.cost} 🪙
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: 600, marginTop: '1rem' }}>{error}</p>
          )}

          <button
            ref={backBtnRef}
            onClick={() => { play('back'); back(); }}
            style={{
              marginTop: '2rem',
              padding: '0.75rem 2.5rem',
              background: 'transparent',
              border: `2px solid ${focus >= packTypes.length ? '#93bbfc' : '#4b5563'}`,
              color: focus >= packTypes.length ? 'white' : '#d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              transform: 'skewX(-6deg)',
              transition: 'border-color 0.2s, color 0.2s',
            }}
          >
            ← VOLVER
          </button>

          <p style={{ marginTop: 'auto', color: '#6b7280', fontSize: '0.75rem', letterSpacing: '0.2em', paddingTop: '1rem' }}>
            ↑↓←→ NAVEGAR · ENTER CONFIRMAR
          </p>
        </div>
      )}

      {/* ═══ OPENING / REVEALED OVERLAY ═══ */}
      {(phase === 'opening' || phase === 'revealed') && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div ref={flashRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

            {hypeRarity && (
              <div style={{ position: 'absolute', top: '17%', zIndex: 999, pointerEvents: 'none' }}>
                <span
                  style={{
                    fontSize: '3rem', fontWeight: 900,
                    color: hypeIsLegendary ? '#facc15' : '#60a5fa',
                    textShadow: hypeIsLegendary
                      ? '0 0 40px rgba(250,204,21,0.8), 0 0 80px rgba(250,204,21,0.4)'
                      : '0 0 40px rgba(96,165,250,0.8), 0 0 80px rgba(96,165,250,0.4)',
                    letterSpacing: '0.3em', opacity: 0, transform: 'scale(0.5)',
                  }}
                  ref={(el) => {
                    if (el) {
                      gsap.fromTo(el,
                        { opacity: 0, scale: 0.5, rotation: -10 },
                        { opacity: 1, scale: 1.2, rotation: 0, duration: 0.4, ease: 'back.out(2)', yoyo: true, repeat: 1 },
                      );
                    }
                  }}
                >
                  {hypeIsLegendary ? '★ LEGENDARIO ★' : '▲ ÉPICO'}
                </span>
              </div>
            )}

            {phase === 'opening' && (
              <button
                ref={skipRef}
                onClick={handleSkip}
                style={{
                  position: 'absolute', bottom: '4rem',
                  padding: '0.5rem 1.5rem',
                  background: 'transparent',
                  border: '1px solid #6b7280',
                  color: '#9ca3af',
                  borderRadius: '4px', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.75rem',
                  letterSpacing: '0.2em', opacity: 0.7,
                  pointerEvents: 'auto',
                }}
              >
                SALTAR ▶▶
              </button>
            )}

            {phase === 'revealed' && bestCard && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', pointerEvents: 'auto', zIndex: 20, position: 'relative' }}>
                <PlaceholderCard
                  rarity={bestCard.card.rarity}
                  name={bestCard.card.name}
                  cardId={bestCard.card.id}
                  stats={bestCard.card.stats}
                />
                {!bestCard.isNew && (
                  <p style={{ color: '#facc15', fontWeight: 700, fontSize: '1.125rem', textShadow: '0 0 8px rgba(250,204,21,0.4)' }}>
                    ⚡ DUPLICADO +25 monedas
                  </p>
                )}
                <button
                  ref={revealBtnRef}
                  onClick={goToContents}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.85rem 2.5rem',
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    border: '2px solid #60a5fa',
                    color: 'white',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '1rem',
                    letterSpacing: '0.1em',
                  }}
                >
                  VER CONTENIDO DEL SOBRE
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ CONTENTS OVERLAY ═══ */}
      {phase === 'contents' && lastResult && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '4rem' }}>
            {/* Card info at bottom */}
            <div
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(15,15,26,0.85)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '1rem 2rem',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: (() => {
                      const rarities: Record<string, string> = {
                        COMUN: '#6b7280', RARO: '#60a5fa', EPICO: '#a855f7', LEGENDARIO: '#facc15',
                      };
                      return rarities[lastResult.cards[contentsIndex].card.rarity] ?? '#6b7280';
                    })(),
                  }}
                />
                <span style={{ color: '#e5e7eb', fontWeight: 700, fontSize: '1.1rem' }}>
                  {lastResult.cards[contentsIndex].card.name}
                </span>
                <span style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: 600 }}>
                  {lastResult.cards[contentsIndex].card.rarity}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                <span>⚔️ {lastResult.cards[contentsIndex].card.stats.attack}</span>
                <span>🛡️ {lastResult.cards[contentsIndex].card.stats.defense}</span>
                <span>🔮 {lastResult.cards[contentsIndex].card.stats.magic}</span>
                <span>🍀 {lastResult.cards[contentsIndex].card.stats.luck}</span>
              </div>

              {!lastResult.cards[contentsIndex].isNew && (
                <span style={{ color: '#facc15', fontWeight: 600, fontSize: '0.85rem' }}>
                  ⚡ DUPLICADO +25 🪙
                </span>
              )}

              <div style={{ color: '#6b7280', fontSize: '0.7rem', letterSpacing: '0.1em' }}>
                {contentsIndex + 1} / {lastResult.cards.length}
              </div>
            </div>

            {lastResult.cards.length > 1 && (
              <p style={{ color: '#6b7280', fontSize: '0.7rem', letterSpacing: '0.15em', marginTop: '1rem', pointerEvents: 'none' }}>
                ← → NAVEGAR
              </p>
            )}

            <button
              ref={contentsBtnRef}
              onClick={resetToStore}
              style={{
                marginTop: '1rem',
                padding: '0.85rem 2.5rem',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                border: '2px solid #60a5fa',
                color: 'white',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '1rem',
                letterSpacing: '0.1em',
                pointerEvents: 'auto',
              }}
            >
              GUARDAR EN EL ÁLBUM
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
