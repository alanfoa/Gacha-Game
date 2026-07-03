import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGameStore } from '../../store/gameStore';
import { useScreenStore } from '../../store/screenStore';
import { useInputManager } from '../../hooks/useInputManager';
import { useSound } from '../../hooks/useSound';

const missionBgColors: Record<string, string> = {
  win_battles: 'linear-gradient(135deg, #1e3a5f, #0f1f3a)',
  open_packs: 'linear-gradient(135deg, #3a1e5f, #1f0f3a)',
  earn_coins: 'linear-gradient(135deg, #3a5f1e, #1f3a0f)',
};

export function MissionsScreen() {
  const { missions, fetchMissions, claimMission } = useGameStore();
  const navigate = useScreenStore((s) => s.navigate);
  const { play } = useSound();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const backBtnRef = useRef<HTMLButtonElement>(null);
  const [focus, setFocus] = useState(0);
  const focusIndexRef = useRef(0);

  const availableMissions = missions.filter((m) => !m.claimed);
  const itemCount = availableMissions.length + 1; // cards + back button
  const BACK_INDEX = availableMissions.length;

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  useEffect(() => {
    if (!containerRef.current) return;
    gsap.fromTo(containerRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
    );
  }, []);

  useInputManager((action) => {
    if (action === 'BACK') {
      play('back');
      navigate('menu');
      return;
    }

    if (action === 'CONFIRM') {
      if (focusIndexRef.current === BACK_INDEX) {
        play('back');
        navigate('menu');
        return;
      }
      const mission = availableMissions[focusIndexRef.current];
      if (mission && mission.completed && !mission.claimed) {
        claimMission(mission.id);
        play('confirm');
      }
      return;
    }

    if (action === 'NAV_UP') {
      focusIndexRef.current = (focusIndexRef.current - 1 + itemCount) % itemCount;
      setFocus(focusIndexRef.current);
      scrollToFocus();
      play('nav');
    }
    if (action === 'NAV_DOWN') {
      focusIndexRef.current = (focusIndexRef.current + 1) % itemCount;
      setFocus(focusIndexRef.current);
      scrollToFocus();
      play('nav');
    }
  });

  function scrollToFocus() {
    // Reset back button style
    if (backBtnRef.current) {
      gsap.set(backBtnRef.current, { scale: 1, borderColor: '#4b5563' });
    }

    if (focusIndexRef.current === BACK_INDEX) {
      backBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      if (backBtnRef.current) {
        gsap.to(backBtnRef.current, { scale: 1.08, borderColor: '#60a5fa', duration: 0.2, ease: 'power2.out' });
      }
      return;
    }

    const el = cardsRef.current?.children[focusIndexRef.current] as HTMLElement | undefined;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      gsap.fromTo(el, { scale: 1 }, { scale: 1.03, duration: 0.2, ease: 'power2.out' });
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f0f1a',
        color: 'white',
        fontFamily: 'system-ui, sans-serif',
        padding: '2rem',
        gap: '2rem',
      }}
    >
      <h1
        style={{
          fontSize: '2.8rem',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          transform: 'skewX(-8deg)',
          color: '#60a5fa',
          textShadow: '0 0 20px rgba(96,165,250,0.15)',
          margin: 0,
        }}
      >
        MISIONES DIARIAS
      </h1>

      <div
        ref={cardsRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          width: '100%',
          maxWidth: '420px',
        }}
      >
        {availableMissions.length === 0 && (
          <p style={{ color: '#6b7280', textAlign: 'center', fontSize: '0.9rem' }}>
            ¡Completaste todas las misiones de hoy!
          </p>
        )}

        {availableMissions.map((mission, i) => {
          const isFocused = i === focus;
          const pct = mission.goal > 0 ? (mission.progress / mission.goal) * 100 : 0;

          return (
            <div
              key={mission.id}
              style={{
                background: missionBgColors[mission.id] ?? '#1e1e3a',
                border: `2px solid ${isFocused ? '#60a5fa' : '#374151'}`,
                borderRadius: '12px',
                padding: '1.25rem',
                cursor: mission.completed && !mission.claimed ? 'pointer' : 'default',
                opacity: mission.claimed ? 0.5 : 1,
                transition: 'border-color 0.2s',
                position: 'relative',
                overflow: 'hidden',
              }}
              onClick={() => {
                if (mission.completed && !mission.claimed) {
                  claimMission(mission.id);
                  play('confirm');
                }
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  height: '3px',
                  width: `${Math.min(pct, 100)}%`,
                  background: mission.completed ? '#22c55e' : '#60a5fa',
                  transition: 'width 0.5s ease',
                  borderRadius: '0 0 0 12px',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#e5e7eb' }}>
                    {mission.name}
                  </h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#9ca3af' }}>
                    {mission.description}
                  </p>
                </div>

                {mission.completed && !mission.claimed && (
                  <span
                    style={{
                      background: '#22c55e',
                      color: '#0f0f1a',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    RECLAMAR
                  </span>
                )}

                {mission.claimed && (
                  <span style={{ color: '#6b7280', fontSize: '0.8rem', fontWeight: 600 }}>
                    ✓ RECLAMADO
                  </span>
                )}
              </div>

              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    flex: 1,
                    height: '6px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(pct, 100)}%`,
                      background: mission.completed ? '#22c55e' : '#60a5fa',
                      borderRadius: '3px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, minWidth: '3rem', textAlign: 'right' }}>
                  {mission.progress}/{mission.goal}
                </span>
              </div>

              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#facc15', fontWeight: 600 }}>
                {mission.reward === 1 ? '🎁 Sobre gratis' : `🪙 +${mission.reward} monedas`}
              </div>
            </div>
          );
        })}
      </div>

      <button
        ref={backBtnRef}
        style={{
          padding: '0.75rem 2.5rem',
          background: 'transparent',
          border: '2px solid #4b5563',
          color: '#d1d5db',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          transform: 'skewX(-6deg)',
          transition: 'border-color 0.2s, color 0.2s',
        }}
        onClick={() => { play('back'); navigate('menu'); }}
      >
        ← VOLVER
      </button>
    </div>
  );
}
