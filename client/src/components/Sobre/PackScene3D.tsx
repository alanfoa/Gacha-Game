import { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { getCardCanvas, RARITY_STYLES, type CardCanvasStats } from './cardTexture';
import { loadCardImage } from '../../utils/cardImage';

interface PackScene3DProps {
  cardRarity: string | null;
  cardName: string | null;
  cardId: string | null;
  cardStats: CardCanvasStats | null;
  skip: boolean;
}

const FLAP_SHAPE = (() => {
  const s = new THREE.Shape();
  s.moveTo(-0.75, 0);
  s.lineTo(0.75, 0);
  s.lineTo(0, 0.65);
  s.closePath();
  return s;
})();

const CAMERA_PROPS = { position: [0, 0, 6] as [number, number, number], fov: 50 };
const PARTICLE_COUNT = 150;

function Envelope3D({ open }: { open: boolean }) {
  const bodyRef = useRef<THREE.Mesh>(null);
  const flapRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const openRef = useRef(open);
  openRef.current = open;

  useFrame((state) => {
    if (!groupRef.current || openRef.current) return;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.08;
    groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.4) * 0.02;
  });

  useEffect(() => {
    const body = bodyRef.current;
    const flap = flapRef.current;
    if (!body || !flap) return;

    const tweens: gsap.core.Tween[] = [];

    if (open) {
      tweens.push(gsap.to(flap.rotation, { x: -Math.PI * 0.6, duration: 0.3, ease: 'back.out(1.5)' }));
      tweens.push(gsap.to(body.scale, { x: 1.3, y: 1.3, z: 1.3, duration: 0.25, ease: 'power2.out' }));
      tweens.push(gsap.to(body.position, { z: 0.3, duration: 0.25, ease: 'power2.out' }));
      tweens.push(gsap.to(body.material, { opacity: 0, duration: 0.2, delay: 0.4 }));
      tweens.push(gsap.to(flap.material, { opacity: 0, duration: 0.2, delay: 0.4 }));
    } else {
      gsap.set(flap.rotation, { x: 0 });
      gsap.set(body.scale, { x: 1, y: 1, z: 1 });
      gsap.set(body.position, { z: 0 });
      gsap.set(body.material, { opacity: 1 });
      gsap.set(flap.material, { opacity: 1 });
    }

    return () => { tweens.forEach((t) => t.kill()); };
  }, [open]);

  return (
    <group ref={groupRef}>
      <mesh ref={bodyRef} position={[0, 0, 0]}>
        <boxGeometry args={[1.6, 2.2, 0.15]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.6} roughness={0.3} transparent opacity={1} />
      </mesh>
      <mesh ref={flapRef} position={[0, 1.1, 0]}>
        <shapeGeometry args={[FLAP_SHAPE]} />
        <meshStandardMaterial color="#60a5fa" metalness={0.5} roughness={0.3} side={THREE.DoubleSide} transparent opacity={1} />
      </mesh>
    </group>
  );
}

function RevealCard3D({ rarity, name, cardId, stats, visible }: { rarity: string; name: string; cardId?: string | null; stats?: CardCanvasStats | null; visible: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  const draw = useCallback(() => {
    const src = getCardCanvas(rarity, name, 280, cardId ?? undefined, stats ?? undefined);
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
  }, [rarity, name, cardId, stats]);

  useEffect(() => {
    draw();
    if (cardId) loadCardImage(cardId).then(draw);
    return () => {
      if (textureRef.current) { textureRef.current.dispose(); textureRef.current = null; }
      setTexture(null);
    };
  }, [draw, cardId, stats]);

  useEffect(() => {
    if (!meshRef.current || !visible) return;
    const mesh = meshRef.current;

    gsap.set(mesh.position, { x: 0, y: 0, z: 0 });
    gsap.set(mesh.scale, { x: 0.1, y: 0.1, z: 0.1 });
    gsap.set(mesh.rotation, { y: 0 });

    const tweens = [
      gsap.to(mesh.rotation, { y: Math.PI * 2, duration: 0.6, ease: 'power2.out' }),
      gsap.to(mesh.scale, { x: 1.3, y: 1.3, z: 1.3, duration: 0.5, ease: 'back.out(2)' }),
      gsap.to(mesh.position, { z: -3, duration: 0.5, ease: 'power2.out' }),
    ];

    return () => { tweens.forEach((t) => t.kill()); };
  }, [visible]);

  const styles = RARITY_STYLES[rarity] ?? RARITY_STYLES.COMUN;

  if (!texture) return null;

  return (
    <mesh ref={meshRef} visible={visible}>
      <planeGeometry args={[1.2, 1.68]} />
      <meshStandardMaterial
        map={texture}
        side={THREE.DoubleSide}
        transparent
        emissive={new THREE.Color(styles.accent)}
        emissiveIntensity={rarity === 'LEGENDARIO' ? 0.3 : rarity === 'EPICO' ? 0.15 : 0}
      />
    </mesh>
  );
}

function ParticleBurst({ rarity }: { rarity: string | null }) {
  const ref = useRef<THREE.Points>(null);
  const tweensRef = useRef<gsap.core.Tween[]>([]);

  useEffect(() => {
    if (!rarity || !ref.current) return;

    tweensRef.current.forEach((t) => t.kill());
    tweensRef.current = [];

    const styles = RARITY_STYLES[rarity] ?? RARITY_STYLES.COMUN;
    const color = new THREE.Color(styles.accent);

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    ref.current.geometry.dispose();
    ref.current.geometry = geometry;

    const targetPos = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1 + Math.random() * 2;
      targetPos[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      targetPos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
      targetPos[i * 3 + 2] = Math.cos(phi) * r;
    }

    const obj = { p: 0 };
    tweensRef.current.push(gsap.to(obj, {
      p: 1,
      duration: 0.5,
      ease: 'power2.out',
      onUpdate: () => {
        const pos = geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < PARTICLE_COUNT * 3; i++) pos[i] = targetPos[i] * obj.p;
        geometry.attributes.position.needsUpdate = true;
      },
    }));

    tweensRef.current.push(gsap.to(ref.current.material, {
      opacity: 0,
      duration: 1,
      delay: 0.6,
      ease: 'power2.in',
    }));

    return () => { tweensRef.current.forEach((t) => t.kill()); tweensRef.current = []; };
  }, [rarity]);

  if (!rarity) return null;

  return (
    <points ref={ref}>
      <bufferGeometry />
      <pointsMaterial size={0.06} vertexColors transparent opacity={1} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  );
}

