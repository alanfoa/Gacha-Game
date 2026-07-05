const CYAN = "rgba(160, 230, 255, 0.92)";
const PINK = "#FF2255";
const BG = "#041565";

export function FateProtocolSeal({ size = 120 }: { size?: number }) {
  const cx = 60;
  const cy = 60;

  const hex = (r: number, offsetAngle = 0) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = ((i * 60 + offsetAngle) * Math.PI) / 180;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    }).join(" ");

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="FATE PROTOCOL seal"
    >
      <defs>
        <filter id="glow-seal">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-eye">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <polygon points={hex(56, 30)} fill="none" stroke={CYAN} strokeWidth="1.2" opacity="0.35" />

      {Array.from({ length: 6 }, (_, i) => {
        const a = ((i * 60 + 30) * Math.PI) / 180;
        const x = cx + 56 * Math.cos(a);
        const y = cy + 56 * Math.sin(a);
        return <circle key={i} cx={x} cy={y} r="2.2" fill={CYAN} opacity="0.6" />;
      })}

      {Array.from({ length: 6 }, (_, i) => {
        const a = ((i * 60 + 30) * Math.PI) / 180;
        const x1 = cx + 56 * Math.cos(a);
        const y1 = cy + 56 * Math.sin(a);
        const x2 = cx + 42 * Math.cos(a);
        const y2 = cy + 42 * Math.sin(a);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={CYAN} strokeWidth="0.8" opacity="0.4" />;
      })}

      <polygon points={hex(42, 30)} fill={BG} stroke={CYAN} strokeWidth="1.6" filter="url(#glow-seal)" opacity="0.9" />

      <polygon points={hex(42, 0)} fill="none" stroke={PINK} strokeWidth="0.8" opacity="0.5" strokeDasharray="4 6" />

      <polygon points={hex(28, 30)} fill="none" stroke={CYAN} strokeWidth="0.8" opacity="0.5" />

      <polygon points={`${cx},${cy - 28} ${cx + 7},${cy - 20} ${cx},${cy - 12} ${cx - 7},${cy - 20}`} fill={PINK} opacity="0.85" />

      <ellipse cx={cx} cy={cy + 4} rx="14" ry="8" fill={BG} stroke={CYAN} strokeWidth="1.4" filter="url(#glow-eye)" />

      <circle cx={cx} cy={cy + 4} r="5" fill={CYAN} opacity="0.9" filter="url(#glow-eye)" />

      <circle cx={cx} cy={cy + 4} r="2.2" fill={BG} />

      <circle cx={cx} cy={cy + 4} r="0.9" fill={CYAN} />

      <line x1={cx - 14} y1={cy + 4} x2={cx - 20} y2={cy + 4} stroke={CYAN} strokeWidth="0.8" opacity="0.6" />
      <line x1={cx + 14} y1={cy + 4} x2={cx + 20} y2={cy + 4} stroke={CYAN} strokeWidth="0.8" opacity="0.6" />

      {[-2, -1, 0, 1, 2].map((n) => (
        <line key={n} x1={cx + n * 5} y1={cy + 18} x2={cx + n * 5} y2={cy + 22} stroke={CYAN} strokeWidth="0.9" opacity="0.5" />
      ))}

      {Array.from({ length: 3 }, (_, i) => {
        const a = (((i * 2) * 60 + 30) * Math.PI) / 180;
        const x = cx + 42 * Math.cos(a);
        const y = cy + 42 * Math.sin(a);
        return (
          <polygon key={i} points={`${x},${y - 3} ${x + 2.2},${y} ${x},${y + 3} ${x - 2.2},${y}`} fill={PINK} opacity="0.9" />
        );
      })}
    </svg>
  );
}
