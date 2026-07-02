export const RARITY_STYLES: Record<string, { bg: string; accent: string; border: string; glow: string }> = {
  COMUN: { bg: '#2a2a30', accent: '#6b7280', border: '#4b5563', glow: 'rgba(107,114,128,0.3)' },
  RARO: { bg: '#1e2a4a', accent: '#3b82f6', border: '#2563eb', glow: 'rgba(59,130,246,0.4)' },
  EPICO: { bg: '#2a1e3a', accent: '#8b5cf6', border: '#7c3aed', glow: 'rgba(139,92,246,0.5)' },
  LEGENDARIO: { bg: '#3a1e1e', accent: '#ef4444', border: '#dc2626', glow: 'rgba(239,68,68,0.6)' },
};

export function getCardCanvas(rarity: string, name: string, compact = false): HTMLCanvasElement {
  const styles = RARITY_STYLES[rarity] ?? RARITY_STYLES.COMUN;
  const size = compact ? 140 : 280;
  const w = size;
  const h = Math.round(size * 1.4);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

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

  return canvas;
}
