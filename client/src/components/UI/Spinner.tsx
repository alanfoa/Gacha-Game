import { useEffect, useRef } from 'react';

export function Spinner({ text = 'CARGANDO' }: { text?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const id = setInterval(() => {
      frame = (frame + 1) % 4;
      const dots = ['.  ', '.. ', '...', ' ..'];
      const span = el.querySelector('span');
      if (span) span.textContent = dots[frame];
    }, 300);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2rem',
        background: '#0f0f1a',
        color: '#60a5fa',
      }}
    >
      <div ref={ref} style={{ display: 'flex', gap: '6px' }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: '16px',
              height: '16px',
              background: '#60a5fa',
              animation: `pulse 0.8s ease-in-out ${i * 0.15}s infinite alternate`,
              transform: 'skewX(-10deg)',
            }}
          />
        ))}
      </div>
      <p style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.3em', opacity: 0.8 }}>
        {text}<span>...</span>
      </p>
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.2; transform: skewX(-10deg) scaleY(0.6); }
          100% { opacity: 1; transform: skewX(-10deg) scaleY(1); }
        }
      `}</style>
    </div>
  );
}
