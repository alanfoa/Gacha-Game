import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import gsap from 'gsap';
import { useScreenStore } from '../../store/screenStore';
import { useGameStore, type BattleCardState, type BattleSkill } from '../../store/gameStore';
import { useInputManager, type GameAction } from '../../hooks/useInputManager';
import { useSound } from '../../hooks/useSound';
import { getCardCanvas } from '../Sobre/cardTexture';

type Phase = 'player_turn' | 'resolving' | 'result';

const RARITY_COLORS: Record<string, string> = {
  COMUN: '#9ca3af',
  RARO: '#60a5fa',
  EPICO: '#a855f7',
  LEGENDARIO: '#f59e0b',
};

export function BattleScreen() {
  const back = useScreenStore((s) => s.back);
  const navigate = useScreenStore((s) => s.navigate);
  const {
    playerBattleCards, enemyBattleCards, battleLog, battleTurn,
    battleWinner, battleCoinsEarned, loading, submitBattleActions, clearBattle,
  } = useGameStore();
  const { play } = useSound();

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
  const [flashOpacity, setFlashOpacity] = useState(0);

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
      setCurrentCardIdx(0);
      pendingActionsRef.current = [];
      setCurrentLogIdx(-1);
      setSelectedAction(null);
      setSelectedSkill(null);
    }
  }, [playerBattleCards, enemyBattleCards, battleTurn, phase]);

  const currentCard = actionablePlayerCards[currentCardIdx];

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

  // --- Click handlers ---
  function handleActionSelect(value: string) {
    if (!currentCard) return;
    if (value === 'SKILL') {
      setShowSkillSubmenu(true);
      setTargetFocus(0);
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

  function handleSkillSelect(skillId: string) {
    setSelectedSkill(skillId);
    setSelectedAction('SKILL');
    setShowSkillSubmenu(false);
    setTargetFocus(0);
    play('confirm');
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
      if (action === 'CONFIRM') {
        setShowSurrenderConfirm(false);
        setPhase('result');
      }
      if (action === 'BACK') {
        setShowSurrenderConfirm(false);
      }
      return;
    }

    if (phaseRef.current === 'result') {
      if (action === 'CONFIRM' || action === 'BACK') {
        clearBattle();
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
      back();
      return;
    }

    if (!currentCard) return;

    if (showSkillSubmenu) {
      if (action === 'NAV_UP' || action === 'NAV_LEFT') {
        setTargetFocus((f) => Math.max(0, f - 1));
        play('nav');
      }
      if (action === 'NAV_DOWN' || action === 'NAV_RIGHT') {
        setTargetFocus((f) => Math.min(currentSkills.length - 1, f + 1));
        play('nav');
      }
      if (action === 'CONFIRM') {
        const skill = currentSkills[targetFocus];
        if (skill) {
          setSelectedSkill(skill.id);
          setSelectedAction('SKILL');
          setShowSkillSubmenu(false);
          setTargetFocus(0);
          play('confirm');
        }
      }
      return;
    }

    if (!selectedAction) {
      // Action menu
      if (action === 'NAV_UP' || action === 'NAV_LEFT') {
        setActionMenuFocus((f) => Math.max(0, f - 1));
        play('nav');
      }
      if (action === 'NAV_DOWN' || action === 'NAV_RIGHT') {
        setActionMenuFocus((f) => Math.min(actionOptions.length - 1, f + 1));
        play('nav');
      }
      if (action === 'CONFIRM') {
        const chosen = actionOptions[actionMenuFocus];
        if (!chosen) return;
        if (chosen.value === 'SKILL') {
          setShowSkillSubmenu(true);
          setTargetFocus(0);
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
          setPhase('result');
          if (battleWinner === 'player') play('victory');
          else play('defeat');
        }, 500);
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
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (skipAnim) {
      setCurrentLogIdx(battleLog.length - 1);
      setSkipAnim(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentLogIdx((i) => i + 1);
    }, 800);
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

    // Shake the target card on damage
    if (entry.damage > 0) {
      const targetCardEl = document.getElementById(`battle-card-${entry.targetId}`);
      if (targetCardEl) {
        try {
          gsap.fromTo(targetCardEl,
            { x: 0 },
            {
              x: 'random(-4, 4)',
              y: 'random(-3, 3)',
              duration: 0.05,
              repeat: 4,
              yoyo: true,
              ease: 'power1.inOut',
              onComplete: () => gsap.set(targetCardEl, { x: 0, y: 0 }),
            }
          );
        } catch { /* GSAP no disponible */ }
      }
    }

    // Screen shake + golden flash on critical
    if (entry.critical && battleContainerRef.current) {
      try {
        gsap.to(battleContainerRef.current, {
          x: 'random(-6, 6)',
          y: 'random(-4, 4)',
          duration: 0.08,
          repeat: 5,
          yoyo: true,
          ease: 'power1.inOut',
          onComplete: () => {
            gsap.set(battleContainerRef.current, { x: 0, y: 0 });
          },
        });
        setFlashOpacity(0.35);
        gsap.to({}, {
          duration: 0.15,
          onComplete: () => setFlashOpacity(0),
          delay: 0.3,
        });
      } catch {
        setFlashOpacity(0.35);
        setTimeout(() => setFlashOpacity(0), 1000);
      }
    }
  }, [currentLogIdx, battleLog]);

  useInputManager(handleAction);

  const getCardColor = (rarity: string) => RARITY_COLORS[rarity] ?? '#9ca3af';

  if (playerBattleCards.length === 0) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a', color: '#9ca3af' }}>
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
        background: '#0f0f1a',
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
              color={getCardColor(card.rarity)}
              isAlive={card.currentHp > 0}
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
              color={getCardColor(card.rarity)}
              isAlive={card.currentHp > 0}
              isActive={phase === 'player_turn' && card.cardId === currentCard?.cardId}
            />
          ))}
        </div>
      </div>

      {/* Action menu / Result */}
      {phase === 'result' ? (
        <BattleResult
          winner={battleWinner}
          coinsEarned={battleCoinsEarned}
          onConfirm={() => { clearBattle(); navigate('menu'); }}
        />
      ) : (
        <div style={{
          borderTop: '2px solid rgba(59,130,246,0.25)',
          background: 'rgba(12,12,25,0.95)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
          position: 'relative',
        }}>
          {phase === 'player_turn' && currentCard && !showSkillSubmenu && !selectedAction && (
            <ActionMenu
              options={actionOptions}
              focus={actionMenuFocus}
              onSelect={handleActionSelect}
              onFocusChange={(i) => setActionMenuFocus(i)}
            />
          )}
          {phase === 'player_turn' && currentCard && showSkillSubmenu && (
            <SkillSubmenu
              skills={currentSkills}
              focus={targetFocus}
              onSelect={handleSkillSelect}
              onFocusChange={(i) => setTargetFocus(i)}
            />
          )}
          {phase === 'player_turn' && selectedAction && (
            <TargetMenu
              targets={aliveEnemyCards}
              focus={targetFocus}
              label="Selecciona objetivo enemigo"
              onSelect={handleTargetSelect}
              onFocusChange={(i) => setTargetFocus(i)}
            />
          )}
          {(phase === 'resolving' || phase === 'player_turn' && !currentCard) && (
            <div style={{ textAlign: 'center', padding: '1rem', color: '#9ca3af', fontSize: '0.875rem' }}>
              {battleWinner ? 'BATALLA FINALIZADA' : 'RESOLVIENDO...'}
            </div>
          )}
        </div>
      )}

      {/* Golden flash overlay on critical */}
      {flashOpacity > 0 && <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(251,191,36,0.4) 0%, rgba(251,191,36,0.1) 50%, transparent 70%)',
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
                style={{
                  padding: '0.5rem 1.5rem',
                  background: '#374151',
                  border: '1px solid #6b7280',
                  borderRadius: '4px',
                  color: '#e5e7eb',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                }}
              >
                NO
              </button>
              <button
                onClick={() => { clearBattle(); navigate('menu'); }}
                style={{
                  padding: '0.5rem 1.5rem',
                  background: '#991b1b',
                  border: '1px solid #ef4444',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
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

function MiniBattleCard({
  card,
  color,
  isAlive,
  isActive,
}: {
  card: BattleCardState;
  color: string;
  isAlive: boolean;
  isActive?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const src = getCardCanvas(card.rarity, card.name, true);
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(src, 0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [card.rarity, card.name]);

  const hpPercent = card.currentHp / card.maxHp;

  return (
    <div
      id={`battle-card-${card.cardId}`}
      style={{
        background: isActive ? 'rgba(59,130,246,0.1)' : 'rgba(30,30,58,0.8)',
        border: `2px solid ${isActive ? '#60a5fa' : isAlive ? color : '#374151'}`,
        borderRadius: '8px',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        opacity: isAlive ? 1 : 0.35,
        transition: 'opacity 0.3s, border-color 0.3s, background 0.3s',
        width: '180px',
      }}
    >
      <canvas
        ref={canvasRef}
        width={130}
        height={182}
        style={{ width: '130px', height: '182px', borderRadius: '4px' }}
      />
      <span style={{
        color: isAlive ? '#e5e7eb' : '#6b7280',
        fontSize: '0.9375rem',
        fontWeight: 700,
        letterSpacing: '0.05em',
        textAlign: 'center',
      }}>
        {card.name}
      </span>
      {/* HP bar */}
      <div style={{ width: '100%', height: '10px', background: '#374151', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{
          width: `${hpPercent * 100}%`,
          height: '100%',
          background: hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#f59e0b' : '#ef4444',
          borderRadius: '4px',
          transition: 'width 0.5s ease',
        }} />
      </div>
      <span style={{
        color: isAlive ? '#d1d5db' : '#6b7280',
        fontSize: '0.8125rem',
        fontWeight: 600,
      }}>
        {Math.max(0, card.currentHp)}/{card.maxHp}
      </span>
    </div>
  );
}



function ActionMenu({ options, focus, onSelect, onFocusChange }: { options: { label: string; value: string }[]; focus: number; onSelect?: (value: string) => void; onFocusChange?: (i: number) => void }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'center', gap: '1rem',
      padding: '1.25rem 1.5rem 1.75rem',
    }}>
      {options.map((opt, i) => {
        const active = i === focus;
        return (
          <div
            key={opt.value}
            onClick={() => onSelect?.(opt.value)}
            onMouseEnter={() => onFocusChange?.(i)}
            style={{
              padding: '0.75rem 2rem',
              background: active ? '#3b82f6' : '#334155',
              border: `2px solid ${active ? '#93c5fd' : '#64748b'}`,
              borderRadius: '8px',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '1.125rem',
              letterSpacing: '0.08em',
              boxShadow: active ? '0 0 16px rgba(59,130,246,0.4)' : 'none',
              transform: active ? 'scale(1.06)' : 'scale(1)',
              cursor: 'pointer',
              transition: 'all 0.12s ease',
            }}
          >
            {opt.label}
          </div>
        );
      })}
    </div>
  );
}

function SkillSubmenu({ skills, focus, onSelect, onFocusChange }: { skills: BattleSkill[]; focus: number; onSelect?: (skillId: string) => void; onFocusChange?: (i: number) => void }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'center', gap: '1rem',
      padding: '1.25rem 1.5rem 1.75rem',
      flexWrap: 'wrap',
    }}>
      <div style={{ width: '100%', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.15em', marginBottom: '0.5rem' }}>
        SELECCIONA HABILIDAD
      </div>
      {skills.map((skill, i) => {
        const active = i === focus;
        return (
          <div
            key={skill.id}
            onClick={() => onSelect?.(skill.id)}
            onMouseEnter={() => onFocusChange?.(i)}
            style={{
              padding: '0.75rem 1.5rem',
              background: active ? '#3b82f6' : '#334155',
              border: `2px solid ${active ? '#93c5fd' : '#64748b'}`,
              borderRadius: '8px',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.9375rem',
              letterSpacing: '0.05em',
              textAlign: 'center',
              boxShadow: active ? '0 0 12px rgba(59,130,246,0.25)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.12s ease',
            }}
          >
            <div>{skill.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              Potencia: {skill.power}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TargetMenu({ targets, focus, label, onSelect, onFocusChange }: { targets: BattleCardState[]; focus: number; label: string; onSelect?: (targetId: string) => void; onFocusChange?: (i: number) => void }) {
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
    <div style={{
      padding: '1.5rem',
      borderTop: '1px solid rgba(59,130,246,0.1)',
      background: 'rgba(15,15,26,0.98)',
      textAlign: 'center',
      position: 'relative',
      zIndex: 20,
    }}>
      <h2 style={{
        fontSize: '1.75rem',
        fontWeight: 900,
        color: isVictory ? '#fbbf24' : '#ef4444',
        letterSpacing: '0.1em',
        transform: 'skewX(-10deg)',
        margin: '0 0 0.5rem 0',
        textShadow: isVictory
          ? '0 0 20px rgba(251,191,36,0.3)'
          : '0 0 20px rgba(239,68,68,0.3)',
      }}>
        {isVictory ? '¡VICTORIA!' : 'DERROTA'}
      </h2>
      <div style={{ color: '#9ca3af', fontSize: '0.9375rem', marginBottom: '1rem' }}>
        {isVictory ? (
          <span>Ganaste <strong style={{ color: '#fbbf24' }}>{coinsEarned}</strong> monedas</span>
        ) : (
          <span>Perdiste <strong style={{ color: '#ef4444' }}>{Math.abs(coinsEarned)}</strong> monedas</span>
        )}
      </div>
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
        }}
      >
        VOLVER AL MENÚ
      </button>
    </div>
  );
}
