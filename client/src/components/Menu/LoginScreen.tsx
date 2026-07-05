import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useScreenStore } from '../../store/screenStore';
import { useSaveSlotsStore } from '../../store/saveSlotsStore';

export function LoginScreen() {
  const { token, user, error, loading, register } = useGameStore();
  const navigate = useScreenStore((s) => s.navigate);
  const screenParams = useScreenStore((s) => s.screenParams);
  const setSlot = useSaveSlotsStore((s) => s.setSlot);
  const activateSlot = useSaveSlotsStore((s) => s.activateSlot);
  const [name, setName] = useState('');
  const autoRegistering = useRef(false);

  const slotIndex = (screenParams as { slot?: number })?.slot ?? null;

  useEffect(() => {
    if (token && user) {
      setSlot(slotIndex ?? 0, {
        token,
        name: user.name,
        coins: user.coins,
        cardCount: 0,
        playTime: 0,
        lastPlayed: new Date().toISOString(),
      });
      activateSlot(slotIndex ?? 0);
      navigate('menu');
    }
  }, [token, user, navigate, setSlot, activateSlot, slotIndex]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !autoRegistering.current) {
      autoRegistering.current = true;
      register(name.trim()).finally(() => { autoRegistering.current = false; });
    }
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#011367',
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
        {slotIndex !== null ? `REGISTRAR EN RANURA ${slotIndex + 1}` : 'Ingresa tu nombre para comenzar'}
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          autoFocus
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
      <button
        onClick={() => navigate('saveSlots')}
        style={{
          marginTop: '1.5rem',
          background: 'none',
          border: 'none',
          color: '#6b7280',
          cursor: 'pointer',
          fontSize: '0.8rem',
          fontWeight: 600,
        }}
      >
        ← VOLVER
      </button>
    </div>
  );
}
