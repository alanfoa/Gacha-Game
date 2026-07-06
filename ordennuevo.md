# Orden de Turnos — Modelo Persona

## Idea

Reemplazar el batch actual (elegís 3 acciones → se resuelven mezcladas por speed) por turnos individuales secuenciales donde cada personaje actúa en orden de speed, y elegís tu acción en el momento que te toca.

```
Ronda N: regen maná + efectos → ordenar por speed
─────────────────────────────────────────────────
[P1] Tu turno → elegís acción → pega
  → [E2] IA auto → pega
  → [E1] IA auto → pega
  → [P3] Tu turno → elegís acción → pega
  → [P2] Tu turno → elegís acción → pega
  → [E3] IA auto → pega
  → round_end
```

## API

| Endpoint | Body | Respuesta |
|----------|------|-----------|
| `POST /battle/start` | `{cardIds}` + token | `{playerCards[], enemyCards[], turnOrder[], round:1}` |
| `POST /battle/act` | `{battleId, action, targetId, skillId?}` | `{logs[], cards[], nextActor, turnOrder[], winner}` |
| `POST /battle/next-round` | `{battleId}` | `{logs[], cards[], turnOrder[], round, nextActor}` |

## Paquetes de trabajo

### Server — `battle.ts`

- [ ] Separar `processTurn` en:
  - `startRound(cards)`: regen maná, procesar status effects, reset flags → devuelve `turnOrder[]` ordenado por speed
  - `processSession(session, playerAction)`: recibe 1 acción player, la resuelve, después auto-resuelve todos los enemigos que sigan hasta que toque otro player o round_end → devuelve `{logs, cards, nextActor, turnOrder, winner}`
- [ ] Nuevo: `TurnActor = { uid, cardId, name, type:'player'|'enemy' }`
- [ ] En session: guardar `turnOrder: TurnActor[]`, `currentActorIdx: number`, `round: number`
- [ ] Enemigos se resuelven automáticamente sin input (IA se llama inline)
- [ ] Round termina cuando `currentActorIdx >= turnOrder.length` → se llama `startRound` automáticamente

### Server — `routes/battle.ts`

- [ ] `POST /battle/start` devuelve `turnOrder[]` y `round: 1`
- [ ] `POST /battle/action` → reemplazar por `POST /battle/act` (1 acción)
- [ ] Nuevo `POST /battle/next-round` → avanza ronda, devuelve nuevo orden + próximo actor
- [ ] `POST /battle/surrender` → igual pero respeta el nuevo flujo

### Cliente — `gameStore.ts`

- [ ] Agregar `turnOrder: TurnActor[]`, `round: number`, `nextActor: string | null` al state
- [ ] Agregar `submitOneAction(action)` (reemplaza `submitBattleActions`)
- [ ] Agregar `nextRound()`
- [ ] Actualizar tipos (`BattleCardState` etc)

### Cliente — `BattleScreen.tsx`

- [ ] Eliminar `currentCardIdx`, `actionablePlayerCards` — el server dice quién actúa
- [ ] Agregar barra de orden de turnos horizontal (`[P1▶] [E2] [E1] [P3]`)
- [ ] Fase `player_turn` → solo menú de acción para el `currentCard` que indica `nextActor`
- [ ] Submit envía 1 acción a `/battle/act` en vez de todas
- [ ] Después del log animation: si el server devuelve `nextActor` de tipo player, mostrar menú; si enemigo, auto-resolver con otro request; si winner, mostrar resultado
- [ ] Skip button saltea la animación de cada log
- [ ] Ajustar `phase` states: `'player_act' | 'resolving' | 'round_start' | 'result'`

### Balance — `battle.ts`

- [ ] Poder fijo por rareza en `generateSkills`:

| Rareza | ATTACK | MAGIC | SKILL | ULTIMATE |
|--------|--------|-------|-------|----------|
| COMUN  | 55     | 50    | —     | —        |
| RARO   | 65     | 60    | —     | —        |
| EPICO  | 75     | 70    | 110   | —        |
| LEGEND | 90     | 85    | 130   | 200      |

### Orden de implementación

1. Balance (poder fijo) — toque mínimo en `generateSkills`
2. Server `battle.ts` — refactor a `startRound`/`processSession`
3. Server `routes/battle.ts` — nuevos endpoints
4. Cliente `gameStore.ts` — nuevos campos y actions
5. Cliente `BattleScreen.tsx` — nuevo flujo de turnos + barra de orden
6. Probar end-to-end

## Archivos a modificar

- `server/src/logic/battle.ts` (~200 líneas nuevas)
- `server/src/routes/battle.ts` (~80 líneas)
- `client/src/store/gameStore.ts` (~50 líneas)
- `client/src/components/Battle/BattleScreen.tsx` (~300 líneas)
