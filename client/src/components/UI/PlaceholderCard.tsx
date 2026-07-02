import type { FC } from 'react';
import { useMemo, useEffect, useRef } from 'react';
import { RARITY_STYLES } from '../Sobre/cardTexture';

interface PlaceholderCardProps {
  rarity: string;
  name: string;
  compact?: boolean;
}

export const PlaceholderCard: FC<PlaceholderCardProps> = ({ rarity, name, compact = false }) => {
  const styles = useMemo(() => RARITY_STYLES[rarity] ?? RARITY_STYLES.COMUN, [rarity]);
  const size = compact ? 140 : 280;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;

    const w = el.width;
    const h = el.height;

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, styles.bg);
    grad.addColorStop(1, '#111118');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = styles.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, w - 8, h - 8);

    ctx.fillStyle = styles.accent;
    ctx.font = `bold ${compact ? 10 : 14}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(rarity, w / 2, compact ? 20 : 28);

    const cx = w / 2;
    const cy = h / 2 - (compact ? 5 : 10);
    const r = compact ? 24 : 48;

    ctx.beginPath();
    switch (rarity) {
      case 'COMUN':
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        break;
      case 'RARO':
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI * 2) / 6 - Math.PI / 2;
          ctx[i === 0 ? 'moveTo' : 'lineTo'](cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
        }
        ctx.closePath();
        break;
      case 'EPICO':
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI * 2) / 8 - Math.PI / 2;
          const rad = i % 2 === 0 ? r : r * 0.5;
          ctx[i === 0 ? 'moveTo' : 'lineTo'](cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad);
        }
        ctx.closePath();
        break;
      case 'LEGENDARIO':
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI * 2) / 10 - Math.PI / 2;
          const rad = i % 2 === 0 ? r : r * 0.4;
          ctx[i === 0 ? 'moveTo' : 'lineTo'](cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad);
        }
        ctx.closePath();
        ctx.strokeStyle = styles.accent;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1;
        ctx.stroke();
        break;
    }
    ctx.fillStyle = styles.accent + '33';
    ctx.fill();

    if (rarity !== 'LEGENDARIO') {
      ctx.strokeStyle = styles.accent;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${compact ? 9 : 13}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(name.toUpperCase(), w / 2, h - (compact ? 12 : 20));
  }, [rarity, name, compact, styles]);

  return (
    <canvas
      ref={canvasRef}
      key={`${name}-${rarity}-${compact}`}
      width={size}
      height={Math.round(size * 1.4)}
      style={{
        borderRadius: '8px',
        boxShadow: `0 0 20px ${styles.glow}`,
      }}
    />
  );
};
