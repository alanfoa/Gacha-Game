import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import gsap from 'gsap';
import { useScreenStore } from '../../store/screenStore';
import { useGameStore, type CardData } from '../../store/gameStore';
import { useInputManager, type GameAction } from '../../hooks/useInputManager';
import { useSound } from '../../hooks/useSound';
import { getCardCanvas } from '../Sobre/cardTexture';
import { loadCardImage } from '../../utils/cardImage';

export function TeamSelectScreen() {
  const back = useScreenStore((s) => s.back);
  const navigate = useScreenStore((s) => s.navigate);
  const { inventory, allCards, selectedCardIds, toggleSelectCard, startBattle, loading, error } = useGameStore();
  const { play } = useSound();

  const availableCards = useMemo(() => {
    const owned = new Set(inventory);
    return allCards.filter((c) => owned.has(c.id));
  }, [allCards, inventory]);

  const cols = 4;
  const totalItems = availableCards.length + 1; // +1 for the start button
  const BUTTON_INDEX = availableCards.length; // focus index for the button
  const [focus, setFocus] = useState(0);
  const focusRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const mountedAt = useRef(Date.now());

  const handleStartBattle = useCallback(async () => {
    play('confirm');
    await startBattle();
    navigate('battle');
  }, [play, startBattle, navigate]);

  const handleAction = useCallback((action: GameAction) => {
    const elapsed = Date.now() - mountedAt.current;
    if (elapsed < 300) return;

    if (action === 'BACK') {
      play('back');
      back();
      return;
    }

    const cur = focusRef.current;
    const isOnButton = cur === BUTTON_INDEX;

    if (action === 'NAV_UP') {
      if (isOnButton) {
        const lastRowStart = Math.max(0, availableCards.length - cols);
        focusRef.current = lastRowStart;
        setFocus(lastRowStart);
        play('nav');
      } else if (cur < cols) {
        focusRef.current = BUTTON_INDEX;
        setFocus(BUTTON_INDEX);
        play('nav');
      } else {
        focusRef.current = cur - cols;
        setFocus(focusRef.current);
        play('nav');
      }
      return;
    }

    if (action === 'NAV_DOWN') {
      if (isOnButton) {
        focusRef.current = 0;
        setFocus(0);
        play('nav');
      } else {
        const inLastRow = cur + cols >= availableCards.length;
        if (inLastRow) {
          focusRef.current = BUTTON_INDEX;
          setFocus(BUTTON_INDEX);
          play('nav');
        } else {
          focusRef.current = cur + cols;
          setFocus(focusRef.current);
          play('nav');
        }
      }
      return;
    }

    if (action === 'NAV_LEFT') {
      if (isOnButton) return;
      if (cur % cols > 0) {
        focusRef.current = cur - 1;
        setFocus(focusRef.current);
        play('nav');
      }
      return;
    }

    if (action === 'NAV_RIGHT') {
      if (isOnButton) return;
      if (cur % cols < cols - 1 && cur + 1 < availableCards.length) {
        focusRef.current = cur + 1;
        setFocus(focusRef.current);
        play('nav');
      }
      return;
    }

    if (action === 'CONFIRM') {
      if (selectedCardIds.length === 3) {
        handleStartBattle();
        return;
      }
      if (isOnButton) return;
      const card = availableCards[cur];
      if (!card) return;
      toggleSelectCard(card.id);
      play('confirm');
    }
  }, [back, play, availableCards, toggleSelectCard, selectedCardIds, handleStartBattle, BUTTON_INDEX, cols]);

  useInputManager(handleAction);

  // Button focus animation
  useEffect(() => {
    if (!buttonRef.current) return;
    try {
      gsap.to(buttonRef.current, {
        scale: focus === BUTTON_INDEX ? 1.05 : 1,
        borderColor: focus === BUTTON_INDEX ? '#60a5fa' : selectedCardIds.length === 3 ? '#60a5fa' : '#4b5563',
        duration: 0.2,
        ease: 'power2.out',
      });
    } catch { /* GSAP no disponible */ }
  }, [focus, selectedCardIds.length, BUTTON_INDEX]);

  // Card entrance animation
  useEffect(() => {
    if (!containerRef.current) return;
    try {
      gsap.timeline({ defaults: { duration: 0.15, ease: 'power2.out' } })
        .to('.ts-card', { opacity: 1, scale: 1, stagger: 0.03 });
    } catch { /* GSAP no disponible */ }
  }, [availableCards.length]);

  // Auto-scroll on focus change
  useEffect(() => {
    if (focus === BUTTON_INDEX) {
      buttonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    const el = document.querySelector(`[data-select-index="${focus}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [focus, BUTTON_INDEX]);

  return (
    <div
      ref={containerRef}
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: '#0f0f1a',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        .team-select-grid::-webkit-scrollbar {
          width: 6px;
        }
        .team-select-grid::-webkit-scrollbar-track {
          background: transparent;
        }
        .team-select-grid::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 3px;
        }
        .team-select-grid::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `}</style>
      <div
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: '800px', height: '800px',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'repeating-linear-gradient(-15deg, transparent, transparent 40px, rgba(59,130,246,0.05) 40px, rgba(59,130,246,0.05) 41px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', position: 'relative', zIndex: 10 }}>
        <button
          onClick={() => { play('back'); back(); }}
          style={{
            background: 'transparent',
            border: '1px solid #4b5563',
            color: '#9ca3af',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.875rem',
          }}
        >
          ← VOLVER
        </button>
        <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.1em', transform: 'skewX(-10deg)', margin: 0 }}>
          SELECCIONAR EQUIPO
        </h2>
      </div>

      <p style={{ color: '#9ca3af', marginBottom: '1.5rem', fontSize: '0.875rem', position: 'relative', zIndex: 10 }}>
        {selectedCardIds.length}/3 cartas seleccionadas
        {inventory.length < 3 && (
          <span style={{ color: '#f59e0b', display: 'block', marginTop: '0.25rem' }}>
            Necesitas al menos 3 cartas en tu inventario. ¡Abre sobres!
          </span>
        )}
      </p>

      {error && (
        <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem', position: 'relative', zIndex: 10 }}>
          {error}
        </p>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: '1rem',
          maxWidth: '900px',
          width: '100%',
          position: 'relative',
          zIndex: 10,
          flex: 1,
          alignContent: 'start',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#374151 transparent',
          padding: '0.5rem',
        }}
        className="team-select-grid"
      >
        {availableCards.map((card, i) => {
          const isSelected = selectedCardIds.includes(card.id);
          const isFocused = i === focus;
          return (
            <div key={card.id} data-select-index={i}>
              <CardSelectButton
                card={card}
                isSelected={isSelected}
                isFocused={isFocused}
                onClick={() => { toggleSelectCard(card.id); play('confirm'); }}
                onHover={() => { focusRef.current = i; setFocus(i); }}
              />
            </div>
          );
        })}
        {availableCards.length === 0 && (
          <p style={{ color: '#6b7280', gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
            No tienes cartas. Abre sobres en el menú principal.
          </p>
        )}
      </div>

      <div style={{ position: 'relative', zIndex: 10, marginTop: '1.5rem' }}>
        <button
          ref={buttonRef}
          onClick={handleStartBattle}
          disabled={selectedCardIds.length !== 3 || loading}
          className={focus === BUTTON_INDEX ? 'ts-btn-focused' : ''}
          style={{
            padding: '0.75rem 3rem',
            fontSize: '1.25rem',
            fontWeight: 700,
            background: selectedCardIds.length === 3 && !loading ? '#2563eb' : '#374151',
            color: 'white',
            border: '2px solid',
            borderColor: focus === BUTTON_INDEX ? '#60a5fa' : selectedCardIds.length === 3 ? '#60a5fa' : '#4b5563',
            borderRadius: '4px',
            transform: 'skewX(-10deg)',
            cursor: selectedCardIds.length === 3 && !loading ? 'pointer' : 'not-allowed',
            letterSpacing: '0.1em',
            opacity: loading ? 0.6 : 1,
            transition: 'none',
          }}
        >
          {loading ? 'INICIANDO...' : 'INICIAR BATALLA'}
        </button>
      </div>
    </div>
  );
}

function CardSelectButton({
  card,
  isSelected,
  isFocused,
  onClick,
  onHover,
}: {
  card: CardData;
  isSelected: boolean;
  isFocused: boolean;
  onClick: () => void;
  onHover: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const redraw = () => {
      if (canvasRef.current) {
        const src = getCardCanvas(card.rarity, card.name, 120, card.id);
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.drawImage(src, 0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    };
    redraw();
    if (card.id) loadCardImage(card.id).then(redraw);
  }, [card.rarity, card.name, card.id]);

  useEffect(() => {
    if (!ref.current) return;
    try {
      gsap.to(ref.current, {
        scale: isFocused ? 1.08 : 1,
        borderColor: isSelected ? '#fbbf24' : isFocused ? '#60a5fa' : '#1e1e3a',
        duration: 0.2,
        ease: 'power2.out',
      });
    } catch { /* GSAP no disponible */ }
  }, [isFocused, isSelected]);

  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseEnter={onHover}
      className="ts-card"
      style={{
        opacity: 0,
        scale: 0.9,
        background: '#1e1e3a',
        border: '2px solid',
        borderColor: isSelected ? '#fbbf24' : isFocused ? '#60a5fa' : '#1e1e3a',
        borderRadius: '8px',
        padding: '0.5rem',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
        transition: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        width={120}
        height={168}
        style={{ width: '120px', height: '168px', borderRadius: '4px' }}
      />
      <span style={{
        color: isSelected ? '#fbbf24' : isFocused ? '#60a5fa' : '#9ca3af',
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.05em',
        marginTop: '0.25rem',
      }}>
        {card.name}
      </span>
      <div style={{ display: 'flex', gap: '0.375rem', fontSize: '0.6rem', fontWeight: 600, color: '#6b7280' }}>
        <span style={{ color: '#ef4444' }}>ATK {card.stats.attack}</span>
        <span style={{ color: '#60a5fa' }}>SPD {card.stats.speed}</span>
        <span style={{ color: '#a855f7' }}>MAG {card.stats.magic}</span>
        <span style={{ color: '#3b82f6' }}>DEF {card.stats.defense}</span>
      </div>
      {isSelected && (
        <span style={{ color: '#fbbf24', fontSize: '0.625rem', fontWeight: 600 }}>
          ✓ SELECCIONADA
        </span>
      )}
    </button>
  );
}
