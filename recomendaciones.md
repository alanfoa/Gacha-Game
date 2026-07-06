# Recomendaciones — Sistema de Batalla

## Arquitectura actual

### Archivos clave

| Archivo | Rol |
|---|---|
| `server/src/data/cards.ts` | Tipos, elementos, tabla de ventajas elementales, interfaz `Card` con stats/HP/maná/skills |
| `server/src/logic/battle.ts` (581 líneas) | Motor de combate: `createBattleCard`, `calcDamageNew`, `generateEnemyTeam`, `processTurn`, efectos de estado, generación de skills |
| `server/src/routes/battle.ts` (153 líneas) | Endpoints `POST /battle/start` y `POST /battle/action` |
| `client/src/store/gameStore.ts` | Acciones `startBattle()` y `submitBattleActions()` |
| `client/src/components/Battle/BattleScreen.tsx` (~1213 líneas) | UI completa: fases, selección de acciones, animación de logs, HP bars |

### Funciones principales del motor (`battle.ts`)

- **`createBattleCard(card)`** — Convierte `Card` estática en `BattleCard` runtime
- **`generateSkills(card)`** — Asigna power base (ATTACK=80, MAGIC=75, SKILL=120, ULTIMATE=180) y efectos vía `getSkillEffect()`
- **`calcDamageNew(atk, power, def, elementMult, luck)`** — Fórmula `(atk * power / 100) * (100 / (100 + def))`. Crítico = random < luck, daño x1.5, mínimo 1
- **`applyDamageToCard()`** — Aplica DEF_DOWN, DEFEND (0.5), llama calcDamageNew
- **`applySkillEffect()`** — Switch por tipo: BLEED, DEF_DOWN, SPD_DOWN, MAG_DOWN, STUN, FREEZE, HEAL_ALLY, CRIT_BONUS
- **`generateEnemyTeam(winStreak)`** — Pool por rareza según winStreak, selecciona 3 random
- **`generateEnemyActions()`** — 60% ataque, 30% skill, 10% defender. Target aleatorio
- **`processTurn()`** — Regen maná 20%, reducir cooldowns, procesar sangrado, expirar efectos, generar acciones enemigas, ordenar por SPD, procesar cada acción, determinar ganador

### Flujo de batalla

```
TeamSelectScreen → handleStartBattle() → startBattle() [API] → navigate('battle')
BattleScreen mount → player_turn → seleccionar acciones (ATACAR/MAGIA/HABILIDAD/DEFENDER)
→ submitTurn() → setPhase('resolving') → submitBattleActions() [API]
→ logs aparecen 1x1 con animación (800ms, antes 1400ms) → HP local baja en sincronía
→ fin → result (victoria/derrota) → clearBattle() → navigate('menu')
```

---

## Problemas actuales

1. **IA enemiga muy básica** — Solo random targets, 60/30/10 fijo. Nunca usa ultimate. No coopera.
2. **Falta variedad de skills** — Solo ATTACK usa power distinto (80). MAGIC siempre 75, SKILL siempre 120, ULT siempre 180. Deberían variar por personaje.
3. **Sin animaciones de personaje** — Cartas static. No hay sprite, no hay "pose de ataque", no hay feedback de "recibir golpe" más allá del shake.
4. ~~**Sin indicador de turno actual** — No se ve claramente de quién es el turno mientras se resuelve.~~ ✅ **Ya implementado** — La carta activa se ilumina con borde dorado + glow.
5. **Elementos LUZ/SOMBRA se counterean entre sí** — Menos estratégicos que el cuadrante FUEGO/AGUA/TIERRA/VIENTO.
6. **DEFENDER es aburrido** — Solo reduce daño 50%. No hay counter-play ni recompensa.
7. **MAGIC vs ATTACK** — Usan stats diferentes (MAG vs ATK) pero el jugador no entiende bien cuál usar.
8. **Sin predicción de daño** — No sabés cuánto daño va a hacer tu habilidad antes de elegir target.

---

## 🟡 Fáciles de implementar

### 1. IA más agresiva
- Priorizar targets con HP bajo
- Usar ultimate cuando tenga maná suficiente
- Usar DEFEND si está por recibir un golpe grande
- Cooperación: si dos enemigos pueden atacar al mismo target débil, lo hacen

### 2. Damage preview
- Al seleccionar target, mostrar "~45 DMG" estimado
- Color según efectividad elemental: ventaja=verde, desventaja=rojo, neutral=blanco

