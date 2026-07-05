import { useRef, useEffect, useState, useCallback } from 'react';
import gsap from 'gsap';
import { useScreenStore } from '../../store/screenStore';
import { useGameStore } from '../../store/gameStore';
import { useSaveSlotsStore, type SlotData } from '../../store/saveSlotsStore';
import { useInputManager, type GameAction } from '../../hooks/useInputManager';
import { useSound } from '../../hooks/useSound';
import { WalletWidget } from '../UI/WalletWidget';

function formatDate(d: string | null): string {
  if (!d) return '—';
  try {
    const date = new Date(d);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return d;
  }
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function SaveSlotsScreen() {
  const navigate = useScreenStore((s) => s.navigate);
  const screenParams = useScreenStore((s) => s.screenParams);
  const switchToken = useGameStore((s) => s.switchToken);
  const { slots, activateSlot, deleteSlot, refreshSlots } = useSaveSlotsStore();
  const [focus, setFocus] = useState(0);
  const focusRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedAt = useRef(Date.now());
  const { play } = useSound();
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const initialMode = (screenParams as { mode?: string })?.mode ?? 'new';

  useEffect(() => {
    refreshSlots();
  }, [refreshSlots]);

  const handleAction = useCallback((action: GameAction) => {
    const elapsed = Date.now() - mountedAt.current;
    if (elapsed < 300) return;

    if (confirmDelete !== null) {
      if (action === 'CONFIRM') {
        deleteSlot(confirmDelete);
        setConfirmDelete(null);
      }
      if (action === 'BACK') {
        setConfirmDelete(null);
      }
      return;
    }

    if (action === 'NAV_UP' || action === 'NAV_LEFT') {
      focusRef.current = (focusRef.current - 1 + slots.length) % slots.length;
      setFocus(focusRef.current);
      play('nav');
    }
    if (action === 'NAV_DOWN' || action === 'NAV_RIGHT') {
      focusRef.current = (focusRef.current + 1) % slots.length;
      setFocus(focusRef.current);
      play('nav');
    }
    if (action === 'CONFIRM') {
      play('confirm');
      const slot = slots[focusRef.current];
      if (slot.token && slot.name) {
        // Load this slot
        switchToken(slot.token);
        activateSlot(focusRef.current);
        navigate('menu');
      } else {
        // Create new game on this slot
        navigate('login', { slot: focusRef.current });
      }
    }
    if (action === 'BACK') {
      navigate('mainmenu');
    }
  }, [navigate, slots, switchToken, activateSlot, play, confirmDelete, deleteSlot]);

  useInputManager(handleAction);

  useEffect(() => {
    if (!containerRef.current) return;
    try {
      gsap.set('.slot-card', { opacity: 0.15, x: -20 });
      gsap.timeline({ defaults: { duration: 0.15, ease: 'power2.out' } })
        .to('.slot-card', { opacity: 1, x: 0, stagger: 0.04 });
    } catch { /* GSAP no disponible */ }
  }, []);

  useEffect(() => {
    const el = document.querySelector(`[data-slot-index="${focus}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [focus]);

  const getSlotContent = (slot: SlotData) => {
    if (slot.token && slot.name) {
      return (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em' }}>
              {slot.name}
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#facc15' }}>
              ¥ {slot.coins.toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: '#9ca3af' }}>
            <span>🃏 {slot.cardCount} cartas</span>
            <span>⏱ {formatTime(slot.playTime)}</span>
            <span>📅 {formatDate(slot.lastPlayed)}</span>
          </div>
        </>
      );
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '2rem', color: '#4b5563' }}>＋</span>
        <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#4b5563', letterSpacing: '0.05em' }}>
          CREAR PARTIDA
        </span>
      </div>
    );
  };

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        background: '#011367',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <WalletWidget />
      {/* Header */}
      <div style={{
        padding: '1.5rem 2rem 0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        position: 'relative',
        zIndex: 10,
      }}>
        <button
          onClick={() => navigate('mainmenu')}
          style={{
            background: 'none',
            border: 'none',
            color: '#60a5fa',
            cursor: 'pointer',
            fontSize: '1.2rem',
            fontWeight: 700,
            padding: '0.5rem 0',
          }}
        >
          ← VOLVER
        </button>
        <h2 style={{
          color: '#ffffff',
          fontSize: '1.5rem',
          fontWeight: 900,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          margin: 0,
        }}>
          {initialMode === 'load' ? 'CARGAR PARTIDA' : 'SELECCIONAR RANURA'}
        </h2>
      </div>

      {/* Slot list */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '1rem 2rem 4rem',
        }}
      >
        {/* Confirm overlay */}
        {confirmDelete !== null && (
          <div style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            background: 'rgba(220,38,38,0.12)',
            border: '1px solid rgba(220,38,38,0.3)',
            borderRadius: '6px',
            padding: '0.75rem 1rem',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ color: '#fca5a5', fontSize: '0.85rem', fontWeight: 600 }}>
              ¿BORRAR RANURA {confirmDelete + 1}? Esta acción no se puede deshacer.
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => { deleteSlot(confirmDelete); setConfirmDelete(null); }}
                style={{
                  background: 'rgba(220,38,38,0.8)',
                  border: 'none',
                  color: 'white',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                }}
              >
                BORRAR
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#9ca3af',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                }}
              >
                CANCELAR
              </button>
            </div>
          </div>
        )}

        {slots.map((slot, i) => {
          const isOccupied = !!(slot.token && slot.name);
          return (
            <div
              key={i}
              data-slot-index={i}
              className="slot-card"
              onClick={() => {
                if (isOccupied) {
                  switchToken(slot.token);
                  activateSlot(i);
                  navigate('menu');
                } else {
                  navigate('login', { slot: i });
                }
              }}
              style={{
                opacity: 0,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '1rem 1.2rem',
                marginBottom: '0.6rem',
                borderRadius: '6px',
                border: i === focus
                  ? '1.5px solid #60a5fa'
                  : '1px solid rgba(96,165,250,0.08)',
                background: i === focus
                  ? 'rgba(59,130,246,0.1)'
                  : 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                transition: 'background 0.2s, border-color 0.2s',
                position: 'relative',
                minHeight: '70px',
              }}
              onMouseEnter={() => { focusRef.current = i; setFocus(i); }}
              onMouseLeave={() => { if (focusRef.current === i) setFocus(i); }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1 }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isOccupied ? 'rgba(96,165,250,0.15)' : 'rgba(75,85,99,0.2)',
                  color: isOccupied ? '#60a5fa' : '#4b5563',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600, marginBottom: '0.2rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    RANURA {i + 1}
                  </div>
                  {getSlotContent(slot)}
                </div>
              </div>

              {isOccupied && (
                <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0, marginTop: '0.2rem' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      switchToken(slot.token);
                      activateSlot(i);
                      navigate('menu');
                    }}
                    style={{
                      background: 'rgba(96,165,250,0.15)',
                      border: '1px solid rgba(96,165,250,0.3)',
                      color: '#60a5fa',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                    }}
                  >
                    CARGAR
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(i);
                    }}
                    title="Borrar ranura"
                    style={{
                      background: 'rgba(220,38,38,0.1)',
                      border: '1px solid rgba(220,38,38,0.2)',
                      color: '#fca5a5',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                    }}
                  >
                    BORRAR
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
