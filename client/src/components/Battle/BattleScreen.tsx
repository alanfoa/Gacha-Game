import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import gsap from 'gsap';
import { useScreenStore } from '../../store/screenStore';
import { useGameStore, type BattleCardState } from '../../store/gameStore';
import { useInputManager, type GameAction } from '../../hooks/useInputManager';
import { useSound } from '../../hooks/useSound';
import { BGM } from '../../audio/sounds';
import { AnimeCard, type Card, type Rarity, type El } from '../Card/AnimeCard';

type Phase = 'player_turn' | 'resolving' | 'result';

export function BattleScreen() {
  const back = useScreenStore((s) => s.back);
  const navigate = useScreenStore((s) => s.navigate);
  const {
    playerBattleCards, enemyBattleCards, battleLog, battleTurn,
    battleWinner, battleCoinsEarned, loading, submitBattleActions, clearBattle,
  } = useGameStore();
  const { play, stopBGM, startBattleBGM } = useSound();

  const [phase, setPhase] = useState<Phase>('player_turn');
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [currentLogIdx, setCurrentLogIdx] = useState(-1);
  const [actionMenuFocus, setActionMenuFocus] = useState(0);
  const [targetFocus, setTargetFocus] = useState(0);
  const [showSkillSubmenu, setShowSkillSubmenu] = useState(false);
  const [skipAnim, setSkipAnim] = useState(false);
  const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);
  const [surrenderFocus, setSurrenderFocus] = useState(0);
  const [flashOpacity, setFlashOpacity] = useState(0);
  const [flashColor, setFlashColor] = useState('rgba(251,191,36,0.4)');

  const battleContainerRef = useRef<HTMLDivElement>(null);
  const mountedAt = useRef(Date.now());
  const newLogStartRef = useRef(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const pendingActionsRef = useRef<{ cardId: string; action: string; targetId: string; skillId?: string }[]>([]);

  const alivePlayerCards = useMemo(() => playerBattleCards.filter((c) => c.currentHp > 0), [playerBattleCards]);
  const actionablePlayerCards = useMemo(() => playerBattleCards.filter((c) => c.currentHp > 0 && !c.skipNextTurn), [playerBattleCards]);
  const aliveEnemyCards = useMemo(() => enemyBattleCards.filter((c) => c.currentHp > 0), [enemyBattleCards]);

  // Reset state when cards change (battle start/new turn)
  useEffect(() => {
    if (battleTurn === 0 && phase === 'player_turn') {
      startBattleBGM();
      setCurrentCardIdx(0);
      pendingActionsRef.current = [];
      setCurrentLogIdx(-1);
      setSelectedAction(null);
      setSelectedSkill(null);
    }
  }, [playerBattleCards, enemyBattleCards, battleTurn, phase, startBattleBGM]);

  const currentCard = actionablePlayerCards[currentCardIdx];
  const activeCardSpec = phase === 'player_turn'
    ? { type: 'uid' as const, uid: currentCard?.uid ?? currentCard?.cardId }
    : phase === 'resolving' && currentLogIdx >= 0 && currentLogIdx < battleLog.length
      ? { type: 'uid' as const, uid: battleLog[currentLogIdx].cardUid ?? battleLog[currentLogIdx].cardId }
      : null;

  // Auto-submit if no cards can act (all frozen/stunned)
  useEffect(() => {
    if (phase === 'player_turn' && actionablePlayerCards.length === 0 && alivePlayerCards.length > 0) {
      const timer = setTimeout(() => {
        submitTurn();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [phase, actionablePlayerCards.length, alivePlayerCards.length]);

  // Show action menu for the current alive card
  const actionOptions = useMemo(() => {
    if (!currentCard) return [{ label: 'ATACAR', value: 'ATTACK' }];
    const opts: { label: string; value: string }[] = [
      { label: 'ATACAR', value: 'ATTACK' },
    ];
    if (currentCard.skills.some((s) => s.type === 'MAGIC')) {
      opts.push({ label: 'MAGIA', value: 'MAGIC' });
    }
    if (currentCard.skills.some((s) => s.type === 'SKILL')) {
      opts.push({ label: 'HABILIDAD', value: 'SKILL' });
    }
    opts.push({ label: 'DEFENDER', value: 'DEFEND' });
    return opts;
  }, [currentCard]);

  const currentSkills = useMemo(() => {
    if (!currentCard) return [];
    return currentCard.skills.filter((s) => s.type === 'SKILL');
  }, [currentCard]);

  const skillOptions = useMemo(() => {
    return [...currentSkills.map((s) => {
      const canUse = currentCard.currentMana >= s.cost && s.currentCooldown === 0;
      const cdLabel = s.currentCooldown > 0 ? ` (CD: ${s.currentCooldown}t)` : '';
      const manaLabel = s.cost > 0 ? ` ${s.cost}PM` : '';
      return { label: `${s.name}${manaLabel}${cdLabel}`, value: s.id, disabled: !canUse };
    }), { label: '← VOLVER', value: '__back__' }];
  }, [currentSkills, currentCard]);

  const actionSublabels = useMemo(() => {
    if (!currentCard) return [];
    const result: string[] = [];
    const atk = currentCard.skills[0];
    result.push(atk ? `Pot: ${atk.power}` : '');
    if (currentCard.skills.some((s) => s.type === 'MAGIC')) {
      const mag = currentCard.skills.find((s) => s.type === 'MAGIC');
      result.push(mag ? `${mag.cost}PM Pot: ${mag.power}` : '');
    }
    if (currentCard.skills.some((s) => s.type === 'SKILL')) {
      result.push('');
    }
    result.push('');
    return result;
  }, [currentCard]);

  // --- Click handlers ---
  function handleActionSelect(value: string) {
    if (!currentCard) return;
    if (value === 'SKILL') {
      setShowSkillSubmenu(true);
      setActionMenuFocus(0);
      play('nav');
    } else if (value === 'DEFEND') {
      pendingActionsRef.current = [...pendingActionsRef.current, { cardId: currentCard.cardId, action: 'DEFEND', targetId: currentCard.cardId }];
      advanceToNextCard();
      play('confirm');
    } else {
      setSelectedAction(value);
      setTargetFocus(0);
      play('confirm');
    }
  }

  function handleTargetSelect(targetId: string) {
    if (!currentCard || !selectedAction) return;
    pendingActionsRef.current = [...pendingActionsRef.current, {
      cardId: currentCard.cardId,
      action: selectedAction,
      targetId,
      skillId: selectedSkill ?? undefined,
    }];
    advanceToNextCard();
    play('confirm');
  }

  // --- Input handling ---
  const handleAction = useCallback((action: GameAction) => {
    const elapsed = Date.now() - mountedAt.current;
    if (elapsed < 300) return;
    if (showSurrenderConfirm) {
      if (action === 'NAV_LEFT' || action === 'NAV_UP') {
        setSurrenderFocus(0);
      }
      if (action === 'NAV_RIGHT' || action === 'NAV_DOWN') {
        setSurrenderFocus(1);
      }
      if (action === 'CONFIRM') {
        if (surrenderFocus === 0) {
          setShowSurrenderConfirm(false);
        } else {
          setShowSurrenderConfirm(false);
          setPhase('result');
        }
      }
      if (action === 'BACK') {
        setShowSurrenderConfirm(false);
      }
      return;
    }

    if (phaseRef.current === 'result') {
      if (action === 'CONFIRM' || action === 'BACK') {
        clearBattle();
        BGM.switchToMenu();
        navigate('menu');
      }
      return;
    }

    if (phaseRef.current === 'resolving') {
      if (action === 'CONFIRM' || action === 'SKIP') {
        setSkipAnim(true);
      }
      return;
    }

    // Player turn phase
    if (action === 'BACK') {
      play('back');
      if (showSkillSubmenu) {
        setShowSkillSubmenu(false);
        return;
      }
      if (selectedAction) {
        setSelectedAction(null);
        setSelectedSkill(null);
        return;
      }
      setShowSurrenderConfirm(true);
      return;
    }

    if (!currentCard) return;

    if (!selectedAction) {
      // Action / Skill menu (inline)
      const items = showSkillSubmenu ? skillOptions : actionOptions;
      if (action === 'NAV_UP' || action === 'NAV_LEFT') {
        setActionMenuFocus((f) => {
          let newF = f - 1;
          while (newF >= 0 && (items as any)[newF]?.disabled) newF--;
          return Math.max(0, newF);
        });
        play('nav');
      }
      if (action === 'NAV_DOWN' || action === 'NAV_RIGHT') {
        setActionMenuFocus((f) => {
          let newF = f + 1;
          while (newF < items.length && (items as any)[newF]?.disabled) newF++;
          return Math.min(items.length - 1, newF);
        });
        play('nav');
      }
      if (action === 'CONFIRM') {
        if (showSkillSubmenu) {
          const skillOpt = skillOptions[actionMenuFocus] as { label: string; value: string; disabled?: boolean } | undefined;
          if (!skillOpt || skillOpt.disabled) return;
          if (skillOpt.value === '__back__') {
            setShowSkillSubmenu(false);
            setActionMenuFocus(0);
            play('nav');
            return;
          }
          setSelectedSkill(skillOpt.value);
          setSelectedAction('SKILL');
          setShowSkillSubmenu(false);
          play('confirm');
        } else {
          const chosen = actionOptions[actionMenuFocus];
          if (!chosen) return;
          if (chosen.value === 'SKILL') {
            setShowSkillSubmenu(true);
            setActionMenuFocus(0);
            play('nav');
          } else if (chosen.value === 'DEFEND') {
            pendingActionsRef.current = [...pendingActionsRef.current, { cardId: currentCard.cardId, action: 'DEFEND', targetId: currentCard.cardId }];
            advanceToNextCard();
            play('confirm');
          } else {
            setSelectedAction(chosen.value);
            setTargetFocus(0);
            play('confirm');
          }
        }
      }
      return;
    }

    // Target selection
    if (action === 'NAV_UP' || action === 'NAV_LEFT') {
      setTargetFocus((f) => Math.max(0, f - 1));
      play('nav');
    }
    if (action === 'NAV_DOWN' || action === 'NAV_RIGHT') {
      setTargetFocus((f) => Math.min(aliveEnemyCards.length - 1, f + 1));
      play('nav');
    }
    if (action === 'CONFIRM') {
      const target = aliveEnemyCards[targetFocus];
      if (!target) return;
      pendingActionsRef.current = [...pendingActionsRef.current, {
        cardId: currentCard.cardId,
        action: selectedAction!,
        targetId: target.cardId,
        skillId: selectedSkill ?? undefined,
      }];
      advanceToNextCard();
      play('confirm');
    }
  }, [back, play, currentCard, currentSkills, showSkillSubmenu, showSurrenderConfirm, selectedAction, selectedSkill,
      actionOptions, actionMenuFocus, targetFocus, aliveEnemyCards, clearBattle, navigate]);

  function advanceToNextCard() {
    setSelectedAction(null);
    setSelectedSkill(null);
    setActionMenuFocus(0);
    setTargetFocus(0);
    setShowSkillSubmenu(false);

    const nextIdx = currentCardIdx + 1;
    if (nextIdx >= actionablePlayerCards.length) {
      // All cards have acted, submit
      submitTurn();
    } else {
      setCurrentCardIdx(nextIdx);
    }
  }

  async function submitTurn() {
    const actions = [...pendingActionsRef.current];
    pendingActionsRef.current = [];
    newLogStartRef.current = battleLog.length;
    setPhase('resolving');
    setCurrentLogIdx(newLogStartRef.current - 1);
    setSkipAnim(false);

    await submitBattleActions(actions);
  }

  // Log animation
  useEffect(() => {
    if (phase !== 'resolving') return;
    if (battleLog.length === 0) return;

    if (currentLogIdx >= battleLog.length - 1) {
      // All logs shown
      if (battleWinner) {
        const timer = setTimeout(() => {
          stopBGM();
          setPhase('result');
          if (battleWinner === 'player') play('victory');
          else play('defeat');
        }, 1200);
        return () => clearTimeout(timer);
      }
      // Next turn
      const timer = setTimeout(() => {
        setPhase('player_turn');
        setCurrentCardIdx(0);
        pendingActionsRef.current = [];
        setSelectedAction(null);
        setSelectedSkill(null);
        setActionMenuFocus(0);
        setTargetFocus(0);
        setCurrentLogIdx(-1);
      }, 1800);
      return () => clearTimeout(timer);
    }

    if (skipAnim) {
      setCurrentLogIdx(battleLog.length - 1);
      setSkipAnim(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentLogIdx((i) => i + 1);
    }, 1400);
    return () => clearTimeout(timer);
  }, [phase, battleLog, currentLogIdx, battleWinner, skipAnim]);

  // GSAP shake on phase change to resolving
  useEffect(() => {
    if (phase === 'resolving' && battleContainerRef.current) {
      try {
        gsap.fromTo(battleContainerRef.current,
          { scaleY: 0.98 },
          { scaleY: 1, duration: 0.2, ease: 'power2.out' }
        );
      } catch { /* GSAP no disponible */ }
    }
  }, [phase]);

  // Log entry animation + screen shake on critical
  useEffect(() => {
    if (currentLogIdx < 0 || currentLogIdx >= battleLog.length) return;
    const entry = battleLog[currentLogIdx];
    const el = document.getElementById(`log-entry-${currentLogIdx}`);
    if (el) {
      try {
        gsap.fromTo(el,
          { opacity: 0, scale: 0.6, y: 30 },
          { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(1.7)' }
        );
      } catch { /* GSAP no disponible */ }
    }

    // Play sound based on action type
    if (entry.critical) {
      play('critical');
    } else if (entry.action === 'MAGIC') {
      play('magicHit');
    } else if (entry.action === 'SKILL') {
      play('skill');
    } else if (entry.action === 'DEFEND') {
      play('defend');
    } else {
      play('attackHit');
    }

    const targetCardEl = entry.damage > 0 ? document.getElementById(`battle-card-${entry.targetId}`) : null;
    const isUltimate = entry.skillId?.startsWith('ult_');
    const isStrike = entry.skillId?.startsWith('skill_');
    const isMagic = entry.action === 'MAGIC';


    // --- Enhanced animations per skill type ---
    if (targetCardEl && entry.damage > 0) {
      try {
        if (isUltimate) {
          // Ultimate: massive shake + zoom pulse
          gsap.to(targetCardEl, {
            scale: 1.25, duration: 0.1, yoyo: true, repeat: 1,
            ease: 'power1.inOut',
          });
          gsap.to(targetCardEl, {
            x: 'random(-12, 12)', y: 'random(-8, 8)',
            duration: 0.06, repeat: 8, yoyo: true, ease: 'none',
            onComplete: () => gsap.set(targetCardEl, { x: 0, y: 0, scale: 1 }),
          });
        } else if (isStrike) {
          // Strike: medium shake + scale bob
          gsap.to(targetCardEl, {
            scale: 1.1, duration: 0.08, yoyo: true, repeat: 1,
            ease: 'power1.inOut',
          });
          gsap.to(targetCardEl, {
            x: 'random(-6, 6)', y: 'random(-4, 4)',
            duration: 0.05, repeat: 5, yoyo: true, ease: 'none',
            onComplete: () => gsap.set(targetCardEl, { x: 0, y: 0, scale: 1 }),
          });
        } else if (isMagic) {
          // Magic: float upward + glow
          gsap.to(targetCardEl, {
            y: -8, duration: 0.2, ease: 'power1.out',
            yoyo: true, repeat: 1,
            onComplete: () => gsap.set(targetCardEl, { y: 0 }),
          });
        } else {
          // Physical: quick shake
          gsap.fromTo(targetCardEl,
            { x: 0 },
            {
              x: 'random(-4, 4)', y: 'random(-3, 3)',
              duration: 0.05, repeat: 4, yoyo: true, ease: 'power1.inOut',
              onComplete: () => gsap.set(targetCardEl, { x: 0, y: 0 }),
            }
          );
        }
      } catch { /* GSAP no disponible */ }
    }

    // --- Screen-wide effects ---
    if (battleContainerRef.current) {
      try {
        if (isUltimate) {
          // Ultimate: heavy screen shake + purple/red flash
          gsap.to(battleContainerRef.current, {
            x: 'random(-14, 14)', y: 'random(-10, 10)',
            duration: 0.07, repeat: 10, yoyo: true, ease: 'none',
            onComplete: () => gsap.set(battleContainerRef.current, { x: 0, y: 0 }),
          });
          setFlashColor('radial-gradient(circle, rgba(147,51,234,0.5) 0%, rgba(147,51,234,0.15) 50%, transparent 70%)');
          setFlashOpacity(0.5);
          gsap.to({}, {
            duration: 0.2, delay: 0.5,
            onComplete: () => setFlashOpacity(0),
          });
        } else if (isStrike) {
          // Strike: medium screen shake + glow
          gsap.to(battleContainerRef.current, {
            x: 'random(-8, 8)', y: 'random(-5, 5)',
            duration: 0.07, repeat: 6, yoyo: true, ease: 'none',
            onComplete: () => gsap.set(battleContainerRef.current, { x: 0, y: 0 }),
          });
          setFlashColor('radial-gradient(circle, rgba(96,165,250,0.35) 0%, rgba(96,165,250,0.1) 50%, transparent 70%)');
          setFlashOpacity(0.25);
          gsap.to({}, {
            duration: 0.15, delay: 0.3,
            onComplete: () => setFlashOpacity(0),
          });
        } else if (isMagic) {
          // Magic: gentle screen hue shift
          setFlashColor('radial-gradient(circle, rgba(34,197,94,0.2) 0%, rgba(34,197,94,0.05) 60%, transparent 80%)');
          setFlashOpacity(0.15);
          gsap.to({}, {
            duration: 0.2, delay: 0.2,
            onComplete: () => setFlashOpacity(0),
          });
        }

        // Critical hit: extra golden flash on top
        if (entry.critical) {
          gsap.to(battleContainerRef.current, {
            x: 'random(-6, 6)', y: 'random(-4, 4)',
            duration: 0.08, repeat: 5, yoyo: true, ease: 'power1.inOut',
            onComplete: () => gsap.set(battleContainerRef.current, { x: 0, y: 0 }),
          });
          setFlashColor('radial-gradient(circle, rgba(251,191,36,0.5) 0%, rgba(251,191,36,0.15) 50%, transparent 70%)');
          setFlashOpacity(0.45);
          gsap.to({}, {
            duration: 0.15,
            onComplete: () => setFlashOpacity(0),
            delay: 0.2,
          });
        }
      } catch { /* GSAP no disponible */ }
    }
  }, [currentLogIdx, battleLog]);

  useInputManager(handleAction);

  if (playerBattleCards.length === 0) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#011367', color: '#9ca3af' }}>
        <p>No hay batalla activa. Selecciona un equipo primero.</p>
      </div>
    );
  }

  return (
    <div
      ref={battleContainerRef}
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        background: '#011367',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes battleGlowPulse {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.3); }
        }
        @keyframes battleFloatIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

      `}</style>
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: '900px', height: '900px',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'repeating-linear-gradient(-15deg, transparent, transparent 40px, rgba(59,130,246,0.03) 40px, rgba(59,130,246,0.03) 41px)',
          pointerEvents: 'none',
        }}
      />

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.5rem 1rem', position: 'relative', zIndex: 10,
        borderBottom: '1px solid rgba(59,130,246,0.1)',
      }}>
        <div style={{ flex: 1 }} />
        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#60a5fa', fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.2em' }}>
            TURNO {battleTurn + 1}
          </span>
          {loading && <span style={{ color: '#f59e0b', marginLeft: '1rem', fontSize: '0.75rem' }}>PROCESANDO...</span>}
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setShowSurrenderConfirm(true)}
            disabled={phase !== 'player_turn'}
            style={{
              background: 'transparent',
              border: '1px solid #4b5563',
              borderRadius: '4px',
              color: '#9ca3af',
              padding: '0.3rem 0.75rem',
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              cursor: phase === 'player_turn' ? 'pointer' : 'default',
              opacity: phase === 'player_turn' ? 0.7 : 0.3,
              transition: 'opacity 0.2s',
            }}
          >
            RENDIRSE
          </button>
        </div>
      </div>

      {/* Enemy cards */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '1.25rem 1.5rem 0.75rem', position: 'relative', zIndex: 10,
      }}>
        <span style={{
          color: '#ef4444', fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.2em',
          marginBottom: '0.75rem', opacity: 0.8,
        }}>
          — RIVAL —
        </span>
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '1.25rem',
          minHeight: '310px', alignItems: 'center',
        }}>
          {enemyBattleCards.map((card) => (
            <MiniBattleCard
              key={card.cardId}
              card={card}
              isAlive={card.currentHp > 0}
              isActive={phase !== 'player_turn' && card.uid === activeCardSpec?.uid}
            />
          ))}
        </div>
      </div>

      {/* Battle announcements — centered */}
      <div style={{
        flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 10,
        padding: '1rem 1.5rem',
        minHeight: '120px',
      }}>
        {currentLogIdx >= 0 && currentLogIdx < battleLog.length && currentLogIdx >= newLogStartRef.current ? (
          (() => {
            const entry = battleLog[currentLogIdx];
            const isPlayerAttack = playerBattleCards.some(c => c.cardId === entry.cardId);
            const isCritical = entry.critical;
            const accentColor = isCritical ? '#fbbf24' : isPlayerAttack ? '#60a5fa' : '#ef4444';
            const bgTint = isCritical
              ? 'rgba(251,191,36,0.08)'
              : isPlayerAttack
                ? 'rgba(59,130,246,0.07)'
                : 'rgba(239,68,68,0.07)';
            return (
              <div
                id={`log-entry-${currentLogIdx}`}
                style={{
                  textAlign: 'center',
                  fontSize: isCritical ? '1.5rem' : '1.125rem',
                  fontWeight: isCritical ? 900 : 700,
                  color: isCritical ? '#fbbf24' : (isPlayerAttack ? '#93c5fd' : '#fca5a5'),
                  letterSpacing: '0.05em',
                  lineHeight: 1.6,
                  textShadow: isCritical
                    ? '0 0 30px rgba(251,191,36,0.6), 0 0 60px rgba(251,191,36,0.3)'
                    : 'none',
                  padding: '1rem 2rem',
                  background: bgTint,
                  borderLeft: `3px solid ${accentColor}`,
                  borderRadius: '4px',
                  maxWidth: '600px',
                  width: '100%',
                  transition: 'border-color 0.3s, background 0.3s',
                }}
              >
                {entry.message}
              </div>
            );
          })()
        ) : (
          <div style={{
            color: '#6b7280', fontSize: '1rem', fontStyle: 'italic',
            opacity: phase === 'resolving' ? 0.6 : 1,
            letterSpacing: '0.1em',
          }}>
            {phase === 'resolving'
              ? '⚔ CALCULANDO...'
              : phase === 'player_turn' && battleLog.length === 0
                ? 'SELECCIONA TUS ACCIONES'
                : '—'}
          </div>
        )}
      </div>

      {/* Player cards */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '0.75rem 1.5rem 1.25rem', position: 'relative', zIndex: 10,
      }}>
        <span style={{
          color: '#60a5fa', fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.2em',
          marginBottom: '0.75rem', opacity: 0.8,
        }}>
          — MIS CARTAS —
        </span>
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '1.25rem',
          minHeight: '310px', alignItems: 'center',
        }}>
          {playerBattleCards.map((card) => (
            <MiniBattleCard
              key={card.cardId}
              card={card}
              isAlive={card.currentHp > 0}
              isActive={phase === 'player_turn' ? card === currentCard : card.uid === activeCardSpec?.uid}
            />
          ))}
        </div>
      </div>

      {/* Action menu / Result */}
      {phase !== 'result' && (
        <div style={{
          borderTop: '2px solid rgba(59,130,246,0.25)',
          background: 'rgba(12,12,25,0.95)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
          position: 'relative',
          display: 'flex', justifyContent: 'center',
        }}>
          {phase === 'player_turn' && currentCard && !selectedAction && (
            <ActionMenu
              options={showSkillSubmenu ? skillOptions : actionOptions}
              focus={actionMenuFocus}
              sublabels={showSkillSubmenu ? currentSkills.map((s) => {
              if (s.currentCooldown > 0) return `CD: ${s.currentCooldown}t | Pot: ${s.power}`;
              if (currentCard.currentMana < s.cost) return `PM insuficiente (${s.cost}) | Pot: ${s.power}`;
              return `Coste: ${s.cost}PM | Pot: ${s.power}`;
            }) : actionSublabels}
              onSelect={(value) => {
                if (showSkillSubmenu) {
                  if (value === '__back__') {
                    setShowSkillSubmenu(false);
                    play('back');
                    return;
                  }
                  const skill = currentSkills.find((s) => s.id === value);
                  if (skill) {
                    setSelectedSkill(skill.id);
                    setSelectedAction('SKILL');
                    setShowSkillSubmenu(false);
                    play('confirm');
                  }
                } else {
                  handleActionSelect(value);
                }
              }}
              onFocusChange={(i) => setActionMenuFocus(i)}
            />
          )}
          {phase === 'player_turn' && selectedAction && (
            <TargetMenu
              targets={aliveEnemyCards}
              focus={targetFocus}
              label="Selecciona objetivo enemigo"
              onSelect={handleTargetSelect}
              onFocusChange={(i) => setTargetFocus(i)}
              onBack={() => { setSelectedAction(null); setSelectedSkill(null); play('back'); }}
            />
          )}
          {(phase === 'resolving' || phase === 'player_turn' && !currentCard) && (
            <div style={{ textAlign: 'center', padding: '1rem', color: '#9ca3af', fontSize: '0.875rem' }}>
              {battleWinner ? 'BATALLA FINALIZADA' : 'RESOLVIENDO...'}
            </div>
          )}
        </div>
      )}

      {phase === 'result' && (
        <BattleResult
          winner={battleWinner}
          coinsEarned={battleCoinsEarned}
          onConfirm={() => { clearBattle(); BGM.switchToMenu(); navigate('menu'); }}
        />
      )}

      {/* Golden flash overlay on critical */}
      {flashOpacity > 0 && <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: flashColor,
        opacity: flashOpacity,
        transition: 'opacity 0.15s ease-out',
        zIndex: 5,
      }} />}

      {/* Surrender confirmation */}
      {showSurrenderConfirm && (
        <div
          onClick={() => setShowSurrenderConfirm(false)}
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1a1a2e',
              border: '2px solid #4b5563',
              borderRadius: '8px',
              padding: '2rem',
              textAlign: 'center',
              maxWidth: '360px',
            }}
          >
            <p style={{ color: '#e5e7eb', fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem', letterSpacing: '0.05em' }}>
              ¿RENDIRSE?
            </p>
            <p style={{ color: '#9ca3af', fontSize: '0.8125rem', margin: '0 0 1.5rem' }}>
              Perderás la partida actual. ¿Estás seguro?
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setShowSurrenderConfirm(false)}
                onMouseEnter={() => setSurrenderFocus(0)}
                style={{
                  padding: '0.5rem 1.5rem',
                  background: surrenderFocus === 0 ? 'rgba(96,165,250,0.15)' : '#374151',
                  border: surrenderFocus === 0 ? '1.5px solid #60a5fa' : '1px solid #6b7280',
                  borderRadius: '4px',
                  color: surrenderFocus === 0 ? '#60a5fa' : '#e5e7eb',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                  transition: 'background 0.2s, border-color 0.2s, color 0.2s',
                }}
              >
                NO
              </button>
              <button
                onClick={() => { clearBattle(); BGM.switchToMenu(); navigate('menu'); }}
                onMouseEnter={() => setSurrenderFocus(1)}
                style={{
                  padding: '0.5rem 1.5rem',
                  background: surrenderFocus === 1 ? '#dc2626' : '#991b1b',
                  border: surrenderFocus === 1 ? '1.5px solid #fca5a5' : '1px solid #ef4444',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                  transition: 'background 0.2s, border-color 0.2s',
                }}
              >
                SÍ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function battleToCard(c: BattleCardState): Card {
  return {
    id: parseInt(c.cardId) || 0,
    name: c.name,
    rarity: c.rarity as Rarity,
    element: c.element as El,
    atk: c.stats.attack,
    def: c.stats.defense,
    mag: c.stats.magic,
    spd: c.stats.speed,
    lck: c.stats.luck,
    imageId: c.cardId,
  };
}

function MiniBattleCard({
  card,
  isAlive,
  isActive,
}: {
  card: BattleCardState;
  isAlive: boolean;
  isActive?: boolean;
}) {
  const hpPercent = card.currentHp / card.maxHp;
  const manaPercent = card.currentMana / card.maxMana;

  return (
    <div
      id={`battle-card-${card.cardId}`}
      style={{
        background: isActive ? 'rgba(250,204,21,0.1)' : 'rgba(30,30,58,0.8)',
        border: `2px solid ${isActive ? '#facc15' : 'transparent'}`,
        boxShadow: isActive ? '0 0 16px rgba(250,204,21,0.25)' : undefined,
        borderRadius: '8px',
        padding: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.35rem',
        opacity: isAlive ? 1 : 0.35,
        transition: 'opacity 0.3s, border-color 0.3s, background 0.3s, box-shadow 0.3s',
        width: '160px',
      }}
    >
      <AnimeCard card={battleToCard(card)} size="sm" />
      <span style={{
        color: isAlive ? '#e5e7eb' : '#6b7280',
        fontSize: '0.8125rem',
        fontWeight: 700,
        letterSpacing: '0.05em',
        textAlign: 'center',
      }}>
        {card.name}
      </span>
      {/* HP bar */}
      <div style={{ width: '100%', height: '8px', background: '#374151', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{
          width: `${hpPercent * 100}%`,
          height: '100%',
          background: hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#f59e0b' : '#ef4444',
          borderRadius: '4px',
          transition: 'width 0.5s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.625rem', color: '#d1d5db', fontWeight: 600 }}>
        <span>HP {Math.max(0, card.currentHp)}/{card.maxHp}</span>
        <span style={{ color: '#60a5fa' }}>SPD {card.stats.speed}</span>
      </div>
      {/* Mana bar */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <div style={{ flex: 1, height: '6px', background: '#1e1e3a', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            width: `${manaPercent * 100}%`,
            height: '100%',
            background: '#8b5cf6',
            borderRadius: '3px',
            transition: 'width 0.5s ease',
          }} />
        </div>
        <span style={{ color: '#a78bfa', fontSize: '0.6rem', fontWeight: 600 }}>
          {Math.round(card.currentMana)}/{card.maxMana}
        </span>
      </div>
      {card.skipNextTurn && (
        <span style={{
          color: '#60a5fa', fontSize: '0.65rem', fontWeight: 800,
          background: 'rgba(96,165,250,0.15)', padding: '1px 6px',
          borderRadius: '3px', letterSpacing: '0.05em',
        }}>
          SALTEA TURNO
        </span>
      )}
      {card.statusEffects && card.statusEffects.length > 0 && (
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {card.statusEffects.map((eff, i) => {
            const colors: Record<string, string> = {
              BLEED: '#ef4444', STUN: '#facc15', FREEZE: '#60a5fa',
              SPD_DOWN: '#a78bfa', ATK_DOWN: '#fb923c', DEF_DOWN: '#34d399',
              MAG_DOWN: '#c084fc', CRIT_BONUS: '#f59e0b',
              IGNORE_DEF: '#f472b6', IGNORE_ALL_DEF: '#ec4899',
              HEAL_ALLY: '#22c55e', DEF_UP: '#06b6d4',
            };
            const labels: Record<string, string> = {
              BLEED: 'SANGR', STUN: 'ATURD', FREEZE: 'CONG',
              SPD_DOWN: 'SPD-', ATK_DOWN: 'ATK-', DEF_DOWN: 'DEF-',
              MAG_DOWN: 'MAG-', CRIT_BONUS: 'CRIT+',
              IGNORE_DEF: 'IG DEF', IGNORE_ALL_DEF: 'IG ALL',
              HEAL_ALLY: 'CURA', DEF_UP: 'DEF+',
            };
            const c = colors[eff.type] || '#6b7280';
            return (
              <span
                key={i}
                title={`${eff.type} (${eff.remainingTurns}t, ${eff.value}%${eff.sourceName ? ` - ${eff.sourceName}` : ''})`}
                style={{
                  color: c, fontSize: '0.6rem', fontWeight: 700,
                  background: `${c}22`, padding: '1px 5px',
                  borderRadius: '3px', letterSpacing: '0.03em',
                }}
              >
                {labels[eff.type] || eff.type}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}



function ActionMenu({ options, focus, onSelect, onFocusChange, sublabels }: { options: { label: string; value: string; disabled?: boolean }[]; focus: number; onSelect?: (value: string) => void; onFocusChange?: (i: number) => void; sublabels?: string[] }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'center', gap: '1rem',
      padding: '1.25rem 1.5rem 1.75rem',
    }}>
      {options.map((opt, i) => {
        const active = i === focus && !opt.disabled;
        return (
          <div
            key={opt.value}
            onClick={() => { if (!opt.disabled) onSelect?.(opt.value); }}
            onMouseEnter={() => onFocusChange?.(i)}
            style={{
              padding: '0.5rem 1.5rem',
              background: active ? '#3b82f6' : opt.disabled ? '#1e1e3a' : '#334155',
              border: `2px solid ${active ? '#93c5fd' : opt.disabled ? '#374151' : '#64748b'}`,
              borderRadius: '8px',
              color: opt.disabled ? '#6b7280' : '#ffffff',
              fontWeight: 700,
              fontSize: '1.125rem',
              letterSpacing: '0.08em',
              textAlign: 'center',
              boxShadow: active ? '0 0 16px rgba(59,130,246,0.4)' : 'none',
              transform: active ? 'scale(1.06)' : 'scale(1)',
              cursor: opt.disabled ? 'default' : 'pointer',
              transition: 'all 0.12s ease',
            }}
          >
            <div>{opt.label}</div>
            {sublabels?.[i] && (
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.15rem', fontWeight: 600 }}>
                {sublabels[i]}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TargetMenu({ targets, focus, label, onSelect, onFocusChange, onBack }: { targets: BattleCardState[]; focus: number; label: string; onSelect?: (targetId: string) => void; onFocusChange?: (i: number) => void; onBack?: () => void }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'center', gap: '0.75rem',
      padding: '1rem 1.5rem 1.5rem',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center',
      }}>
        <span style={{ color: '#fca5a5', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em' }}>
          {label}
        </span>
        {targets.map((target, i) => {
          const active = i === focus;
          return (
            <div
              key={target.cardId}
              onClick={() => onSelect?.(target.cardId)}
              onMouseEnter={() => onFocusChange?.(i)}
              style={{
                padding: '0.5rem 1rem',
                background: active ? '#dc2626' : '#334155',
                border: `2px solid ${active ? '#f87171' : '#64748b'}`,
                borderRadius: '8px',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.8125rem',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
                boxShadow: active ? '0 0 14px rgba(239,68,68,0.35)' : 'none',
                transform: active ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              {target.name}
            </div>
          );
        })}
        {onBack && (
          <div
            onClick={onBack}
            style={{
              padding: '0.5rem 1rem',
              background: '#334155',
              border: '2px solid #64748b',
              borderRadius: '8px',
              color: '#94a3b8',
              fontWeight: 600,
              fontSize: '0.75rem',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'all 0.12s ease',
            }}
          >
            ← VOLVER
          </div>
        )}
        {targets.length === 0 && (
          <span style={{ color: '#6b7280', fontStyle: 'italic' }}>No hay objetivos</span>
        )}
      </div>
    </div>
  );
}

// ---------- BattleResult ----------

function BattleResult({
  winner,
  coinsEarned,
  onConfirm,
}: {
  winner: string | null;
  coinsEarned: number;
  onConfirm: () => void;
}) {
  const isVictory = winner === 'player';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#16162a',
          border: `2px solid ${isVictory ? '#facc1550' : '#ef444450'}`,
          borderRadius: '12px',
          padding: '2.5rem',
          textAlign: 'center',
          maxWidth: '400px',
          width: '90%',
          boxShadow: isVictory
            ? '0 0 60px rgba(250,204,21,0.15)'
            : '0 0 60px rgba(239,68,68,0.15)',
        }}
      >
        <h2 style={{
          fontSize: '2rem',
          fontWeight: 900,
          color: isVictory ? '#fbbf24' : '#ef4444',
          letterSpacing: '0.1em',
          transform: 'skewX(-10deg)',
          margin: '0 0 0.75rem 0',
          textShadow: isVictory
            ? '0 0 20px rgba(251,191,36,0.3)'
            : '0 0 20px rgba(239,68,68,0.3)',
        }}>
          {isVictory ? '¡VICTORIA!' : 'DERROTA'}
        </h2>
        {coinsEarned !== 0 && (
          <div style={{ color: '#9ca3af', fontSize: '1rem', marginBottom: '1.5rem' }}>
            {isVictory ? (
              <span>Ganaste <strong style={{ color: '#fbbf24' }}>{coinsEarned}</strong> monedas</span>
            ) : (
              <span>Perdiste <strong style={{ color: '#ef4444' }}>{Math.abs(coinsEarned)}</strong> monedas</span>
            )}
          </div>
        )}
        <button
          onClick={onConfirm}
          style={{
            padding: '0.75rem 2.5rem',
            fontSize: '1rem',
            fontWeight: 700,
            background: isVictory ? '#2563eb' : '#374151',
            color: 'white',
            border: `2px solid ${isVictory ? '#60a5fa' : '#6b7280'}`,
            borderRadius: '4px',
            transform: 'skewX(-10deg)',
            cursor: 'pointer',
            letterSpacing: '0.1em',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = isVictory ? '#1d4ed8' : '#4b5563'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = isVictory ? '#2563eb' : '#374151'; }}
        >
          VOLVER AL MENÚ
        </button>
      </div>
    </div>
  );
}