### 4. Variar power por personaje
- Que ATTACK no sea siempre 80, sino que escale con ATK stat del personaje
- Misma lógica para MAGIC, SKILL, ULTIMATE

### 5. DEFEND más interesante
- Reduce daño 50%
- Además: curar 5% HP, o reducir cooldowns 1 turno, o cargar maná extra
- Feedback visual claro: escudo, destello azul, sonido "cling"

### 6. Diferenciar visualmente cada tipo de ataque
- ATTACK: color plateado/blanco, shake corto
- MAGIC: color azul/violeta, flotar, partículas circulares
- SKILL: color naranja/dorado, animación media, destello
- ULTIMATE: color rojo/púrpura, pantalla se oscurece, cámara shake, zoom
- DEFEND: escudo azul que parpadea
- CRÍTICO: dorado (#fbbf24), texto grande, extra shake

### 7. Logs con emoción
- Emoji/icono por tipo: ⚔️ ATTACK / ✨ MAGIC / 🛡️ DEFEND / 🌟 ULTIMATE / 💥 crítico
- Texto coloreado según bando (aliado azul, enemigo rojo, crítico dorado)
- Animación de entrada: slide + fade + scale

---

## 🟠 Más trabajo

### 8. Sprite de "ataque"
- Mover la carta del atacante hacia el target durante el log (slide animation)
- Efecto de dash/embestida visual

### 9. Indicador de velocidad
- Antes del turno: mostrar orden de acción (1st, 2nd, 3rd) basado en SPD
- Pequeño icono o número sobre cada carta

### 10. Elementos más estratégicos
- LUZ > SOMBRA (1.5x) pero LUZ 0.75x vs todos los demás
- SOMBRA > LUZ (1.5x) pero SOMBRA 0.75x vs todos los demás
- Incentiva tener ambos tipos en el equipo

### 11. Combo system
- Si dos cartas del MISMO ANIME atacan al mismo target → bonus damage
- Si dos cartas del MISMO ELEMENTO atacan al mismo target → bonus menor

### 12. Muerte animada
- Opacity fade out + scale down + partículas del color del elemento
- Overkill: daño excede HP restante → mostrar número en grande, rojo intenso

### 13. Partículas elementales
- 🔥 FUEGO: naranja/rojo, destello ascendente
- 💧 AGUA: azul, burbujas
- 🌿 VIENTO: verde claro, líneas curvas
- 🌍 TIERRA: marrón, partículas cuadradas
- ✨ LUZ: amarillo/dorado, rayos
- 🌑 SOMBRA: púrpura/negro, niebla

---

## 🟣 Para "divertido y entendible"

### 14. Nombres de habilidades con color e icono
- "🔴 Tajo de la Superficie" vs "🔵 Vals de Fuego" vs "💥 Dragón del Cambio"
- Color según elemento del personaje

### 15. Camera zoom al personaje que actúa
- Carta activa se agranda y centra temporalmente
- Vuelve a su tamaño al terminar la animación

### 16. Barra de "próximo turno"
- Al final de los logs, mostrar "TURNO {n+1}" con countdown visual (1.8s)
- Pequeña barra de progreso o animación de cuenta regresiva

### 17. Skip button visible
- Botón "SALTAR ▶" durante resolución
- Ya existe estado `skipAnim` pero no hay botón visible en pantalla

### 18. HP bar con animación fluida (efecto Pokémon)
- 2 capas: HP real (baja instantánea) + HP delay (baja 300ms después)
- Cuando baja, se ve claramente cuánto daño recibió y el "aftermath"

### 19. Sistema de overkill
- Si hacés más daño del necesario para matar, el excedente hace overkill
- Número se agranda, color rojo intenso, cámara shake
- Momento satisfactorio: ver "-150" sobre un enemigo con 10 HP restantes

---

## Prioridad recomendada

1. **IA más inteligente** + **logs más rápidos** + **damage preview** — Mayor impacto con menor esfuerzo
2. Diferenciar ataques visualmente + logs con emoción — Cambia radicalmente cómo se siente la pelea
3. DEFEND mejorado + variar power — Balance y profundidad estratégica
4. Muerte animada + partículas elementales — Polish visual
5. HP delay + overkill + skip button — Calidad de vida
6. Combo system + camera zoom + indicador velocidad — Features avanzadas