function CameraShake({ intensity }: { intensity: number }) {
  const { camera } = useThree();
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (intensity <= 0) return;

    const origX = camera.position.x;
    const origY = camera.position.y;
    const origZ = camera.position.z;

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(camera.position, {
          x: origX, y: origY, z: origZ,
          duration: 0.3, ease: 'power2.out',
        });
      },
    });

    for (let i = 0; i < 6; i++) {
      tl.to(camera.position, {
        x: origX + (Math.random() - 0.5) * intensity * 0.08,
        y: origY + (Math.random() - 0.5) * intensity * 0.08,
        duration: 0.04, ease: 'none',
      });
    }

    tlRef.current = tl;

    return () => { tl.kill(); tlRef.current = null; };
  }, [intensity]);

  return null;
}

function SceneContent({ cardRarity, cardName, cardId, cardStats, skip }: PackScene3DProps) {
  const [phase, setPhase] = useState<'idle' | 'opening' | 'revealed'>('idle');
  const [particleRarity, setParticleRarity] = useState<string | null>(null);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!cardRarity || !cardName) {
      setPhase('idle');
      setParticleRarity(null);
      setShakeIntensity(0);
      return;
    }

    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }

    if (skip) {
      setPhase('revealed');
      setParticleRarity(cardRarity);
      const intensity = cardRarity === 'LEGENDARIO' ? 8 : cardRarity === 'EPICO' ? 4 : 0;
      if (intensity > 0) setShakeIntensity(intensity);
      setTimeout(() => { setShakeIntensity(0); setParticleRarity(null); }, 2000);
      return;
    }

    setPhase('opening');

    const tl = gsap.timeline({
      onComplete: () => {
        setPhase('revealed');
        setParticleRarity(cardRarity);
        const intensity = cardRarity === 'LEGENDARIO' ? 8 : cardRarity === 'EPICO' ? 4 : 0;
        if (intensity > 0) setShakeIntensity(intensity);
        setTimeout(() => { setShakeIntensity(0); setParticleRarity(null); }, 2000);
      },
    });

    tl.call(() => setPhase('revealed'), [], '+=0.65');

    timelineRef.current = tl;

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }
    };
  }, [cardRarity, cardName, skip]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[0, 0, 6]} intensity={1.0} color="#60a5fa" />
      <pointLight position={[-3, -2, 4]} intensity={0.5} color="#3b82f6" />
      <spotLight position={[0, 3, 4]} angle={0.3} penumbra={0.5} intensity={1.2} color="#ffffff" />
      <Envelope3D open={phase !== 'idle'} />
      {cardRarity && cardName && (
        <RevealCard3D rarity={cardRarity} name={cardName} cardId={cardId} stats={cardStats} visible={phase === 'revealed'} />
      )}
      <ParticleBurst rarity={particleRarity} />
      <CameraShake intensity={shakeIntensity} />
    </>
  );
}

export function PackScene3D(props: PackScene3DProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      <div style={{ width: '100%', height: '100%' }}>
        <Canvas
          camera={CAMERA_PROPS}
          gl={{ antialias: true, alpha: false }}
        >
          <color attach="background" args={['#0f0f1a']} />
          <SceneContent {...props} />
        </Canvas>
      </div>
    </div>
  );
}
