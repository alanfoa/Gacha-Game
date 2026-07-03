import { useState, useRef, useEffect } from 'react';
import { useScreenStore } from '../../store/screenStore';
import { useGameStore, type CardData } from '../../store/gameStore';
import { useInputManager, type GameAction } from '../../hooks/useInputManager';
import { useSound } from '../../hooks/useSound';
import { PlaceholderCard } from '../UI/PlaceholderCard';
import { CardModal } from '../UI/CardModal';

const CARD_W = 140;
const GAP = 12;

export function AlbumScreen() {
  const back = useScreenStore((s) => s.back);
  const { allCards, unlockedCards, user } = useGameStore();
  const { play } = useSound();
  const [selected, setSelected] = useState<CardData | null>(null);
  const [selectedOwned, setSelectedOwned] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

  const getColumns = () => {
    if (!gridRef.current) return 5;
    return Math.max(1, Math.floor((gridRef.current.offsetWidth + GAP) / (CARD_W + GAP)));
  };

  useInputManager((action: GameAction) => {
    if (selected) {
      if (action === 'BACK') { setSelected(null); }
      return;
    }
    switch (action) {
      case 'BACK':
        play('back'); back();
        return;
      case 'NAV_LEFT':
        setFocusIndex((i) => Math.max(0, i - 1));
        return;
      case 'NAV_RIGHT':
        setFocusIndex((i) => Math.min(allCards.length - 1, i + 1));
        return;
      case 'NAV_UP':
        setFocusIndex((i) => Math.max(0, i - getColumns()));
        return;
      case 'NAV_DOWN':
        setFocusIndex((i) => Math.min(allCards.length - 1, i + getColumns()));
        return;
      case 'CONFIRM': {
        const card = allCards[focusIndex];
        if (card) { setSelected(card); setSelectedOwned(unlockedCards.includes(card.id)); }
        return;
      }
    }
  });

  useEffect(() => {
    setFocusIndex((i) => Math.min(i, Math.max(0, allCards.length - 1)));
  }, [allCards.length]);

  useEffect(() => {
    const el = document.querySelector(`[data-album-index="${focusIndex}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [focusIndex]);

  const total = allCards.length;
  const unlocked = unlockedCards.length;
  const completion = total > 0 ? Math.round((unlocked / total) * 100) : 0;

  const handleCardClick = (card: CardData) => {
    setSelected(card);
    setSelectedOwned(unlockedCards.includes(card.id));
  };

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        background: '#0f0f1a',
        padding: '2rem',
        overflow: 'auto',
        willChange: 'transform',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <button
          onClick={() => { play('back'); back(); }}
          style={{
            background: 'transparent',
            border: '1px solid #4b5563',
            color: '#d1d5db',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          ← VOLVER
        </button>
        <div style={{ textAlign: 'right' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', margin: 0 }}>
            MI ÁLBUM
          </h1>
          <p style={{ color: '#9ca3af', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
            {unlocked}/{total} · {completion}%
          </p>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'flex',
          gap: '2rem',
          marginBottom: '2rem',
          padding: '1rem',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Stat label="Monedas" value={`🪙 ${user?.coins ?? 0}`} />
        <Stat label="Sobres abiertos" value={`📦 ${user?.totalPulls ?? 0}`} />
        <Stat label="Legendarios" value={`💎 ${user?.legendaryCount ?? 0}`} />
        <Stat label="Pity" value={`😤 ${user?.pityCount ?? 0}/50`} />
      </div>

      {/* Grid */}
      <style>{`
        .album-card {
          transition: opacity 0.3s, outline-color 0.3s, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
          cursor: pointer;
          border-radius: 8px;
        }
        .album-card:hover {
          transform: scale(1.07) translateY(-4px);
          box-shadow: 0 8px 32px rgba(96,165,250,0.15);
          outline: 2px solid rgba(96,165,250,0.5);
          outline-offset: 3px;
        }
        .album-card:active {
          transform: scale(0.98);
        }
      `}</style>
      <div
        ref={gridRef}
        style={{
          display: 'flex',
          gap: `${GAP}px`,
          flexWrap: 'wrap',
          justifyContent: 'center',
          paddingBottom: '2rem',
        }}
      >
        {allCards.map((card, i) => {
          const owned = unlockedCards.includes(card.id);
          const isFocused = i === focusIndex;
          return (
            <div
              key={card.id}
              data-album-index={i}
              onClick={() => { setFocusIndex(i); handleCardClick(card); }}
              className="album-card"
              style={{
                opacity: owned ? 1 : 0.2,
                outline: isFocused ? '3px solid #3b82f6' : '3px solid transparent',
                outlineOffset: '2px',
              }}
            >
              <PlaceholderCard
                rarity={card.rarity}
                name={owned ? card.name : '???'}
                size={140}
                cardId={owned ? card.id : undefined}
              />
            </div>
          );
        })}
      </div>

      {selected && (
        <CardModal
          card={selected}
          owned={selectedOwned}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: '#d1d5db', fontSize: '0.75rem', margin: 0 }}>{label}</p>
      <p style={{ color: 'white', fontSize: '1.125rem', fontWeight: 700, margin: '0.25rem 0 0' }}>{value}</p>
    </div>
  );
}
