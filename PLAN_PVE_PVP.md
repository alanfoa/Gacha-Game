# PLAN — PvE Dificultades + PvP Ranked

---

## Sprint 1: Dificultades PvE (Server)

- [ ] Crear `server/src/data/difficulties.ts` con dificultades: `{ id, name, statMult, rarityCap, rewardMult }`
- [ ] Endpoint `GET /api/battle/difficulties`
- [ ] Modificar `POST /api/battle/start` para aceptar `difficulty` (default `normal`)
- [ ] Modificar `generateEnemyTeam()` para filtrar pool por `rarityCap`
- [ ] Aplicar `statMult` a stats enemigas (HP, ataque, defensa, magia, speed)
- [ ] Mejorar IA enemiga por dificultad: Fácil (random), Difícil+ (target débil, skills situacionales, ultimate)

## Sprint 2: Dificultades PvE (Client)

- [ ] Selector de dificultad en `TeamSelectScreen.tsx` (4 botones)
- [ ] Mostrar multiplicador de recompensa en cada botón
- [ ] Pasar `difficulty` al `POST /api/battle/start`
- [ ] Mostrar dificultad + recompensa final en resultado de batalla

## Sprint 3: Matchmaking + Sesiones PvP (Server)

- [ ] Instalar `socket.io` en server
- [ ] Crear `server/src/logic/matchmaking.ts` con cola de jugadores
- [ ] Crear `server/src/routes/pvp.ts`: `POST /api/pvp/queue`, `POST /api/pvp/leave`
- [ ] WebSocket handler para turnos: `match_found`, `submit_actions`, `turn_result`, `disconnect`
- [ ] Reutilizar `processTurn()` existente para resolver PvP
- [ ] Timeout 60s por turno (pierde el que no responde)

## Sprint 4: Sistema de Ranking (Server)

- [ ] Tabla `ranked` en DB: `user_id, rating, wins, losses, streak, tier`
- [ ] ELO simplificado: `rating ± 25 * (winner_rating / loser_rating)`
- [ ] Tiers: Bronce / Plata / Oro / Platino / Diamante
- [ ] Actualizar rating al finalizar partida PvP
- [ ] Endpoint `GET /api/ranked/leaderboard` — top 100

## Sprint 5: UI PvP Ranked (Client)

- [ ] `RankedScreen.tsx` con rating, tier, W/L, botón "BUSCAR OPONENTE"
- [ ] WebSocket al entrar a cola
- [ ] "Partida encontrada vs {nombre}" con countdown
- [ ] Reutilizar `BattleScreen.tsx` para el combate (mostrar nombre rival)
- [ ] Resultado final + cambio de rating + animación de tier
- [ ] Acceso a Ranked desde el menú principal

## Sprint 6: Extras y pulido

- [ ] Mostrar equipo del rival antes de la partida PvP
- [ ] Animación de tier up (Bronce → Plata, etc.)
- [ ] Efecto de racha en PvP (win streak bonus rating)
- [ ] Sonido de emparejamiento encontrado
- [ ] Validar que las 3 cartas sean distintas en equipo PvP
- [ ] Validar que las 3 cartas estén vivas

## Sprint 7: Fix Misiones Diarias + Pack Gratis

- [x] Modificar `POST /api/missions/claim`: cuando `reward === 1` (open_packs), devolver `{ freePack }` 
- [x] Modificar `claimMission()` en `gameStore.ts`: devuelve `boolean` si `freePack === true`
- [x] Después de reclamar la misión, navegar automáticamente a `PackScreen` con `{ freePack: true }`
- [x] `PackScreen` detecta el param y auto-abre sobre básico gratis sin cobrar
- [x] Server `POST /api/open` acepta `free: true` para saltar chequeo de monedas

## Sprint 8 — MenuPrincipal (Pantalla de Título)

- [x] Agregar `'mainmenu'` y `'login'` al tipo `Screen` en `screenStore.ts`
- [x] Crear `components/Menu/MenuPrincipal.tsx` con:
  - Logo grande "GACHA PERSONA" con skewX
  - Botones: **NUEVA PARTIDA** · **CARGAR PARTIDA** · **OPCIONES**
  - Primer click → `BGM.start()` + navega a login/menu
  - Fondo con gradiente + radial glow + líneas geométricas
- [x] Modificar `App.tsx`:
  - `current` default pasa a ser `'mainmenu'`
  - Sacar `useEffect` de BGM automático
  - Login/Nombre pasa a ser `'login'` screen
- [x] **CARGAR PARTIDA**: si hay token en localStorage, navega directo al menú del juego; si no, botón deshabilitado
- [x] **NUEVA PARTIDA**: navega a `'login'` (input de nombre + register)
- [x] **OPCIONES**: navega a `'options'`; al volver → `'mainmenu'`
- [x] BGM arranca con el primer click (bypass de autoplay policy)
- [x] Crear `SaveSlotsScreen.tsx` con 10 ranuras en scroll + CRUD
- [x] NUEVA PARTIDA y CARGAR PARTIDA → `'saveSlots'` en vez de login directo
- [x] Crear `saveSlotsStore.ts` con persistencia local de 10 slots
- [x] Auto-detectar última ranura usada al iniciar la app
- [x] Ranura vacía → botón CREAR PARTIDA → login con slot param
- [x] Ranura ocupada → muestra nombre, 🪙, 🃏, ⏱, 📅 + botones CARGAR / BORRAR
- [x] `POST /api/profiles/batch` para refrescar datos de ranuras desde el server

## Sprint 9 — Fix: ESC en batalla abre modal de rendirse

- [x] En `BattleScreen.tsx:200`, cambiar `back()` por `setShowSurrenderConfirm(true)` — cuando el jugador aprieta ESC sin tener submenús abiertos, abre el modal "¿RENDIRSE?" en lugar de salir de la batalla
- [x] En el handler de `phase === 'result'` (line 173-178), agregar `BGM.switchToMenu()` antes de `navigate('menu')` — así la música vuelve al tema del menú incluso si se rinde por teclado (el BattleResult button ya lo hace, pero la tecla CONFIRM lo omitía)
- [x] Perder batalla ya no descuenta monedas — solo resetea win streak
- [x] Al rendirse, no se muestra "Perdiste 0 monedas" en el resultado

## Sprint 10 — Music Player Widget + Menú de Pausa

- [x] Agregar `MENU_TRACKS` exportable en `sounds.ts` con `{ src, name }[]` y métodos `BGM.nextTrack()`, `BGM.prevTrack()`, `BGM.getCurrentTrack()`, `BGM.playTrack(index)`, `BGM.togglePause()`
- [x] Crear `components/UI/MusicPlayer.tsx`:
  - Posición `fixed; bottom: 1rem; right: 1rem; z-index: 9999`
  - Mini reproductor compacto: nombre canción (marquee) + ⏮ ⏸/▶ ⏭
  - Dropdown al clickear nombre con la playlist completa para cambiar de tema
- [x] Widget visible en `MenuScreen`
- [ ] Widget visible en `MenuPrincipal` (cuando se cree en Sprint 8)
- [ ] Widget oculto durante batalla, pack opening, álbum, team select, missions
