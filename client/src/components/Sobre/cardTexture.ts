import { getCachedImage } from '../../utils/cardImage';

export interface CardCanvasStats {
  attack: number;
  defense: number;
  magic: number;
  luck: number;
  speed: number;
}

interface RarityStyle {
  bg: string;
  accent: string;
  border: string;
  glow: string;
  metal1: string;
  metal2: string;
  metal3: string;
}

export const RARITY_STYLES: Record<string, RarityStyle> = {
  COMUN: {
    bg: '#2a2a30', accent: '#cbd5e1', border: '#94a3b8', glow: 'rgba(148,163,184,0.4)',
    metal1: '#f8fafc', metal2: '#94a3b8', metal3: '#475569',
  },
  RARO: {
    bg: '#1e2a4a', accent: '#60a5fa', border: '#3b82f6', glow: 'rgba(96,165,250,0.5)',
    metal1: '#bfdbfe', metal2: '#3b82f6', metal3: '#1d4ed8',
  },
  EPICO: {
    bg: '#2a1e3a', accent: '#a78bfa', border: '#8b5cf6', glow: 'rgba(167,139,250,0.5)',
    metal1: '#ddd6fe', metal2: '#8b5cf6', metal3: '#6d28d9',
  },
  LEGENDARIO: {
    bg: '#3a1e1e', accent: '#fbbf24', border: '#f59e0b', glow: 'rgba(251,191,36,0.6)',
    metal1: '#fde68a', metal2: '#f59e0b', metal3: '#b45309',
  },
};

const STAT_COLORS: Record<string, string> = {
  ATK: '#ef4444', DEF: '#3b82f6', MAG: '#a855f7', SPD: '#22c55e', LCK: '#facc15',
};

function hexToRgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawShapePath(ctx: CanvasRenderingContext2D, rarity: string, cx: number, cy: number, r: number) {
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
      break;
  }
}

