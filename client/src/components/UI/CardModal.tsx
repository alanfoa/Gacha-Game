import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { AnimeCard, type Card, type Rarity, type El } from '../Card/AnimeCard';
import type { CardData } from '../../store/gameStore';

function toCard(c: CardData): Card {
  return {
    id: parseInt(c.id) || 0,
    name: c.name,
    rarity: c.rarity as Rarity,
    element: c.element as El,
    atk: c.stats.attack,
    def: c.stats.defense,
    mag: c.stats.magic,
    spd: c.stats.speed,
    lck: c.stats.luck,
    imageId: c.id,
  };
}

interface Props {
  card: CardData;
  owned: boolean;
  onClose: () => void;
}

export function CardModal({ card, owned, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const cardOuterRef = useRef<HTMLDivElement>(null);
  const cardInnerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!overlayRef.current || !modalRef.current) return;
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 });
    gsap.fromTo(modalRef.current, { opacity: 0, scale: 0.8, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'back.out(1.5)' });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setRotation((r) => r - 15);
      if (e.key === 'ArrowRight') setRotation((r) => r + 15);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    const el = cardOuterRef.current;
    if (!el) return;
    const inner = cardInnerRef.current;
    if (!inner) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const tiltX = (x - 0.5) * 20;
      const tiltY = (0.5 - y) * 20;
      inner.style.transform = `rotateX(${tiltY}deg) rotateY(${tiltX}deg)`;
    };

    const onLeave = () => {
      inner.style.transform = 'rotateX(0deg) rotateY(0deg)';
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  useEffect(() => {
    const el = cardOuterRef.current;
    if (!el) return;
    el.style.transform = `rotateY(${rotation}deg)`;
  }, [rotation]);

  const rarityLabel = (r: string) => {
    switch (r) {
      case 'LEGENDARIO': return { text: 'LEGENDARIO', color: '#facc15' };
      case 'EPICO': return { text: 'ÉPICO', color: '#a78bfa' };
      case 'RARO': return { text: 'RARO', color: '#60a5fa' };
      default: return { text: 'COMÚN', color: '#9ca3af' };
    }
  };

  const rl = rarityLabel(card.rarity);

  return (
    <div
      ref={overlayRef}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      }}
    >
        <div
          ref={modalRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            background: '#16162a',
          border: `1px solid ${rl.color}40`,
          borderRadius: '12px',
          padding: '2rem',
          display: 'flex',
          gap: '2rem',
          alignItems: 'center',
          maxWidth: '550px',
          width: '90%',
          boxShadow: `0 0 60px ${rl.color}20`,
        }}
      >
        <div ref={cardOuterRef} style={{ perspective: '800px', transition: 'transform 0.3s ease-out' }}>
          <div ref={cardInnerRef} style={{ willChange: 'transform', transition: 'transform 0.08s ease-out' }}>
            <AnimeCard card={{ ...toCard(card), name: owned ? card.name : '???', imageId: owned ? card.id : undefined }} dimmed={!owned} size="lg" />
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <p style={{ color: rl.color, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.3em', margin: 0 }}>{rl.text}</p>
          <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 900, margin: '0.25rem 0', textShadow: owned ? `0 0 20px ${rl.color}40` : 'none' }}>
            {owned ? card.name : '???'}
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginBottom: '1rem' }}>
            {owned ? card.anime : '???'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <StatBar label="ATK" value={card.stats.attack} color="#ef4444" />
            <StatBar label="DEF" value={card.stats.defense} color="#3b82f6" />
            <StatBar label="MAG" value={card.stats.magic} color="#a855f7" />
            <StatBar label="SPD" value={card.stats.speed} color="#60a5fa" />
            <StatBar label="LCK" value={card.stats.luck} color="#facc15" />
          </div>

          {!owned && (
            <p style={{ color: '#6b7280', fontSize: '0.75rem', textAlign: 'center', marginTop: '0.75rem', fontStyle: 'italic' }}>
              No has obtenido esta carta aún
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '0.75rem', right: '0.75rem',
            background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.5rem',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
        <span style={{ color: '#d1d5db', fontSize: '0.7rem', fontWeight: 600 }}>{label}</span>
        <span style={{ color, fontSize: '0.7rem', fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: '4px', background: '#1e1e3a', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${(value / 100) * 100}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}
