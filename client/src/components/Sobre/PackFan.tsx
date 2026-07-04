import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getCardCanvas, RARITY_STYLES, type CardCanvasStats } from './cardTexture';
import { loadCardImage } from '../../utils/cardImage';

interface FanCard {
  id: string;
  name: string;
  rarity: string;
  stats?: CardCanvasStats;
  isNew: boolean;
}

interface PackFanProps {
  cards: FanCard[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

const SPREAD = 80;
const FAN_RADIUS = 2.8;

function createSmokeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(255,255,255,0)');
  gradient.addColorStop(0.3, 'rgba(255,255,255,0.03)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.1)');
  gradient.addColorStop(0.7, 'rgba(255,255,255,0.2)');
  gradient.addColorStop(0.85, 'rgba(255,255,255,0.12)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = Math.random() * 30 + 8;
    const alpha = Math.random() * 0.06;
    const g2 = ctx.createRadialGradient(x, y, 0, x, y, r);
    g2.addColorStop(0, `rgba(255,255,255,${alpha})`);
    g2.addColorStop(1, `rgba(255,255,255,0)`);
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function CardMesh({ card, index, selected, total }: { card: FanCard; index: number; selected: boolean; total: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const smokeRef = useRef<THREE.Mesh>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  const animFrame = useRef(0);
  const smokeTexture = useMemo(() => createSmokeTexture(), []);

  const angleStep = (SPREAD * Math.PI / 180) / Math.max(total - 1, 1);
  const startAngle = -(SPREAD * Math.PI / 180) / 2;
  const angle = startAngle + index * angleStep;

  const baseX = Math.sin(angle) * FAN_RADIUS;
  const baseZ = -(Math.cos(angle) * FAN_RADIUS - FAN_RADIUS);
  const baseRotY = -angle;

  useFrame((state) => {
    if (!smokeRef.current) return;
    const smoke = smokeRef.current;
    const mat = smoke.material as THREE.MeshBasicMaterial;
    smoke.rotation.z = Math.sin(state.clock.elapsedTime * 0.4 + index * 1.7) * 0.2;
    const pulse = Math.sin(state.clock.elapsedTime * 0.6 + index * 2.3) * 0.5 + 0.5;
    mat.opacity = 0.2 + pulse * 0.2;
    const s = 1 + Math.sin(state.clock.elapsedTime * 0.3 + index) * 0.05;
    smoke.scale.set(s, s, s);
  });

  const draw = useCallback(() => {
    const src = getCardCanvas(card.rarity, card.name, 200, card.id, card.stats);
    if (!canvasRef.current || canvasRef.current.width !== src.width || canvasRef.current.height !== src.height) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = src.width;
      canvasRef.current.height = src.height;
    }
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, src.width, src.height);
    ctx.drawImage(src, 0, 0);

    if (!textureRef.current) {
      textureRef.current = new THREE.CanvasTexture(canvasRef.current);
      textureRef.current.needsUpdate = true;
      setTexture(textureRef.current);
    } else {
      textureRef.current.needsUpdate = true;
    }
  }, [card.rarity, card.name, card.id, card.stats]);

  useEffect(() => {
    draw();
    if (card.id) loadCardImage(card.id).then(draw);
    return () => {
      if (textureRef.current) { textureRef.current.dispose(); textureRef.current = null; }
      setTexture(null);
    };
  }, [draw, card.id, card.stats]);

  useEffect(() => {
    if (!groupRef.current) return;
    const group = groupRef.current;

    const targetY = selected ? 0.5 : 0;
    const targetZ = selected ? baseZ + 0.8 : baseZ;
    const targetScale = selected ? 1.15 : 0.85;
    const targetRotY = selected ? 0 : baseRotY;

    const startY = group.position.y;
    const startZ = group.position.z;
    const startScale = group.scale.x;
    const startRotY = group.rotation.y;

    const duration = 300;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);

      group.position.y = startY + (targetY - startY) * ease;
      group.position.z = startZ + (targetZ - startZ) * ease;
      const s = startScale + (targetScale - startScale) * ease;
      group.scale.set(s, s, s);
      group.rotation.y = startRotY + (targetRotY - startRotY) * ease;

      if (t < 1) {
        animFrame.current = requestAnimationFrame(animate);
      }
    };

    cancelAnimationFrame(animFrame.current);
    animFrame.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animFrame.current);
  }, [selected, baseX, baseZ, baseRotY]);

  const styles = RARITY_STYLES[card.rarity] ?? RARITY_STYLES.COMUN;

  if (!texture) return null;

  return (
    <group
      ref={groupRef}
      position={[baseX, 0, baseZ]}
      rotation={[0, baseRotY, 0]}
      scale={[0.85, 0.85, 0.85]}
    >
      {/* Smoke aura behind card */}
      <mesh ref={smokeRef} position={[0, 0, -0.02]} scale={[1.35, 1.35, 1.35]}>
        <planeGeometry args={[1, 1.4]} />
        <meshBasicMaterial
          map={smokeTexture}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
          color={styles.accent}
        />
      </mesh>
      {/* Card */}
      <mesh ref={meshRef}>
        <planeGeometry args={[1, 1.4]} />
        <meshStandardMaterial
          map={texture}
          side={THREE.DoubleSide}
          transparent
          roughness={0.6}
          emissive={new THREE.Color(styles.accent)}
          emissiveIntensity={0}
        />
      </mesh>
    </group>
  );
}

export function PackFan({ cards, selectedIndex, onSelect: _onSelect }: PackFanProps) {
  const count = cards.length;

  return (
    <>
      {cards.map((card, i) => (
        <CardMesh
          key={card.id + '-' + i}
          card={card}
          index={i}
          selected={i === selectedIndex}
          total={count}
        />
      ))}
    </>
  );
}