export function getCardCanvas(
  rarity: string,
  name: string,
  size = 280,
  cardId?: string,
  stats?: CardCanvasStats,
): HTMLCanvasElement {
  const styles = RARITY_STYLES[rarity] ?? RARITY_STYLES.COMUN;
  const w = size;
  const h = Math.round(size * 1.4);
  const scale = size / 280;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const img = cardId ? getCachedImage(cardId) : undefined;

  // --- Metallic background ---
  const metalGrad = ctx.createLinearGradient(0, 0, w, h);
  metalGrad.addColorStop(0, styles.metal1);
  metalGrad.addColorStop(0.3, styles.metal2);
  metalGrad.addColorStop(0.48, styles.metal1);
  metalGrad.addColorStop(0.65, styles.metal2);
  metalGrad.addColorStop(1, styles.metal3);
  ctx.fillStyle = metalGrad;
  ctx.fillRect(0, 0, w, h);

  // --- Outer border (thick, rarity color) ---
  ctx.strokeStyle = styles.border;
  ctx.lineWidth = Math.max(1.5, 3 * scale);
  roundRect(ctx, 3 * scale, 3 * scale, w - 6 * scale, h - 6 * scale, Math.max(4, 12 * scale));
  ctx.stroke();

  // --- Rarity badge at top ---
  const badgeW = Math.max(35, 80 * scale);
  const badgeH = Math.max(10, 20 * scale);
  const badgeX = (w - badgeW) / 2;
  const badgeY = Math.max(4, 10 * scale);
  ctx.fillStyle = hexToRgba(styles.metal3, 0.5);
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
  ctx.fill();

  ctx.fillStyle = styles.metal1;
  ctx.font = `bold ${Math.max(7, 11 * scale)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(rarity, w / 2, badgeY + badgeH / 2);
  ctx.textBaseline = 'alphabetic';

  // --- Image frame ---
  const pad = Math.max(4, 14 * scale);
  const topMargin = Math.max(14, 40 * scale);
  const bottomMargin = stats ? Math.max(16, 76 * scale) : Math.max(10, 32 * scale);
  const rx = pad;
  const ry = topMargin;
  const rw = w - pad * 2;
  const rh = h - topMargin - bottomMargin;
  const cornerR = Math.max(3, 10 * scale);

  // Dark inset shadow inside the frame
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(ctx, rx + 1, ry + 1, rw - 2, rh - 2, cornerR);
  ctx.fill();

  if (img) {
    ctx.save();
    roundRect(ctx, rx, ry, rw, rh, cornerR);
    ctx.clip();

    const scale = Math.max(rw / img.width, rh / img.height);
    const ix = rx + (rw - img.width * scale) / 2;
    const iy = ry + (rh - img.height * scale) / 2;
    ctx.drawImage(img, ix, iy, img.width * scale, img.height * scale);

    // Subtle rarity overlay
    ctx.fillStyle = hexToRgba(styles.metal2, 0.1);
    ctx.fillRect(rx, ry, rw, rh);
    ctx.restore();
  } else {
    // Fallback shape
    const cx = rx + rw / 2;
    const cy = ry + rh / 2;
    const r = Math.max(12, 44 * scale);

    drawShapePath(ctx, rarity, cx, cy, r);
    ctx.fillStyle = hexToRgba(styles.metal1, 0.2);
    ctx.fill();

    if (rarity === 'LEGENDARIO') {
      ctx.strokeStyle = styles.border;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.strokeStyle = styles.accent;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // Frame border
  ctx.strokeStyle = hexToRgba(styles.metal1, 0.6);
  ctx.lineWidth = Math.max(0.5, 1.5 * scale);
  roundRect(ctx, rx, ry, rw, rh, cornerR);
  ctx.stroke();

  // --- Stats (only on full cards) ---
  if (stats) {
    const statRows: { label: string; value: number }[] = [
      { label: 'ATK', value: stats.attack },
      { label: 'DEF', value: stats.defense },
      { label: 'MAG', value: stats.magic },
      { label: 'SPD', value: stats.speed },
      { label: 'LCK', value: stats.luck },
    ];

    const skewDeg = -10;
    const tanSkew = Math.tan(skewDeg * Math.PI / 180);
    const statY = ry + rh + 8 * scale;
    const rowH = 11 * scale;
    const labelW = 26 * scale;
    const barMaxW = 100 * scale;
    const barH = 5 * scale;
    const gap2 = 4 * scale;
    const valEstW = 22 * scale;
    const totalStatW = labelW + gap2 + barMaxW + gap2 + valEstW;
    const statX = (w - totalStatW) / 2;

    ctx.save();
    const statCenterY = statY + (statRows.length * (rowH + 2)) / 2 - rowH / 2;
    ctx.translate(0, statCenterY);
    ctx.transform(1, 0, tanSkew, 1, 0, 0);
    ctx.translate(0, -statCenterY);
    ctx.font = `bold ${Math.max(6, 9 * scale)}px system-ui, sans-serif`;
    ctx.textBaseline = 'middle';

    for (let i = 0; i < statRows.length; i++) {
      const { label, value } = statRows[i];
      const y = statY + i * (rowH + 2 * scale);
      const color = STAT_COLORS[label] ?? '#ffffff';

      // Label
      ctx.fillStyle = hexToRgba(styles.metal1, 0.85);
      ctx.textAlign = 'right';
      ctx.fillText(label, statX + labelW, y + barH / 2);

      // Bar background
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      roundRect(ctx, statX + labelW + gap2, y, barMaxW, barH, Math.max(1, 2.5 * scale));
      ctx.fill();

      // Bar fill
      const fillW = Math.max(2, (value / 100) * barMaxW);
      ctx.fillStyle = color;
      roundRect(ctx, statX + labelW + gap2, y, fillW, barH, Math.max(1, 2.5 * scale));
      ctx.fill();

      // Value → white for high contrast
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(String(value), statX + labelW + gap2 + barMaxW + gap2, y + barH / 2);
    }

    ctx.restore();
    ctx.textBaseline = 'alphabetic';
  }

  // --- Name (Persona-style skewed banner) ---
  const nameStr = name.toUpperCase();
  const nameFS = Math.max(7, 10 * scale);
  ctx.font = `bold ${nameFS}px system-ui, sans-serif`;
  const nameW = ctx.measureText(nameStr).width + 14 * scale;
  const nameH = 20 * scale;
  const skewDeg = -15;
  const tanSkew = Math.tan(skewDeg * Math.PI / 180);

  const bx = rx + 2 * scale;
  const by = ry + rh - nameH - 2 * scale;

  // Skewed black background polygon
  ctx.beginPath();
  ctx.moveTo(bx + by * tanSkew, by);
  ctx.lineTo(bx + nameW + by * tanSkew, by);
  ctx.lineTo(bx + nameW + (by + nameH) * tanSkew, by + nameH);
  ctx.lineTo(bx + (by + nameH) * tanSkew, by + nameH);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fill();

  // White text
  ctx.fillStyle = styles.metal1;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(nameStr, bx + 6 * scale + (by + nameH / 2) * tanSkew, by + nameH / 2);
  ctx.textBaseline = 'alphabetic';

  return canvas;
}
