import type { FC } from 'react';
import { useMemo, useEffect, useRef } from 'react';
import { RARITY_STYLES, getCardCanvas, type CardCanvasStats } from '../Sobre/cardTexture';
import { loadCardImage } from '../../utils/cardImage';

interface PlaceholderCardProps {
  rarity: string;
  name: string;
  size?: number;
  cardId?: string;
  stats?: CardCanvasStats;
}

export const PlaceholderCard: FC<PlaceholderCardProps> = ({ rarity, name, size = 280, cardId, stats }) => {
  const styles = useMemo(() => RARITY_STYLES[rarity] ?? RARITY_STYLES.COMUN, [rarity]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const redraw = () => {
    const el = canvasRef.current;
    if (!el) return;
    const src = getCardCanvas(rarity, name, size, cardId, stats);
    const ctx = el.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, el.width, el.height);
      ctx.drawImage(src, 0, 0, el.width, el.height);
    }
  };

  useEffect(() => {
    redraw();
    if (cardId) loadCardImage(cardId).then(redraw);
  }, [rarity, name, size, cardId, stats]);

  return (
    <canvas
      ref={canvasRef}
      key={`${name}-${rarity}-${size}`}
      width={size}
      height={Math.round(size * 1.4)}
      style={{
        borderRadius: '8px',
        boxShadow: `0 0 20px ${styles.glow}`,
      }}
    />
  );
};
