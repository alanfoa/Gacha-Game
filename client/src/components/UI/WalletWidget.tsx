import { motion } from 'motion/react';
import { useGameStore } from '../../store/gameStore';

export function WalletWidget() {
  const user = useGameStore((s) => s.user);
  return (
    <motion.div
      style={{ position: 'absolute', top: '5.5%', left: '3%', zIndex: 20 }}
      initial={{ x: -260, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 255, damping: 26, delay: 0.5 }}
    >
      <div
        style={{
          background: 'white',
          border: '2.5px solid #111',
          padding: '8px 18px 8px 14px',
          minWidth: '148px',
        }}
      >
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '1.65rem',
            fontWeight: 700,
            color: '#0A0A0A',
            lineHeight: 1.1,
            letterSpacing: '0.01em',
          }}
        >
          ¥ {user?.coins?.toLocaleString() ?? '0'}
        </div>
        <div
          style={{
            fontSize: '0.62rem',
            color: '#555',
            marginTop: '2px',
            letterSpacing: '0.08em',
          }}
        >
          current wallet
        </div>
      </div>
    </motion.div>
  );
}
